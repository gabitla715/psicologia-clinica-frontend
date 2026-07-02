import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  citaService,
  esProxima,
  NOMBRE_ESTADO_CITA,
  COLOR_ESTADO_CITA,
  NOMBRE_TIPO_CITA,
  type Cita,
  type EstadoCita,
} from '../../api/citaService';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';

type FiltroEstado = 'TODAS' | EstadoCita;
type FiltroTemporal = 'PROXIMAS' | 'PASADAS' | 'TODAS';

const FILTROS_ESTADO: Array<{ valor: FiltroEstado; etiqueta: string }> = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'CONFIRMADA', etiqueta: 'Confirmadas' },
  { valor: 'REALIZADA', etiqueta: 'Realizadas' },
  { valor: 'CANCELADA', etiqueta: 'Canceladas' },
];

const FILTROS_TEMPORAL: Array<{ valor: FiltroTemporal; etiqueta: string }> = [
  { valor: 'PROXIMAS', etiqueta: 'Próximas' },
  { valor: 'PASADAS', etiqueta: 'Pasadas' },
  { valor: 'TODAS', etiqueta: 'Todas' },
];

export function AgendaCitas() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('TODAS');
  const [filtroTemporal, setFiltroTemporal] = useState<FiltroTemporal>('PROXIMAS');
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    citaService
      .listarMisCitas()
      .then((res) => setCitas(res))
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la agenda.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const citasFiltradas = useMemo(() => {
    const ahora = Date.now();
    return citas
      .filter((c) => {
        if (filtroEstado !== 'TODAS' && c.estado !== filtroEstado) return false;
        if (filtroTemporal === 'PROXIMAS' && c.fechaHora.getTime() < ahora) return false;
        if (filtroTemporal === 'PASADAS' && c.fechaHora.getTime() >= ahora) return false;
        return true;
      })
      .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());
  }, [citas, filtroEstado, filtroTemporal]);

  const conteoPorEstado = useMemo(() => {
    const conteo: Record<FiltroEstado, number> = {
      TODAS: citas.length,
      PENDIENTE: 0,
      CONFIRMADA: 0,
      CANCELADA: 0,
      REALIZADA: 0,
    };
    for (const c of citas) conteo[c.estado] += 1;
    return conteo;
  }, [citas]);

  async function ejecutarAccion(
    citaId: number,
    accion: 'confirmar' | 'cancelar' | 'realizada',
    mensajeConfirmacion?: string
  ) {
    if (mensajeConfirmacion && !window.confirm(mensajeConfirmacion)) return;
    setAccionEnCurso(citaId);
    setErrorAccion(null);
    try {
      const actualizada =
        accion === 'confirmar'
          ? await citaService.confirmar(citaId)
          : accion === 'cancelar'
          ? await citaService.cancelar(citaId)
          : await citaService.marcarRealizada(citaId);
      setCitas((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
    } catch (err) {
      setErrorAccion(extraerMensajeError(err, 'No se pudo actualizar la cita.'));
    } finally {
      setAccionEnCurso(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Agenda de citas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Citas asignadas a tu cuenta. Filtra por estado y por momento para encontrar
            lo que necesitas.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/citas/calendario"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Ver calendario
          </Link>
          <Link
            to="/citas/nueva"
            className="inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            + Agendar cita
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {FILTROS_ESTADO.map((f) => (
              <button
                key={f.valor}
                onClick={() => setFiltroEstado(f.valor)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filtroEstado === f.valor
                    ? 'bg-brand-100 text-brand-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.etiqueta}
                <span className="ml-1.5 text-slate-500">({conteoPorEstado[f.valor]})</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Momento</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {FILTROS_TEMPORAL.map((f) => (
              <button
                key={f.valor}
                onClick={() => setFiltroTemporal(f.valor)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filtroTemporal === f.valor
                    ? 'bg-brand-100 text-brand-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorAccion && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorAccion}</p>
      )}

      {cargando && <p className="mt-6 text-sm text-slate-500">Cargando agenda…</p>}

      {error && !cargando && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!cargando && !error && (
        <div className="mt-4 space-y-3">
          {citasFiltradas.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                {citas.length === 0
                  ? 'Aún no tienes citas agendadas.'
                  : 'Ninguna cita coincide con los filtros aplicados.'}
              </p>
              {citas.length === 0 && (
                <Link
                  to="/citas/nueva"
                  className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  Agendar la primera cita →
                </Link>
              )}
            </div>
          ) : (
            citasFiltradas.map((cita) => (
              <TarjetaCita
                key={cita.id}
                cita={cita}
                accionEnCurso={accionEnCurso === cita.id}
                onConfirmar={() => ejecutarAccion(cita.id, 'confirmar')}
                onCancelar={() =>
                  ejecutarAccion(
                    cita.id,
                    'cancelar',
                    '¿Cancelar esta cita? El estudiante recibirá una notificación.'
                  )
                }
                onRealizada={() => ejecutarAccion(cita.id, 'realizada')}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta individual de cita ──────────────────────────────────
interface TarjetaProps {
  cita: Cita;
  accionEnCurso: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  onRealizada: () => void;
}

function TarjetaCita({ cita, accionEnCurso, onConfirmar, onCancelar, onRealizada }: TarjetaProps) {
  const fecha = cita.fechaHora.toLocaleDateString('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const hora = cita.fechaHora.toLocaleTimeString('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const proxima = esProxima(cita);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{cita.nombreEstudiante}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {NOMBRE_TIPO_PSICOLOGIA[cita.tipoPsicologia]} · {NOMBRE_TIPO_CITA[cita.tipoCita]}
            {cita.modalidad && ` · ${cita.modalidad}`}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${COLOR_ESTADO_CITA[cita.estado]}`}
        >
          {NOMBRE_ESTADO_CITA[cita.estado]}
        </span>
      </div>

      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <Dato titulo="Fecha" valor={fecha} />
        <Dato titulo="Hora" valor={`${hora} · ${cita.duracionMinutos} min`} />
        <Dato
          titulo="Notificación"
          valor={cita.notificacionEnviada ? 'Enviada' : 'Pendiente'}
        />
      </div>

      {cita.notas && (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Notas</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-slate-700">{cita.notas}</p>
        </div>
      )}

      {/* Acciones según estado */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {cita.estado === 'PENDIENTE' && (
          <button
            onClick={onConfirmar}
            disabled={accionEnCurso}
            className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            Confirmar
          </button>
        )}
        {(cita.estado === 'PENDIENTE' || cita.estado === 'CONFIRMADA') && proxima && (
          <button
            onClick={onCancelar}
            disabled={accionEnCurso}
            className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
          >
            Cancelar
          </button>
        )}
        {cita.estado === 'CONFIRMADA' && !proxima && (
          <button
            onClick={onRealizada}
            disabled={accionEnCurso}
            className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            Marcar como realizada
          </button>
        )}
        {(cita.estado === 'CANCELADA' || cita.estado === 'REALIZADA') && (
          <p className="text-xs text-slate-400">Esta cita ya no admite acciones.</p>
        )}
      </div>
    </article>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-0.5 font-medium text-slate-800">{valor}</p>
    </div>
  );
}
