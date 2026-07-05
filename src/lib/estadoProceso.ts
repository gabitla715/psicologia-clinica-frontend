// ────────────────────────────────────────────────────────────────
// Estado unificado del proceso del estudiante.
//
// Antes existían dos fuentes de verdad mostrándose al mismo tiempo:
// la ficha (backend real) y la solicitud (mock del coordinador), lo
// que producía la inconsistencia reportada: "Pendiente de asignación"
// arriba y una cita ya asignada abajo.
//
// Esta función combina ambas fuentes en UNA sola línea de tiempo y
// UN solo estado visible, para que nunca se contradigan.
// ────────────────────────────────────────────────────────────────
import type { Ficha } from '../api/fichaService';
import type { SolicitudCoordinador } from '../api/coordinadorMockService';

export type PasoEstado = 'completado' | 'actual' | 'pendiente';

export interface PasoProgreso {
  clave: string;
  etiqueta: string;
  estado: PasoEstado;
}

export type ColorEstado = 'verde' | 'ambar' | 'gris' | 'rojo' | 'azul';

export interface ProgresoProceso {
  pasos: PasoProgreso[];
  tituloEstado: string;
  color: ColorEstado;
  /** true si ya existe un horario propuesto/confirmado que el estudiante debe revisar */
  tieneCitaPorConfirmar: boolean;
  /** true si la cita ya fue confirmada por el estudiante */
  citaConfirmada: boolean;
  /** true si el estudiante nunca ha solicitado este servicio (aún no existe ni ficha ni solicitud) */
  sinSolicitud: boolean;
  descripcion: string;
}

const ETIQUETAS_BASE = [
  'Solicitud enviada',
  'Caso revisado',
  'Profesional asignado',
  'Cita confirmada',
  'Atención psicológica',
] as const;

function construirPasos(indiceActual: number, forzarPendienteDesdeIndice?: number): PasoProgreso[] {
  return ETIQUETAS_BASE.map((etiqueta, i) => {
    let estado: PasoEstado;
    if (forzarPendienteDesdeIndice !== undefined && i >= forzarPendienteDesdeIndice) {
      estado = i === forzarPendienteDesdeIndice ? 'actual' : 'pendiente';
    } else if (i < indiceActual) {
      estado = 'completado';
    } else if (i === indiceActual) {
      estado = 'actual';
    } else {
      estado = 'pendiente';
    }
    return { clave: etiqueta, etiqueta, estado };
  });
}

/**
 * Calcula el estado único del proceso a partir de la ficha real (backend)
 * y/o la solicitud simulada del coordinador. Prioriza la ficha cuando
 * existe (es la fuente "oficial"), y usa la solicitud para el tramo
 * previo a la apertura de ficha (asignación de especialista y horario).
 */
