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

const USAR_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// El backend devuelve este valor literal en accessToken/refreshToken cuando
// la cuenta se creó pero requiere verificación por correo antes de usarse.
const PENDING_VERIFICATION = 'PENDING_VERIFICATION';

/**
 * Resultado del registro. La cuenta puede estar lista (con tokens reales)
 * o pendiente de verificación por correo.
 */
export type ResultadoRegistro =
  | { tipo: 'LISTO'; sesion: SesionAuth }
  | { tipo: 'PENDIENTE_VERIFICACION'; email: string };

// ──────────────────────────────────────────────────────────────
// MODO REAL — backend Spring Boot
// ──────────────────────────────────────────────────────────────

async function loginReal(cred: LoginCredenciales): Promise<SesionAuth> {
  const { data: tokens } = await apiClient.post<AuthResponseBackend>(
    '/auth/login',
    mapearCredencialesALoginBackend(cred)
  );

  if (
    tokens.accessToken === PENDING_VERIFICATION ||
    tokens.refreshToken === PENDING_VERIFICATION
  ) {
    throw new Error(
      'Tu cuenta aún no está verificada. Revisa tu correo institucional para activarla.'
    );
  }

  tokenStorage.save(tokens.accessToken, tokens.refreshToken);

  const { data: perfil } = await apiClient.get<UserProfileResponseBackend>('/users/me/');
  const usuario = mapearPerfilBackendAUsuario(perfil);

  return {
    usuario,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

async function registrarReal(datos: RegistroDatos): Promise<ResultadoRegistro> {
  // Guardamos servicioInteres ANTES de la llamada porque no se envía al backend.
  localStorage.setItem(`servicioInteres:${datos.email}`, datos.servicioInteres);

  const { data: tokens } = await apiClient.post<AuthResponseBackend>(
    '/auth/register-student',
    mapearRegistroDatosARegisterBackend(datos)
  );

  // CASO ESPERADO: el backend exige verificación de correo antes de activar la cuenta.
  // Devuelve `{accessToken: "PENDING_VERIFICATION", refreshToken: "PENDING_VERIFICATION"}`.
  // En ese caso NO guardamos tokens (no son JWT válidos) y devolvemos PENDIENTE.
  if (
    tokens.accessToken === PENDING_VERIFICATION ||
    tokens.refreshToken === PENDING_VERIFICATION
  ) {
    return { tipo: 'PENDIENTE_VERIFICACION', email: datos.email };
  }

  // CASO ALTERNO: el backend ya devolvió tokens reales (cuenta activa).
  tokenStorage.save(tokens.accessToken, tokens.refreshToken);

  const { data: perfil } = await apiClient.get<UserProfileResponseBackend>('/users/me/');
  const usuario = mapearPerfilBackendAUsuario(perfil);

  return {
    tipo: 'LISTO',
    sesion: {
      usuario,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  };
}

async function logoutReal(): Promise<void> {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) return;
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
// MODO MOCK
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
// API PÚBLICA
// ──────────────────────────────────────────────────────────────

export async function login(cred: LoginCredenciales): Promise<SesionAuth> {
  if (USAR_MOCK) {
    const u = usuariosMock.find(
      (x) => x.email === cred.email && x.contrasena === cred.contrasena
    );
    if (!u) throw new Error('Credenciales inválidas');
    return emitirSesionMock(u);
  }
  return loginReal(cred);
}

export async function registrar(datos: RegistroDatos): Promise<ResultadoRegistro> {
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
    return { tipo: 'LISTO', sesion: emitirSesionMock(nuevo) };
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
