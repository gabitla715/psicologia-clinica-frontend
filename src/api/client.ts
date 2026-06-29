import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponseBackend } from '../types/auth';

// La baseURL apunta al prefijo /api/v1 del backend (Spring Boot Hexagonal).
// Si cambia el contrato del backend, este es el único lugar que se toca.
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ─── Helpers de token ──────────────────────────────────────────
const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  save: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ─── Request interceptor: añade Authorization ──────────────────
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: refresh token automático ────────────
//
// Si una petición falla con 401, intentamos refrescar el token UNA vez
// y reintentamos la petición original. Si el refresh también falla,
// limpiamos sesión y disparamos un evento para que el AuthContext redirija.
//
// Si llegan varios 401 a la vez (típico cuando el access token expira
// con el dashboard abierto), encolamos las peticiones para que esperen
// el mismo refresh en lugar de disparar uno por cada una.

let refreshPromise: Promise<string> | null = null;
type QueuedRequest = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};
let pendingQueue: QueuedRequest[] = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((req) => {
    if (error) req.reject(error);
    else if (token) req.resolve(token);
  });
  pendingQueue = [];
}

async function refrescarAccessToken(): Promise<string> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) throw new Error('No hay refresh token');

  // Usamos axios "plano" (no apiClient) para que NO entre al interceptor
  // de nuevo y se cree un bucle infinito.
  const { data } = await axios.post<AuthResponseBackend>(
    `${baseURL}/auth/refresh`,
    { refreshToken: refresh },
    { headers: { 'Content-Type': 'application/json' } }
  );

  tokenStorage.save(data.accessToken, data.refreshToken);
  return data.accessToken;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    // /auth/refresh y /auth/login no se reintentan: si dan 401 ya no hay nada que hacer.
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/login')) {
      tokenStorage.clear();
      return Promise.reject(error);
    }

    original._retry = true;

    if (refreshPromise) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    refreshPromise = refrescarAccessToken();

    try {
      const nuevoAccess = await refreshPromise;
      processQueue(null, nuevoAccess);
      original.headers.Authorization = `Bearer ${nuevoAccess}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    } finally {
      refreshPromise = null;
    }
  }
);

// ─── Helper para extraer mensaje de error legible ──────────────
export function extraerMensajeError(error: unknown, mensajePorDefecto = 'Ocurrió un error'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (error.response?.status === 0) return 'No se pudo conectar al servidor';
  }
  if (error instanceof Error) return error.message;
  return mensajePorDefecto;
}
