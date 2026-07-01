import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fichaService, type Ficha, NOMBRE_ESTADO_FICHA, COLOR_ESTADO_FICHA, NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { entrevistaService, type EntrevistaInicial, NOMBRE_NIVEL_RIESGO, COLOR_NIVEL_RIESGO } from '../../api/entrevistaService';
import { consentimientoService, type Consentimiento } from '../../api/consentimientoService';
import { planIntervencionService, type ResumenPlanLocal } from '../../api/planIntervencionService';
import { sesionService, type Sesion } from '../../api/sesionService';
import { extraerMensajeError } from '../../api/client';

export function DetalleFicha() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [entrevista, setEntrevista] = useState<EntrevistaInicial | null>(null);
  const [consentimiento, setConsentimiento] = useState<Consentimiento | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [planResumen, setPlanResumen] = useState<ResumenPlanLocal | null>(null);
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
      sesionService.listarPorFicha(id).catch(() => [] as Sesion[]),
    ])
      .then(([f, e, c, s]) => {
        if (!activo) return;
        setFicha(f);
        setEntrevista(e);
        setConsentimiento(c);
        setSesiones([...s].sort((a, b) => b.numeroSesion - a.numeroSesion));
        setPlanResumen(planIntervencionService.resumenLocal(id));
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

  if (cargando) return <p className="text-sm text-slate-500">Cargando ficha…</p>;
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

  const cerrada = ficha.estado !== 'ACTIVA';

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
            <Dato titulo="Fecha de firma" valor={consentimiento.fechaFirma.toLocaleString('es-EC')} />
            <Dato
              titulo="Aceptación"
              valor={consentimiento.estudianteAcepta ? 'El estudiante aceptó las condiciones' : 'No aceptado'}
            />
            {consentimiento.modoLocal && (
              <div className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Esta firma se guardó en modo local porque el endpoint del backend aún no
                está implementado.
              </div>
            )}
          </dl>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Aún no se ha registrado el consentimiento informado. Es indispensable antes
              de iniciar la intervención.
            </p>
            {!cerrada && (
              <Link
                to={`/pacientes/${ficha.id}/consentimiento`}
                className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                Registrar consentimiento
              </Link>
            )}
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
            <Dato titulo="Motivo detallado" valor={entrevista.motivoConsultaDetallado} ancho="sm:col-span-2" />
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
              <Dato titulo="Observaciones del riesgo" valor={entrevista.observacionesRiesgo} ancho="sm:col-span-2" />
            )}
          </dl>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Aún no se ha registrado la entrevista inicial.
            </p>
            {!cerrada && (
              <Link
                to={`/pacientes/${ficha.id}/entrevista`}
                className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                Registrar entrevista
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Plan de intervención */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Plan de intervención</h2>
          {planResumen && (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Registrado
            </span>
          )}
        </div>

        {planResumen ? (
          <>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Dato titulo="Enfoque terapéutico" valor={planResumen.enfoqueTerapeutico} ancho="sm:col-span-2" />
              <Dato titulo="Sesiones estimadas" valor={String(planResumen.numSesionesEstimadas)} />
              <Dato titulo="Última actualización" valor={new Date(planResumen.actualizadoEn).toLocaleString('es-EC')} />
            </dl>
            <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              El backend aún no expone un endpoint para consultar el plan completo. Este resumen
              proviene de la creación/edición realizada desde este navegador.
            </div>
            {!cerrada && (
              <Link
                to={`/pacientes/${ficha.id}/plan`}
                className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
              >
                Editar plan →
              </Link>
            )}
          </>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Aún no se ha creado el plan de intervención para este caso.
            </p>
            {!cerrada && (
              <Link
                to={`/pacientes/${ficha.id}/plan`}
                className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                Crear plan
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Sesiones de seguimiento */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Sesiones de seguimiento</h2>
          <Link
            to={`/pacientes/${ficha.id}/sesiones`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Ver historial completo →
          </Link>
        </div>

        {sesiones.length === 0 ? (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Aún no se han registrado sesiones para este caso.
            </p>
            {!cerrada && (
              <Link
                to={`/pacientes/${ficha.id}/sesiones/nueva`}
                className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                Registrar primera sesión
              </Link>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-4 divide-y divide-slate-100">
              {sesiones.slice(0, 3).map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Sesión #{s.numeroSesion} ·{' '}
                      {s.fecha.toLocaleDateString('es-EC', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.duracionMinutos} min
                      {s.modalidad ? ` · ${s.modalidad}` : ''}
                      {s.estadoAsistencia ? ` · ${s.estadoAsistencia}` : ''}
                    </p>
                  </div>
                  {s.evaluacionRiesgo && (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${COLOR_NIVEL_RIESGO[s.evaluacionRiesgo]}`}
                    >
                      {NOMBRE_NIVEL_RIESGO[s.evaluacionRiesgo]}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {!cerrada && (
              <Link
                to={`/pacientes/${ficha.id}/sesiones/nueva`}
                className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
              >
                + Registrar sesión
              </Link>
            )}
          </>
        )}
      </section>

      {/* Programación de citas — enlace directo con estudianteId y tipo prellenados */}
      {!cerrada && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Programación de citas</h2>
              <p className="mt-1 text-sm text-slate-500">
                Agenda una cita para este estudiante desde la ficha. La agenda completa
                está en <Link to="/citas" className="text-brand-700 hover:underline">Agenda de citas</Link>.
              </p>
            </div>
            <Link
              to={`/citas/nueva?estudianteId=${ficha.estudianteId}&tipoPsicologia=${ficha.tipo}`}
              className="inline-flex shrink-0 items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              + Agendar cita
            </Link>
          </div>
        </section>
      )}

      {/* Cierre del caso */}
      {!cerrada ? (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-semibold text-slate-800">Cierre del caso</h2>
          <p className="mt-1 text-sm text-slate-500">
            El caso puede cerrarse por derivación a otra instancia o por desistimiento
            voluntario del estudiante. Ambas acciones son irreversibles desde la
            interfaz.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              to={`/pacientes/${ficha.id}/derivacion`}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800"
            >
              <p className="font-semibold">Registrar derivación</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Cerrar el caso porque debe atenderlo otra área.
              </p>
            </Link>
            <Link
              to={`/pacientes/${ficha.id}/desistimiento`}
              className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800"
            >
              <p className="font-semibold">Registrar desistimiento</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Cerrar el caso porque el estudiante decidió no continuar.
              </p>
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          Este caso se encuentra en estado <strong>{NOMBRE_ESTADO_FICHA[ficha.estado]}</strong>.
          Ya no se pueden registrar nuevas sesiones, derivaciones o desistimientos.
        </section>
      )}
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
