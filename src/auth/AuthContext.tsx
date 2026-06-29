import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SesionAuth, Usuario, LoginCredenciales, RegistroDatos } from '../types/auth';
import {
  login as loginRequest,
  logout as logoutRequest,
  registrar as registrarRequest,
  obtenerPerfil as obtenerPerfilRequest,
} from '../api/authService';
import { tokenStorage } from '../api/client';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (credenciales: LoginCredenciales) => Promise<Usuario>;
  registrarse: (datos: RegistroDatos) => Promise<Usuario>;
  cerrarSesion: () => Promise<void>;
  marcarContrasenaActualizada: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'sesionUsuario';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Recuperación de sesión al montar la app.
  // Si hay accessToken guardado, validamos contra /users/me; si el backend lo
  // rechaza, el interceptor de axios se encarga del refresh o limpia tokens.
  useEffect(() => {
    let activo = true;
    async function restaurar() {
      const accessToken = tokenStorage.getAccess();
      if (!accessToken) {
        setCargando(false);
        return;
      }
      try {
        const perfil = await obtenerPerfilRequest();
        if (!activo) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
        setUsuario(perfil);
      } catch {
        // Tokens inválidos / expirados sin posibilidad de refresh → limpiamos.
        tokenStorage.clear();
        localStorage.removeItem(STORAGE_KEY);
        if (activo) setUsuario(null);
      } finally {
        if (activo) setCargando(false);
      }
    }
    restaurar();
    return () => {
      activo = false;
    };
  }, []);

  // Escuchamos el evento de logout forzado que dispara el interceptor de axios
  // cuando el refresh token falla.
  useEffect(() => {
    function onForceLogout() {
      tokenStorage.clear();
      localStorage.removeItem(STORAGE_KEY);
      setUsuario(null);
    }
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, []);

  function guardarSesion(sesion: SesionAuth) {
    tokenStorage.save(sesion.accessToken, sesion.refreshToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion.usuario));
    setUsuario(sesion.usuario);
  }

  async function iniciarSesion(credenciales: LoginCredenciales) {
    const sesion = await loginRequest(credenciales);
    guardarSesion(sesion);
    return sesion.usuario;
  }

  async function registrarse(datos: RegistroDatos) {
    const sesion = await registrarRequest(datos);
    guardarSesion(sesion);
    return sesion.usuario;
  }

  async function cerrarSesion() {
    await logoutRequest();
    tokenStorage.clear();
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
  }

  function marcarContrasenaActualizada() {
    if (!usuario) return;
    const actualizado = { ...usuario, debeCambiarContrasena: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizado));
    setUsuario(actualizado);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, iniciarSesion, registrarse, cerrarSesion, marcarContrasenaActualizada }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
