import { apiClient } from './client';
import { USUARIOS_MOCK } from './mockData';
import type {
  LoginCredenciales,
  RegistroDatos,
  SesionAuth,
  Usuario,
  AuthResponseBackend,
  UserProfileBackend,
} from '../types/auth';
import { mapearPerfilBackendAUsuario } from '../types/auth';

const USAR_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const usuariosEnMemoria: Array<Usuario & { contrasena: string }> = [...USUARIOS_MOCK];
let siguienteId = usuariosEnMemoria.length + 1;

function generarTokenFalso(payload: object): string {
  return `mock.${btoa(JSON.stringify(payload))}.token`;
}

function emitirSesionMock(usuario: Usuario & { contrasena: string }): SesionAuth {
  const { contrasena, ...usuarioSinContrasena } = usuario;
  return {
    usuario: usuarioSinContrasena,
    accessToken: generarTokenFalso({ sub: usuario.email, rol: usuario.rol }),
    refreshToken: generarTokenFalso({ sub: usuario.email, tipo: 'refresh' }),
  };
}

/**
 * El backend real (POST /auth/login) solo devuelve { accessToken, refreshToken }.
 * No incluye los datos del usuario, así que después de loguear hay que llamar
 * GET /users/me/ para traer el perfil y armar la sesión completa.
 */
async function emitirSesionReal(tokens: AuthResponseBackend): Promise<SesionAuth> {
  // Guardamos el accessToken ANTES de pedir el perfil, porque el interceptor
  // de axios (client.ts) lo lee de localStorage para poner el header Authorization.
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);

  const { data } = await apiClient.get<UserProfileBackend>('/users/me/');
  const usuario = mapearPerfilBackendAUsuario(data);

  return {
    usuario,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export async function login(credenciales: LoginCredenciales): Promise<SesionAuth> {
  if (USAR_MOCK) {
    const usuario = usuariosEnMemoria.find(
      (u) => u.email === credenciales.email && u.contrasena === credenciales.contrasena
    );
    if (!usuario) {
      throw new Error('Credenciales inválidas');
    }
    return emitirSesionMock(usuario);
  }

  // El backend espera { email, password }, no { email, contrasena }.
  const { data } = await apiClient.post<AuthResponseBackend>('/auth/login', {
    email: credenciales.email,
    password: credenciales.contrasena,
  });
  return emitirSesionReal(data);
}

export async function registrar(datos: RegistroDatos): Promise<SesionAuth> {
  if (USAR_MOCK) {
    const yaExiste = usuariosEnMemoria.some((u) => u.email === datos.email);
    if (yaExiste) {
      throw new Error('Ya existe una cuenta con ese correo');
    }
    const nuevoUsuario: Usuario & { contrasena: string } = {
      id: siguienteId++,
      identificacion: datos.identificacion,
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      email: datos.email,
      rol: 'ESTUDIANTE',
      debeCambiarContrasena: false,
      servicioInteres: datos.servicioInteres,
      contrasena: datos.contrasena,
    };
    usuariosEnMemoria.push(nuevoUsuario);
    return emitirSesionMock(nuevoUsuario);
  }

  // ⚠️ PENDIENTE: el backend real (POST /auth/register-student) exige muchos más
  // campos obligatorios que los que hoy recoge RegisterPage.tsx: phone, carrera,
  // term, birthDate, address, nationality, ethnicity, gender, sex (ver
  // StudentRegisterRequest.java). Hay que ampliar el formulario de registro
  // antes de conectar esto. Mientras tanto, lanzamos un error explícito en vez
  // de mandar datos incompletos que el backend rechazará con 400.
  throw new Error(
    'El registro contra el backend real todavía no está conectado: faltan campos ' +
      'obligatorios en el formulario (teléfono, carrera, fecha de nacimiento, etc.). ' +
      'Usa VITE_USE_MOCK=true mientras se amplía el formulario de registro.'
  );
}

export async function logout(): Promise<void> {
  if (!USAR_MOCK) {
    const refreshToken = localStorage.getItem('refreshToken');
    await apiClient.post('/auth/logout', { refreshToken }).catch(() => undefined);
  }
}
