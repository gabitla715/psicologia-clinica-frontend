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
const PENDING_VERIFICATION = 'PENDING_VERIFICATION';

export type ResultadoRegistro =
  | { tipo: 'LISTO'; sesion: SesionAuth }
  | { tipo: 'PENDIENTE_VERIFICACION'; email: string };

// ──────────────────────────────────────────────────────────────
// MODO REAL
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
      'Tu cuenta aún no está verificada. Revisa tu correo institucional o contacta a Bienestar Estudiantil.'
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
  const { data: tokens } = await apiClient.post<AuthResponseBackend>(
    '/auth/register-student',
    mapearRegistroDatosARegisterBackend(datos)
  );

  if (
    tokens.accessToken === PENDING_VERIFICATION ||
    tokens.refreshToken === PENDING_VERIFICATION
  ) {
    return { tipo: 'PENDIENTE_VERIFICACION', email: datos.email };
  }

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

// Actualización de perfil del estudiante.
// El backend (UserController.updateStudentProfile) SOLO permite editar
// estos 4 campos: teléfono, dirección, semestre/paralelo y horario
// académico. Correo, cédula, nombres/apellidos y carrera NO son
// editables por este endpoint.
export interface DatosPerfilEstudianteEditable {
  telefono: string;
  direccion: string;
  semestre: string;
  horarioAcademico: string;
}

async function actualizarPerfilEstudianteReal(datos: DatosPerfilEstudianteEditable): Promise<void> {
  await apiClient.put('/users/me/student-profile', {
    phone: datos.telefono,
    address: datos.direccion,
    term: datos.semestre,
    academicSchedule: datos.horarioAcademico,
  });
}

// Recuperación de contraseña
async function solicitarRecuperacionReal(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

async function restablecerContrasenaReal(args: {
  token: string;
  contrasenaNueva: string;
}): Promise<void> {
  await apiClient.post('/auth/reset-password', {
    token: args.token,
    newPassword: args.contrasenaNueva,
  });
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
      activo: true,
      debeCambiarContrasena: false,
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

export async function actualizarPerfilEstudiante(datos: DatosPerfilEstudianteEditable): Promise<void> {
  if (USAR_MOCK) {
    const guardado = localStorage.getItem('sesionUsuario');
    if (!guardado) throw new Error('Sin sesión');
    const usuario = JSON.parse(guardado) as Usuario;
    usuario.telefono = datos.telefono;
    if (usuario.datosEstudiante) {
      usuario.datosEstudiante.semestre = datos.semestre;
      usuario.datosEstudiante.direccion = datos.direccion;
      usuario.datosEstudiante.horarioAcademico = datos.horarioAcademico;
    }
    localStorage.setItem('sesionUsuario', JSON.stringify(usuario));
    return;
  }
  await actualizarPerfilEstudianteReal(datos);
}

export async function solicitarRecuperacion(email: string): Promise<void> {
  if (USAR_MOCK) return;
  await solicitarRecuperacionReal(email);
}

export async function restablecerContrasena(args: {
  token: string;
  contrasenaNueva: string;
}): Promise<void> {
  if (USAR_MOCK) return;
  await restablecerContrasenaReal(args);
}
