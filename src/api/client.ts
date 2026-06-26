import axios from 'axios';

// IMPORTANTE: VITE_API_URL debe incluir /v1, porque el backend real expone
// sus rutas en /api/v1/... (ver SecurityConfig.java -> "/api/v1/auth/**").
// Ej: VITE_API_URL=http://localhost:8080/api/v1
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Evita loops de refresh: solo reintentamos una vez por request.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const esLoginOLogout = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !original?._retry && !esLoginOLogout) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(original);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('sesionUsuario');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
