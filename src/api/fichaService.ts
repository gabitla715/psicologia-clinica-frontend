// ────────────────────────────────────────────────────────────────
// Servicio de fichas psicológicas (módulo CLINICA del backend).
//
// Endpoints consumidos (todos requieren JWT):
//   POST   /api/v1/psicologia/fichas?estudianteId={id}&tipoPsicologia={tipo}
//   GET    /api/v1/psicologia/fichas/{fichaId}
//   GET    /api/v1/psicologia/fichas/activa?estudianteId={id}&tipoPsicologia={tipo}
//   GET    /api/v1/psicologia/fichas/mis-fichas
//   GET    /api/v1/psicologia/fichas?tipo={CLINICA|GENERAL}
//
// REGLA: los componentes React llaman a estas funciones, NUNCA a apiClient.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

// ─── Tipos del backend (espejo del DTO Java) ────────────────────
export type TipoPsicologia = 'CLINICA' | 'GENERAL';
export type EstadoFichaBackend =
  | 'ACTIVA'
  | 'CERRADA'
  | 'DERIVADA'
  | 'DESISTIDA';

export interface FichaResponseBackend {
  id: number;
  estudianteId: number;
  nombreEstudiante: string;
  correoEstudiante: string;
  especialistaId?: number | null;
  nombreEspecialista?: string | null;
  tipoPsicologia: TipoPsicologia;
  motivoConsulta?: string;
  tiempoProblema?: string;
  antecedentesPsicologicos?: string;
  historiaPersonal?: string;
  historiaFamiliar?: string;
  diagnosticoTrabajo?: string;
  estado: EstadoFichaBackend;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CrearFichaRequestBackend {
  motivoConsulta?: string;
  tiempoProblema?: string;
  antecedentesPsicologicos?: string;
  historiaPersonal?: string;
  historiaFamiliar?: string;
  diagnosticoTrabajo?: string;
  pensamientosAutolesion?: string;
}

// ─── Tipos del frontend ─────────────────────────────────────────
export type EstadoFicha = EstadoFichaBackend;

export interface Ficha {
  id: number;
  estudianteId: number;
  nombreEstudiante: string;
  correoEstudiante: string;
  especialistaId?: number;
  nombreEspecialista?: string;
  tipo: TipoPsicologia;
  motivoConsulta?: string;
  tiempoProblema?: string;
  antecedentesPsicologicos?: string;
  historiaPersonal?: string;
  historiaFamiliar?: string;
  diagnosticoTrabajo?: string;
  estado: EstadoFicha;
  fechaCreacion: Date;
  fechaActualizacion: Date;
}

// ─── Mapper backend → frontend ──────────────────────────────────
function mapearFicha(b: FichaResponseBackend): Ficha {
  return {
    id: b.id,
    estudianteId: b.estudianteId,
    nombreEstudiante: b.nombreEstudiante,
    correoEstudiante: b.correoEstudiante,
    especialistaId: b.especialistaId ?? undefined,
    nombreEspecialista: b.nombreEspecialista ?? undefined,
    tipo: b.tipoPsicologia,
    motivoConsulta: b.motivoConsulta,
    tiempoProblema: b.tiempoProblema,
    antecedentesPsicologicos: b.antecedentesPsicologicos,
    historiaPersonal: b.historiaPersonal,
    historiaFamiliar: b.historiaFamiliar,
    diagnosticoTrabajo: b.diagnosticoTrabajo,
    estado: b.estado,
    fechaCreacion: new Date(b.creadoEn),
    fechaActualizacion: new Date(b.actualizadoEn),
  };
}

// Helper para distinguir un 404 (no hay ficha) de otros errores reales.
function esNotFound(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 404;
}

// ─── Servicio ───────────────────────────────────────────────────
export const fichaService = {
  /** Crea una ficha clínica nueva (solo SPECIALIST). */
  async crear(args: {
    estudianteId: number;
    tipo: TipoPsicologia;
    datos: CrearFichaRequestBackend;
  }): Promise<Ficha> {
    const { data } = await apiClient.post<FichaResponseBackend>(
      '/psicologia/fichas',
      args.datos,
      { params: { estudianteId: args.estudianteId, tipoPsicologia: args.tipo } }
    );
    return mapearFicha(data);
  },

  /** Obtiene una ficha por su ID (SPECIALIST/ADMIN). */
  async obtenerPorId(fichaId: number): Promise<Ficha> {
    const { data } = await apiClient.get<FichaResponseBackend>(
      `/psicologia/fichas/${fichaId}`
    );
    return mapearFicha(data);
  },

  /**
   * Obtiene la ficha activa de un estudiante para un tipo de psicología.
   * Devuelve null si el estudiante no tiene ficha abierta (404).
   * Permitido para SPECIALIST, ADMIN y el propio STUDENT.
   */
  async obtenerActiva(
    estudianteId: number,
    tipo: TipoPsicologia
  ): Promise<Ficha | null> {
    try {
      const { data } = await apiClient.get<FichaResponseBackend>(
        '/psicologia/fichas/activa',
        { params: { estudianteId, tipoPsicologia: tipo } }
      );
      // Si el backend devuelve 200 con cuerpo vacío, lo tratamos como sin ficha.
      if (!data || typeof data !== 'object' || !('id' in data)) {
        return null;
      }
      return mapearFicha(data);
    } catch (err) {
      if (esNotFound(err)) return null;
      throw err;
    }
  },

  /** Lista las fichas del especialista autenticado. */
  async listarMisFichas(): Promise<Ficha[]> {
    const { data } = await apiClient.get<FichaResponseBackend[]>(
      '/psicologia/fichas/mis-fichas'
    );
    return data.map(mapearFicha);
  },

  /** Lista todas las fichas por tipo (solo ADMIN). */
  async listarPorTipo(tipo: TipoPsicologia): Promise<Ficha[]> {
    const { data } = await apiClient.get<FichaResponseBackend[]>(
      '/psicologia/fichas',
      { params: { tipo } }
    );
    return data.map(mapearFicha);
  },
};

// ─── Helpers de presentación ────────────────────────────────────
export const NOMBRE_ESTADO_FICHA: Record<EstadoFicha, string> = {
  ACTIVA: 'Activa',
  CERRADA: 'Cerrada',
  DERIVADA: 'Derivada',
  DESISTIDA: 'Desistida',
};

export const COLOR_ESTADO_FICHA: Record<EstadoFicha, string> = {
  ACTIVA: 'bg-emerald-50 text-emerald-700',
  CERRADA: 'bg-slate-100 text-slate-700',
  DERIVADA: 'bg-blue-50 text-blue-700',
  DESISTIDA: 'bg-rose-50 text-rose-700',
};

export const NOMBRE_TIPO_PSICOLOGIA: Record<TipoPsicologia, string> = {
  CLINICA: 'Psicología Clínica',
  GENERAL: 'Psicología General',
};
