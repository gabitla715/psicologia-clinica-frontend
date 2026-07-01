// ────────────────────────────────────────────────────────────────
// Servicio de sesiones psicológicas.
//
// Endpoints consumidos:
//   POST /api/v1/psicologia/sesiones/{fichaId}    (SPECIALIST)
//   GET  /api/v1/psicologia/sesiones/{fichaId}    (SPECIALIST, ADMIN)
//
// El backend calcula numeroSesion automáticamente (secuencia por ficha).
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';
import type { NivelRiesgo } from './entrevistaService';

export interface SesionRequestBackend {
  fecha: string;                      // ISO datetime (LocalDateTime)
  duracionMinutos: number;            // 15..120
  modalidad?: string;
  estadoAsistencia?: string;
  notaClinica?: string;
  tecnicasAplicadas?: string;
  logrosSesion?: string;
  obstaculosSesion?: string;
  tareaCasa?: string;
  estadoEmocionalInicio?: number;     // 1..5
  estadoEmocionalFinal?: number;      // 1..5
  motivacionCompromiso?: number;      // 1..5
  pensamientosAutolesion?: string;
  evaluacionRiesgo?: NivelRiesgo;
  notasRiesgoConfidencial?: string;
}

export interface SesionResponseBackend {
  id: number;
  fichaId: number;
  especialistaId: number;
  nombreEspecialista: string;
  numeroSesion: number;
  fecha: string;
  duracionMinutos: number;
  modalidad?: string | null;
  estadoAsistencia?: string | null;
  notaClinica?: string | null;
  tecnicasAplicadas?: string | null;
  logrosSesion?: string | null;
  obstaculosSesion?: string | null;
  tareaCasa?: string | null;
  estadoEmocionalInicio?: number | null;
  estadoEmocionalFinal?: number | null;
  motivacionCompromiso?: number | null;
  evaluacionRiesgo?: NivelRiesgo | null;
  creadoEn: string;
}

export interface Sesion {
  id: number;
  fichaId: number;
  especialistaId: number;
  nombreEspecialista: string;
  numeroSesion: number;
  fecha: Date;
  duracionMinutos: number;
  modalidad?: string;
  estadoAsistencia?: string;
  notaClinica?: string;
  tecnicasAplicadas?: string;
  logrosSesion?: string;
  obstaculosSesion?: string;
  tareaCasa?: string;
  estadoEmocionalInicio?: number;
  estadoEmocionalFinal?: number;
  motivacionCompromiso?: number;
  evaluacionRiesgo?: NivelRiesgo;
  fechaCreacion: Date;
}

function s(v: string | null | undefined): string | undefined {
  return v ?? undefined;
}
function n(v: number | null | undefined): number | undefined {
  return v ?? undefined;
}
function r(v: NivelRiesgo | null | undefined): NivelRiesgo | undefined {
  return v ?? undefined;
}

function mapear(b: SesionResponseBackend): Sesion {
  return {
    id: b.id,
    fichaId: b.fichaId,
    especialistaId: b.especialistaId,
    nombreEspecialista: b.nombreEspecialista,
    numeroSesion: b.numeroSesion,
    fecha: new Date(b.fecha),
    duracionMinutos: b.duracionMinutos,
    modalidad: s(b.modalidad),
    estadoAsistencia: s(b.estadoAsistencia),
    notaClinica: s(b.notaClinica),
    tecnicasAplicadas: s(b.tecnicasAplicadas),
    logrosSesion: s(b.logrosSesion),
    obstaculosSesion: s(b.obstaculosSesion),
    tareaCasa: s(b.tareaCasa),
    estadoEmocionalInicio: n(b.estadoEmocionalInicio),
    estadoEmocionalFinal: n(b.estadoEmocionalFinal),
    motivacionCompromiso: n(b.motivacionCompromiso),
    evaluacionRiesgo: r(b.evaluacionRiesgo),
    fechaCreacion: new Date(b.creadoEn),
  };
}

export const sesionService = {
  /** Registra una nueva sesión. Solo SPECIALIST. */
  async registrar(fichaId: number, datos: SesionRequestBackend): Promise<Sesion> {
    const { data } = await apiClient.post<SesionResponseBackend>(
      `/psicologia/sesiones/${fichaId}`,
      datos
    );
    return mapear(data);
  },

  /** Lista todas las sesiones de una ficha. SPECIALIST/ADMIN. */
  async listarPorFicha(fichaId: number): Promise<Sesion[]> {
    const { data } = await apiClient.get<SesionResponseBackend[]>(
      `/psicologia/sesiones/${fichaId}`
    );
    return data.map(mapear);
  },
};

// ─── Helpers de presentación ────────────────────────────────────
export const MODALIDADES = ['Presencial', 'Virtual', 'Telefónica'] as const;
export const ESTADOS_ASISTENCIA = [
  'Asistió',
  'Inasistencia justificada',
  'Inasistencia injustificada',
  'Reagendada',
] as const;

export const ETIQUETA_ESCALA_EMOCIONAL: Record<number, string> = {
  1: 'Muy bajo',
  2: 'Bajo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Muy bueno',
};
