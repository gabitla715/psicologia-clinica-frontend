import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fichaService,
  type TipoPsicologia,
  NOMBRE_TIPO_PSICOLOGIA,
  type CrearFichaRequestBackend,
} from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';

interface FormularioFicha {
  estudianteId: string; // se recibe como texto y se valida que sea numérico
  tipo: TipoPsicologia;
  motivoConsulta: string;
  tiempoProblema: string;
  antecedentesPsicologicos: string;
  historiaPersonal: string;
  historiaFamiliar: string;
  diagnosticoTrabajo: string;
  pensamientosAutolesion: string;
}

const ESTADO_INICIAL: FormularioFicha = {
  estudianteId: '',
  tipo: 'CLINICA',
  motivoConsulta: '',
  tiempoProblema: '',
  antecedentesPsicologicos: '',
  historiaPersonal: '',
  historiaFamiliar: '',
  diagnosticoTrabajo: '',
  pensamientosAutolesion: '',
};

const PASOS = [
  { numero: 1, titulo: 'Identificación', descripcion: 'Estudiante y servicio' },
  { numero: 2, titulo: 'Motivo', descripcion: 'Razón y antigüedad' },
  { numero: 3, titulo: 'Historia clínica', descripcion: 'Antecedentes' },
  { numero: 4, titulo: 'Evaluación inicial', descripcion: 'Diagnóstico de trabajo' },
  { numero: 5, titulo: 'Revisión', descripcion: 'Confirmar y crear' },
] as const;

