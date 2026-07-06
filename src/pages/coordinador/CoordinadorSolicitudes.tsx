import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, CheckCircle2, XCircle, BadgeCheck } from 'lucide-react';
import { solicitudService, type SolicitudAtencionBackend } from '../../api/solicitudService';
import { NOMBRE_TIPO_PSICOLOGIA, type TipoPsicologia } from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';
import {
  mockAsignacionCita,
  META_ESTADO_EXTENDIDO,
  type EstadoSolicitudExtendido,
} from '../../mocks/mockContratoBackend';

interface ItemSolicitud {
  id: number;
  nombreEstudiante: string;
  tipoPsicologia: TipoPsicologia;
  motivoSolicitud: string;
  creadoEn: string;
  estado: EstadoSolicitudExtendido;
  nombreEspecialista: string | null;
  fechaHora: string | null;
}

type Pestana = 'TODAS' | 'PENDIENTES' | 'ASIGNADAS' | 'RECHAZADAS' | 'CONFIRMADAS';

function bucketDe(estado: EstadoSolicitudExtendido): Exclude<Pestana, 'TODAS'> {
  if (estado === 'PENDIENTE') return 'PENDIENTES';
  if (estado === 'ASIGNADA' || estado === 'REAGENDADA') return 'ASIGNADAS';
  if (estado === 'CONFIRMADA' || estado === 'ATENDIDA') return 'CONFIRMADAS';
  return 'RECHAZADAS'; // CANCELADA, RECHAZADA
}

/**
 * Listado de solicitudes de atención psicológica.
 *
 * Combina dos fuentes:
 * - Solicitudes pendientes reales (GET /api/v1/solicitudes/pendientes).
 * - El registro de asignaciones (src/mocks/mockContratoBackend.ts),
 *   que guarda qué pasó con cada solicitud después de asignarla
 *   (especialista, fecha/hora, estado, historial), porque el backend
 *   todavía no tiene un endpoint de histórico completo.
 */
