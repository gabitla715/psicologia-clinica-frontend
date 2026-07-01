// ────────────────────────────────────────────────────────────────
// Servicio de plan de intervención.
//
// Endpoints consumidos:
//   POST /api/v1/psicologia/planes/{fichaId}
//   PUT  /api/v1/psicologia/planes/{fichaId}
//
// LIMITACIÓN CONOCIDA: el backend NO expone GET para consultar el
// plan. Para saber si ya existe o no, este servicio usa una bandera
// en localStorage con la key `plan-existe:{fichaId}`. La UI advierte
// al psicólogo de esta limitación en el punto de uso.
//
// Cuando el backend agregue GET /planes/{fichaId}, basta con reemplazar
// `existeLocal` por la llamada real y borrar la bandera; ningún
// componente cambia.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

export interface PlanIntervencionRequestBackend {
  diagnosticoTrabajo?: string;
  enfoqueTerapeutico: string;      // requerido
  objetivosGenerales: string;      // requerido
  objetivosEspecificos?: string;
  numSesionesEstimadas: number;    // requerido, >= 1
  frecuenciaSesiones?: string;
  tecnicasEstrategias?: string;
  observaciones?: string;
}

export interface PlanIntervencionResponseBackend {
  id: number;
  fichaId: number;
  diagnosticoTrabajo?: string | null;
  enfoqueTerapeutico: string;
  objetivosGenerales: string;
  objetivosEspecificos?: string | null;
  numSesionesEstimadas: number;
  frecuenciaSesiones?: string | null;
  tecnicasEstrategias?: string | null;
  observaciones?: string | null;
  fechaElaboracion: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface PlanIntervencion {
  id: number;
  fichaId: number;
  diagnosticoTrabajo?: string;
  enfoqueTerapeutico: string;
  objetivosGenerales: string;
  objetivosEspecificos?: string;
  numSesionesEstimadas: number;
  frecuenciaSesiones?: string;
  tecnicasEstrategias?: string;
  observaciones?: string;
  fechaElaboracion: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

function s(v: string | null | undefined): string | undefined {
  return v ?? undefined;
}

function mapear(b: PlanIntervencionResponseBackend): PlanIntervencion {
  return {
    id: b.id,
    fichaId: b.fichaId,
    diagnosticoTrabajo: s(b.diagnosticoTrabajo),
    enfoqueTerapeutico: b.enfoqueTerapeutico,
    objetivosGenerales: b.objetivosGenerales,
    objetivosEspecificos: s(b.objetivosEspecificos),
    numSesionesEstimadas: b.numSesionesEstimadas,
    frecuenciaSesiones: s(b.frecuenciaSesiones),
    tecnicasEstrategias: s(b.tecnicasEstrategias),
    observaciones: s(b.observaciones),
    fechaElaboracion: b.fechaElaboracion,
    fechaCreacion: new Date(b.creadoEn),
    fechaActualizacion: new Date(b.actualizadoEn),
  };
}

// ─── Bandera local: "hay plan para esta ficha" ─────────────────
function keyExistencia(fichaId: number): string {
  return `plan-existe:${fichaId}`;
}

function marcarComoCreado(fichaId: number, plan: PlanIntervencion): void {
  localStorage.setItem(
    keyExistencia(fichaId),
    JSON.stringify({
      creadoEn: plan.fechaCreacion.toISOString(),
      actualizadoEn: plan.fechaActualizacion.toISOString(),
      numSesionesEstimadas: plan.numSesionesEstimadas,
      enfoqueTerapeutico: plan.enfoqueTerapeutico,
    })
  );
}

export interface ResumenPlanLocal {
  creadoEn: string;
  actualizadoEn: string;
  numSesionesEstimadas: number;
  enfoqueTerapeutico: string;
}

/**
 * Devuelve un resumen local del plan si se creó/editó desde este navegador.
 * NO reemplaza a un GET real: si el psicólogo abre la ficha en otro
 * navegador, este resumen no estará. Es una ayuda visual, no una fuente
 * de verdad.
 */
function resumenLocal(fichaId: number): ResumenPlanLocal | null {
  const raw = localStorage.getItem(keyExistencia(fichaId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ResumenPlanLocal;
  } catch {
    return null;
  }
}

// ─── Servicio ───────────────────────────────────────────────────
export const planIntervencionService = {
  /** Crea el plan de intervención de una ficha. POST /planes/{fichaId}. */
  async crear(
    fichaId: number,
    datos: PlanIntervencionRequestBackend
  ): Promise<PlanIntervencion> {
    const { data } = await apiClient.post<PlanIntervencionResponseBackend>(
      `/psicologia/planes/${fichaId}`,
      datos
    );
    const plan = mapear(data);
    marcarComoCreado(fichaId, plan);
    return plan;
  },

  /** Actualiza el plan de intervención existente. PUT /planes/{fichaId}. */
  async actualizar(
    fichaId: number,
    datos: PlanIntervencionRequestBackend
  ): Promise<PlanIntervencion> {
    const { data } = await apiClient.put<PlanIntervencionResponseBackend>(
      `/psicologia/planes/${fichaId}`,
      datos
    );
    const plan = mapear(data);
    marcarComoCreado(fichaId, plan);
    return plan;
  },

  /**
   * Resumen local del plan, si se creó desde este navegador.
   * Es una ayuda para la UI mientras el backend no exponga GET.
   */
  resumenLocal,
};
