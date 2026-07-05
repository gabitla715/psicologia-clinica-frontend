import { FileClock, Info } from 'lucide-react';
import { NOMBRE_ESTADO_FICHA, NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { useProcesosEstudiante } from './useProcesosEstudiante';

export function HistorialAtenciones() {
  const { usuario, listaProcesos, cargando } = useProcesosEstudiante();

  if (!usuario) return null;

  const conFicha = listaProcesos.filter((p) => p.ficha);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800">Historial de atenciones</h1>
      <p className="mt-1 text-sm text-slate-500">
        Consulta el registro de tus procesos de atención psicológica (General y Clínica).
      </p>

      {cargando && (
        <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
          <div className="h-5 w-52 rounded bg-slate-100" />
        </div>
      )}

      {!cargando && conFicha.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <FileClock className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Todavía no tienes fichas clínicas abiertas. Cuando un especialista abra tu ficha,
            aparecerá aquí.
          </p>
        </div>
      )}

      {!cargando && conFicha.length > 0 && (
        <div className="mt-6 space-y-4">
          {conFicha.map((p) => (
            <div key={p.tipo} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {NOMBRE_TIPO_PSICOLOGIA[p.tipo]}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {p.ficha!.nombreEspecialista ?? 'Especialista por asignar'}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {NOMBRE_ESTADO_FICHA[p.ficha!.estado]}
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>
                  <span className="text-slate-400">Apertura: </span>
                  {p.ficha!.fechaCreacion.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p>
                  <span className="text-slate-400">Última actualización: </span>
                  {p.ficha!.fechaActualizacion.toLocaleString('es-EC')}
                </p>
              </div>
              {p.ficha!.motivoConsulta && (
                <p className="mt-3 text-sm text-slate-600">
                  <span className="text-slate-400">Motivo de consulta: </span>
                  {p.ficha!.motivoConsulta}
                </p>
              )}
            </div>
          ))}

          <div className="flex items-start gap-2 rounded-lg bg-brand-50 px-4 py-3 text-xs text-brand-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              El detalle sesión por sesión de tu atención lo administra tu especialista. Si
              necesitas un resumen de tus sesiones, solicítalo al Área de Bienestar Estudiantil.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
