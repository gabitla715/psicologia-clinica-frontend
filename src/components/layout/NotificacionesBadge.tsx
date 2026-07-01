// ────────────────────────────────────────────────────────────────
// Icono de campana + contador de no leídas para el header del
// AppLayout. Visible para cualquier rol autenticado.
// ────────────────────────────────────────────────────────────────
import { Link } from 'react-router-dom';
import { useNotificaciones } from '../../hooks/useNotificaciones';

export function NotificacionesBadge() {
  const { noLeidas } = useNotificaciones();

  return (
    <Link
      to="/notificaciones"
      className="relative inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
      aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
      title="Notificaciones"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {noLeidas > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-none text-white">
          {noLeidas > 99 ? '99+' : noLeidas}
        </span>
      )}
    </Link>
  );
}
