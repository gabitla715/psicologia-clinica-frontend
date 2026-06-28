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

// --- Tipos que reflejan EXACTAMENTE lo que devuelve el backend real ---
export interface AuthResponseBackend {
  accessToken: string;
  refreshToken: string;
}

// El enum Role.java del backend: STUDENT, SPECIALIST, ADMIN, COORDINATOR
export type RolBackend = 'STUDENT' | 'SPECIALIST' | 'ADMIN' | 'COORDINATOR';

// com.uce.psicologiaclinica.autenticacion.application.port.in.UserProfileResponse
export interface UserProfileBackend {
  id: number;
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: RolBackend;
  isActive: boolean;
  studentData?: {
    carrera: string;
    term: string;
    birthDate: string;
    address: string;
    nationality: string;
    ethnicity: string;
    gender: string;
    sex: string;
    hasDisability: boolean;
    disabilityType?: string;
    disabilityPercentage?: number;
    conadisId?: string;
    academicSchedule?: string;
  };
  specialistData?: {
    id: number;
    specialty: string;
    professionalCode: string;
  };
}

const MAPA_ROL_BACKEND_A_FRONTEND: Record<RolBackend, Rol> = {
  STUDENT: 'ESTUDIANTE',
  SPECIALIST: 'PSICOLOGO',
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINADOR',
};

/** Convierte el perfil que entrega el backend (UserProfileResponse) al `Usuario` que usa la UI. */
export function mapearPerfilBackendAUsuario(perfil: UserProfileBackend): Usuario {
  return {
    id: perfil.id,
    identificacion: perfil.identification,
    nombres: perfil.firstName,
    apellidos: perfil.lastName,
    email: perfil.email,
    rol: MAPA_ROL_BACKEND_A_FRONTEND[perfil.role],
    debeCambiarContrasena: false,
  };
}
