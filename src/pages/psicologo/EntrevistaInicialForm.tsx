import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  entrevistaService,
  type EntrevistaInicialRequestBackend,
  type NivelRiesgo,
  NOMBRE_NIVEL_RIESGO,
} from '../../api/entrevistaService';
import { extraerMensajeError } from '../../api/client';

interface Formulario {
  // Datos personales
  fechaNacimiento: string;
  lugarNacimiento: string;
  estadoCivil: string;
  ocupacion: string;
  nivelInstruccion: string;
  // Motivo de consulta
  motivoConsultaDetallado: string;
  inicioproblema: string;
  factoresPrecipitantes: string;
  intentosSolucion: string;
  // Historia
  historiaPersonal: string;
  historiaFamiliar: string;
  relacionesInterpersonales: string;
  // Estado mental
  aparienciaGeneral: string;
  estadoAfectivo: string;
  pensamiento: string;
  percepcion: string;
  memoriaAtencion: string;
  juicioCritico: string;
  // Riesgo
  riesgoDetectado: NivelRiesgo;
  observacionesRiesgo: string;
  // Diagnóstico
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

export function EntrevistaInicialForm() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;
  const navegar = useNavigate();

  const [form, setForm] = useState<Formulario>(ESTADO_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(id)) {
      setError('ID de ficha inválido.');
      return;
    }
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

    // Convertimos cadenas vacías en undefined para no enviarlas al backend.
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
      await entrevistaService.registrar(id, datos);
      navegar(`/pacientes/${id}`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la entrevista.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Entrevista inicial</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registra la entrevista inicial y la evaluación psicológica del estudiante. Los
          campos marcados son obligatorios; el resto puede completarse según la
          información disponible.
        </p>
      </header>

      {/* Datos personales */}
      <Seccion titulo="Datos personales">
        <Campo etiqueta="Fecha de nacimiento">
          <input
            type="date"
            value={form.fechaNacimiento}
            onChange={(e) => actualizar('fechaNacimiento', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Lugar de nacimiento">
          <input
            type="text"
            value={form.lugarNacimiento}
            onChange={(e) => actualizar('lugarNacimiento', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Estado civil">
          <input
            type="text"
            value={form.estadoCivil}
            onChange={(e) => actualizar('estadoCivil', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Ocupación">
          <input
            type="text"
            value={form.ocupacion}
            onChange={(e) => actualizar('ocupacion', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Nivel de instrucción" ancho="md:col-span-2">
          <input
            type="text"
            value={form.nivelInstruccion}
            onChange={(e) => actualizar('nivelInstruccion', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {/* Motivo de consulta */}
      <Seccion titulo="Motivo de consulta">
        <Campo etiqueta="Motivo de consulta detallado" obligatorio ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.motivoConsultaDetallado}
            onChange={(e) => actualizar('motivoConsultaDetallado', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Inicio del problema">
          <input
            type="text"
            value={form.inicioproblema}
            onChange={(e) => actualizar('inicioproblema', e.target.value)}
            placeholder="Ej. hace 6 meses"
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Factores precipitantes">
          <input
            type="text"
            value={form.factoresPrecipitantes}
            onChange={(e) => actualizar('factoresPrecipitantes', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Intentos de solución previos" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.intentosSolucion}
            onChange={(e) => actualizar('intentosSolucion', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {/* Historia */}
      <Seccion titulo="Historia">
        <Campo etiqueta="Historia personal" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.historiaPersonal}
            onChange={(e) => actualizar('historiaPersonal', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Historia familiar" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.historiaFamiliar}
            onChange={(e) => actualizar('historiaFamiliar', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Relaciones interpersonales" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.relacionesInterpersonales}
            onChange={(e) => actualizar('relacionesInterpersonales', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {/* Estado mental */}
      <Seccion titulo="Examen del estado mental">
        <Campo etiqueta="Apariencia general">
          <textarea
            rows={2}
            value={form.aparienciaGeneral}
            onChange={(e) => actualizar('aparienciaGeneral', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Estado afectivo">
          <textarea
            rows={2}
            value={form.estadoAfectivo}
            onChange={(e) => actualizar('estadoAfectivo', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Pensamiento">
          <textarea
            rows={2}
            value={form.pensamiento}
            onChange={(e) => actualizar('pensamiento', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Percepción">
          <textarea
            rows={2}
            value={form.percepcion}
            onChange={(e) => actualizar('percepcion', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Memoria y atención">
          <textarea
            rows={2}
            value={form.memoriaAtencion}
            onChange={(e) => actualizar('memoriaAtencion', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Juicio crítico">
          <textarea
            rows={2}
            value={form.juicioCritico}
            onChange={(e) => actualizar('juicioCritico', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {/* Riesgo */}
      <Seccion titulo="Evaluación de riesgo">
        <Campo etiqueta="Nivel de riesgo detectado" obligatorio ancho="md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-3">
            {(['SIN_IDEACION', 'IDEACION_PASIVA', 'IDEACION_ACTIVA'] as NivelRiesgo[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => actualizar('riesgoDetectado', r)}
                className={`rounded-lg border px-4 py-3 text-sm transition ${
                  form.riesgoDetectado === r
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {NOMBRE_NIVEL_RIESGO[r]}
              </button>
            ))}
          </div>
        </Campo>
        <Campo etiqueta="Observaciones del riesgo" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.observacionesRiesgo}
            onChange={(e) => actualizar('observacionesRiesgo', e.target.value)}
            placeholder="Detalla la valoración clínica que sustenta el nivel de riesgo seleccionado."
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {/* Diagnóstico */}
      <Seccion titulo="Diagnóstico y plan">
        <Campo etiqueta="Impresión diagnóstica" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.impresionDiagnostica}
            onChange={(e) => actualizar('impresionDiagnostica', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Recomendaciones" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.recomendaciones}
            onChange={(e) => actualizar('recomendaciones', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Fecha de entrevista" obligatorio>
          <input
            type="date"
            value={form.fechaEntrevista}
            onChange={(e) => actualizar('fechaEntrevista', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navegar(`/pacientes/${id}`)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {enviando ? 'Guardando…' : 'Guardar entrevista'}
        </button>
      </div>
    </form>
  );
}

// ─── Helpers visuales ────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
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
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
        {etiqueta}
        {obligatorio && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
