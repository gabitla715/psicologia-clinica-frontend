import { apiClient, tokenStorage } from './client';
import { USUARIOS_MOCK } from './mockData';
import type {
  AuthResponseBackend,
  LoginCredenciales,
  RegistroDatos,
  SesionAuth,
  Usuario,
  UserProfileResponseBackend,
} from '../types/auth';
import {
  mapearCredencialesALoginBackend,
  mapearPerfilBackendAUsuario,
  mapearRegistroDatosARegisterBackend,
} from '../types/auth';

// Si VITE_USE_MOCK === 'true' usa el simulador en memoria; cualquier otro valor
// (o ausencia de la variable) usa el backend real.
const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// ──────────────────────────────────────────────────────────────
// MODO REAL — backend Spring Boot
// ──────────────────────────────────────────────────────────────

async function loginReal(cred: LoginCredenciales): Promise<SesionAuth> {
  // 1) Pedimos los tokens.
  const { data: tokens } = await apiClient.post<AuthResponseBackend>(
    '/auth/login',
    mapearCredencialesALoginBackend(cred)
  );

  // 2) Guardamos los tokens ANTES de pedir el perfil; /users/me requiere Bearer.
  tokenStorage.save(tokens.accessToken, tokens.refreshToken);

  // 3) Pedimos el perfil del usuario autenticado.
  const { data: perfil } = await apiClient.get<UserProfileResponseBackend>('/users/me/');
  const usuario = mapearPerfilBackendAUsuario(perfil);

  return {
    usuario,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function registrarReal(datos: RegistroDatos): Promise<SesionAuth> {
  // Guardamos servicioInteres ANTES de la llamada porque no se envía al backend
  // (no existe el campo allí). Después lo recuperaremos al mapear el perfil.
  localStorage.setItem(`servicioInteres:${datos.email}`, datos.servicioInteres);

  const { data: tokens } = await apiClient.post<AuthResponseBackend>(
    '/auth/register-student',
    mapearRegistroDatosARegisterBackend(datos)
  );

  tokenStorage.save(tokens.accessToken, tokens.refreshToken);

  const { data: perfil } = await apiClient.get<UserProfileResponseBackend>('/users/me/');
  const usuario = mapearPerfilBackendAUsuario(perfil);

  return {
    usuario,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function logoutReal(): Promise<void> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return;
  // El backend exige el refreshToken en el body para invalidarlo.
  // Si falla, no abortamos: queremos cerrar sesión del lado cliente igual.
  try {
    await apiClient.post('/auth/logout', { refreshToken: refresh });
  } catch {
    /* ignoramos */
  }
}

async function cambiarContrasenaReal(args: {
  contrasenaActual: string;
  contrasenaNueva: string;
}): Promise<void> {
  await apiClient.put('/users/me/password', {
    oldPassword: args.contrasenaActual,
    newPassword: args.contrasenaNueva,
  });
}

async function obtenerPerfilReal(): Promise<Usuario> {
  const { data: perfil } = await apiClient.get<UserProfileResponseBackend>('/users/me/');
  return mapearPerfilBackendAUsuario(perfil);
}

// ──────────────────────────────────────────────────────────────
// MODO MOCK — solo se usa si VITE_USE_MOCK=true
// ──────────────────────────────────────────────────────────────

const usuariosMock: Array<Usuario & { contrasena: string }> = [...USUARIOS_MOCK];
let siguienteIdMock = usuariosMock.length + 1;

function tokenFalso(payload: object) {
  return `mock.${btoa(JSON.stringify(payload))}.token`;
}

function emitirSesionMock(u: Usuario & { contrasena: string }): SesionAuth {
  const { contrasena, ...usuarioSinContrasena } = u;
  void contrasena;
  return {
    usuario: usuarioSinContrasena,
    accessToken: tokenFalso({ sub: u.email, rol: u.rol }),
    refreshToken: tokenFalso({ sub: u.email, tipo: 'refresh' }),
  };
}

// ──────────────────────────────────────────────────────────────
// API PÚBLICA del módulo — lo único que el resto de la app usa.
// ──────────────────────────────────────────────────────────────

export async function login(cred: LoginCredenciales): Promise<SesionAuth> {
  if (USAR_MOCK) {
    const u = usuariosMock.find((x) => x.email === cred.email && x.contrasena === cred.contrasena);
    if (!u) throw new Error('Credenciales inválidas');
    return emitirSesionMock(u);
  }
  return loginReal(cred);
}

export async function registrar(datos: RegistroDatos): Promise<SesionAuth> {
  if (USAR_MOCK) {
    if (usuariosMock.some((u) => u.email === datos.email)) {
      throw new Error('Ya existe una cuenta con ese correo');
    }
    const nuevo: Usuario & { contrasena: string } = {
      id: siguienteIdMock++,
      identificacion: datos.identificacion,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email: datos.email,
      rol: 'ESTUDIANTE',
      debeCambiarContrasena: false,
      servicioInteres: datos.servicioInteres,
      contrasena: datos.contrasena,
    };
    usuariosMock.push(nuevo);
    return emitirSesionMock(nuevo);
  }
  return registrarReal(datos);
}

export async function logout(): Promise<void> {
  if (USAR_MOCK) return;
  await logoutReal();
}

export async function cambiarContrasena(args: {
  contrasenaActual: string;
  contrasenaNueva: string;
}): Promise<void> {
  if (USAR_MOCK) return;
  await cambiarContrasenaReal(args);
}

export async function obtenerPerfil(): Promise<Usuario> {
  if (USAR_MOCK) {
    const guardado = localStorage.getItem('sesionUsuario');
    if (!guardado) throw new Error('Sin sesión');
    return JSON.parse(guardado) as Usuario;
  }
  return obtenerPerfilReal();
}
