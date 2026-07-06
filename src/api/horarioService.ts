// ────────────────────────────────────────────────────────────────
// Servicio REAL de horarios de disponibilidad semanal.
// Nunca antes conectado a ninguna pantalla (descubierto en la
// sesión anterior). Endpoints bajo /api/v1/horarios, verificados en
// HorarioController.java:
//   POST  /                  (STUDENT, SPECIALIST) — guardar mis horarios
//   GET   /mis-horarios      (STUDENT, SPECIALIST)
//   GET   /{usuarioId}       (COORDINATOR, ADMIN)   — ver horarios de alguien
//
// ⚠️ Es disponibilidad SEMANAL recurrente (día + hora inicio/fin),
// NO fecha puntual. Sirve para saber "este especialista suele
// atender lunes y miércoles de 9 a 13", no para saber si un slot
// puntual del 13/07 está libre.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES';

export interface HorarioDisponibleBackend {
  id: number;
  idUsuario: number;
  diaSemana: DiaSemana;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  activo: boolean;
}

export const horarioService = {
  /** Coordinador/Admin: ver la disponibilidad semanal declarada por un usuario (especialista o estudiante). */
  async obtenerHorariosDe(usuarioId: number): Promise<HorarioDisponibleBackend[]> {
    const { data } = await apiClient.get<HorarioDisponibleBackend[]>(`/horarios/${usuarioId}`);
    return data;
  },
};

export const NOMBRE_DIA_SEMANA: Record<DiaSemana, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
};

/** Formatea "08:00:00" -> "08:00" para mostrar en UI. */
export function formatearHora(hora: string): string {
  return hora.slice(0, 5);
}
