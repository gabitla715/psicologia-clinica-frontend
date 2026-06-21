import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SesionAuth, Usuario, LoginCredenciales, RegistroDatos } from '../types/auth';
import { login as loginRequest, logout as logoutRequest, registrar as registrarRequest } from '../api/authService';

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

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
      try {
        setUsuario(JSON.parse(guardado));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setCargando(false);
  }, []);

  function guardarSesion(sesion: SesionAuth) {
    localStorage.setItem('accessToken', sesion.accessToken);
    localStorage.setItem('refreshToken', sesion.refreshToken);
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
