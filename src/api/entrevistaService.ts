// ────────────────────────────────────────────────────────────────
// Servicio de entrevista inicial (módulo CLINICA del backend).
//
// Endpoints consumidos:
//   POST   /api/v1/clinica/entrevistas/{fichaId}
//   GET    /api/v1/clinica/entrevistas/{fichaId}
//   PATCH  /api/v1/clinica/entrevistas/{fichaId}/impresion
//            ?impresionDiagnostica=...&recomendaciones=...
//
// Solo SPECIALIST puede registrar y actualizar; SPECIALIST/ADMIN/COORDINATOR
// pueden obtener.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

// ─── Enum NivelRiesgo (espejo del enum Java) ────────────────────
export type NivelRiesgo = 'SIN_IDEACION' | 'IDEACION_PASIVA' | 'IDEACION_ACTIVA';

// ─── DTOs del backend ───────────────────────────────────────────
export interface EntrevistaInicialRequestBackend {
  fechaNacimiento?: string;
  lugarNacimiento?: string;
  estadoCivil?: string;
  ocupacion?: string;
  nivelInstruccion?: string;
  motivoConsultaDetallado: string;
  inicioproblema?: string;
  factoresPrecipitantes?: string;
  intentosSolucion?: string;
  historiaPersonal?: string;
  historiaFamiliar?: string;
  relacionesInterpersonales?: string;
  aparienciaGeneral?: string;
  estadoAfectivo?: string;
  pensamiento?: string;
  percepcion?: string;
  memoriaAtencion?: string;
  juicioCritico?: string;
  riesgoDetectado: NivelRiesgo;
  observacionesRiesgo?: string;
  impresionDiagnostica?: string;
  recomendaciones?: string;
  fechaEntrevista: string;
}

export interface EntrevistaInicialResponseBackend {
  id: number;
  fichaId: number;
  nombreEspecialista: string;

  fechaNacimiento?: string | null;
  lugarNacimiento?: string | null;
  estadoCivil?: string | null;
  ocupacion?: string | null;
  nivelInstruccion?: string | null;

  motivoConsultaDetallado: string;
  inicioproblema?: string | null;
  factoresPrecipitantes?: string | null;
  intentosSolucion?: string | null;

  historiaPersonal?: string | null;
  historiaFamiliar?: string | null;
  relacionesInterpersonales?: string | null;

  aparienciaGeneral?: string | null;
  estadoAfectivo?: string | null;
  pensamiento?: string | null;
  percepcion?: string | null;
  memoriaAtencion?: string | null;
  juicioCritico?: string | null;

  riesgoDetectado: NivelRiesgo;
  tieneRiesgo: boolean;
  observacionesRiesgo?: string | null;

  impresionDiagnostica?: string | null;
  recomendaciones?: string | null;

  fechaEntrevista: string;
  creadoEn: string;
  actualizadoEn: string;
}

// ─── Tipo de dominio del frontend ───────────────────────────────
export interface EntrevistaInicial {
  id: number;
  fichaId: number;
  nombreEspecialista: string;

  fechaNacimiento?: string;
  lugarNacimiento?: string;
  estadoCivil?: string;
  ocupacion?: string;
  nivelInstruccion?: string;

  motivoConsultaDetallado: string;
  inicioproblema?: string;
  factoresPrecipitantes?: string;
  intentosSolucion?: string;

  historiaPersonal?: string;
  historiaFamiliar?: string;
  relacionesInterpersonales?: string;

  aparienciaGeneral?: string;
  estadoAfectivo?: string;
  pensamiento?: string;
  percepcion?: string;
  memoriaAtencion?: string;
  juicioCritico?: string;

  riesgoDetectado: NivelRiesgo;
  tieneRiesgo: boolean;
  observacionesRiesgo?: string;

  impresionDiagnostica?: string;
  recomendaciones?: string;

