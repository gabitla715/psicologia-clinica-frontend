import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarX, User, CalendarClock } from 'lucide-react';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { COLOR_CLASES } from '../../lib/estadoProceso';
import type { ProcesoTipo } from '../../pages/estudiante/useProcesosEstudiante';
import { ProgresoTimeline } from './ProgresoTimeline';

interface Props {
  proceso: ProcesoTipo;
  onConfirmar: () => Promise<void>;
  onRechazar: (motivo: string) => Promise<void>;
  procesando: boolean;
}

export function ProcesoCard({ proceso, onConfirmar, onRechazar, procesando }: Props) {
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [motivo, setMotivo] = useState('');

  const { progreso, ficha, solicitud, tipo } = proceso;
  const colores = COLOR_CLASES[progreso.color];
  const especialista = ficha?.nombreEspecialista ?? solicitud?.nombreEspecialistaAsignado;
  const fechaHora = solicitud?.fechaHoraPropuesta ? new Date(solicitud.fechaHoraPropuesta) : null;

  return (
    <div className={`overflow-hidden rounded-2xl border ${colores.borde} bg-white shadow-sm`}>
      <div className={`${colores.fondo} px-6 py-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {NOMBRE_TIPO_PSICOLOGIA[tipo]}
            </p>
            <h2 className={`mt-1 text-lg font-semibold ${colores.texto}`}>{progreso.tituloEstado}</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colores.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colores.punto}`} />
            {progreso.tituloEstado}
          </span>
        </div>
        <p className="mt-2 max-w-xl text-sm text-slate-600">{progreso.descripcion}</p>
      </div>

      <div className="border-t border-slate-100 px-6 py-6">
        <ProgresoTimeline pasos={progreso.pasos} />
      </div>

      {(especialista || fechaHora) && (
        <div className="grid gap-4 border-t border-slate-100 px-6 py-5 sm:grid-cols-2">
          <InfoMini icono={<User className="h-4 w-4" />} etiqueta="Especialista" valor={especialista ?? '—'} />
          <InfoMini
            icono={<CalendarClock className="h-4 w-4" />}
            etiqueta="Fecha y hora"
            valor={fechaHora ? fechaHora.toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' }) : '—'}
          />
        </div>
      )}

      {progreso.tieneCitaPorConfirmar && (
        <div className="border-t border-slate-100 px-6 py-5">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onConfirmar}
              disabled={procesando}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CalendarCheck className="h-4 w-4" />
              Confirmar cita
            </button>
            <button
              onClick={() => setMostrarRechazo((v) => !v)}
              disabled={procesando}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <CalendarX className="h-4 w-4" />
              Solicitar otro horario
            </button>
            <Link
              to="/mi-cita"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Ver detalle de la cita
            </Link>
          </div>

          {mostrarRechazo && (
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50/40 p-4">
              <label className="text-xs font-medium text-slate-600">
                Cuéntanos brevemente por qué necesitas otro horario:
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                placeholder="Ej: tengo clase a esa hora, ¿podría ser en la tarde?"
              />
              <button
                onClick={async () => {
                  await onRechazar(motivo.trim());
                  setMostrarRechazo(false);
                  setMotivo('');
                }}
                disabled={procesando || !motivo.trim()}
                className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-50"
              >
                Enviar solicitud de reagenda
              </button>
            </div>
          )}
        </div>
      )}

      {progreso.citaConfirmada && (
        <div className="border-t border-slate-100 px-6 py-5">
          <Link
            to="/mi-cita"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <CalendarClock className="h-4 w-4" />
            Ver detalle completo de tu cita
          </Link>
        </div>
      )}
    </div>
  );
}

function InfoMini({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icono}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
        <p className="text-sm font-medium text-slate-800">{valor}</p>
      </div>
    </div>
  );
}
