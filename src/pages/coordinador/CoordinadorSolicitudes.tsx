import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import {
  coordinadorMockService,
  NOMBRE_ESTADO_SOLICITUD,
  COLOR_ESTADO_SOLICITUD,
  type SolicitudCoordinador,
  type EstadoSolicitud,
} from '../../api/coordinadorMockService';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';

const FILTROS: { etiqueta: string; valor: EstadoSolicitud | 'TODAS' }[] = [
  { etiqueta: 'Todas', valor: 'TODAS' },
  { etiqueta: 'Pendientes', valor: 'PENDIENTE' },
  { etiqueta: 'Asignadas', valor: 'ASIGNADA' },
  { etiqueta: 'Rechazadas', valor: 'RECHAZADA_ESTUDIANTE' },
  { etiqueta: 'Confirmadas', valor: 'CONFIRMADA' },
];

/**
 * ⚠️ Consume `coordinadorMockService` — datos simulados en localStorage.
 * El backend no tiene (todavía) un endpoint para "solicitudes pendientes
 * de asignación". Ver PEDIDO-PARA-GABO.md. Cuando exista, solo hay que
 * cambiar el import de este archivo, la UI no debería necesitar cambios.
 */
export function CoordinadorSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<SolicitudCoordinador[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<EstadoSolicitud | 'TODAS'>('TODAS');

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    coordinadorMockService
      .listarSolicitudes()
      .then(setSolicitudes)
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar el listado de solicitudes.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const kpis = useMemo(() => {
    return {
      pendientes: solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
      asignadas: solicitudes.filter((s) => s.estado === 'ASIGNADA').length,
      rechazadas: solicitudes.filter((s) => s.estado === 'RECHAZADA_ESTUDIANTE').length,
      confirmadas: solicitudes.filter((s) => s.estado === 'CONFIRMADA').length,
    };
  }, [solicitudes]);

  const filtradas = useMemo(
    () => (filtro === 'TODAS' ? solicitudes : solicitudes.filter((s) => s.estado === filtro)),
    [solicitudes, filtro]
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
          <ClipboardList className="h-5 w-5 text-brand-600" />
          Solicitudes de atención psicológica
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Asigna un especialista y un horario a cada estudiante que solicitó atención.
        </p>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Este módulo trabaja con datos de demostración guardados en tu navegador, porque el
          backend todavía no expone un endpoint de "solicitudes pendientes". El diseño y flujo
          ya quedan listos para conectarse en cuanto ese endpoint exista.
        </p>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TarjetaKpi icono={Clock} color="text-amber-600 bg-amber-50" etiqueta="Pendientes" valor={kpis.pendientes} />
        <TarjetaKpi icono={CheckCircle2} color="text-blue-600 bg-blue-50" etiqueta="Asignadas" valor={kpis.asignadas} />
        <TarjetaKpi icono={XCircle} color="text-red-600 bg-red-50" etiqueta="Rechazadas" valor={kpis.rechazadas} />
        <TarjetaKpi icono={CheckCircle2} color="text-emerald-600 bg-emerald-50" etiqueta="Confirmadas" valor={kpis.confirmadas} />
      </div>

      {/* Filtros */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filtro === f.valor
                ? 'bg-brand-800 text-white'
                : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {cargando ? (
        <p className="mt-6 text-sm text-slate-500">Cargando solicitudes…</p>
      ) : filtradas.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No hay solicitudes en este estado.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtradas.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm"
            >
              <div className="min-w-[220px]">
                <p className="font-medium text-slate-800">{s.nombreEstudiante}</p>
                <p className="text-xs text-slate-500">
                  {s.cedulaEstudiante} · {s.carreraEstudiante}
                </p>
              </div>

              <div className="min-w-[140px]">
                <p className="text-xs uppercase tracking-wide text-slate-400">Servicio</p>
                <p className="text-sm text-slate-700">{NOMBRE_TIPO_PSICOLOGIA[s.tipoPsicologia]}</p>
              </div>

              <div className="min-w-[160px]">
                <p className="text-xs uppercase tracking-wide text-slate-400">Estado</p>
                <span
                  className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${COLOR_ESTADO_SOLICITUD[s.estado]}`}
                >
                  {NOMBRE_ESTADO_SOLICITUD[s.estado]}
                </span>
              </div>

              {s.nombreEspecialistaAsignado && (
                <div className="min-w-[180px]">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Asignado a</p>
                  <p className="text-sm text-slate-700">{s.nombreEspecialistaAsignado}</p>
                  {s.fechaHoraPropuesta && (
                    <p className="text-xs text-slate-500">
                      {new Date(s.fechaHoraPropuesta).toLocaleString('es-EC', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  )}
                </div>
              )}

              <div className="ml-auto">
                <Link
                  to={`/coordinador/solicitudes/${s.id}/asignar`}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {s.estado === 'PENDIENTE' || s.estado === 'RECHAZADA_ESTUDIANTE' ? 'Asignar' : 'Ver / Reagendar'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TarjetaKpi({
  icono: Icono,
  color,
  etiqueta,
  valor,
}: {
  icono: typeof Clock;
  color: string;
  etiqueta: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`inline-flex rounded-lg p-2 ${color}`}>
        <Icono className="h-4 w-4" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{valor}</p>
      <p className="text-xs text-slate-500">{etiqueta}</p>
    </div>
  );
}
