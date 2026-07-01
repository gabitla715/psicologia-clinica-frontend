import { useMemo, useState } from 'react';
import { useNotificaciones } from '../hooks/useNotificaciones';
import {
  colorTipoAlerta,
  fechaRelativa,
  nombreTipoAlerta,
  type Notificacion,
} from '../api/notificationService';

type Filtro = 'TODAS' | 'NO_LEIDAS' | 'LEIDAS';

const FILTROS: Array<{ valor: Filtro; etiqueta: string }> = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'NO_LEIDAS', etiqueta: 'No leídas' },
  { valor: 'LEIDAS', etiqueta: 'Leídas' },
];

export function Notificaciones() {
  const { notificaciones, cargando, error, noLeidas, marcarLeida, marcarTodas } =
    useNotificaciones();
  const [filtro, setFiltro] = useState<Filtro>('TODAS');
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const ordenadas = useMemo(
    () => [...notificaciones].sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime()),
    [notificaciones]
  );

  const filtradas = useMemo(() => {
    if (filtro === 'NO_LEIDAS') return ordenadas.filter((n) => !n.leida);
    if (filtro === 'LEIDAS') return ordenadas.filter((n) => n.leida);
    return ordenadas;
  }, [ordenadas, filtro]);

  async function manejarMarcarTodas() {
    setMarcandoTodas(true);
    try {
      await marcarTodas();
    } finally {
      setMarcandoTodas(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Notificaciones</h1>
          <p className="mt-1 text-sm text-slate-500">
            Avisos relacionados con tus fichas, citas y sesiones.
          </p>
        </div>
        {noLeidas > 0 && (
          <button
            onClick={manejarMarcarTodas}
            disabled={marcandoTodas}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
          >
            {marcandoTodas ? 'Marcando…' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filtro === f.valor
                ? 'bg-brand-100 text-brand-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.etiqueta}
            {f.valor === 'NO_LEIDAS' && noLeidas > 0 && (
              <span className="ml-1.5 text-slate-500">({noLeidas})</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {cargando && <p className="mt-6 text-sm text-slate-500">Cargando notificaciones…</p>}

      {!cargando && (
        <div className="mt-4 space-y-2">
          {filtradas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                {filtro === 'TODAS'
                  ? 'No tienes notificaciones todavía.'
                  : filtro === 'NO_LEIDAS'
                  ? 'No tienes notificaciones sin leer.'
                  : 'No tienes notificaciones leídas.'}
              </p>
            </div>
          ) : (
            filtradas.map((n) => (
              <ItemNotificacion key={n.id} notificacion={n} onMarcarLeida={() => marcarLeida(n.id)} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ItemNotificacion({
  notificacion,
  onMarcarLeida,
}: {
  notificacion: Notificacion;
  onMarcarLeida: () => void;
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        notificacion.leida ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50/40'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {!notificacion.leida && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
          )}
          <div>
            <p className={`text-sm ${notificacion.leida ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
              {notificacion.titulo}
            </p>
            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{notificacion.mensaje}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${colorTipoAlerta(
            notificacion.tipoAlerta
          )}`}
        >
          {nombreTipoAlerta(notificacion.tipoAlerta)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
        <p className="text-xs text-slate-400">{fechaRelativa(notificacion.fechaCreacion)}</p>
        {!notificacion.leida && (
          <button
            onClick={onMarcarLeida}
            className="text-xs font-medium text-brand-700 hover:underline"
          >
            Marcar como leída
          </button>
        )}
      </div>
    </article>
  );
}
