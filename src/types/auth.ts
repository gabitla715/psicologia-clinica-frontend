// ============================================================
// TIPOS DEL BACKEND — espejo exacto del contrato HTTP.
// ============================================================
export type RolBackend = 'STUDENT' | 'SPECIALIST' | 'ADMIN' | 'COORDINATOR';

export interface AuthResponseBackend {
  accessToken: string;
  refreshToken: string;
}

export interface StudentDataBackend {
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
}

export interface SpecialistDataBackend {
  id: number;
  specialty: string;
  professionalCode: string;
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
  studentData?: StudentDataBackend | null;
  specialistData?: SpecialistDataBackend | null;
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
}

// ============================================================
// TIPOS DEL FRONTEND
// ============================================================
export type Rol = 'ADMIN' | 'PSICOLOGO' | 'COORDINADOR' | 'ESTUDIANTE';
export type ServicioPsicologico = 'CLINICA' | 'GENERAL';

export interface DatosEstudiante {
  carrera: string;
  semestre: string;
  fechaNacimiento: string;
  direccion: string;
  nacionalidad: string;
  etnia: string;
  genero: string;
  sexo: string;
  tieneDiscapacidad: boolean;
  tipoDiscapacidad?: string;
  porcentajeDiscapacidad?: number;
  conadisId?: string;
  horarioAcademico?: string;
}

export interface DatosEspecialista {
  id: number;
  especialidad: string;
  codigoProfesional: string;
}

export interface Usuario {
  id: number;
  identificacion: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  rol: Rol;
  activo: boolean;
  debeCambiarContrasena: boolean;
  servicioInteres?: ServicioPsicologico;
  datosEstudiante?: DatosEstudiante;
  datosEspecialista?: DatosEspecialista;
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

// El estudiante ya NO elige servicioInteres en el registro: lo hace después del login.
export interface RegistroDatos {
  nombres: string;
  apellidos: string;
  identificacion: string;
  email: string;
  contrasena: string;
  telefono: string;
  carrera: string;
  semestre: string;
  fechaNacimiento: string;
  direccion: string;
  nacionalidad: string;
  etnia: string;
  genero: string;
  sexo: string;
  tieneDiscapacidad: boolean;
  tipoDiscapacidad?: string;
  porcentajeDiscapacidad?: number;
  conadisId?: string;
}

// ============================================================
// MAPPERS
// ============================================================
const ROL_BACKEND_A_FRONT: Record<RolBackend, Rol> = {
  STUDENT: 'ESTUDIANTE',
  SPECIALIST: 'PSICOLOGO',
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINADOR',
};

export function mapearPerfilBackendAUsuario(perfil: UserProfileResponseBackend): Usuario {
  // El servicio elegido por el estudiante se guarda en localStorage al hacer
  // la selección en la pantalla "Elegir servicio".
  const servicioGuardado = localStorage.getItem(`servicioInteres:${perfil.email}`);

  const datosEstudiante: DatosEstudiante | undefined = perfil.studentData
    ? {
        carrera: perfil.studentData.carrera,
        semestre: perfil.studentData.term,
        fechaNacimiento: perfil.studentData.birthDate,
        direccion: perfil.studentData.address,
        nacionalidad: perfil.studentData.nationality,
        etnia: perfil.studentData.ethnicity,
        genero: perfil.studentData.gender,
        sexo: perfil.studentData.sex,
        tieneDiscapacidad: perfil.studentData.hasDisability,
        tipoDiscapacidad: perfil.studentData.disabilityType ?? undefined,
        porcentajeDiscapacidad: perfil.studentData.disabilityPercentage ?? undefined,
        conadisId: perfil.studentData.conadisId ?? undefined,
        horarioAcademico: perfil.studentData.academicSchedule ?? undefined,
      }
    : undefined;

  const datosEspecialista: DatosEspecialista | undefined = perfil.specialistData
    ? {
        id: perfil.specialistData.id,
        especialidad: perfil.specialistData.specialty,
        codigoProfesional: perfil.specialistData.professionalCode,
      }
    : undefined;

  return {
    id: perfil.id,
    identificacion: perfil.identification,
    nombres: perfil.firstName,
    apellidos: perfil.lastName,
    email: perfil.email,
    telefono: perfil.phone,
    rol: ROL_BACKEND_A_FRONT[perfil.role],
    activo: perfil.isActive,
    debeCambiarContrasena: false,
    servicioInteres: (servicioGuardado as ServicioPsicologico) ?? undefined,
    datosEstudiante,
    datosEspecialista,
  };
}

export function mapearCredencialesALoginBackend(cred: LoginCredenciales): LoginRequestBackend {
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
