import { apiClient } from './client';
import { USUARIOS_MOCK } from './mockData';
import type { LoginCredenciales, RegistroDatos, SesionAuth, Usuario } from '../types/auth';

// Mientras el backend no tenga /auth/login y /auth/registro funcionando,
// este servicio responde con datos simulados, guardados solo en memoria
// (se pierden al recargar la página — es normal, es un mock).
// Cuando el backend esté listo: VITE_USE_MOCK=false en .env, y el resto
// de la app (componentes, rutas, contexto) no necesita tocarse.
const USAR_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

// Copia mutable en memoria, para poder "registrar" usuarios nuevos en modo mock.
const usuariosEnMemoria: Array<Usuario & { contrasena: string }> = [...USUARIOS_MOCK];
let siguienteId = usuariosEnMemoria.length + 1;

function generarTokenFalso(payload: object): string {
  return `mock.${btoa(JSON.stringify(payload))}.token`;
}

function emitirSesion(usuario: Usuario & { contrasena: string }): SesionAuth {
  const { contrasena, ...usuarioSinContrasena } = usuario;
  return {
    usuario: usuarioSinContrasena,
    accessToken: generarTokenFalso({ sub: usuario.email, rol: usuario.rol }),
    refreshToken: generarTokenFalso({ sub: usuario.email, tipo: 'refresh' }),
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
    return emitirSesion(usuario);
  }

  // Backend real: único bloque que cambia al conectar.
  const { data } = await apiClient.post<SesionAuth>('/auth/login', credenciales);
  return data;
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
    return emitirSesion(nuevoUsuario);
  }

  // Backend real: cuando exista POST /auth/registro con esta misma forma de datos.
  const { data } = await apiClient.post<SesionAuth>('/auth/registro', datos);
  return data;
}

export async function logout(): Promise<void> {
  if (!USAR_MOCK) {
    await apiClient.post('/auth/logout').catch(() => undefined);
  }
}
