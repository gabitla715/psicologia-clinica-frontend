// ────────────────────────────────────────────────────────────────
// Servicio de desistimiento.
//
// Endpoint consumido:
//   POST /api/v1/psicologia/desistimientos/{fichaId}   (SPECIALIST)
//
// Al registrarse, el backend cambia el estado de la ficha a DESISTIDA.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

export type MotivoDesistimiento = 'PERSONAL' | 'ACADEMICO' | 'LABORAL' | 'OTRO';

export interface DesistimientoRequestBackend {
  motivoCategoria: MotivoDesistimiento;   // requerido
  motivoDescripcion?: string;
  informadoPor?: string;
}

export interface DesistimientoResponseBackend {
  id: number;
  fichaId: number;
  especialistaId: number;
  nombreEspecialista: string;
  motivoCategoria: MotivoDesistimiento;
  motivoDescripcion?: string | null;
  fechaDecision: string;
  timestampDecision: string;
  informadoPor?: string | null;
  creadoEn: string;
}

export interface Desistimiento {
  id: number;
  fichaId: number;
  nombreEspecialista: string;
  motivoCategoria: MotivoDesistimiento;
  motivoDescripcion?: string;
  fechaDecision: string;
  informadoPor?: string;
  fechaCreacion: Date;
}

function s(v: string | null | undefined): string | undefined {
  return v ?? undefined;
}

function mapear(b: DesistimientoResponseBackend): Desistimiento {
  return {
    id: b.id,
    fichaId: b.fichaId,
    nombreEspecialista: b.nombreEspecialista,
    motivoCategoria: b.motivoCategoria,
    motivoDescripcion: s(b.motivoDescripcion),
    fechaDecision: b.fechaDecision,
    informadoPor: s(b.informadoPor),
    fechaCreacion: new Date(b.creadoEn),
  };
}

export const desistimientoService = {
  /** Registra un desistimiento y cierra la ficha con estado DESISTIDA. */
  async registrar(
    fichaId: number,
    datos: DesistimientoRequestBackend
  ): Promise<Desistimiento> {
    const { data } = await apiClient.post<DesistimientoResponseBackend>(
      `/psicologia/desistimientos/${fichaId}`,
      datos
    );
    return mapear(data);
  },
};

// ─── Helpers de presentación ────────────────────────────────────
export const NOMBRE_MOTIVO_DESISTIMIENTO: Record<MotivoDesistimiento, string> = {
  PERSONAL: 'Personal',
  ACADEMICO: 'Académico',
  LABORAL: 'Laboral',
  OTRO: 'Otro',
};

export const DESCRIPCION_MOTIVO_DESISTIMIENTO: Record<MotivoDesistimiento, string> = {
  PERSONAL: 'Circunstancias personales del estudiante ajenas al servicio.',
  ACADEMICO: 'Reorganización de tiempos por carga académica u obligaciones de la carrera.',
  LABORAL: 'Compromisos laborales que impiden continuar con el proceso.',
  OTRO: 'Otro motivo, detallar en la descripción.',
};
