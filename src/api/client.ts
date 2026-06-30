import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthResponseBackend } from '../types/auth';

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

// Rutas públicas a las que NO debemos enviar Authorization.
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register-student',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

function esEndpointPublico(url: string | undefined): boolean {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((path) => url.includes(path));
}

// ─── Request interceptor ───────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  if (esEndpointPublico(config.url)) {
    delete config.headers.Authorization;
    return config;
  }
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: refresh token automático ────────────
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
    if (esEndpointPublico(original.url)) {
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

// ─── Helper para mensajes de error legibles ─────────────────────
// Lee TODOS los formatos típicos de Spring Boot (message, error, errors[],
// validationErrors[], detail, title) y devuelve algo útil para el usuario.
export function extraerMensajeError(error: unknown, mensajePorDefecto = 'Ocurrió un error'): string {
  // Log siempre en consola para que el desarrollador vea qué pasó.
  if (axios.isAxiosError(error)) {
    console.error('[apiClient] HTTP error', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    const data = error.response?.data as
      | {
          message?: string;
          error?: string;
          detail?: string;
          title?: string;
          errors?: Array<{ defaultMessage?: string; field?: string; message?: string }>;
          validationErrors?: Record<string, string>;
        }
      | string
      | undefined;

    if (typeof data === 'string' && data.length > 0 && data.length < 300) {
      return data;
    }

    if (data && typeof data === 'object') {
      // Errores de validación tipo Spring Boot (BindingResult).
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const mensajes = data.errors
          .map((e) => {
            const campo = e.field ? `${e.field}: ` : '';
            return campo + (e.defaultMessage ?? e.message ?? '');
          })
          .filter((m) => m.trim().length > 0);
        if (mensajes.length > 0) return mensajes.join(' • ');
      }
      // Errores de validación tipo Map<String,String>.
      if (data.validationErrors && Object.keys(data.validationErrors).length > 0) {
        return Object.entries(data.validationErrors)
          .map(([campo, msg]) => `${campo}: ${msg}`)
          .join(' • ');
      }
      if (data.message) return data.message;
      if (data.detail) return data.detail;
      if (data.error) return data.error;
      if (data.title) return data.title;
    }

    // Mensajes específicos por status si no hay cuerpo legible.
    const status = error.response?.status;
    if (status === 400) return 'El servidor rechazó el formulario. Revisa que todos los campos estén bien llenos.';
    if (status === 401) return 'No estás autorizado. Inicia sesión nuevamente.';
    if (status === 403) return 'No tienes permisos para realizar esta acción.';
    if (status === 404) return 'Recurso no encontrado.';
    if (status === 409) return 'Ya existe un registro con esos datos (correo o cédula duplicados).';
    if (status && status >= 500) return 'Error interno del servidor. Intenta de nuevo en un momento.';
    if (status === 0 || !error.response) return 'No se pudo conectar al servidor.';
  }

  if (error instanceof Error) return error.message;
  return mensajePorDefecto;
}