export function calcularProgreso(
  solicitud: SolicitudCoordinador | null,
  ficha: Ficha | null
): ProgresoProceso {
  // Caso 1: ya existe ficha clínica cerrada → proceso de atención finalizado.
  if (ficha && (ficha.estado === 'CERRADA' || ficha.estado === 'DESISTIDA' || ficha.estado === 'DERIVADA')) {
    return {
      pasos: construirPasos(5),
      tituloEstado: ficha.estado === 'CERRADA' ? 'Atención finalizada' : 'Caso cerrado',
      color: 'gris',
      tieneCitaPorConfirmar: false,
      citaConfirmada: false,
      sinSolicitud: false,
      descripcion:
        ficha.estado === 'CERRADA'
          ? 'Tu proceso de atención psicológica ha concluido. Puedes revisar el detalle en tu historial.'
          : 'Tu caso fue cerrado. Consulta el detalle en tu historial de atenciones.',
    };
  }

  // Caso 2: ya existe ficha activa con especialista → la atención está en curso.
  if (ficha && ficha.estado === 'ACTIVA' && ficha.nombreEspecialista) {
    return {
      pasos: construirPasos(4),
      tituloEstado: 'Atención psicológica en curso',
      color: 'verde',
      tieneCitaPorConfirmar: false,
      citaConfirmada: true,
      sinSolicitud: false,
      descripcion: `Tu ficha ya fue abierta y ${ficha.nombreEspecialista} está a cargo de tu proceso.`,
    };
  }

  // Caso 2b: nunca ha solicitado este servicio.
  if (!solicitud && !ficha) {
    return {
      pasos: construirPasos(0),
      tituloEstado: 'Sin solicitud activa',
      color: 'gris',
      tieneCitaPorConfirmar: false,
      citaConfirmada: false,
      sinSolicitud: true,
      descripcion: 'Aún no has solicitado este servicio. Puedes hacerlo cuando quieras.',
    };
  }

  // Caso 3: no hay ficha todavía → nos basamos en la solicitud (coordinador).
  if (!solicitud || solicitud.estado === 'PENDIENTE') {
    return {
      pasos: construirPasos(1),
      tituloEstado: 'Solicitud en revisión',
      color: 'ambar',
      tieneCitaPorConfirmar: false,
      citaConfirmada: false,
      sinSolicitud: false,
      descripcion:
        'Hemos recibido tu solicitud. Un profesional del Área de Bienestar Estudiantil la revisará y te asignará un especialista.',
    };
  }

  if (solicitud.estado === 'ASIGNADA') {
    return {
      pasos: construirPasos(3),
      tituloEstado: 'Cita asignada — pendiente de confirmación',
      color: 'azul',
      tieneCitaPorConfirmar: true,
      citaConfirmada: false,
      sinSolicitud: false,
      descripcion: 'Se te asignó un especialista y un horario. Revisa los datos y confirma tu asistencia.',
    };
  }

  if (solicitud.estado === 'CONFIRMADA') {
    return {
      pasos: construirPasos(4),
      tituloEstado: 'Cita confirmada',
      color: 'verde',
      tieneCitaPorConfirmar: false,
      citaConfirmada: true,
      sinSolicitud: false,
      descripcion: 'Confirmaste tu cita. Te esperamos en la fecha y hora acordadas.',
    };
  }

  if (solicitud.estado === 'RECHAZADA_ESTUDIANTE') {
    return {
      pasos: construirPasos(3, 2),
      tituloEstado: 'Buscando un nuevo horario',
      color: 'ambar',
      tieneCitaPorConfirmar: false,
      citaConfirmada: false,
      sinSolicitud: false,
      descripcion:
        'Pediste reagendar tu cita. El coordinador está revisando la disponibilidad y te asignará un nuevo horario pronto.',
    };
  }

  // CANCELADA u otro estado no contemplado.
  return {
    pasos: construirPasos(1, 1),
    tituloEstado: 'Solicitud cancelada',
    color: 'rojo',
    tieneCitaPorConfirmar: false,
    citaConfirmada: false,
    sinSolicitud: false,
    descripcion: 'Esta solicitud fue cancelada. Comunícate con Bienestar Estudiantil si necesitas reactivarla.',
  };
}

export const COLOR_CLASES: Record<ColorEstado, { badge: string; texto: string; punto: string; borde: string; fondo: string }> = {
  verde: {
    badge: 'bg-emerald-100 text-emerald-700',
    texto: 'text-emerald-700',
    punto: 'bg-emerald-500',
    borde: 'border-emerald-200',
    fondo: 'bg-emerald-50',
  },
  ambar: {
    badge: 'bg-amber-100 text-amber-700',
    texto: 'text-amber-700',
    punto: 'bg-amber-500',
    borde: 'border-amber-200',
    fondo: 'bg-amber-50',
  },
  gris: {
    badge: 'bg-slate-100 text-slate-600',
    texto: 'text-slate-600',
    punto: 'bg-slate-400',
    borde: 'border-slate-200',
    fondo: 'bg-slate-50',
  },
  rojo: {
    badge: 'bg-red-100 text-red-700',
    texto: 'text-red-700',
    punto: 'bg-red-500',
    borde: 'border-red-200',
    fondo: 'bg-red-50',
  },
  azul: {
    badge: 'bg-brand-100 text-brand-700',
    texto: 'text-brand-700',
    punto: 'bg-brand-600',
    borde: 'border-brand-200',
    fondo: 'bg-brand-50',
  },
};
