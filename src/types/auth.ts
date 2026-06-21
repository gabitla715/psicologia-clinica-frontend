export type Rol = 'ADMIN' | 'PSICOLOGO' | 'COORDINADOR' | 'ESTUDIANTE';

export type ServicioPsicologico = 'CLINICA' | 'GENERAL';

export interface Usuario {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: Rol;
  debeCambiarContrasena: boolean;
  servicioInteres?: ServicioPsicologico;
}

export interface SesionAuth {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredenciales {
  email: string;
  contrasena: string;
}

export interface RegistroDatos {
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  contrasena: string;
  servicioInteres: ServicioPsicologico;
}
