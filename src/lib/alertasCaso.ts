// ────────────────────────────────────────────────────────────────
// Alertas administrativas del caso clínico. 100% derivadas de datos
// reales ya disponibles (ficha, consentimiento, sesiones, citas) —
// no requieren ningún campo nuevo de backend ni de mock.
// ────────────────────────────────────────────────────────────────
import type { EstadoFicha } from '../api/fichaService';

export type TipoAlerta = 'CONSENTIMIENTO_PENDIENTE' | 'SIN_PROXIMA_CITA' | 'SIN_ATENCION_30_DIAS';

export interface Alerta {
  tipo: TipoAlerta;
  etiqueta: string;
}

export const META_ALERTA: Record<TipoAlerta, { etiqueta: string; claseBadge: string }> = {
  CONSENTIMIENTO_PENDIENTE: { etiqueta: 'Consentimiento pendiente', claseBadge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  SIN_PROXIMA_CITA: { etiqueta: 'Sin próxima cita', claseBadge: 'bg-blue-50 text-blue-700 ring-blue-200' },
  SIN_ATENCION_30_DIAS: { etiqueta: '+30 días sin atención', claseBadge: 'bg-red-50 text-red-700 ring-red-200' },
};

export function calcularAlertas(args: {
  estadoFicha: EstadoFicha;
  tieneConsentimiento: boolean;
  proximaCita: Date | null;
  ultimaActividad: Date; // última sesión, o fecha de apertura de la ficha si no hay ninguna
}): Alerta[] {
  const { estadoFicha, tieneConsentimiento, proximaCita, ultimaActividad } = args;
  if (estadoFicha !== 'ACTIVA') return []; // casos cerrados/derivados/desistidos no generan alertas operativas

  const alertas: Alerta[] = [];
  if (!tieneConsentimiento) {
    alertas.push({ tipo: 'CONSENTIMIENTO_PENDIENTE', etiqueta: META_ALERTA.CONSENTIMIENTO_PENDIENTE.etiqueta });
  }
  if (!proximaCita) {
    alertas.push({ tipo: 'SIN_PROXIMA_CITA', etiqueta: META_ALERTA.SIN_PROXIMA_CITA.etiqueta });
  }
  const diasSinAtencion = (Date.now() - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24);
  if (diasSinAtencion > 30) {
    alertas.push({ tipo: 'SIN_ATENCION_30_DIAS', etiqueta: META_ALERTA.SIN_ATENCION_30_DIAS.etiqueta });
  }
  return alertas;
}
