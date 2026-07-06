// ────────────────────────────────────────────────────────────────
// Servicio REAL de solicitudes de atención psicológica.
// Reemplaza a `coordinadorMockService.ts` (localStorage), que queda
// obsoleto: este archivo habla directamente con el backend.
//
// Endpoints consumidos (todos bajo /api/v1/solicitudes), verificados
// en SolicitudController.java:
//   POST   /                    (STUDENT)               — crear
//   GET    /mis-solicitudes     (STUDENT)                — propias
//   GET    /pendientes          (COORDINATOR, ADMIN)     — pendientes
//   PATCH  /{id}/asignar        (COORDINATOR, ADMIN)     — asignar especialista
//   PATCH  /{id}/cancelar       (STUDENT)                — cancelar
//
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';
import type { TipoPsicologia } from './fichaService';

export type EstadoSolicitud = 'PENDIENTE' | 'ASIGNADA' | 'RECHAZADA' | 'CANCELADA';

export interface SolicitudAtencionBackend {
  id: number;
  estudianteId: number;
  nombreEstudiante: string;
  tipoPsicologia: TipoPsicologia;
  motivoSolicitud: string;
  estado: EstadoSolicitud;
  especialistaId?: number | null;
  nombreEspecialista?: string | null;
  notasCoordinador?: string | null;
  fechaAsignacion?: string | null;
  creadoEn: string;
}

export const solicitudService = {
  /** El estudiante crea una solicitud de atención. */
  async crear(tipoPsicologia: TipoPsicologia, motivoSolicitud: string): Promise<SolicitudAtencionBackend> {
    const { data } = await apiClient.post<SolicitudAtencionBackend>('/solicitudes', {
      tipoPsicologia,
      motivoSolicitud,
    });
    return data;
  },

  /** El estudiante ve sus propias solicitudes (todas, cualquier estado). */
  async misSolicitudes(): Promise<SolicitudAtencionBackend[]> {
    const { data } = await apiClient.get<SolicitudAtencionBackend[]>('/solicitudes/mis-solicitudes');
    return data;
  },

  /**
   * Coordinador/Admin: solicitudes pendientes de asignación.
   */
  async pendientes(): Promise<SolicitudAtencionBackend[]> {
    const { data } = await apiClient.get<SolicitudAtencionBackend[]>('/solicitudes/pendientes');
    return data;
  },

  /** Coordinador/Admin: asigna un especialista a una solicitud. */
  async asignar(solicitudId: number, especialistaId: number, notas?: string): Promise<SolicitudAtencionBackend> {
    const { data } = await apiClient.patch<SolicitudAtencionBackend>(
      `/solicitudes/${solicitudId}/asignar`,
      { especialistaId, notas }
    );
    return data;
  },

  /** El estudiante cancela su propia solicitud (debe seguir PENDIENTE). */
  async cancelar(solicitudId: number): Promise<SolicitudAtencionBackend> {
    const { data } = await apiClient.patch<SolicitudAtencionBackend>(`/solicitudes/${solicitudId}/cancelar`);
    return data;
  },
};

export const NOMBRE_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente de asignación',
  ASIGNADA: 'Asignada a un especialista',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

export const COLOR_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  ASIGNADA: 'bg-blue-50 text-blue-700 ring-blue-200',
  RECHAZADA: 'bg-red-50 text-red-700 ring-red-200',
  CANCELADA: 'bg-slate-100 text-slate-600 ring-slate-200',
};
