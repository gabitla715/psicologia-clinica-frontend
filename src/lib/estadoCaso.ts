// ────────────────────────────────────────────────────────────────
// Estado "enriquecido" del caso clínico, para la vista del psicólogo.
//
// El backend (EstadoFicha) solo distingue ACTIVA / CERRADA / DERIVADA /
// DESISTIDA. Para una experiencia de expediente clínico moderno,
// distinguimos además, dentro de ACTIVA, en qué punto del proceso está
// el caso (sin entrevista todavía / con entrevista pero sin sesiones /
// en seguimiento con sesiones registradas). Esto es 100% derivado en el
// frontend a partir de datos reales — no requiere ningún campo nuevo
// en el backend.
// ────────────────────────────────────────────────────────────────
import type { EstadoFicha } from '../api/fichaService';

export type EstadoCaso =
  | 'PENDIENTE_ENTREVISTA'
  | 'EN_TRATAMIENTO'
  | 'SEGUIMIENTO'
  | 'ALTA'
  | 'CERRADO'
  | 'DERIVADO'
  | 'DESISTIDO';

export function derivarEstadoCaso(args: {
  estadoFicha: EstadoFicha;
  tieneEntrevista: boolean;
  numeroSesiones: number;
  altaRegistrada?: boolean;
}): EstadoCaso {
  const { estadoFicha, tieneEntrevista, numeroSesiones, altaRegistrada } = args;
  if (estadoFicha === 'CERRADA') return 'CERRADO';
  if (estadoFicha === 'DERIVADA') return 'DERIVADO';
  if (estadoFicha === 'DESISTIDA') return 'DESISTIDO';
  // ACTIVA:
  if (altaRegistrada) return 'ALTA';
  if (!tieneEntrevista) return 'PENDIENTE_ENTREVISTA';
  if (numeroSesiones === 0) return 'EN_TRATAMIENTO';
  return 'SEGUIMIENTO';
}

export const META_ESTADO_CASO: Record<
  EstadoCaso,
  { etiqueta: string; claseBadge: string }
> = {
  PENDIENTE_ENTREVISTA: { etiqueta: 'Pendiente entrevista', claseBadge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  EN_TRATAMIENTO: { etiqueta: 'En tratamiento', claseBadge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  SEGUIMIENTO: { etiqueta: 'Seguimiento', claseBadge: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  ALTA: { etiqueta: 'Alta', claseBadge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CERRADO: { etiqueta: 'Cerrado', claseBadge: 'bg-slate-100 text-slate-600 ring-slate-200' },
  DERIVADO: { etiqueta: 'Derivado', claseBadge: 'bg-violet-50 text-violet-700 ring-violet-200' },
  DESISTIDO: { etiqueta: 'Desistido', claseBadge: 'bg-red-50 text-red-700 ring-red-200' },
};

/** Texto y ruta del botón de acción principal para cada estado del caso. */
export function accionPrincipal(
  estadoCaso: EstadoCaso,
  fichaId: number
): { etiqueta: string; ruta: string } {
  switch (estadoCaso) {
    case 'PENDIENTE_ENTREVISTA':
      return { etiqueta: 'Abrir entrevista inicial', ruta: `/pacientes/${fichaId}/entrevista` };
    case 'EN_TRATAMIENTO':
    case 'SEGUIMIENTO':
      return { etiqueta: 'Continuar tratamiento', ruta: `/pacientes/${fichaId}` };
    default:
      return { etiqueta: 'Ver expediente', ruta: `/pacientes/${fichaId}` };
  }
}
