import { Link } from 'react-router-dom';
import { CalendarClock, MapPin, User, Download, CalendarPlus, Info, ClipboardList } from 'lucide-react';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { COLOR_CLASES } from '../../lib/estadoProceso';
import type { ProcesoTipo } from './useProcesosEstudiante';
import { useProcesosEstudiante } from './useProcesosEstudiante';
import { useAuth } from '../../auth/AuthContext';

export function MiCita() {
  const { usuario } = useAuth();
  const { procesosActivos, cargando } = useProcesosEstudiante();

  if (!usuario) return null;

  const procesosConCita = procesosActivos.filter(
    (p) => (p.ficha?.nombreEspecialista || p.solicitud?.nombreEspecialistaAsignado) && p.solicitud?.fechaHoraPropuesta
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800">Mi cita</h1>
      <p className="mt-1 text-sm text-slate-500">
        Toda la información de tus próximas citas en un solo lugar.
      </p>

      {cargando && (
        <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
          <div className="h-5 w-52 rounded bg-slate-100" />
        </div>
      )}

      {!cargando && procesosConCita.length === 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Aún no tienes ninguna cita asignada</p>
          <p className="mt-1 text-sm text-slate-500">
            Cuando el coordinador te asigne un especialista y un horario, aparecerá aquí.
          </p>
          <Link to="/estado-solicitud" className="btn-primary mt-4 inline-flex px-4 py-2 text-sm">
            Ver estado de mis solicitudes
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {procesosConCita.map((p) => (
          <TarjetaCita key={p.tipo} usuarioNombre={`${usuario.nombres} ${usuario.apellidos}`} usuarioCedula={usuario.identificacion} proceso={p} />
        ))}
      </div>
    </div>
  );
}

function TarjetaCita({
  proceso,
  usuarioNombre,
  usuarioCedula,
}: {
  proceso: ProcesoTipo;
  usuarioNombre: string;
  usuarioCedula: string;
}) {
  const { tipo, ficha, solicitud, progreso } = proceso;
  const especialista = ficha?.nombreEspecialista ?? solicitud?.nombreEspecialistaAsignado ?? '—';
  const fechaHora = solicitud?.fechaHoraPropuesta ? new Date(solicitud.fechaHoraPropuesta) : null;
  const colores = COLOR_CLASES[progreso.color];

  function descargarComprobante() {
    const contenido = [
      'COMPROBANTE DE CITA — ÁREA DE BIENESTAR ESTUDIANTIL',
      'Universidad Central del Ecuador',
      '',
      `Estudiante: ${usuarioNombre}`,
      `Cédula: ${usuarioCedula}`,
      `Servicio: ${NOMBRE_TIPO_PSICOLOGIA[tipo]}`,
      `Especialista: ${especialista}`,
      `Fecha y hora: ${fechaHora ? fechaHora.toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' }) : '—'}`,
      `Modalidad: Presencial`,
      `Estado: ${progreso.tituloEstado}`,
    ].join('\n');
    const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprobante-cita-${tipo.toLowerCase()}-bienestar-uce.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function agregarAlCalendario() {
    if (!fechaHora) return;
    const inicio = fechaHora;
    const fin = new Date(inicio.getTime() + 45 * 60 * 1000);
    const formato = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:Cita ${NOMBRE_TIPO_PSICOLOGIA[tipo]} — Bienestar Estudiantil UCE`,
      `DTSTART:${formato(inicio)}`,
      `DTEND:${formato(fin)}`,
      `DESCRIPTION:Cita con ${especialista}. Área de Bienestar Estudiantil, UCE.`,
      'LOCATION:Facultad de Filosofía\\, Letras y Ciencias de la Educación\\, UCE',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cita-${tipo.toLowerCase()}-bienestar-uce.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`rounded-2xl border ${colores.borde} bg-white shadow-sm`}>
      <div className={`flex items-center justify-between rounded-t-2xl ${colores.fondo} px-6 py-4`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${colores.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${colores.punto}`} />
          {progreso.tituloEstado}
        </span>
        <span className="text-xs font-medium text-slate-500">{NOMBRE_TIPO_PSICOLOGIA[tipo]}</span>
      </div>

      <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
        <Dato icono={<User className="h-4 w-4" />} etiqueta="Especialista" valor={especialista} />
        <Dato
          icono={<CalendarClock className="h-4 w-4" />}
          etiqueta="Fecha y hora"
          valor={fechaHora ? fechaHora.toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short' }) : '—'}
        />
        <Dato icono={<Info className="h-4 w-4" />} etiqueta="Duración estimada" valor="45 minutos" />
        <Dato icono={<MapPin className="h-4 w-4" />} etiqueta="Lugar" valor="Facultad de Filosofía, Letras y Ciencias de la Educación — Bienestar Estudiantil" />
        <Dato icono={<Info className="h-4 w-4" />} etiqueta="Modalidad" valor="Presencial" />
        <Dato icono={<Info className="h-4 w-4" />} etiqueta="Qué llevar" valor="Cédula o carnet universitario" />
      </div>

      {solicitud?.motivoAsignacion && (
        <div className="border-t border-slate-100 px-6 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Observaciones</p>
          <p className="mt-1 text-sm text-slate-600">{solicitud.motivoAsignacion}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-6 py-5">
        <button
          onClick={descargarComprobante}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Descargar comprobante
        </button>
        <button
          onClick={agregarAlCalendario}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <CalendarPlus className="h-4 w-4" />
          Agregar al calendario
        </button>
        {!progreso.citaConfirmada && (
          <Link to="/mi-solicitud" className="btn-primary px-4 py-2 text-sm">
            Ir a confirmar mi cita
          </Link>
        )}
      </div>
    </div>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
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
