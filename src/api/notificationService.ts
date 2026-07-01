// ────────────────────────────────────────────────────────────────
// Servicio de notificaciones in-app (bandeja de la campana).
//
// Endpoints consumidos (todos bajo /api/v1/notifications):
//   GET    /                 — todas las notificaciones del usuario autenticado
//   GET    /unread           — solo las no leídas
//   PATCH  /{id}/read        — marca una notificación como leída
//   PATCH  /read-all         — marca todas como leídas
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

// ─── DTO del backend (NotificationController.NotificationDto) ──
export interface NotificationResponseBackend {
  id: number;
  referenceId: number | null;
  referenceType: string | null;
  title: string;
  message: string;
  alertType: string | null;
  read: boolean;
  createdAt: string;
}

// ─── Tipo de dominio del frontend ───────────────────────────────
export interface Notificacion {
  id: number;
  referenciaId: number | null;
  tipoReferencia: string | null;
  titulo: string;
  mensaje: string;
  tipoAlerta: string | null;
  leida: boolean;
  fechaCreacion: Date;
}

function mapear(b: NotificationResponseBackend): Notificacion {
  return {
    id: b.id,
    referenciaId: b.referenceId,
    tipoReferencia: b.referenceType,
    titulo: b.title,
    mensaje: b.message,
    tipoAlerta: b.alertType,
    leida: b.read,
    fechaCreacion: new Date(b.createdAt),
  };
}

export const notificationService = {
  /** Lista todas las notificaciones del usuario autenticado, más recientes primero. */
  async listarMisNotificaciones(): Promise<Notificacion[]> {
    const { data } = await apiClient.get<NotificationResponseBackend[]>('/notifications');
    return data.map(mapear);
  },

  /** Lista solo las notificaciones no leídas. */
  async listarNoLeidas(): Promise<Notificacion[]> {
    const { data } = await apiClient.get<NotificationResponseBackend[]>('/notifications/unread');
    return data.map(mapear);
  },

  /** Marca una notificación puntual como leída. */
  async marcarComoLeida(id: number): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  /** Marca todas las notificaciones del usuario como leídas. */
  async marcarTodasComoLeidas(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },
};

/** Cuenta cuántas notificaciones de la lista están sin leer. */
export function contarNoLeidas(notificaciones: Notificacion[]): number {
  return notificaciones.reduce((total, n) => (n.leida ? total : total + 1), 0);
}

// ─── Helpers de presentación ────────────────────────────────────
export const NOMBRE_TIPO_ALERTA: Record<string, string> = {
  RECORDATORIO: 'Recordatorio',
  URGENTE: 'Urgente',
  INFO: 'Información',
};

export const COLOR_TIPO_ALERTA: Record<string, string> = {
  RECORDATORIO: 'bg-amber-50 text-amber-700 ring-amber-200',
  URGENTE: 'bg-rose-50 text-rose-700 ring-rose-200',
  INFO: 'bg-blue-50 text-blue-700 ring-blue-200',
};

export function nombreTipoAlerta(tipo: string | null): string {
  if (!tipo) return 'Notificación';
  return NOMBRE_TIPO_ALERTA[tipo] ?? tipo;
}

export function colorTipoAlerta(tipo: string | null): string {
  if (!tipo) return 'bg-slate-100 text-slate-600 ring-slate-200';
  return COLOR_TIPO_ALERTA[tipo] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
}

/** Formatea una fecha como texto relativo corto ("hace 3 horas", "hace 2 días"). */
export function fechaRelativa(fecha: Date): string {
  const segundos = Math.floor((Date.now() - fecha.getTime()) / 1000);
  if (segundos < 60) return 'hace un momento';

  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;

  return fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}
