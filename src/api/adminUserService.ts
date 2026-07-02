// ────────────────────────────────────────────────────────────────
// Servicio de administración de usuarios.
//
// Endpoints consumidos (todos bajo /api/v1/admin/users):
//   POST  /register-specialist   (ADMIN, COORDINATOR) — crea un especialista
//   PATCH /{userId}/status?isActive=  (ADMIN, COORDINATOR) — activa/desactiva
//   GET   /                      (ADMIN, COORDINATOR) — lista todos los usuarios
//   GET   /{userId}              (ADMIN, COORDINATOR) — perfil completo
//   PUT   /{userId}              (ADMIN, COORDINATOR) — actualización COMPLETA
//
// Verificado directamente en AdminUserController.java y sus DTOs
// (SpecialistRegisterRequest, UpdateUserByAdminRequest, UserProfileResponse).
//
//  Notas importantes verificadas en el código:
// 1. `POST /register-specialist` responde un AuthResponse (accessToken +
//    refreshToken). Son tokens del especialista recién creado, NO del
//    administrador que hace la petición: se descartan intencionalmente
//    para no pisar la sesión activa del admin/coordinador.
// 2. `PUT /{userId}` es un reemplazo COMPLETO del perfil (no un PATCH
//    parcial): `firstName`, `lastName`, `email` e `isActive` son
//    obligatorios en el backend. Por eso el formulario de edición
//    siempre parte de un GET previo para precargar todos los campos,
//    incluidos los que el admin no vaya a tocar.
// 3. `GET /` y `GET /{userId}` reutilizan exactamente la misma forma que
//    `UserProfileResponseBackend` ya definido en `types/auth.ts` para el
//    perfil propio, así que se reutiliza ese tipo y el mapper existente
//    `mapearPerfilBackendAUsuario` en vez de duplicar la lógica de mapeo.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';
import {
  mapearPerfilBackendAUsuario,
  type RolBackend,
  type Usuario,
  type UserProfileResponseBackend,
} from '../types/auth';

// ─── DTOs del backend ───────────────────────────────────────────
export interface RegistrarEspecialistaRequest {
  identification: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  professionalCode: string;
}

export interface ActualizarUsuarioRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  // Datos de estudiante (solo aplican si el usuario es STUDENT)
  carrera?: string;
  term?: string;
  birthDate?: string;
  address?: string;
  nationality?: string;
  ethnicity?: string;
  gender?: string;
  sex?: string;
  hasDisability?: boolean;
  disabilityType?: string;
  disabilityPercentage?: number;
  conadisId?: string;
  academicSchedule?: string;
  // Datos de especialista (solo aplican si el usuario es SPECIALIST)
  specialty?: string;
  professionalCode?: string;
}

export const adminUserService = {
  /** Crea una cuenta de especialista. Solo ADMIN/COORDINATOR. */
  async registrarEspecialista(datos: RegistrarEspecialistaRequest): Promise<void> {
    await apiClient.post('/admin/users/register-specialist', datos);
  },

  /** Lista todos los usuarios registrados en el sistema. */
  async listarUsuarios(): Promise<Usuario[]> {
    const { data } = await apiClient.get<UserProfileResponseBackend[]>('/admin/users');
    return data.map(mapearPerfilBackendAUsuario);
  },

  /** Obtiene el perfil completo de un usuario por su ID. */
  async obtenerUsuario(userId: number): Promise<Usuario> {
    const { data } = await apiClient.get<UserProfileResponseBackend>(`/admin/users/${userId}`);
    return mapearPerfilBackendAUsuario(data);
  },

  /** Activa o desactiva un usuario. Si se desactiva, el backend cierra sus sesiones. */
  async cambiarEstado(userId: number, activo: boolean): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/status`, null, {
      params: { isActive: activo },
    });
  },

  /**
   * Reemplaza el perfil completo del usuario. El backend exige `firstName`,
   * `lastName`, `email` e `isActive`; el resto de campos son opcionales pero
   * se recomienda enviarlos siempre para no perder datos ya guardados.
   */
  async actualizarUsuario(userId: number, datos: ActualizarUsuarioRequest): Promise<void> {
    await apiClient.put(`/admin/users/${userId}`, datos);
  },
};

// ─── Helpers de presentación ────────────────────────────────────
export const NOMBRE_ROL_BACKEND: Record<RolBackend, string> = {
  STUDENT: 'Estudiante',
  SPECIALIST: 'Especialista',
  ADMIN: 'Administrador',
  COORDINATOR: 'Coordinador/a',
};
