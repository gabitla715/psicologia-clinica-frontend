import { ClipboardX } from 'lucide-react';
import { ProgresoTimeline } from '../../components/estudiante/ProgresoTimeline';
import { COLOR_CLASES } from '../../lib/estadoProceso';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import type { ProcesoTipo } from './useProcesosEstudiante';
import { useProcesosEstudiante } from './useProcesosEstudiante';

export function EstadoSolicitud() {
  const { usuario, procesosActivos, cargando } = useProcesosEstudiante();

  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800">Estado de mis solicitudes</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consulta en qué etapa se encuentra cada una de tus solicitudes de atención psicológica.
      </p>

      {cargando && (
        <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
          <div className="h-5 w-52 rounded bg-slate-100" />
        </div>
      )}

      {!cargando && procesosActivos.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <ClipboardX className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            No tienes ninguna solicitud registrada todavía. Ve a "Inicio" para solicitar Psicología
            General o Clínica.
          </p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {procesosActivos.map((p) => (
          <TarjetaEstado key={p.tipo} proceso={p} />
        ))}
      </div>
    </div>
  );
}

function TarjetaEstado({ proceso }: { proceso: ProcesoTipo }) {
  const { tipo, solicitud, progreso } = proceso;
  const colores = COLOR_CLASES[progreso.color];

  return (
    <div className={`rounded-2xl border ${colores.borde} bg-white shadow-sm`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-t-2xl ${colores.fondo} px-6 py-5`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {NOMBRE_TIPO_PSICOLOGIA[tipo]}
          </p>
          <h2 className={`mt-1 text-lg font-semibold ${colores.texto}`}>{progreso.tituloEstado}</h2>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colores.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${colores.punto}`} />
          Actual
        </span>
      </div>

      <div className="border-t border-slate-100 px-6 py-6">
        <ProgresoTimeline pasos={progreso.pasos} />
      </div>

      <div className="grid gap-4 border-t border-slate-100 px-6 py-5 sm:grid-cols-2">
        <Dato
          etiqueta="Fecha de creación"
          valor={
            solicitud
              ? new Date(solicitud.fechaSolicitud).toLocaleDateString('es-EC', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'
          }
        />
        <Dato
          etiqueta="Última actualización"
          valor={
            solicitud?.historial?.length
              ? new Date(solicitud.historial[solicitud.historial.length - 1].fecha).toLocaleString('es-EC')
              : '—'
          }
        />
      </div>

      {(solicitud?.motivoAsignacion || solicitud?.motivoRechazo) && (
        <div className="border-t border-slate-100 px-6 py-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Comentarios del profesional</p>
          <p className="mt-1 text-sm text-slate-600">{solicitud?.motivoRechazo ?? solicitud?.motivoAsignacion}</p>
        </div>
      )}

      {solicitud?.historial && solicitud.historial.length > 0 && (
        <div className="border-t border-slate-100 px-6 py-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Historial de cambios</p>
          <ul className="mt-3 space-y-3">
            {[...solicitud.historial].reverse().map((ev, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <div>
                  <p className="text-slate-700">{ev.detalle}</p>
                  <p className="text-xs text-slate-400">{new Date(ev.fecha).toLocaleString('es-EC')}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{valor}</p>
    </div>
  );
}
