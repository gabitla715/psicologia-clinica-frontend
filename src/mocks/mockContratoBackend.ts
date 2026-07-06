// ════════════════════════════════════════════════════════════════
// MOCK CENTRALIZADO
// ════════════════════════════════════════════════════════════════
//
// Este archivo reúne todo lo que el frontend necesita pero que el
// backend todavía no expone. Es el único lugar del proyecto con
// datos simulados: nada de mocks sueltos dentro de componentes o de
// otros servicios.
//
// Cuando exista el endpoint real correspondiente, el cambio sigue
// siempre el mismo patrón en 2 pasos:
//   1. Reemplazar el cuerpo de la función de aquí por una llamada
//      real con `apiClient` (mismo nombre, misma firma).
//   2. Borrar la sección de este archivo que ya no se necesite.
// Ningún componente que consuma este archivo debería tener que
// cambiar una sola línea cuando eso pase.
//
// Persistencia: localStorage, con el prefijo `mock:` para poder
// limpiarlo fácil (ver `resetearMocks()` al final).
// ════════════════════════════════════════════════════════════════

import type { TipoPsicologia } from '../api/fichaService';
import type { EstadoSolicitud } from '../api/solicitudService';

const PREFIJO = 'mock:';

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir<T>(clave: string, valor: T): void {
  localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
}

// ────────────────────────────────────────────────────────────────
// SECCIÓN 1 — Fecha/hora de la asignación y estados extendidos
// ────────────────────────────────────────────────────────────────
// Para que esto deje de ser simulado, `PATCH /solicitudes/{id}/asignar`
// necesitaría aceptar también `fechaHora` (ISO 8601), y el enum
// EstadoSolicitud debería crecer a: PENDIENTE, ASIGNADA, CONFIRMADA,
// ATENDIDA, CANCELADA, REAGENDADA, RECHAZADA. Mientras tanto, esto
// vive aquí.

export type EstadoSolicitudExtendido = EstadoSolicitud | 'CONFIRMADA' | 'ATENDIDA' | 'REAGENDADA';

export interface SolicitudSnapshot {
  nombreEstudiante: string;
  tipoPsicologia: TipoPsicologia;
  motivoSolicitud: string;
  creadoEn: string;
}

export interface AsignacionExtra {
  solicitudId: number;
  fechaHora: string | null; // ISO 8601
  estadoExtendido: EstadoSolicitudExtendido;
  historial: EventoHistorial[];
  especialistaId: number;
  nombreEspecialista: string;
  solicitud: SolicitudSnapshot;
}

export interface EventoHistorial {
  fecha: string; // ISO 8601
  descripcion: string;
}

function obtenerTodasLasAsignacionesExtra(): Record<number, AsignacionExtra> {
  return leer('asignaciones-extra', {} as Record<number, AsignacionExtra>);
}

export const mockAsignacionCita = {
  /** Se llama justo después de que `solicitudService.asignar(...)` (real) tuvo éxito. */
  registrarAsignacion(
    solicitudId: number,
    fechaHora: string | null,
    quienEscribio: string,
    especialistaId: number,
    nombreEspecialista: string,
    solicitud: SolicitudSnapshot
  ): AsignacionExtra {
    const todas = obtenerTodasLasAsignacionesExtra();
    const historialPrevio = todas[solicitudId]?.historial ?? [
      { fecha: solicitud.creadoEn, descripcion: 'Solicitud creada' },
    ];
    const registro: AsignacionExtra = {
      solicitudId,
      fechaHora,
      estadoExtendido: 'ASIGNADA',
      especialistaId,
      nombreEspecialista,
      solicitud,
      historial: [
        ...historialPrevio,
        { fecha: new Date().toISOString(), descripcion: `Especialista asignado por ${quienEscribio}` },
      ],
    };
    todas[solicitudId] = registro;
    escribir('asignaciones-extra', todas);
    return registro;
  },

  obtener(solicitudId: number): AsignacionExtra | null {
    return obtenerTodasLasAsignacionesExtra()[solicitudId] ?? null;
  },

  listarTodas(): AsignacionExtra[] {
    return Object.values(obtenerTodasLasAsignacionesExtra());
  },

  cambiarEstado(solicitudId: number, nuevoEstado: EstadoSolicitudExtendido, descripcionEvento: string): void {
    const todas = obtenerTodasLasAsignacionesExtra();
    const actual = todas[solicitudId];
    if (!actual) return;
    actual.estadoExtendido = nuevoEstado;
    actual.historial.push({ fecha: new Date().toISOString(), descripcion: descripcionEvento });
    todas[solicitudId] = actual;
    escribir('asignaciones-extra', todas);
  },
};

// ────────────────────────────────────────────────────────────────
// SECCIÓN 2 — Carga de trabajo por especialista
// ────────────────────────────────────────────────────────────────
// Requeriría un endpoint tipo `GET /admin/especialistas/{id}/carga`
// que devuelva { citasActivas: number, fichasActivas: number }.
// Mientras tanto, se estima contando las asignaciones hechas desde
// esta misma sesión del navegador (dato parcial, no exacto).

export const mockCargaEspecialista = {
  calcularCargaAproximada(especialistaId: number): 'baja' | 'media' | 'alta' {
    const activas = Object.values(obtenerTodasLasAsignacionesExtra()).filter(
      (a) => a.especialistaId === especialistaId && a.estadoExtendido !== 'ATENDIDA' && a.estadoExtendido !== 'CANCELADA'
    ).length;
    if (activas <= 2) return 'baja';
    if (activas <= 5) return 'media';
    return 'alta';
  },
};

// ────────────────────────────────────────────────────────────────
// SECCIÓN 3 — utilidades
// ────────────────────────────────────────────────────────────────

export function resetearMocks(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIJO))
    .forEach((k) => localStorage.removeItem(k));
}

// Metadata visual de los estados extendidos (color + orden para el
// stepper). Vive aquí porque está atada 1:1 a `EstadoSolicitudExtendido`.
export const ORDEN_ESTADO_EXTENDIDO: EstadoSolicitudExtendido[] = [
  'PENDIENTE',
  'ASIGNADA',
  'CONFIRMADA',
  'ATENDIDA',
];

export const META_ESTADO_EXTENDIDO: Record<
  EstadoSolicitudExtendido,
  { etiqueta: string; claseBadge: string; claseSolida: string }
> = {
  PENDIENTE: { etiqueta: 'Pendiente', claseBadge: 'bg-amber-50 text-amber-700 ring-amber-200', claseSolida: 'bg-amber-500' },
  ASIGNADA: { etiqueta: 'Asignada', claseBadge: 'bg-blue-50 text-blue-700 ring-blue-200', claseSolida: 'bg-blue-500' },
  CONFIRMADA: { etiqueta: 'Confirmada', claseBadge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', claseSolida: 'bg-indigo-500' },
  ATENDIDA: { etiqueta: 'Atendida', claseBadge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', claseSolida: 'bg-emerald-500' },
  CANCELADA: { etiqueta: 'Cancelada', claseBadge: 'bg-red-50 text-red-700 ring-red-200', claseSolida: 'bg-red-500' },
  RECHAZADA: { etiqueta: 'Rechazada', claseBadge: 'bg-red-50 text-red-700 ring-red-200', claseSolida: 'bg-red-500' },
  REAGENDADA: { etiqueta: 'Reagendada', claseBadge: 'bg-violet-50 text-violet-700 ring-violet-200', claseSolida: 'bg-violet-500' },
};

export type { TipoPsicologia };
