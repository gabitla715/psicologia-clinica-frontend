// ────────────────────────────────────────────────────────────────
// Servicio REAL (no mock) de estudiantes y especialistas, para la
// vista del coordinador. Es un wrapper delgado sobre `adminUserService`,
// que ya consume GET/PUT/PATCH /api/v1/admin/users — endpoints reales,
// verificados en AdminUserController.java, con hasAnyRole('ADMIN',
// 'COORDINATOR').
//
// No duplicamos lógica de mapeo: reutilizamos `adminUserService` y solo
// agregamos los filtros por rol que la vista del coordinador necesita.
// ────────────────────────────────────────────────────────────────
import { adminUserService } from './adminUserService';
import type { Usuario } from '../types/auth';

export const coordinadorEstudiantesService = {
  /** Lista todos los usuarios con rol ESTUDIANTE. Dato real del backend. */
  async listarEstudiantes(): Promise<Usuario[]> {
    const todos = await adminUserService.listarUsuarios();
    return todos.filter((u) => u.rol === 'ESTUDIANTE');
  },

  /** Lista todos los usuarios con rol PSICOLOGO (especialista). Dato real. */
  async listarEspecialistas(): Promise<Usuario[]> {
    const todos = await adminUserService.listarUsuarios();
    return todos.filter((u) => u.rol === 'PSICOLOGO');
  },

  /** Activa o desactiva a un estudiante. Real: PATCH /admin/users/{id}/status. */
  async cambiarEstadoEstudiante(userId: number, activo: boolean): Promise<void> {
    await adminUserService.cambiarEstado(userId, activo);
  },
};
