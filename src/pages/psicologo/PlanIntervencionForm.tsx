import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  planIntervencionService,
  type PlanIntervencionRequestBackend,
} from '../../api/planIntervencionService';
import { extraerMensajeError } from '../../api/client';

interface Formulario {
  diagnosticoTrabajo: string;
  enfoqueTerapeutico: string;
  objetivosGenerales: string;
  objetivosEspecificos: string;
  numSesionesEstimadas: string; // texto para permitir vaciado
  frecuenciaSesiones: string;
  tecnicasEstrategias: string;
  observaciones: string;
}

const ESTADO_INICIAL: Formulario = {
  diagnosticoTrabajo: '',
  enfoqueTerapeutico: '',
  objetivosGenerales: '',
  objetivosEspecificos: '',
  numSesionesEstimadas: '8',
  frecuenciaSesiones: 'Semanal',
  tecnicasEstrategias: '',
  observaciones: '',
};

export function PlanIntervencionForm() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;
  const navegar = useNavigate();

  // ¿Existe ya un plan (según la bandera local)?
  const resumenPrevio = Number.isFinite(id) ? planIntervencionService.resumenLocal(id) : null;
  const modoEdicion = resumenPrevio !== null;

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
    if (!form.enfoqueTerapeutico.trim()) {
      setError('El enfoque terapéutico es obligatorio.');
      return;
    }
    if (!form.objetivosGenerales.trim()) {
      setError('Los objetivos generales son obligatorios.');
      return;
    }
    const num = Number(form.numSesionesEstimadas);
    if (!Number.isFinite(num) || num < 1) {
      setError('El número de sesiones estimadas debe ser al menos 1.');
      return;
    }

    const norm = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);
    const datos: PlanIntervencionRequestBackend = {
      diagnosticoTrabajo: norm(form.diagnosticoTrabajo),
      enfoqueTerapeutico: form.enfoqueTerapeutico.trim(),
      objetivosGenerales: form.objetivosGenerales.trim(),
      objetivosEspecificos: norm(form.objetivosEspecificos),
      numSesionesEstimadas: num,
      frecuenciaSesiones: norm(form.frecuenciaSesiones),
      tecnicasEstrategias: norm(form.tecnicasEstrategias),
      observaciones: norm(form.observaciones),
    };

    setEnviando(true);
    setError(null);
    try {
      if (modoEdicion) {
        await planIntervencionService.actualizar(id, datos);
      } else {
        await planIntervencionService.crear(id, datos);
      }
      navegar(`/pacientes/${id}`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo guardar el plan.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">
          {modoEdicion ? 'Editar plan de intervención' : 'Nuevo plan de intervención'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Define el enfoque, los objetivos y la frecuencia de sesiones previstas para el
          proceso terapéutico.
        </p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>⚠️ Aviso:</strong> el backend aún no expone un endpoint para consultar
        el plan existente. {modoEdicion
          ? 'Estás editando un plan cuyo contenido no se puede precargar; los cambios se enviarán como PUT y sobrescribirán al anterior.'
          : 'Al guardar, se creará el plan con POST. Una vez creado, no podrás verlo desde el sistema hasta que el backend agregue el GET; por ahora se conserva un resumen local.'}
      </div>

      <Seccion titulo="Enfoque y diagnóstico">
        <Campo etiqueta="Diagnóstico de trabajo" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.diagnosticoTrabajo}
            onChange={(e) => actualizar('diagnosticoTrabajo', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Enfoque terapéutico" obligatorio ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.enfoqueTerapeutico}
            onChange={(e) => actualizar('enfoqueTerapeutico', e.target.value)}
            placeholder="Ej. Cognitivo-conductual, sistémico, humanista…"
            className={inputCls}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Objetivos del proceso">
        <Campo etiqueta="Objetivos generales" obligatorio ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.objetivosGenerales}
            onChange={(e) => actualizar('objetivosGenerales', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Objetivos específicos" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.objetivosEspecificos}
            onChange={(e) => actualizar('objetivosEspecificos', e.target.value)}
            placeholder="Uno por línea, si aplica."
            className={inputCls}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Sesiones previstas">
        <Campo etiqueta="Número de sesiones estimadas" obligatorio>
          <input
            type="number"
            min={1}
            value={form.numSesionesEstimadas}
            onChange={(e) => actualizar('numSesionesEstimadas', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Frecuencia de sesiones">
          <input
            type="text"
            value={form.frecuenciaSesiones}
            onChange={(e) => actualizar('frecuenciaSesiones', e.target.value)}
            placeholder="Ej. Semanal, quincenal…"
            className={inputCls}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Técnicas y observaciones">
        <Campo etiqueta="Técnicas y estrategias" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.tecnicasEstrategias}
            onChange={(e) => actualizar('tecnicasEstrategias', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Observaciones" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.observaciones}
            onChange={(e) => actualizar('observaciones', e.target.value)}
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
          {enviando ? 'Guardando…' : modoEdicion ? 'Guardar cambios' : 'Crear plan'}
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
