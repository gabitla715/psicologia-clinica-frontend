import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SesionAuth, Usuario, LoginCredenciales, RegistroDatos } from '../types/auth';
import {
  login as loginRequest,
  logout as logoutRequest,
  registrar as registrarRequest,
  obtenerPerfil as obtenerPerfilRequest,
  type ResultadoRegistro,
} from '../api/authService';
import { tokenStorage } from '../api/client';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (credenciales: LoginCredenciales) => Promise<Usuario>;
  registrarse: (datos: RegistroDatos) => Promise<ResultadoRegistro>;
  cerrarSesion: () => Promise<void>;
  marcarContrasenaActualizada: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'sesionUsuario';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    function onForceLogout() {
      tokenStorage.clear();
      localStorage.removeItem(STORAGE_KEY);
      setUsuario(null);
      // Igual que en cerrarSesion(): evita dejar la URL restringida de la
      // sesión anterior como "from" para el próximo login.
      navigate('/ingresar', { replace: true, state: null });
    }
    window.addEventListener('auth:logout', onForceLogout);
    return () => window.removeEventListener('auth:logout', onForceLogout);
  }, [navigate]);

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

  async function registrarse(datos: RegistroDatos): Promise<ResultadoRegistro> {
    const resultado = await registrarRequest(datos);
    // Solo creamos sesión si el backend ya activó la cuenta. Si está pendiente
    // de verificación, devolvemos el resultado para que la página muestre el
    // mensaje correspondiente.
    if (resultado.tipo === 'LISTO') {
      guardarSesion(resultado.sesion);
    }
    return resultado;
  }

  async function cerrarSesion() {
    await logoutRequest();
    tokenStorage.clear();
    localStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
    // Navega explícitamente a /ingresar SIN arrastrar ningún location.state
    // previo. Si no hiciéramos esto, PrivateRoute redirigiría aquí guardando
    // la URL en la que estaba la sesión anterior (ej. /usuarios, solo ADMIN)
    // como "from", y el próximo login (de otro rol) intentaría volver ahí
    // -> pantalla de "Acceso restringido". Ver bug reportado con logout
    // admin/especialista seguido de login como estudiante.
    navigate('/ingresar', { replace: true, state: null });
  }

  function marcarContrasenaActualizada() {
    if (!usuario) return;
    const actualizado = { ...usuario, debeCambiarContrasena: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizado));
    setUsuario(actualizado);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        marcarContrasenaActualizada,
      }}
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
