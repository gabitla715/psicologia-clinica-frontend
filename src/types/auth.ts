// ============================================================
// TIPOS DEL BACKEND — espejo exacto del contrato HTTP.
// No los cambies si no cambia el backend.
// ============================================================
export type RolBackend = 'STUDENT' | 'SPECIALIST' | 'ADMIN' | 'COORDINATOR';

export interface AuthResponseBackend {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileResponseBackend {
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
  } | null;
  specialistData?: {
    id: number;
    specialty: string;
    professionalCode: string;
  } | null;
}

export interface LoginRequestBackend {
  email: string;
  password: string;
}

export interface StudentRegisterRequestBackend {
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  carrera: string;
  term: string;
  birthDate: string; // ISO yyyy-MM-dd
  address: string;
  nationality: string;
  ethnicity: string;
  gender: string;
  sex: string;
  hasDisability: boolean;
  disabilityType?: string;
  disabilityPercentage?: number;
  conadisId?: string;
}

// ============================================================
// TIPOS DEL FRONTEND — lo que la UI consume.
// Mantienen los nombres en español que ya usa la app.
// ============================================================
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
  // Identificación y credenciales
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  contrasena: string;
  telefono: string;

  // Datos académicos
  carrera: string;
  semestre: string;

  // Datos demográficos
  fechaNacimiento: string; // yyyy-MM-dd
  direccion: string;
  nacionalidad: string;
  etnia: string;
  genero: string;
  sexo: string;

  // Discapacidad
  tieneDiscapacidad: boolean;
  tipoDiscapacidad?: string;
  porcentajeDiscapacidad?: number;
  conadisId?: string;

  // Preferencia local (no se envía al backend, se guarda en el cliente)
  servicioInteres: ServicioPsicologico;
}

// ============================================================
// MAPPERS — traducen entre formato backend y formato frontend.
// Toda la "fealdad" del desajuste vive aquí, no en componentes.
// ============================================================
const ROL_BACKEND_A_FRONT: Record<RolBackend, Rol> = {
  STUDENT: 'ESTUDIANTE',
  SPECIALIST: 'PSICOLOGO',
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINADOR',
};

export function mapearPerfilBackendAUsuario(perfil: UserProfileResponseBackend): Usuario {
  // El backend no expone todavía un flag debeCambiarContrasena ni servicioInteres;
  // los recuperamos de localStorage si el usuario los registró desde esta app.
  const servicioGuardado = localStorage.getItem(`servicioInteres:${perfil.email}`);
  return {
    id: perfil.id,
    identificacion: perfil.identification,
    nombres: perfil.firstName,
    apellidos: perfil.lastName,
    email: perfil.email,
    rol: ROL_BACKEND_A_FRONT[perfil.role],
    debeCambiarContrasena: false,
    servicioInteres: (servicioGuardado as ServicioPsicologico) ?? undefined,
  };
}

export function mapearCredencialesALoginBackend(
  cred: LoginCredenciales
): LoginRequestBackend {
  return { email: cred.email, password: cred.contrasena };
}

export function mapearRegistroDatosARegisterBackend(
  datos: RegistroDatos
): StudentRegisterRequestBackend {
  return {
    identification: datos.identificacion,
    firstName: datos.nombres,
    lastName: datos.apellidos,
    email: datos.email,
    password: datos.contrasena,
    phone: datos.telefono,
    carrera: datos.carrera,
    term: datos.semestre,
    birthDate: datos.fechaNacimiento,
    address: datos.direccion,
    nationality: datos.nacionalidad,
    ethnicity: datos.etnia,
    gender: datos.genero,
    sex: datos.sexo,
    hasDisability: datos.tieneDiscapacidad,
    disabilityType: datos.tieneDiscapacidad ? datos.tipoDiscapacidad : undefined,
    disabilityPercentage: datos.tieneDiscapacidad ? datos.porcentajeDiscapacidad : undefined,
    conadisId: datos.tieneDiscapacidad ? datos.conadisId : undefined,
  };
}