  fechaEntrevista: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// ─── Mapper backend → frontend ──────────────────────────────────
function s(v: string | null | undefined): string | undefined {
  return v ?? undefined;
}

function mapearEntrevista(b: EntrevistaInicialResponseBackend): EntrevistaInicial {
  return {
    id: b.id,
    fichaId: b.fichaId,
    nombreEspecialista: b.nombreEspecialista,
    fechaNacimiento: s(b.fechaNacimiento),
    lugarNacimiento: s(b.lugarNacimiento),
    estadoCivil: s(b.estadoCivil),
    ocupacion: s(b.ocupacion),
    nivelInstruccion: s(b.nivelInstruccion),
    motivoConsultaDetallado: b.motivoConsultaDetallado,
    inicioproblema: s(b.inicioproblema),
    factoresPrecipitantes: s(b.factoresPrecipitantes),
    intentosSolucion: s(b.intentosSolucion),
    historiaPersonal: s(b.historiaPersonal),
    historiaFamiliar: s(b.historiaFamiliar),
    relacionesInterpersonales: s(b.relacionesInterpersonales),
    aparienciaGeneral: s(b.aparienciaGeneral),
    estadoAfectivo: s(b.estadoAfectivo),
    pensamiento: s(b.pensamiento),
    percepcion: s(b.percepcion),
    memoriaAtencion: s(b.memoriaAtencion),
    juicioCritico: s(b.juicioCritico),
    riesgoDetectado: b.riesgoDetectado,
    tieneRiesgo: b.tieneRiesgo,
    observacionesRiesgo: s(b.observacionesRiesgo),
    impresionDiagnostica: s(b.impresionDiagnostica),
    recomendaciones: s(b.recomendaciones),
    fechaEntrevista: b.fechaEntrevista,
    fechaCreacion: new Date(b.creadoEn),
    fechaActualizacion: new Date(b.actualizadoEn),
  };
}

// ⚠️ Bug real de backend (verificado): GestionarEntrevistaUseCase.obtenerPorFicha
// lanza IllegalArgumentException cuando no existe entrevista para la ficha,
// y GlobalExceptionHandler mapea TODO IllegalArgumentException a 400 Bad
// Request — aunque el Swagger de este mismo endpoint documenta 404. Por eso
// no basta con revisar el status 404; también se reconoce este 400 puntual
// por su mensaje. Pedido de backend: que el caso de uso lance una excepción
// distinta (ej. EntrevistaNoEncontradaException) mapeada a 404 real.
function esEntrevistaNoEncontrada(err: unknown): boolean {
  const respuesta = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
  if (respuesta?.status === 404) return true;
  if (respuesta?.status === 400 && respuesta.data?.message?.includes('No existe entrevista')) return true;
  return false;
}

// ─── Servicio ───────────────────────────────────────────────────
export const entrevistaService = {
  /** Registra la entrevista inicial de una ficha. Solo SPECIALIST. */
  async registrar(
    fichaId: number,
    datos: EntrevistaInicialRequestBackend
  ): Promise<EntrevistaInicial> {
    const { data } = await apiClient.post<EntrevistaInicialResponseBackend>(
      `/clinica/entrevistas/${fichaId}`,
      datos
    );
    return mapearEntrevista(data);
  },

  /**
   * Obtiene la entrevista asociada a una ficha. Devuelve null si no
   * existe (404). SPECIALIST, ADMIN, COORDINATOR.
   */
  async obtenerPorFicha(fichaId: number): Promise<EntrevistaInicial | null> {
    try {
      const { data } = await apiClient.get<EntrevistaInicialResponseBackend>(
        `/clinica/entrevistas/${fichaId}`
      );
      return mapearEntrevista(data);
    } catch (err) {
      if (esEntrevistaNoEncontrada(err)) return null;
      throw err;
    }
  },

  /**
   * Actualiza impresión diagnóstica y recomendaciones.
   * Importante: el backend espera ambos como QUERY PARAMS, no como body.
   */
  async actualizarImpresion(
    fichaId: number,
    impresionDiagnostica: string,
    recomendaciones: string
  ): Promise<EntrevistaInicial> {
    const { data } = await apiClient.patch<EntrevistaInicialResponseBackend>(
      `/clinica/entrevistas/${fichaId}/impresion`,
      null,
      { params: { impresionDiagnostica, recomendaciones } }
    );
    return mapearEntrevista(data);
  },
};

// ─── Helpers de presentación ────────────────────────────────────
export const NOMBRE_NIVEL_RIESGO: Record<NivelRiesgo, string> = {
  SIN_IDEACION: 'Sin ideación',
  IDEACION_PASIVA: 'Ideación pasiva',
  IDEACION_ACTIVA: 'Ideación activa',
};

export const COLOR_NIVEL_RIESGO: Record<NivelRiesgo, string> = {
  SIN_IDEACION: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  IDEACION_PASIVA: 'bg-amber-50 text-amber-700 ring-amber-200',
  IDEACION_ACTIVA: 'bg-red-50 text-red-700 ring-red-200',
};
