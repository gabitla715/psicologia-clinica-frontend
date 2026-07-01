import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  derivacionService,
  type DerivacionRequestBackend,
  AREAS_DESTINO_SUGERIDAS,
} from '../../api/derivacionService';
import { extraerMensajeError } from '../../api/client';

interface Formulario {
  areaDestino: string;
  areaDestinoCustom: string;
  profesionalDestino: string;
  motivoDerivacion: string;
  evaluacionesRealizadas: string;
  observacionesAdicionales: string;
}

const OTRA = '__otra__';

const ESTADO_INICIAL: Formulario = {
  areaDestino: '',
  areaDestinoCustom: '',
  profesionalDestino: '',
  motivoDerivacion: '',
  evaluacionesRealizadas: '',
  observacionesAdicionales: '',
};

export function DerivacionForm() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;
  const navegar = useNavigate();

  const [form, setForm] = useState<Formulario>(ESTADO_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function areaDestinoFinal(): string {
    if (form.areaDestino === OTRA) return form.areaDestinoCustom.trim();
    return form.areaDestino;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!Number.isFinite(id)) {
      setError('ID de ficha inválido.');
      return;
    }
    const destino = areaDestinoFinal();
    if (!destino) {
      setError('El área de destino es obligatoria.');
      return;
    }
    if (!form.motivoDerivacion.trim()) {
      setError('El motivo de derivación es obligatorio.');
      return;
    }

    const norm = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);
    const datos: DerivacionRequestBackend = {
      areaDestino: destino,
      profesionalDestino: norm(form.profesionalDestino),
      motivoDerivacion: form.motivoDerivacion.trim(),
      evaluacionesRealizadas: norm(form.evaluacionesRealizadas),
      observacionesAdicionales: norm(form.observacionesAdicionales),
    };

    setEnviando(true);
    setError(null);
    try {
      await derivacionService.registrar(id, datos);
      navegar(`/pacientes/${id}`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la derivación.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Registrar derivación</h1>
        <p className="mt-1 text-sm text-slate-500">
          Documenta el traslado del caso a otra instancia profesional. Al guardar, la
          ficha se cerrará con estado <strong>Derivada</strong>.
        </p>
      </header>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Esta acción es irreversible desde la interfaz. Verifica los datos antes de
        confirmar.
      </div>

      <Seccion titulo="Destino de la derivación">
        <Campo etiqueta="Área de destino" obligatorio ancho="md:col-span-2">
          <select
            value={form.areaDestino}
            onChange={(e) => actualizar('areaDestino', e.target.value)}
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {AREAS_DESTINO_SUGERIDAS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
            <option value={OTRA}>Otra (especificar)…</option>
          </select>
        </Campo>
        {form.areaDestino === OTRA && (
          <Campo etiqueta="Nombre del área" obligatorio ancho="md:col-span-2">
            <input
              type="text"
              value={form.areaDestinoCustom}
              onChange={(e) => actualizar('areaDestinoCustom', e.target.value)}
              className={inputCls}
            />
          </Campo>
        )}
        <Campo etiqueta="Profesional destino (si se conoce)" ancho="md:col-span-2">
          <input
            type="text"
            value={form.profesionalDestino}
            onChange={(e) => actualizar('profesionalDestino', e.target.value)}
            placeholder="Ej. Dr. Juan Pérez, psiquiatra."
            className={inputCls}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Motivo y evaluación">
        <Campo etiqueta="Motivo de la derivación" obligatorio ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.motivoDerivacion}
            onChange={(e) => actualizar('motivoDerivacion', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Evaluaciones realizadas" ancho="md:col-span-2">
          <textarea
            rows={3}
            value={form.evaluacionesRealizadas}
            onChange={(e) => actualizar('evaluacionesRealizadas', e.target.value)}
            placeholder="Instrumentos aplicados, pruebas, exámenes."
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Observaciones adicionales" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.observacionesAdicionales}
            onChange={(e) => actualizar('observacionesAdicionales', e.target.value)}
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
          {enviando ? 'Guardando…' : 'Confirmar derivación'}
        </button>
      </div>
    </form>
  );
}

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
