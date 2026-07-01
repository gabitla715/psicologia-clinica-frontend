// ────────────────────────────────────────────────────────────────
// Servicio de citas de psicología.
//
// Endpoints consumidos (todos bajo /api/v1/psicologia/citas):
//   POST   /                              (SPECIALIST) — agendar
//   PATCH  /{id}/confirmar                (SPECIALIST)
//   PATCH  /{id}/cancelar                 (SPECIALIST, STUDENT)
//   PATCH  /{id}/realizada                (SPECIALIST)
//   GET    /mis-citas                     (SPECIALIST, ADMIN)
//   GET    /?tipoPsicologia={CLINICA|GENERAL}   (ADMIN)
//
// ⚠️ Gap del backend: el estudiante puede CANCELAR una cita si
// conoce su ID, pero no dispone de un endpoint para listar sus
// propias citas. Documentado en INSTRUCCIONES.md para pedirlo.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';
import type { TipoPsicologia } from './fichaService';

// ─── Enums (espejo de los enum Java) ────────────────────────────
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'REALIZADA';
export type TipoCita = 'PRIMERA_CONVOCATORIA' | 'SEGUIMIENTO';

// ─── DTOs del backend ───────────────────────────────────────────
export interface CitaRequestBackend {
  estudianteId: number;
  tipoPsicologia: TipoPsicologia;
  fechaHora: string;           // ISO yyyy-MM-ddTHH:mm:ss
  duracionMinutos?: number;    // default 50 en el backend
  tipoCita: TipoCita;
  modalidad?: string;
  notas?: string;
}

export interface CitaResponseBackend {
  id: number;
  estudianteId: number;
  nombreEstudiante: string;
  especialistaId: number;
  nombreEspecialista: string;
  tipoPsicologia: TipoPsicologia;
  fechaHora: string;
  duracionMinutos: number;
  estado: EstadoCita;
  tipoCita: TipoCita;
  modalidad?: string | null;
  notas?: string | null;
  notificacionEnviada: boolean;
  creadoEn: string;
}

// ─── Tipo de dominio del frontend ───────────────────────────────
export interface Cita {
  id: number;
  estudianteId: number;
  nombreEstudiante: string;
  especialistaId: number;
  nombreEspecialista: string;
  tipoPsicologia: TipoPsicologia;
  fechaHora: Date;
  duracionMinutos: number;
  estado: EstadoCita;
  tipoCita: TipoCita;
  modalidad?: string;
  notas?: string;
  notificacionEnviada: boolean;
  fechaCreacion: Date;
}

function s(v: string | null | undefined): string | undefined {
  return v ?? undefined;
}

function mapear(b: CitaResponseBackend): Cita {
  return {
    id: b.id,
    estudianteId: b.estudianteId,
    nombreEstudiante: b.nombreEstudiante,
    especialistaId: b.especialistaId,
    nombreEspecialista: b.nombreEspecialista,
    tipoPsicologia: b.tipoPsicologia,
    fechaHora: new Date(b.fechaHora),
    duracionMinutos: b.duracionMinutos,
    estado: b.estado,
    tipoCita: b.tipoCita,
    modalidad: s(b.modalidad),
    notas: s(b.notas),
    notificacionEnviada: b.notificacionEnviada,
    fechaCreacion: new Date(b.creadoEn),
  };
}

// ─── Servicio ───────────────────────────────────────────────────
export const citaService = {
  /** Agenda una nueva cita. Solo SPECIALIST. */
  async agendar(datos: CitaRequestBackend): Promise<Cita> {
    const { data } = await apiClient.post<CitaResponseBackend>(
      '/psicologia/citas',
      datos
    );
    return mapear(data);
  },

  /** Confirma una cita PENDIENTE. Solo SPECIALIST. */
  async confirmar(citaId: number): Promise<Cita> {
    const { data } = await apiClient.patch<CitaResponseBackend>(
      `/psicologia/citas/${citaId}/confirmar`
    );
    return mapear(data);
  },

  /** Cancela una cita. SPECIALIST o STUDENT (dueño). */
  async cancelar(citaId: number): Promise<Cita> {
    const { data } = await apiClient.patch<CitaResponseBackend>(
      `/psicologia/citas/${citaId}/cancelar`
    );
    return mapear(data);
  },

  /** Marca una cita como REALIZADA. Solo SPECIALIST. */
  async marcarRealizada(citaId: number): Promise<Cita> {
    const { data } = await apiClient.patch<CitaResponseBackend>(
      `/psicologia/citas/${citaId}/realizada`
    );
    return mapear(data);
  },

  /** Lista las citas del especialista autenticado. SPECIALIST, ADMIN. */
  async listarMisCitas(): Promise<Cita[]> {
    const { data } = await apiClient.get<CitaResponseBackend[]>(
      '/psicologia/citas/mis-citas'
    );
    return data.map(mapear);
  },

  /** Lista todas las citas por tipo de psicología. Solo ADMIN. */
  async listarPorTipo(tipoPsicologia: TipoPsicologia): Promise<Cita[]> {
    const { data } = await apiClient.get<CitaResponseBackend[]>(
      '/psicologia/citas',
      { params: { tipoPsicologia } }
    );
    return data.map(mapear);
  },
};

// ─── Helpers de presentación ────────────────────────────────────
export const NOMBRE_ESTADO_CITA: Record<EstadoCita, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  REALIZADA: 'Realizada',
};

export const COLOR_ESTADO_CITA: Record<EstadoCita, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  CONFIRMADA: 'bg-blue-50 text-blue-700 ring-blue-200',
  CANCELADA: 'bg-rose-50 text-rose-700 ring-rose-200',
  REALIZADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export const NOMBRE_TIPO_CITA: Record<TipoCita, string> = {
  PRIMERA_CONVOCATORIA: 'Primera convocatoria',
  SEGUIMIENTO: 'Seguimiento',
};

export const MODALIDADES_CITA = ['Presencial', 'Virtual', 'Telefónica'] as const;

// Duraciones sugeridas para el selector; el backend acepta cualquier entero.
export const DURACIONES_SUGERIDAS = [30, 45, 50, 60, 90] as const;

/**
 * Devuelve true si la cita es "próxima" (hoy o en el futuro y no cancelada/realizada).
 * Es un helper de UI, no una regla del backend.
 */
export function esProxima(cita: Cita): boolean {
  if (cita.estado === 'CANCELADA' || cita.estado === 'REALIZADA') return false;
  return cita.fechaHora.getTime() >= Date.now();
}
