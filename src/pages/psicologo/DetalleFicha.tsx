import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fichaService, type Ficha, NOMBRE_ESTADO_FICHA, COLOR_ESTADO_FICHA, NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { entrevistaService, type EntrevistaInicial, NOMBRE_NIVEL_RIESGO, COLOR_NIVEL_RIESGO } from '../../api/entrevistaService';
import { consentimientoService, type Consentimiento } from '../../api/consentimientoService';
import { extraerMensajeError } from '../../api/client';

export function DetalleFicha() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [entrevista, setEntrevista] = useState<EntrevistaInicial | null>(null);
  const [consentimiento, setConsentimiento] = useState<Consentimiento | null>(null);
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

    Promise.all([
      fichaService.obtenerPorId(id),
      entrevistaService.obtenerPorFicha(id),
      consentimientoService.obtenerPorFicha(id),
    ])
      .then(([f, e, c]) => {
        if (!activo) return;
        setFicha(f);
        setEntrevista(e);
        setConsentimiento(c);
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudo cargar la ficha.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return <p className="text-sm text-slate-500">Cargando ficha…</p>;
  }
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
      <div>
        <Link to="/pacientes" className="text-sm text-brand-700 hover:underline">
          ← Volver a Pacientes
        </Link>
      </div>

      {/* Header del paciente */}
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{ficha.nombreEstudiante}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{ficha.correoEstudiante}</p>
            <p className="mt-3 text-sm text-slate-600">
              {NOMBRE_TIPO_PSICOLOGIA[ficha.tipo]} · Ficha #{ficha.id}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${COLOR_ESTADO_FICHA[ficha.estado]}`}
          >
            {NOMBRE_ESTADO_FICHA[ficha.estado]}
          </span>
        </div>
      </header>

      {/* Datos de apertura */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Datos de apertura</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dato titulo="Motivo de consulta" valor={ficha.motivoConsulta} />
          <Dato titulo="Tiempo del problema" valor={ficha.tiempoProblema} />
          <Dato titulo="Antecedentes psicológicos" valor={ficha.antecedentesPsicologicos} />
          <Dato titulo="Diagnóstico de trabajo" valor={ficha.diagnosticoTrabajo} />
          <Dato titulo="Historia personal" valor={ficha.historiaPersonal} ancho="sm:col-span-2" />
          <Dato titulo="Historia familiar" valor={ficha.historiaFamiliar} ancho="sm:col-span-2" />
          <Dato
            titulo="Apertura"
            valor={ficha.fechaCreacion.toLocaleDateString('es-EC', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          />
          <Dato
            titulo="Última actualización"
            valor={ficha.fechaActualizacion.toLocaleString('es-EC')}
          />
        </dl>
      </section>

      {/* Consentimiento */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Consentimiento informado</h2>
          {consentimiento ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Firmado
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Pendiente
            </span>
          )}
        </div>

        {consentimiento ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dato titulo="Versión del texto" valor={consentimiento.textoVersion} />
            <Dato
              titulo="Fecha de firma"
              valor={consentimiento.fechaFirma.toLocaleString('es-EC')}
            />
            <Dato
              titulo="Aceptación"
              valor={consentimiento.estudianteAcepta ? 'El estudiante aceptó las condiciones' : 'No aceptado'}
            />
            {consentimiento.modoLocal && (
              <div className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Esta firma se guardó en modo local porque el endpoint del backend aún no
                está implementado. Cuando se publique, los registros pasarán a la base
                de datos institucional.
              </div>
            )}
          </dl>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Aún no se ha registrado el consentimiento informado de este caso. Es
              indispensable antes de iniciar la intervención.
            </p>
            <Link
              to={`/pacientes/${ficha.id}/consentimiento`}
              className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              Registrar consentimiento
            </Link>
          </div>
        )}
      </section>

      {/* Entrevista inicial */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Entrevista inicial</h2>
          {entrevista && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${COLOR_NIVEL_RIESGO[entrevista.riesgoDetectado]}`}
            >
              Riesgo: {NOMBRE_NIVEL_RIESGO[entrevista.riesgoDetectado]}
            </span>
          )}
        </div>

        {entrevista ? (
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dato
              titulo="Motivo detallado"
              valor={entrevista.motivoConsultaDetallado}
              ancho="sm:col-span-2"
            />
            <Dato titulo="Impresión diagnóstica" valor={entrevista.impresionDiagnostica} ancho="sm:col-span-2" />
            <Dato titulo="Recomendaciones" valor={entrevista.recomendaciones} ancho="sm:col-span-2" />
            <Dato
              titulo="Fecha de entrevista"
              valor={new Date(entrevista.fechaEntrevista).toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Dato titulo="Aplicada por" valor={entrevista.nombreEspecialista} />
            {entrevista.observacionesRiesgo && (
              <Dato
                titulo="Observaciones del riesgo"
                valor={entrevista.observacionesRiesgo}
                ancho="sm:col-span-2"
              />
            )}
          </dl>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Aún no se ha registrado la entrevista inicial. Este es el siguiente paso
              del proceso clínico tras la apertura de la ficha.
            </p>
            <Link
              to={`/pacientes/${ficha.id}/entrevista`}
              className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              Registrar entrevista
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Dato({
  titulo,
  valor,
  ancho,
}: {
  titulo: string;
  valor?: string | null;
  ancho?: string;
}) {
  return (
    <div className={ancho}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
        {valor ?? <span className="text-slate-400">—</span>}
      </p>
    </div>
  );
}
