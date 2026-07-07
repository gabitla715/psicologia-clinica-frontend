import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  FileCheck2,
  FolderOpen,
  CalendarDays,
  Flag,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Award,
  ChevronRight,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { calcularAlertas, META_ALERTA } from '../../lib/alertasCaso';
import { fichaService, type Ficha, NOMBRE_ESTADO_FICHA, NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { entrevistaService, type EntrevistaInicial, NOMBRE_NIVEL_RIESGO, COLOR_NIVEL_RIESGO } from '../../api/entrevistaService';
import { consentimientoService, type Consentimiento } from '../../api/consentimientoService';
import { sesionService, type Sesion, ETIQUETA_ESCALA_EMOCIONAL } from '../../api/sesionService';
import { citaService, NOMBRE_ESTADO_CITA, COLOR_ESTADO_CITA, type Cita } from '../../api/citaService';
import { archivosLocalStore, type ArchivoGuardado } from '../../lib/archivosLocalStore';
import { extraerMensajeError } from '../../api/client';
import {
  mockNivelAtencion,
  mockCierreCaso,
  META_NIVEL_ATENCION,
  type NivelAtencion,
  type RegistroAlta,
} from '../../mocks/mockContratoBackend';
import { derivarEstadoCaso, META_ESTADO_CASO } from '../../lib/estadoCaso';

type TabId = 'info' | 'entrevista' | 'sesiones' | 'documentos' | 'agenda' | 'cierre';

const TABS: Array<{ id: TabId; etiqueta: string; icono: typeof FileText }> = [
  { id: 'info', etiqueta: 'Información', icono: FileText },
  { id: 'entrevista', etiqueta: 'Entrevista Inicial', icono: ClipboardList },
  { id: 'sesiones', etiqueta: 'Sesiones', icono: FileCheck2 },
  { id: 'documentos', etiqueta: 'Documentos', icono: FolderOpen },
  { id: 'agenda', etiqueta: 'Agenda', icono: CalendarDays },
  { id: 'cierre', etiqueta: 'Cierre del caso', icono: Flag },
];

export function ExpedienteClinico() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabActivo = (searchParams.get('tab') as TabId) || 'info';

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [entrevista, setEntrevista] = useState<EntrevistaInicial | null>(null);
  const [consentimiento, setConsentimiento] = useState<Consentimiento | null>(null);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [nivelAtencion, setNivelAtencion] = useState<NivelAtencion>('BAJO');
  const [alta, setAlta] = useState<RegistroAlta | null>(null);
  const [proximaCita, setProximaCita] = useState<Date | null>(null);
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
      citaService.listarMisCitas().catch(() => [] as Cita[]),
    ])
      .then(([f, e, c, s, citas]) => {
        if (!activo) return;
        setFicha(f);
        setEntrevista(e);
        setConsentimiento(c);
        setSesiones([...s].sort((a, b) => b.numeroSesion - a.numeroSesion));
        setNivelAtencion(mockNivelAtencion.obtener(id));
        setAlta(mockCierreCaso.obtener(id));
        const ahora = new Date();
        const proxima = citas
          .filter((ci) => ci.estudianteId === f.estudianteId && (ci.estado === 'PENDIENTE' || ci.estado === 'CONFIRMADA') && ci.fechaHora >= ahora)
          .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime())[0];
        setProximaCita(proxima?.fechaHora ?? null);
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

  function cambiarTab(tab: TabId) {
    setSearchParams({ tab });
  }

  function cambiarNivel(nivel: NivelAtencion) {
    mockNivelAtencion.establecer(id, nivel);
    setNivelAtencion(nivel);
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando expediente…</p>;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <Link to="/pacientes" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          ← Volver a Casos asignados
        </Link>
      </div>
    );
  }
  if (!ficha) return null;

  const estadoCaso = derivarEstadoCaso({
    estadoFicha: ficha.estado,
    tieneEntrevista: !!entrevista,
    numeroSesiones: sesiones.length,
    altaRegistrada: !!alta,
  });
  const cerrada = ficha.estado !== 'ACTIVA' || !!alta;
  const alertas = calcularAlertas({
    estadoFicha: ficha.estado,
    tieneConsentimiento: !!consentimiento,
    proximaCita,
    ultimaActividad: sesiones[0]?.fecha ?? ficha.fechaCreacion,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/pacientes" className="hover:text-brand-700 hover:underline">
          Casos asignados
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="font-medium text-slate-700">{ficha.nombreEstudiante}</span>
        {tabActivo !== 'info' && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span>{TABS.find((t) => t.id === tabActivo)?.etiqueta}</span>
          </>
        )}
      </nav>

      {/* Cabecera del expediente */}
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-800">
              {ficha.nombreEstudiante.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">{ficha.nombreEstudiante}</h1>
              <p className="mt-0.5 text-sm text-slate-500">{ficha.correoEstudiante}</p>
              <p className="mt-2 text-sm text-slate-600">
                {NOMBRE_TIPO_PSICOLOGIA[ficha.tipo]} · Ficha #{ficha.id} · {sesiones.length}{' '}
                {sesiones.length === 1 ? 'sesión' : 'sesiones'} · Apertura{' '}
                {ficha.fechaCreacion.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${META_ESTADO_CASO[estadoCaso].claseBadge}`}>
              {META_ESTADO_CASO[estadoCaso].etiqueta}
            </span>
            <span className="text-xs text-slate-400">
              Ficha original: {NOMBRE_ESTADO_FICHA[ficha.estado]}
            </span>
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            {alertas.map((a) => (
              <span
                key={a.tipo}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${META_ALERTA[a.tipo].claseBadge}`}
              >
                <AlertTriangle className="h-3 w-3" />
                {a.etiqueta}
              </span>
            ))}
          </div>
        )}

        {/* Nivel de atención — indicador administrativo, no clínico */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Nivel de atención
          </span>
          {(Object.keys(META_NIVEL_ATENCION) as NivelAtencion[]).map((n) => (
            <button
              key={n}
              onClick={() => cambiarNivel(n)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                nivelAtencion === n
                  ? META_NIVEL_ATENCION[n].claseBadge
                  : 'bg-white text-slate-400 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {META_NIVEL_ATENCION[n].emoji} {META_NIVEL_ATENCION[n].etiqueta}
            </button>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const Icono = t.icono;
          const activo = tabActivo === t.id;
          return (
            <button
              key={t.id}
              onClick={() => cambiarTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                activo
                  ? 'border-brand-700 text-brand-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icono className="h-4 w-4" />
              {t.etiqueta}
            </button>
          );
        })}
      </nav>

      {/* Contenido del tab */}
      {tabActivo === 'info' && <TabInformacion ficha={ficha} />}
      {tabActivo === 'entrevista' && <TabEntrevista ficha={ficha} entrevista={entrevista} />}
      {tabActivo === 'sesiones' && (
        <TabSesiones
          ficha={ficha}
          sesiones={sesiones}
          cerrada={cerrada}
          entrevista={entrevista}
          consentimiento={consentimiento}
          alta={alta}
        />
      )}
      {tabActivo === 'documentos' && (
        <TabDocumentos ficha={ficha} consentimiento={consentimiento} cerrada={cerrada} />
      )}
      {tabActivo === 'agenda' && <TabAgenda ficha={ficha} />}
      {tabActivo === 'cierre' && (
        <TabCierre
          ficha={ficha}
          cerrada={cerrada}
          alta={alta}
          onAltaRegistrada={(registro) => setAlta(registro)}
        />
      )}

      {/* Botón flotante: acceso rápido para registrar sesión */}
      {!cerrada && (
        <Link
          to={`/pacientes/${ficha.id}/sesiones/nueva`}
          className="fixed bottom-6 right-6 z-10 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-brand-800 hover:shadow-xl"
          title="Registrar nueva sesión"
        >
          <Plus className="h-4 w-4" />
          Nueva sesión
        </Link>
      )}
    </div>
  );
}

// ─── Tab: Información ────────────────────────────────────────────
function TabInformacion({ ficha }: { ficha: Ficha }) {
  return (
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
          valor={ficha.fechaCreacion.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
        />
        <Dato titulo="Última actualización" valor={ficha.fechaActualizacion.toLocaleString('es-EC')} />
      </dl>
    </section>
  );
}

// ─── Tab: Entrevista Inicial ─────────────────────────────────────
// El formulario completo (2 columnas + panel de resumen en vivo) vive en
// su propia ruta, reutilizado tal cual: aquí solo se resume el estado y
// se enlaza. Fusionarlo dentro de este tab es candidato para la Parte B.
function TabEntrevista({ ficha, entrevista }: { ficha: Ficha; entrevista: EntrevistaInicial | null }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Entrevista inicial</h2>
        {entrevista && (
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${COLOR_NIVEL_RIESGO[entrevista.riesgoDetectado]}`}>
            Riesgo: {NOMBRE_NIVEL_RIESGO[entrevista.riesgoDetectado]}
          </span>
        )}
      </div>

      {entrevista ? (
        <>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Dato titulo="Motivo detallado" valor={entrevista.motivoConsultaDetallado} ancho="sm:col-span-2" />
            <Dato titulo="Impresión diagnóstica" valor={entrevista.impresionDiagnostica} ancho="sm:col-span-2" />
            <Dato titulo="Fecha de entrevista" valor={entrevista.fechaEntrevista.slice(0, 10)} />
          </dl>
          <Link
            to={`/pacientes/${ficha.id}/entrevista`}
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:underline"
          >
            Ver / editar entrevista completa →
          </Link>
        </>
      ) : (
        <div className="mt-4">
          <p className="text-sm text-slate-500">Aún no se ha registrado la entrevista inicial.</p>
          <Link
            to={`/pacientes/${ficha.id}/entrevista`}
            className="mt-4 inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Abrir entrevista inicial
          </Link>
        </div>
      )}
    </section>
  );
}

// ─── Tab: Sesiones — timeline del caso + tarjetas de sesión ──────
interface EventoTimeline {
  fecha: Date;
  etiqueta: string;
  detalle?: string;
}

function construirTimeline(args: {
  ficha: Ficha;
  entrevista: EntrevistaInicial | null;
  consentimiento: Consentimiento | null;
  sesiones: Sesion[];
  alta: RegistroAlta | null;
}): EventoTimeline[] {
  const { ficha, entrevista, consentimiento, sesiones, alta } = args;
  const eventos: EventoTimeline[] = [
    { fecha: ficha.fechaCreacion, etiqueta: 'Caso asignado / ficha abierta' },
  ];
  if (entrevista) {
    eventos.push({ fecha: new Date(entrevista.fechaEntrevista), etiqueta: 'Entrevista inicial registrada' });
  }
  if (consentimiento) {
    eventos.push({ fecha: consentimiento.fechaFirma, etiqueta: 'Consentimiento firmado' });
  }
  for (const s of sesiones) {
    eventos.push({ fecha: s.fecha, etiqueta: `Sesión #${s.numeroSesion}`, detalle: s.modalidad });
  }
  if (ficha.estado === 'DERIVADA') {
    eventos.push({ fecha: ficha.fechaActualizacion, etiqueta: 'Caso derivado' });
  }
  if (ficha.estado === 'DESISTIDA') {
    eventos.push({ fecha: ficha.fechaActualizacion, etiqueta: 'Desistimiento registrado' });
  }
  if (alta) {
    eventos.push({ fecha: new Date(alta.fechaAlta), etiqueta: 'Alta del caso', detalle: alta.motivoCierre });
  }
  return eventos.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

function TabSesiones({
  ficha,
  sesiones,
  cerrada,
  entrevista,
  consentimiento,
  alta,
}: {
  ficha: Ficha;
  sesiones: Sesion[];
  cerrada: boolean;
  entrevista: EntrevistaInicial | null;
  consentimiento: Consentimiento | null;
  alta: RegistroAlta | null;
}) {
  const timeline = construirTimeline({ ficha, entrevista, consentimiento, sesiones, alta });
  const sesionesOrdenAsc = [...sesiones].sort((a, b) => a.numeroSesion - b.numeroSesion);

  return (
    <div className="space-y-5">
      {/* Línea de tiempo del caso */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Línea de tiempo del caso</h2>
        <ol className="mt-4 space-y-4">
          {timeline.map((ev, idx) => (
            <li key={idx} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                {idx < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
              </div>
              <div className="pb-1">
                <p className="text-sm font-medium text-slate-700">{ev.etiqueta}</p>
                <p className="text-xs text-slate-400">
                  {ev.fecha.toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {ev.detalle ? ` · ${ev.detalle}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Tarjetas de sesión */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Sesiones de seguimiento</h2>
          {!cerrada && (
            <Link
              to={`/pacientes/${ficha.id}/sesiones/nueva`}
              className="inline-flex items-center rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800"
            >
              + Registrar sesión
            </Link>
          )}
        </div>

        {sesionesOrdenAsc.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aún no se han registrado sesiones para este caso.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sesionesOrdenAsc.map((s) => (
              <TarjetaSesion key={s.id} sesion={s} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TarjetaSesion({ sesion }: { sesion: Sesion }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200">
      <button
        onClick={() => setAbierta((a) => !a)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <p className="text-sm font-medium text-slate-800">
            Sesión #{sesion.numeroSesion} ·{' '}
            {sesion.fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-xs text-slate-500">
            {sesion.duracionMinutos} min{sesion.modalidad ? ` · ${sesion.modalidad}` : ''}
            {sesion.estadoAsistencia ? ` · ${sesion.estadoAsistencia}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sesion.evaluacionRiesgo && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${COLOR_NIVEL_RIESGO[sesion.evaluacionRiesgo]}`}>
              {NOMBRE_NIVEL_RIESGO[sesion.evaluacionRiesgo]}
            </span>
          )}
          {abierta ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {abierta && (
        <div className="grid gap-4 border-t border-slate-100 px-4 py-4 sm:grid-cols-2">
          <Dato titulo="Nota clínica" valor={sesion.notaClinica} ancho="sm:col-span-2" />
          <Dato titulo="Técnicas aplicadas" valor={sesion.tecnicasAplicadas} />
          <Dato titulo="Tarea para casa" valor={sesion.tareaCasa} />
          <Dato titulo="Logros de la sesión" valor={sesion.logrosSesion} />
          <Dato titulo="Obstáculos" valor={sesion.obstaculosSesion} />
          <Dato
            titulo="Estado emocional (inicio → fin)"
            valor={
              sesion.estadoEmocionalInicio && sesion.estadoEmocionalFinal
                ? `${ETIQUETA_ESCALA_EMOCIONAL[sesion.estadoEmocionalInicio]} → ${ETIQUETA_ESCALA_EMOCIONAL[sesion.estadoEmocionalFinal]}`
                : null
            }
          />
          <Dato
            titulo="Motivación / compromiso"
            valor={sesion.motivacionCompromiso ? ETIQUETA_ESCALA_EMOCIONAL[sesion.motivacionCompromiso] : null}
          />
        </div>
      )}
    </div>
  );
}

// ─── Tab: Documentos ─────────────────────────────────────────────
function TabDocumentos({
  ficha,
  consentimiento,
  cerrada,
}: {
  ficha: Ficha;
  consentimiento: Consentimiento | null;
  cerrada: boolean;
}) {
  const [archivoEntrevista, setArchivoEntrevista] = useState<ArchivoGuardado | null>(null);

  useEffect(() => {
    let activo = true;
    archivosLocalStore
      .obtener(`entrevista-firmada:${ficha.id}`)
      .then((a) => {
        if (activo) setArchivoEntrevista(a);
      })
      .catch(() => {
        if (activo) setArchivoEntrevista(null);
      });
    return () => {
      activo = false;
    };
  }, [ficha.id]);

  return (
    <section className="space-y-4">
      {/* Consentimiento informado */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Consentimiento informado</h3>
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
          <p className="mt-2 text-xs text-slate-500">
            Firmado el {consentimiento.fechaFirma.toLocaleString('es-EC')}
          </p>
        ) : (
          !cerrada && (
            <Link
              to={`/pacientes/${ficha.id}/consentimiento`}
              className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
            >
              Registrar consentimiento →
            </Link>
          )
        )}
      </div>

      {/* PDF de la entrevista inicial firmado */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Entrevista inicial (documento firmado)</h3>
          {archivoEntrevista ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Cargado
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Pendiente
            </span>
          )}
        </div>
        {archivoEntrevista ? (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {archivoEntrevista.nombreOriginal} · guardado{' '}
              {new Date(archivoEntrevista.fechaGuardado).toLocaleString('es-EC')}
            </p>
            <a
              href={archivosLocalStore.crearUrl(archivoEntrevista.blob)}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Ver archivo
            </a>
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            Descarga, imprime y sube el documento firmado desde el tab Entrevista Inicial.
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Tab: Agenda — citas reales de este estudiante ──────────────
function TabAgenda({ ficha }: { ficha: Ficha }) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);

  useEffect(() => {
    let activo = true;
    citaService
      .listarMisCitas()
      .then((todas) => {
        if (!activo) return;
        setCitas(
          todas
            .filter((c) => c.estudianteId === ficha.estudianteId)
            .sort((a, b) => b.fechaHora.getTime() - a.fechaHora.getTime())
        );
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudieron cargar las citas de este estudiante.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [ficha.estudianteId]);

  async function ejecutar(citaId: number, accion: 'confirmar' | 'cancelar' | 'realizada') {
    setAccionEnCurso(citaId);
    setError(null);
    try {
      const actualizada =
        accion === 'confirmar'
          ? await citaService.confirmar(citaId)
          : accion === 'cancelar'
            ? await citaService.cancelar(citaId)
            : await citaService.marcarRealizada(citaId);
      setCitas((prev) => prev.map((c) => (c.id === citaId ? actualizada : c)));
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo actualizar la cita.'));
    } finally {
      setAccionEnCurso(null);
    }
  }

  const ahora = new Date();
  const proxima = citas
    .filter((c) => (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && c.fechaHora >= ahora)
    .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime())[0];

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Agenda del caso</h2>
            <p className="mt-1 text-sm text-slate-500">
              {proxima
                ? `Próxima cita: ${proxima.fechaHora.toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                : 'No hay una próxima cita programada para este estudiante.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/citas/nueva?estudianteId=${ficha.estudianteId}&tipoPsicologia=${ficha.tipo}`}
              className="inline-flex items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              + Agendar cita
            </Link>
            <Link
              to="/citas/calendario"
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Ver disponibilidad
            </Link>
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-800">Historial de citas de este estudiante</h3>
        {cargando ? (
          <p className="mt-4 text-sm text-slate-500">Cargando…</p>
        ) : citas.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Este estudiante no tiene citas registradas todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {citas.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {c.fechaHora.toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.duracionMinutos} min{c.modalidad ? ` · ${c.modalidad}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${COLOR_ESTADO_CITA[c.estado]}`}>
                    {NOMBRE_ESTADO_CITA[c.estado]}
                  </span>
                  {c.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => ejecutar(c.id, 'confirmar')}
                      disabled={accionEnCurso === c.id}
                      className="text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  )}
                  {(c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && (
                    <>
                      <button
                        onClick={() => ejecutar(c.id, 'realizada')}
                        disabled={accionEnCurso === c.id}
                        className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50"
                      >
                        Marcar realizada
                      </button>
                      <button
                        onClick={() => ejecutar(c.id, 'cancelar')}
                        disabled={accionEnCurso === c.id}
                        className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// ─── Tab: Cierre del caso ────────────────────────────────────────
function TabCierre({
  ficha,
  cerrada,
  alta,
  onAltaRegistrada,
}: {
  ficha: Ficha;
  cerrada: boolean;
  alta: RegistroAlta | null;
  onAltaRegistrada: (registro: RegistroAlta) => void;
}) {
  const [mostrarFormAlta, setMostrarFormAlta] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState('');
  const [resultados, setResultados] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [fechaAlta, setFechaAlta] = useState(new Date().toISOString().slice(0, 10));

  function registrarAlta() {
    if (!motivoCierre.trim() || !resultados.trim()) return;
    const registro = mockCierreCaso.registrarAlta(ficha.id, {
      motivoCierre: motivoCierre.trim(),
      resultados: resultados.trim(),
      observaciones: observaciones.trim() || undefined,
      fechaAlta,
    });
    onAltaRegistrada(registro);
  }

  if (alta) {
    return (
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-2 text-emerald-800">
          <Award className="h-5 w-5" />
          <h2 className="text-base font-semibold">Caso dado de alta</h2>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dato titulo="Fecha de alta" valor={alta.fechaAlta} />
          <Dato titulo="Motivo de cierre" valor={alta.motivoCierre} ancho="sm:col-span-2" />
          <Dato titulo="Resultados" valor={alta.resultados} ancho="sm:col-span-2" />
          {alta.observaciones && <Dato titulo="Observaciones" valor={alta.observaciones} ancho="sm:col-span-2" />}
        </dl>
      </section>
    );
  }

  if (cerrada) {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Este caso se encuentra en estado <strong>{NOMBRE_ESTADO_FICHA[ficha.estado]}</strong>. Ya
        no se pueden registrar nuevas sesiones, derivaciones o desistimientos.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Cierre del caso</h2>
        <p className="mt-1 text-sm text-slate-500">
          El caso puede cerrarse por derivación a otra instancia, por desistimiento
          voluntario, o dando de alta al concluir el proceso terapéutico.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            to={`/pacientes/${ficha.id}/derivacion`}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800"
          >
            <p className="font-semibold">Registrar derivación</p>
            <p className="mt-0.5 text-xs text-slate-500">Debe atenderlo otra área.</p>
          </Link>
          <Link
            to={`/pacientes/${ficha.id}/desistimiento`}
            className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800"
          >
            <p className="font-semibold">Registrar desistimiento</p>
            <p className="mt-0.5 text-xs text-slate-500">El estudiante decidió no continuar.</p>
          </Link>
          <button
            onClick={() => setMostrarFormAlta((v) => !v)}
            className="rounded-lg border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <p className="font-semibold">Dar de alta</p>
            <p className="mt-0.5 text-xs text-slate-500">Concluyó el proceso terapéutico.</p>
          </button>
        </div>
      </section>

      {mostrarFormAlta && (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-800">Registrar alta</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Motivo de cierre <span className="text-red-500">*</span>
              </span>
              <textarea
                rows={2}
                value={motivoCierre}
                onChange={(e) => setMotivoCierre(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Resultados <span className="text-red-500">*</span>
              </span>
              <textarea
                rows={3}
                value={resultados}
                onChange={(e) => setResultados(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Observaciones</span>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Fecha de alta</span>
              <input
                type="date"
                value={fechaAlta}
                onChange={(e) => setFechaAlta(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={registrarAlta}
              disabled={!motivoCierre.trim() || !resultados.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmar alta
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Dato({ titulo, valor, ancho }: { titulo: string; valor?: string | null; ancho?: string }) {
  return (
    <div className={ancho}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-0.5 whitespace-pre-line text-sm text-slate-800">
        {valor ?? <span className="text-slate-400">—</span>}
      </p>
    </div>
  );
}
