import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sesionService, type Sesion, ETIQUETA_ESCALA_EMOCIONAL } from '../../api/sesionService';
import { fichaService, type Ficha } from '../../api/fichaService';
import {
  NOMBRE_NIVEL_RIESGO,
  COLOR_NIVEL_RIESGO,
  type NivelRiesgo,
} from '../../api/entrevistaService';
import { extraerMensajeError } from '../../api/client';

export function HistorialSesiones() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError('ID de ficha inválido.');
      setCargando(false);
      return;
    }
    let activo = true;
    setCargando(true);
    setError(null);
    Promise.all([fichaService.obtenerPorId(id), sesionService.listarPorFicha(id)])
      .then(([f, s]) => {
        if (!activo) return;
        setFicha(f);
        // Ordena por número de sesión ascendente para lectura longitudinal.
        setSesiones([...s].sort((a, b) => a.numeroSesion - b.numeroSesion));
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudo cargar el historial.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) return <p className="text-sm text-slate-500">Cargando historial…</p>;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link to="/pacientes" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          ← Volver a Pacientes
        </Link>
      </div>
    );
  }
  if (!ficha) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/pacientes/${ficha.id}`}
          className="text-sm text-brand-700 hover:underline"
        >
          ← Volver a la ficha
        </Link>
        <Link
          to={`/pacientes/${ficha.id}/sesiones/nueva`}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          + Registrar sesión
        </Link>
      </div>

      <header>
        <h1 className="text-xl font-semibold text-slate-800">
          Historial de sesiones · {ficha.nombreEstudiante}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {sesiones.length === 0
            ? 'Aún no hay sesiones registradas para este caso.'
            : `${sesiones.length} sesión${sesiones.length === 1 ? '' : 'es'} registrada${sesiones.length === 1 ? '' : 's'}.`}
        </p>
      </header>

      {sesiones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm text-slate-500">
            Registra la primera sesión de seguimiento para este paciente.
          </p>
          <Link
            to={`/pacientes/${ficha.id}/sesiones/nueva`}
            className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Registrar primera sesión →
          </Link>
        </div>
      ) : (
        <ol className="space-y-4">
          {sesiones.map((s) => (
            <TarjetaSesion key={s.id} sesion={s} />
          ))}
        </ol>
      )}
    </div>
  );
}

function TarjetaSesion({ sesion }: { sesion: Sesion }) {
  const riesgo = sesion.evaluacionRiesgo;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Sesión #{sesion.numeroSesion}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-800">
            {sesion.fecha.toLocaleString('es-EC', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {sesion.duracionMinutos} min
            {sesion.modalidad ? ` · ${sesion.modalidad}` : ''}
            {sesion.estadoAsistencia ? ` · ${sesion.estadoAsistencia}` : ''}
          </p>
        </div>
        {riesgo && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${COLOR_NIVEL_RIESGO[riesgo as NivelRiesgo]}`}
          >
            Riesgo: {NOMBRE_NIVEL_RIESGO[riesgo as NivelRiesgo]}
          </span>
        )}
      </div>

      {sesion.notaClinica && (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Nota clínica</p>
          <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
            {sesion.notaClinica}
          </p>
        </div>
      )}

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <EscalaResumen etiqueta="Emocional inicio" valor={sesion.estadoEmocionalInicio} />
        <EscalaResumen etiqueta="Emocional final" valor={sesion.estadoEmocionalFinal} />
        <EscalaResumen etiqueta="Motivación" valor={sesion.motivacionCompromiso} />
      </div>

      {(sesion.tecnicasAplicadas || sesion.tareaCasa || sesion.logrosSesion || sesion.obstaculosSesion) && (
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Detalle etiqueta="Técnicas aplicadas" valor={sesion.tecnicasAplicadas} />
          <Detalle etiqueta="Tarea para casa" valor={sesion.tareaCasa} />
          <Detalle etiqueta="Logros" valor={sesion.logrosSesion} />
          <Detalle etiqueta="Obstáculos" valor={sesion.obstaculosSesion} />
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Registrada por {sesion.nombreEspecialista} el{' '}
        {sesion.fechaCreacion.toLocaleString('es-EC')}
      </p>
    </li>
  );
}

function EscalaResumen({ etiqueta, valor }: { etiqueta: string; valor?: number }) {
  if (!valor) {
    return (
      <div className="rounded-lg bg-slate-50 px-3 py-2">
        <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
        <p className="mt-0.5 text-sm text-slate-400">—</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">
        {valor} · {ETIQUETA_ESCALA_EMOCIONAL[valor]}
      </p>
    </div>
  );
}

function Detalle({ etiqueta, valor }: { etiqueta: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
      <p className="mt-0.5 whitespace-pre-line text-slate-700">{valor}</p>
    </div>
  );
}
