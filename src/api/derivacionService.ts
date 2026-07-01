// ────────────────────────────────────────────────────────────────
// Servicio de derivación.
//
// Endpoint consumido:
//   POST /api/v1/psicologia/derivaciones/{fichaId}   (SPECIALIST)
//
// Al registrarse, el backend cambia el estado de la ficha a DERIVADA.
// No hay endpoint GET a la fecha.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

export interface DerivacionRequestBackend {
  areaDestino: string;                 // requerido
  profesionalDestino?: string;
  motivoDerivacion: string;            // requerido
  evaluacionesRealizadas?: string;
  observacionesAdicionales?: string;
}

export interface DerivacionResponseBackend {
  id: number;
  fichaId: number;
  especialistaId: number;
  nombreEspecialista: string;
  codigoFormulario?: string | null;
  areaDestino: string;
  profesionalDestino?: string | null;
  motivoDerivacion: string;
  evaluacionesRealizadas?: string | null;
  observacionesAdicionales?: string | null;
  fechaDerivacion: string;
  creadoEn: string;
}

export interface Derivacion {
  id: number;
  fichaId: number;
  nombreEspecialista: string;
  codigoFormulario?: string;
  areaDestino: string;
  profesionalDestino?: string;
  motivoDerivacion: string;
  evaluacionesRealizadas?: string;
  observacionesAdicionales?: string;
  fechaDerivacion: string;
  fechaCreacion: Date;
}

function s(v: string | null | undefined): string | undefined {
  return v ?? undefined;
}

function mapear(b: DerivacionResponseBackend): Derivacion {
  return {
    id: b.id,
    fichaId: b.fichaId,
    nombreEspecialista: b.nombreEspecialista,
    codigoFormulario: s(b.codigoFormulario),
    areaDestino: b.areaDestino,
    profesionalDestino: s(b.profesionalDestino),
    motivoDerivacion: b.motivoDerivacion,
    evaluacionesRealizadas: s(b.evaluacionesRealizadas),
    observacionesAdicionales: s(b.observacionesAdicionales),
    fechaDerivacion: b.fechaDerivacion,
    fechaCreacion: new Date(b.creadoEn),
  };
}

export const derivacionService = {
  /** Registra una derivación y cierra la ficha con estado DERIVADA. */
  async registrar(
    fichaId: number,
    datos: DerivacionRequestBackend
  ): Promise<Derivacion> {
    const { data } = await apiClient.post<DerivacionResponseBackend>(
      `/psicologia/derivaciones/${fichaId}`,
      datos
    );
    return mapear(data);
  },
};

// Sugerencias comunes para el área de destino, para poblar el select.
export const AREAS_DESTINO_SUGERIDAS = [
  'Psiquiatría',
  'Trabajo Social',
  'Servicio Médico Universitario',
  'Consejería Estudiantil',
  'Centro externo',
] as const;
