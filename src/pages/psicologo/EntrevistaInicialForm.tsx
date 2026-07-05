import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Printer,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  Trash2,
} from 'lucide-react';
import {
  entrevistaService,
  type EntrevistaInicialRequestBackend,
  type EntrevistaInicial,
  type NivelRiesgo,
  NOMBRE_NIVEL_RIESGO,
} from '../../api/entrevistaService';
import { fichaService, type Ficha, NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';
import { archivosLocalStore, type ArchivoGuardado } from '../../lib/archivosLocalStore';

interface Formulario {
  fechaNacimiento: string;
  lugarNacimiento: string;
  estadoCivil: string;
  ocupacion: string;
  nivelInstruccion: string;
  motivoConsultaDetallado: string;
  inicioproblema: string;
  factoresPrecipitantes: string;
  intentosSolucion: string;
  historiaPersonal: string;
  historiaFamiliar: string;
  relacionesInterpersonales: string;
  aparienciaGeneral: string;
  estadoAfectivo: string;
  pensamiento: string;
  percepcion: string;
  memoriaAtencion: string;
  juicioCritico: string;
  riesgoDetectado: NivelRiesgo;
  observacionesRiesgo: string;
  impresionDiagnostica: string;
  recomendaciones: string;
  fechaEntrevista: string;
}

const ESTADO_INICIAL: Formulario = {
  fechaNacimiento: '',
  lugarNacimiento: '',
  estadoCivil: '',
  ocupacion: '',
  nivelInstruccion: '',
  motivoConsultaDetallado: '',
  inicioproblema: '',
  factoresPrecipitantes: '',
  intentosSolucion: '',
  historiaPersonal: '',
  historiaFamiliar: '',
  relacionesInterpersonales: '',
  aparienciaGeneral: '',
  estadoAfectivo: '',
  pensamiento: '',
  percepcion: '',
  memoriaAtencion: '',
  juicioCritico: '',
  riesgoDetectado: 'SIN_IDEACION',
  observacionesRiesgo: '',
  impresionDiagnostica: '',
  recomendaciones: '',
  fechaEntrevista: new Date().toISOString().slice(0, 10),
};

function entrevistaAFormulario(e: EntrevistaInicial): Formulario {
  return {
    fechaNacimiento: e.fechaNacimiento ?? '',
    lugarNacimiento: e.lugarNacimiento ?? '',
    estadoCivil: e.estadoCivil ?? '',
    ocupacion: e.ocupacion ?? '',
    nivelInstruccion: e.nivelInstruccion ?? '',
    motivoConsultaDetallado: e.motivoConsultaDetallado,
    inicioproblema: e.inicioproblema ?? '',
    factoresPrecipitantes: e.factoresPrecipitantes ?? '',
    intentosSolucion: e.intentosSolucion ?? '',
    historiaPersonal: e.historiaPersonal ?? '',
    historiaFamiliar: e.historiaFamiliar ?? '',
    relacionesInterpersonales: e.relacionesInterpersonales ?? '',
    aparienciaGeneral: e.aparienciaGeneral ?? '',
    estadoAfectivo: e.estadoAfectivo ?? '',
    pensamiento: e.pensamiento ?? '',
    percepcion: e.percepcion ?? '',
    memoriaAtencion: e.memoriaAtencion ?? '',
    juicioCritico: e.juicioCritico ?? '',
    riesgoDetectado: e.riesgoDetectado,
    observacionesRiesgo: e.observacionesRiesgo ?? '',
    impresionDiagnostica: e.impresionDiagnostica ?? '',
    recomendaciones: e.recomendaciones ?? '',
    fechaEntrevista: e.fechaEntrevista?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  };
}

function calcularEdad(fechaNacimientoISO: string): number | null {
  if (!fechaNacimientoISO) return null;
  const nacimiento = new Date(fechaNacimientoISO);
  if (Number.isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad;
}

export function EntrevistaInicialForm() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;
  const navegar = useNavigate();
  const inputArchivoRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [entrevistaGuardada, setEntrevistaGuardada] = useState<EntrevistaInicial | null>(null);
  const [form, setForm] = useState<Formulario>(ESTADO_INICIAL);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [archivoGuardado, setArchivoGuardado] = useState<ArchivoGuardado | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avisoArchivo, setAvisoArchivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);

  const claveArchivo = `entrevista-firmada:${id}`;

  const cargar = useCallback(() => {
    if (!Number.isFinite(id)) {
      setError('ID de ficha inválido.');
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    Promise.all([
      fichaService.obtenerPorId(id),
      entrevistaService.obtenerPorFicha(id),
      archivosLocalStore.obtener(claveArchivo),
    ])
      .then(([f, e, archivo]) => {
        setFicha(f);
        if (e) {
          setEntrevistaGuardada(e);
          setForm(entrevistaAFormulario(e));
          setMostrarFormulario(true);
        }
        setArchivoGuardado(archivo);
      })
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la información del estudiante.')))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(id)) return;
    if (!form.motivoConsultaDetallado.trim()) {
      setError('El motivo de consulta detallado es obligatorio.');
      return;
    }
    if (!form.fechaEntrevista) {
      setError('La fecha de entrevista es obligatoria.');
      return;
    }

    setEnviando(true);
    setError(null);

    const norm = (s: string): string | undefined => (s.trim() ? s.trim() : undefined);
    const datos: EntrevistaInicialRequestBackend = {
      fechaNacimiento: norm(form.fechaNacimiento),
      lugarNacimiento: norm(form.lugarNacimiento),
      estadoCivil: norm(form.estadoCivil),
      ocupacion: norm(form.ocupacion),
      nivelInstruccion: norm(form.nivelInstruccion),
      motivoConsultaDetallado: form.motivoConsultaDetallado.trim(),
      inicioproblema: norm(form.inicioproblema),
      factoresPrecipitantes: norm(form.factoresPrecipitantes),
      intentosSolucion: norm(form.intentosSolucion),
      historiaPersonal: norm(form.historiaPersonal),
      historiaFamiliar: norm(form.historiaFamiliar),
      relacionesInterpersonales: norm(form.relacionesInterpersonales),
      aparienciaGeneral: norm(form.aparienciaGeneral),
      estadoAfectivo: norm(form.estadoAfectivo),
      pensamiento: norm(form.pensamiento),
      percepcion: norm(form.percepcion),
      memoriaAtencion: norm(form.memoriaAtencion),
      juicioCritico: norm(form.juicioCritico),
      riesgoDetectado: form.riesgoDetectado,
      observacionesRiesgo: norm(form.observacionesRiesgo),
      impresionDiagnostica: norm(form.impresionDiagnostica),
      recomendaciones: norm(form.recomendaciones),
      fechaEntrevista: form.fechaEntrevista,
    };

    try {
      const guardada = await entrevistaService.registrar(id, datos);
      setEntrevistaGuardada(guardada);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la entrevista.'));
    } finally {
      setEnviando(false);
    }
  }

  function imprimir() {
    window.print();
  }

  async function subirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setAvisoArchivo('El archivo supera los 15 MB. Comprímelo o escanea en menor resolución.');
      return;
    }

    setSubiendoArchivo(true);
    setAvisoArchivo(null);
    try {
      await archivosLocalStore.guardar(claveArchivo, file);
      const guardado = await archivosLocalStore.obtener(claveArchivo);
      setArchivoGuardado(guardado);
      setAvisoArchivo('Documento firmado guardado correctamente en este dispositivo.');
    } catch {
      setAvisoArchivo('No se pudo guardar el archivo. Intenta de nuevo.');
    } finally {
      setSubiendoArchivo(false);
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    }
  }

  async function eliminarArchivo() {
    await archivosLocalStore.eliminar(claveArchivo);
    setArchivoGuardado(null);
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando…</p>;

  if (!ficha) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Ficha no encontrada.'}
        </p>
        <Link to="/pacientes" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          ← Volver a Pacientes
        </Link>
      </div>
    );
  }

  const edad = calcularEdad(form.fechaNacimiento);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between print:hidden">
        <Link to={`/pacientes/${id}`} className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a la ficha
        </Link>
        {entrevistaGuardada && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Entrevista registrada
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-6 print:mt-0 print:block lg:grid-cols-[320px_1fr]">
        <div className="space-y-4 print:hidden">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Datos del estudiante
            </h2>
            <p className="mt-2 text-lg font-semibold text-slate-800">{ficha.nombreEstudiante}</p>
            <p className="text-sm text-slate-500">{ficha.correoEstudiante}</p>

            <dl className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm">
              <DatoEstudiante etiqueta="Cédula" valor={null} />
              <DatoEstudiante
                etiqueta="Fecha de nacimiento"
                valor={form.fechaNacimiento || null}
                formato={(v) =>
                  new Date(v).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })
                }
              />
              <DatoEstudiante etiqueta="Edad" valor={edad !== null ? `${edad} años` : null} />
              <DatoEstudiante etiqueta="Carrera" valor={null} />
              <DatoEstudiante etiqueta="Servicio" valor={NOMBRE_TIPO_PSICOLOGIA[ficha.tipo]} />
            </dl>

            <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-800">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              Cédula y carrera no están disponibles todavía para el rol Especialista en el
              backend (solo Admin/Coordinador pueden consultarlas). La fecha de nacimiento y
              la edad se completan al llenar el formulario.
            </p>
          </div>

          {!mostrarFormulario && (
            <button
              onClick={() => setMostrarFormulario(true)}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm"
            >
              <FileText className="h-4 w-4" />
              Abrir formulario de entrevista inicial
            </button>
          )}

          {entrevistaGuardada && (
            <button
              onClick={imprimir}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Imprimir formulario
            </button>
          )}

          {entrevistaGuardada && (
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Paperclip className="h-3.5 w-3.5" />
                Documento firmado
              </h2>

              {!archivoGuardado ? (
                <>
                  <p className="mt-2 text-xs text-slate-500">
                    Sube la foto o escaneo del formulario impreso y firmado por el estudiante.
                  </p>
                  <input
                    ref={inputArchivoRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={subirArchivo}
                    className="hidden"
                    id="input-archivo-firmado"
                  />
                  <label
                    htmlFor="input-archivo-firmado"
                    className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm text-slate-600 hover:border-brand-400 hover:bg-brand-50"
                  >
                    <Upload className="h-4 w-4" />
                    {subiendoArchivo ? 'Guardando…' : 'Cargar archivo firmado'}
                  </label>
                </>
              ) : (
                <div className="mt-2 space-y-2">
                  <p className="truncate text-sm font-medium text-slate-700">{archivoGuardado.nombreOriginal}</p>
                  <p className="text-xs text-slate-400">
                    {(archivoGuardado.tamanoBytes / 1024).toFixed(0)} KB · guardado{' '}
                    {new Date(archivoGuardado.fechaGuardado).toLocaleString('es-EC')}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={archivosLocalStore.crearUrl(archivoGuardado.blob)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-lg border border-slate-200 py-1.5 text-center text-xs font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Ver archivo
                    </a>
                    <button
                      onClick={eliminarArchivo}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Quitar
                    </button>
                  </div>
                </div>
              )}

              {avisoArchivo && <p className="mt-2 text-xs text-slate-500">{avisoArchivo}</p>}

              <p className="mt-3 text-[11px] leading-snug text-slate-400">
                Este archivo se guarda solo en este dispositivo/navegador (IndexedDB) — el
                backend todavía no tiene un endpoint de subida de archivos. 
              </p>
            </div>
          )}
        </div>

        {mostrarFormulario && (
          <div>
            <div className="hidden print:block print:mb-6">
              <p className="text-center text-xs font-semibold uppercase tracking-wide">
                Universidad Central del Ecuador — Oficina de Bienestar Universitario
              </p>
              <h1 className="text-center text-lg font-bold">Ficha de Entrevista Inicial</h1>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <p><strong>Estudiante:</strong> {ficha.nombreEstudiante}</p>
                <p><strong>Correo:</strong> {ficha.correoEstudiante}</p>
                <p><strong>Servicio:</strong> {NOMBRE_TIPO_PSICOLOGIA[ficha.tipo]}</p>
                <p><strong>Fecha de entrevista:</strong> {form.fechaEntrevista}</p>
                {form.fechaNacimiento && <p><strong>Fecha de nacimiento:</strong> {form.fechaNacimiento}</p>}
                {edad !== null && <p><strong>Edad:</strong> {edad} años</p>}
              </div>
            </div>

            <form onSubmit={enviar} className="space-y-6 print:space-y-4">
              <Seccion titulo="Datos personales">
                <Campo etiqueta="Fecha de nacimiento">
                  <input type="date" value={form.fechaNacimiento} onChange={(e) => actualizar('fechaNacimiento', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Lugar de nacimiento">
                  <input type="text" value={form.lugarNacimiento} onChange={(e) => actualizar('lugarNacimiento', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Estado civil">
                  <input type="text" value={form.estadoCivil} onChange={(e) => actualizar('estadoCivil', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Ocupación">
                  <input type="text" value={form.ocupacion} onChange={(e) => actualizar('ocupacion', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Nivel de instrucción" ancho="md:col-span-2">
                  <input type="text" value={form.nivelInstruccion} onChange={(e) => actualizar('nivelInstruccion', e.target.value)} className={inputCls} />
                </Campo>
              </Seccion>

              <Seccion titulo="Motivo de consulta">
                <Campo etiqueta="Motivo de consulta detallado" obligatorio ancho="md:col-span-2">
                  <textarea rows={3} value={form.motivoConsultaDetallado} onChange={(e) => actualizar('motivoConsultaDetallado', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Inicio del problema">
                  <input type="text" value={form.inicioproblema} onChange={(e) => actualizar('inicioproblema', e.target.value)} placeholder="Ej. hace 6 meses" className={inputCls} />
                </Campo>
                <Campo etiqueta="Factores precipitantes">
                  <input type="text" value={form.factoresPrecipitantes} onChange={(e) => actualizar('factoresPrecipitantes', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Intentos de solución previos" ancho="md:col-span-2">
                  <textarea rows={2} value={form.intentosSolucion} onChange={(e) => actualizar('intentosSolucion', e.target.value)} className={inputCls} />
                </Campo>
              </Seccion>

              <Seccion titulo="Historia">
                <Campo etiqueta="Historia personal" ancho="md:col-span-2">
                  <textarea rows={3} value={form.historiaPersonal} onChange={(e) => actualizar('historiaPersonal', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Historia familiar" ancho="md:col-span-2">
                  <textarea rows={3} value={form.historiaFamiliar} onChange={(e) => actualizar('historiaFamiliar', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Relaciones interpersonales" ancho="md:col-span-2">
                  <textarea rows={2} value={form.relacionesInterpersonales} onChange={(e) => actualizar('relacionesInterpersonales', e.target.value)} className={inputCls} />
                </Campo>
              </Seccion>

              <Seccion titulo="Examen del estado mental">
                <Campo etiqueta="Apariencia general">
                  <textarea rows={2} value={form.aparienciaGeneral} onChange={(e) => actualizar('aparienciaGeneral', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Estado afectivo">
                  <textarea rows={2} value={form.estadoAfectivo} onChange={(e) => actualizar('estadoAfectivo', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Pensamiento">
                  <textarea rows={2} value={form.pensamiento} onChange={(e) => actualizar('pensamiento', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Percepción">
                  <textarea rows={2} value={form.percepcion} onChange={(e) => actualizar('percepcion', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Memoria y atención">
                  <textarea rows={2} value={form.memoriaAtencion} onChange={(e) => actualizar('memoriaAtencion', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Juicio crítico">
                  <textarea rows={2} value={form.juicioCritico} onChange={(e) => actualizar('juicioCritico', e.target.value)} className={inputCls} />
                </Campo>
              </Seccion>

              <Seccion titulo="Evaluación de riesgo">
                <Campo etiqueta="Nivel de riesgo detectado" obligatorio ancho="md:col-span-2">
                  <div className="grid gap-2 sm:grid-cols-3 print:grid-cols-3">
                    {(['SIN_IDEACION', 'IDEACION_PASIVA', 'IDEACION_ACTIVA'] as NivelRiesgo[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => actualizar('riesgoDetectado', r)}
                        className={`rounded-lg border px-4 py-3 text-sm transition print:border-slate-400 ${
                          form.riesgoDetectado === r
                            ? 'border-brand-500 bg-brand-50 text-brand-800 print:bg-slate-100 print:font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {NOMBRE_NIVEL_RIESGO[r]}
                      </button>
                    ))}
                  </div>
                </Campo>
                <Campo etiqueta="Observaciones del riesgo" ancho="md:col-span-2">
                  <textarea rows={3} value={form.observacionesRiesgo} onChange={(e) => actualizar('observacionesRiesgo', e.target.value)} placeholder="Detalla la valoración clínica que sustenta el nivel de riesgo seleccionado." className={inputCls} />
                </Campo>
              </Seccion>

              <Seccion titulo="Diagnóstico y plan">
                <Campo etiqueta="Impresión diagnóstica" ancho="md:col-span-2">
                  <textarea rows={3} value={form.impresionDiagnostica} onChange={(e) => actualizar('impresionDiagnostica', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Recomendaciones" ancho="md:col-span-2">
                  <textarea rows={3} value={form.recomendaciones} onChange={(e) => actualizar('recomendaciones', e.target.value)} className={inputCls} />
                </Campo>
                <Campo etiqueta="Fecha de entrevista" obligatorio>
                  <input type="date" value={form.fechaEntrevista} onChange={(e) => actualizar('fechaEntrevista', e.target.value)} className={inputCls} />
                </Campo>
              </Seccion>

              <div className="hidden print:block print:mt-10">
                <div className="grid grid-cols-2 gap-10 text-center text-sm">
                  <div>
                    <div className="mt-12 border-t border-slate-500 pt-1">Firma del estudiante</div>
                  </div>
                  <div>
                    <div className="mt-12 border-t border-slate-500 pt-1">Firma del especialista</div>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">{error}</p>
              )}

              <div className="flex justify-end gap-3 print:hidden">
                <button
                  type="button"
                  onClick={() => navegar(`/pacientes/${id}`)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Volver a la ficha
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
                >
                  {enviando ? 'Guardando…' : entrevistaGuardada ? 'Guardar cambios' : 'Guardar entrevista'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 print:border-none print:px-0 print:py-0.5';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 print:break-inside-avoid print:rounded-none print:border-0 print:border-b print:border-slate-300 print:p-0 print:py-3">
      <h2 className="text-base font-semibold text-slate-800 print:text-sm">{titulo}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 print:mt-2 print:gap-2">{children}</div>
    </section>
  );
}

function Campo({
  etiqueta,
  obligatorio,
  ancho,
  children,
}: {
  etiqueta: string;
  obligatorio?: boolean;
  ancho?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${ancho ?? ''}`}>
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500 print:text-[10px]">
        {etiqueta}
        {obligatorio && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="mt-1.5 print:mt-0.5">{children}</div>
    </label>
  );
}

function DatoEstudiante({
  etiqueta,
  valor,
  formato,
}: {
  etiqueta: string;
  valor: string | null;
  formato?: (v: string) => string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-slate-400">{etiqueta}</dt>
      <dd className={`text-right text-sm font-medium ${valor ? 'text-slate-700' : 'text-slate-300 italic'}`}>
        {valor ? (formato ? formato(valor) : valor) : 'No disponible'}
      </dd>
    </div>
  );
}
