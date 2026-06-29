// ────────────────────────────────────────────────────────────────
// Servicio de fichas psicológicas (módulo CLINICA del backend).
//
// USO: los componentes React llaman a estas funciones, NUNCA a apiClient
// directamente. Si mañana el backend cambia un path o un campo,
// solo se toca este archivo.
//
// Este archivo sirve también de PATRÓN: copia su estructura para crear
// los demás servicios (citaService, sesionService, planService, etc.).
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

// ─── Tipos del backend ──────────────────────────────────────────
export type TipoPsicologiaBackend = 'CLINICA' | 'GENERAL';
export type EstadoFichaBackend = 'ACTIVA' | 'CERRADA' | 'DERIVADA' | 'DESISTIDA';

export interface FichaBackend {
  idFicha: number;
  idEstudiante: number;
  idEspecialista?: number;
  tipoPsicologia: TipoPsicologiaBackend;
  motivoConsulta?: string;
  estado: EstadoFichaBackend;
  creadoEn: string;
  actualizadoEn: string;
  numeroCaso?: string;
}

// ─── Tipos del frontend ─────────────────────────────────────────
export interface Ficha {
  id: number;
  estudianteId: number;
  especialistaId?: number;
  tipo: TipoPsicologiaBackend;
  motivoConsulta?: string;
  estado: EstadoFichaBackend;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  numeroCaso?: string;
}

// ─── Mapper ─────────────────────────────────────────────────────
function mapearFicha(b: FichaBackend): Ficha {
  return {
    id: b.idFicha,
    estudianteId: b.idEstudiante,
    especialistaId: b.idEspecialista,
    tipo: b.tipoPsicologia,
    motivoConsulta: b.motivoConsulta,
    estado: b.estado,
    fechaCreacion: new Date(b.creadoEn),
    fechaActualizacion: new Date(b.actualizadoEn),
    numeroCaso: b.numeroCaso,
  };
}

// ─── Servicio ───────────────────────────────────────────────────
export const fichaService = {
  async crear(input: {
    estudianteId: number;
    tipo: TipoPsicologiaBackend;
    motivoConsulta?: string;
  }): Promise<Ficha> {
    const { data } = await apiClient.post<FichaBackend>('/psicologia/fichas', {
      idEstudiante: input.estudianteId,
      tipoPsicologia: input.tipo,
      motivoConsulta: input.motivoConsulta,
    });
    return mapearFicha(data);
  },

  async obtenerPorId(id: number): Promise<Ficha> {
    const { data } = await apiClient.get<FichaBackend>(`/psicologia/fichas/${id}`);
    return mapearFicha(data);
  },

  async obtenerActivaDelEstudiante(
    estudianteId: number,
    tipo: TipoPsicologiaBackend
  ): Promise<Ficha | null> {
    try {
      const { data } = await apiClient.get<FichaBackend>('/psicologia/fichas/activa', {
        params: { idEstudiante: estudianteId, tipoPsicologia: tipo },
      });
      return mapearFicha(data);
    } catch (err: unknown) {
      // Si no hay ficha activa, el backend devuelve 404; lo tratamos como "null".
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw err;
    }
  },

  async listarMisFichas(): Promise<Ficha[]> {
    const { data } = await apiClient.get<FichaBackend[]>('/psicologia/fichas/mis-fichas');
    return data.map(mapearFicha);
  },

  async listarTodas(): Promise<Ficha[]> {
    // Solo ADMIN
    const { data } = await apiClient.get<FichaBackend[]>('/psicologia/fichas');
    return data.map(mapearFicha);
  },
};