export function CoordinadorSolicitudes() {
  const [pendientesReales, setPendientesReales] = useState<SolicitudAtencionBackend[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pestana, setPestana] = useState<Pestana>('TODAS');
  const [filtroServicio, setFiltroServicio] = useState<TipoPsicologia | 'TODAS'>('TODAS');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    solicitudService
      .pendientes()
      .then(setPendientesReales)
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar el listado de solicitudes.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const items: ItemSolicitud[] = useMemo(() => {
    const registros = mockAsignacionCita.listarTodas();
    const idsConRegistro = new Set(registros.map((r) => r.solicitudId));

    const desdeReales: ItemSolicitud[] = pendientesReales
      .filter((s) => !idsConRegistro.has(s.id))
      .map((s) => ({
        id: s.id,
        nombreEstudiante: s.nombreEstudiante,
        tipoPsicologia: s.tipoPsicologia,
        motivoSolicitud: s.motivoSolicitud,
        creadoEn: s.creadoEn,
        estado: 'PENDIENTE',
        nombreEspecialista: null,
        fechaHora: null,
      }));

    const desdeRegistros: ItemSolicitud[] = registros.map((r) => ({
      id: r.solicitudId,
      nombreEstudiante: r.solicitud.nombreEstudiante,
      tipoPsicologia: r.solicitud.tipoPsicologia,
      motivoSolicitud: r.solicitud.motivoSolicitud,
      creadoEn: r.solicitud.creadoEn,
      estado: r.estadoExtendido,
      nombreEspecialista: r.nombreEspecialista,
      fechaHora: r.fechaHora,
    }));

    return [...desdeReales, ...desdeRegistros].sort(
      (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
    );
  }, [pendientesReales]);

  const conteos = useMemo(() => {
    const base = { PENDIENTES: 0, ASIGNADAS: 0, RECHAZADAS: 0, CONFIRMADAS: 0 };
    for (const item of items) base[bucketDe(item.estado)]++;
    return base;
  }, [items]);

  const filtrados = useMemo(() => {
    return items.filter((item) => {
      if (pestana !== 'TODAS' && bucketDe(item.estado) !== pestana) return false;
      if (filtroServicio !== 'TODAS' && item.tipoPsicologia !== filtroServicio) return false;
      const fecha = new Date(item.creadoEn);
      if (desde && fecha < new Date(desde)) return false;
      if (hasta && fecha > new Date(hasta + 'T23:59:59')) return false;
      return true;
    });
  }, [items, pestana, filtroServicio, desde, hasta]);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
          <ClipboardList className="h-5 w-5 text-brand-600" />
          Solicitudes de atención psicológica
        </h1>
        <p className="mt-1 text-sm text-slate-500">Asigna un especialista y un horario a cada estudiante que solicitó atención.</p>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TarjetaKpi icono={<Clock className="h-4 w-4" />} color="amber" numero={conteos.PENDIENTES} etiqueta="Pendientes" />
        <TarjetaKpi icono={<BadgeCheck className="h-4 w-4" />} color="blue" numero={conteos.ASIGNADAS} etiqueta="Asignadas" />
        <TarjetaKpi icono={<XCircle className="h-4 w-4" />} color="red" numero={conteos.RECHAZADAS} etiqueta="Rechazadas" />
        <TarjetaKpi icono={<CheckCircle2 className="h-4 w-4" />} color="emerald" numero={conteos.CONFIRMADAS} etiqueta="Confirmadas" />
      </div>

      {/* Pestañas */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['TODAS', 'Todas'],
            ['PENDIENTES', 'Pendientes'],
            ['ASIGNADAS', 'Asignadas'],
            ['RECHAZADAS', 'Rechazadas'],
            ['CONFIRMADAS', 'Confirmadas'],
          ] as [Pestana, string][]
        ).map(([valor, etiqueta]) => (
          <button
            key={valor}
            onClick={() => setPestana(valor)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              pestana === valor ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {/* Filtros adicionales */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">Servicio</label>
          <select
            value={filtroServicio}
            onChange={(e) => setFiltroServicio(e.target.value as TipoPsicologia | 'TODAS')}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="TODAS">Todos los servicios</option>
            <option value="GENERAL">Psicología General</option>
            <option value="CLINICA">Psicología Clínica</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Desde</label>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Hasta</label>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500" />
        </div>
        {(filtroServicio !== 'TODAS' || desde || hasta) && (
          <button
            onClick={() => {
              setFiltroServicio('TODAS');
              setDesde('');
              setHasta('');
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="mt-6 text-sm text-slate-500">Cargando solicitudes…</p>
      ) : filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No hay solicitudes con estos filtros.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {filtrados.map((item) => {
            const meta = META_ESTADO_EXTENDIDO[item.estado];
            const yaAsignada = item.estado !== 'PENDIENTE';
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-sm">
                <div className="min-w-[200px]">
                  <p className="font-medium text-slate-800">{item.nombreEstudiante}</p>
                  <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-slate-500" title={item.motivoSolicitud}>
                    {item.motivoSolicitud}
                  </p>
                </div>

                <div className="min-w-[130px]">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Servicio</p>
                  <p className="text-sm text-slate-700">{NOMBRE_TIPO_PSICOLOGIA[item.tipoPsicologia]}</p>
                </div>

                <div className="min-w-[150px]">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Estado</p>
                  <span className={`mt-0.5 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${meta.claseBadge}`}>
                    {meta.etiqueta}
                  </span>
                </div>

                {item.nombreEspecialista && (
                  <div className="min-w-[180px]">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Asignado a</p>
                    <p className="text-sm font-medium text-slate-700">{item.nombreEspecialista}</p>
                    {item.fechaHora && (
                      <p className="text-xs text-slate-500">
                        {new Date(item.fechaHora).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })},{' '}
                        {new Date(item.fechaHora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                )}

                <div className="ml-auto">
                  <Link to={`/coordinador/solicitudes/${item.id}/asignar`} className="btn-primary px-4 py-2 text-sm">
                    {yaAsignada ? 'Ver / Reagendar' : 'Asignar'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TarjetaKpi({
  icono,
  numero,
  etiqueta,
  color,
}: {
  icono: React.ReactNode;
  numero: number;
  etiqueta: string;
  color: 'amber' | 'blue' | 'red' | 'emerald';
}) {
  const clases = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  }[color];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className={`inline-flex rounded-lg p-2 ${clases}`}>{icono}</div>
      <div>
        <p className="text-2xl font-semibold text-slate-800">{numero}</p>
        <p className="text-xs text-slate-500">{etiqueta}</p>
      </div>
    </div>
  );
}