export function NuevaFicha() {
  const navegar = useNavigate();
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState<FormularioFicha>(ESTADO_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar<K extends keyof FormularioFicha>(campo: K, valor: FormularioFicha[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validarPasoActual(): string | null {
    if (paso === 1) {
      if (!form.estudianteId.trim()) return 'El ID del estudiante es obligatorio.';
      if (!/^\d+$/.test(form.estudianteId.trim())) {
        return 'El ID del estudiante debe ser un número.';
      }
    }
    if (paso === 2) {
      if (!form.motivoConsulta.trim()) return 'El motivo de consulta es obligatorio.';
    }
    return null;
  }

  function siguiente() {
    const errorValidacion = validarPasoActual();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setError(null);
    setPaso((p) => Math.min(p + 1, PASOS.length));
  }

  function anterior() {
    setError(null);
    setPaso((p) => Math.max(p - 1, 1));
  }

  async function enviar() {
    const errorValidacion = validarPasoActual();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const datos: CrearFichaRequestBackend = {
        motivoConsulta: form.motivoConsulta.trim() || undefined,
        tiempoProblema: form.tiempoProblema.trim() || undefined,
        antecedentesPsicologicos: form.antecedentesPsicologicos.trim() || undefined,
        historiaPersonal: form.historiaPersonal.trim() || undefined,
        historiaFamiliar: form.historiaFamiliar.trim() || undefined,
        diagnosticoTrabajo: form.diagnosticoTrabajo.trim() || undefined,
        pensamientosAutolesion: form.pensamientosAutolesion.trim() || undefined,
      };
      const ficha = await fichaService.crear({
        estudianteId: Number(form.estudianteId),
        tipo: form.tipo,
        datos,
      });
      navegar(`/pacientes/${ficha.id}`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo crear la ficha.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-800">Abrir nueva ficha clínica</h1>
      <p className="mt-1 text-sm text-slate-500">
        Completa los datos en cinco pasos. Solo los campos marcados son obligatorios; el
        resto puede registrarse posteriormente en la entrevista inicial.
      </p>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2">
        {PASOS.map((p, idx) => {
          const activo = paso === p.numero;
          const completado = paso > p.numero;
          return (
            <li key={p.numero} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    activo
                      ? 'bg-brand-700 text-white'
                      : completado
                      ? 'bg-brand-100 text-brand-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {completado ? '✓' : p.numero}
                </div>
                <p className="mt-1 hidden text-center text-xs font-medium text-slate-600 sm:block">
                  {p.titulo}
                </p>
              </div>
              {idx < PASOS.length - 1 && (
                <div className="mx-2 h-px flex-1 bg-slate-200" />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        {paso === 1 && (
          <Paso1 form={form} actualizar={actualizar} />
        )}
        {paso === 2 && (
          <Paso2 form={form} actualizar={actualizar} />
        )}
        {paso === 3 && (
          <Paso3 form={form} actualizar={actualizar} />
        )}
        {paso === 4 && (
          <Paso4 form={form} actualizar={actualizar} />
        )}
        {paso === 5 && (
          <Paso5 form={form} />
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            onClick={anterior}
            disabled={paso === 1 || enviando}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          {paso < PASOS.length ? (
            <button
              onClick={siguiente}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={enviar}
              disabled={enviando}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
            >
              {enviando ? 'Creando…' : 'Crear ficha clínica'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponentes por paso ──────────────────────────────────────
interface PasoProps {
  form: FormularioFicha;
  actualizar: <K extends keyof FormularioFicha>(campo: K, valor: FormularioFicha[K]) => void;
}

function Paso1({ form, actualizar }: PasoProps) {
  return (
    <div className="space-y-4">
      <Encabezado titulo="Identificación del caso" />

      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Nota:</strong> el ID del estudiante lo asigna el coordinador del Área de
        Bienestar Estudiantil al momento de la derivación. Si no lo tienes a mano,
        consúltalo antes de continuar.
      </div>

      <Campo etiqueta="ID del estudiante" obligatorio>
        <input
          type="text"
          inputMode="numeric"
          value={form.estudianteId}
          onChange={(e) => actualizar('estudianteId', e.target.value)}
          placeholder="Ej. 42"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>

      <Campo etiqueta="Tipo de servicio" obligatorio>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['CLINICA', 'GENERAL'] as TipoPsicologia[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => actualizar('tipo', t)}
              className={`rounded-lg border px-4 py-3 text-sm transition ${
                form.tipo === t
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {NOMBRE_TIPO_PSICOLOGIA[t]}
            </button>
          ))}
        </div>
      </Campo>
    </div>
  );
}

function Paso2({ form, actualizar }: PasoProps) {
  return (
    <div className="space-y-4">
      <Encabezado titulo="Motivo de consulta" />
      <Campo etiqueta="Motivo de consulta" obligatorio>
        <textarea
          rows={3}
          value={form.motivoConsulta}
          onChange={(e) => actualizar('motivoConsulta', e.target.value)}
          placeholder="Breve descripción del motivo por el que el estudiante busca atención."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
      <Campo etiqueta="Tiempo del problema">
        <input
          type="text"
          value={form.tiempoProblema}
          onChange={(e) => actualizar('tiempoProblema', e.target.value)}
          placeholder="Ej. 3 meses, desde inicio de semestre…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
    </div>
  );
}

function Paso3({ form, actualizar }: PasoProps) {
  return (
    <div className="space-y-4">
      <Encabezado titulo="Historia clínica" />
      <Campo etiqueta="Antecedentes psicológicos">
        <textarea
          rows={3}
          value={form.antecedentesPsicologicos}
          onChange={(e) => actualizar('antecedentesPsicologicos', e.target.value)}
          placeholder="Atenciones previas, diagnósticos, tratamientos."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
      <Campo etiqueta="Historia personal">
        <textarea
          rows={3}
          value={form.historiaPersonal}
          onChange={(e) => actualizar('historiaPersonal', e.target.value)}
          placeholder="Eventos significativos, desarrollo, contexto personal."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
      <Campo etiqueta="Historia familiar">
        <textarea
          rows={3}
          value={form.historiaFamiliar}
          onChange={(e) => actualizar('historiaFamiliar', e.target.value)}
          placeholder="Composición familiar, dinámica, antecedentes familiares."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
    </div>
  );
}

function Paso4({ form, actualizar }: PasoProps) {
  return (
    <div className="space-y-4">
      <Encabezado titulo="Evaluación inicial" />
      <Campo etiqueta="Diagnóstico de trabajo">
        <textarea
          rows={3}
          value={form.diagnosticoTrabajo}
          onChange={(e) => actualizar('diagnosticoTrabajo', e.target.value)}
          placeholder="Impresión clínica preliminar al momento de abrir la ficha."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
      <Campo etiqueta="Pensamientos de autolesión">
        <textarea
          rows={2}
          value={form.pensamientosAutolesion}
          onChange={(e) => actualizar('pensamientosAutolesion', e.target.value)}
          placeholder="Si el estudiante reporta o se identifica algún indicador, regístralo aquí."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </Campo>
      <p className="text-xs text-slate-500">
        Una valoración estructurada del riesgo de autolesión se realiza en la entrevista
        inicial posterior a la apertura de la ficha.
      </p>
    </div>
  );
}

function Paso5({ form }: { form: FormularioFicha }) {
  return (
    <div className="space-y-4">
      <Encabezado titulo="Revisión final" />
      <p className="text-sm text-slate-500">
        Confirma la información antes de crear la ficha. Después podrás registrar la
        entrevista inicial completa y el consentimiento informado.
      </p>
      <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm">
        <Linea termino="ID del estudiante" descripcion={form.estudianteId || '—'} />
        <Linea termino="Tipo de servicio" descripcion={NOMBRE_TIPO_PSICOLOGIA[form.tipo]} />
        <Linea termino="Motivo de consulta" descripcion={form.motivoConsulta || '—'} />
        <Linea termino="Tiempo del problema" descripcion={form.tiempoProblema || '—'} />
        <Linea termino="Diagnóstico de trabajo" descripcion={form.diagnosticoTrabajo || '—'} />
      </dl>
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────
function Encabezado({ titulo }: { titulo: string }) {
  return <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>;
}

function Campo({
  etiqueta,
  obligatorio,
  children,
}: {
  etiqueta: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
        {etiqueta}
        {obligatorio && <span className="ml-1 text-red-500">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Linea({ termino, descripcion }: { termino: string; descripcion: string }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <dt className="col-span-1 text-xs uppercase tracking-wide text-slate-500">{termino}</dt>
      <dd className="col-span-2 text-slate-800">{descripcion}</dd>
    </div>
  );
}
