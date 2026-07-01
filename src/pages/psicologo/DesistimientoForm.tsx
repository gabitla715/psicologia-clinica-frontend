import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  desistimientoService,
  type DesistimientoRequestBackend,
  type MotivoDesistimiento,
  NOMBRE_MOTIVO_DESISTIMIENTO,
  DESCRIPCION_MOTIVO_DESISTIMIENTO,
} from '../../api/desistimientoService';
import { extraerMensajeError } from '../../api/client';

interface Formulario {
  motivoCategoria: MotivoDesistimiento | '';
  motivoDescripcion: string;
  informadoPor: string;
}

const ESTADO_INICIAL: Formulario = {
  motivoCategoria: '',
  motivoDescripcion: '',
  informadoPor: '',
};

const MOTIVOS: MotivoDesistimiento[] = ['PERSONAL', 'ACADEMICO', 'LABORAL', 'OTRO'];

export function DesistimientoForm() {
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
    if (!form.motivoCategoria) {
      setError('La categoría del motivo es obligatoria.');
      return;
    }
    if (form.motivoCategoria === 'OTRO' && !form.motivoDescripcion.trim()) {
      setError('Cuando el motivo es "Otro", debes describirlo.');
      return;
    }

    const norm = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);
    const datos: DesistimientoRequestBackend = {
      motivoCategoria: form.motivoCategoria,
      motivoDescripcion: norm(form.motivoDescripcion),
      informadoPor: norm(form.informadoPor),
    };

    setEnviando(true);
    setError(null);
    try {
      await desistimientoService.registrar(id, datos);
      navegar(`/pacientes/${id}`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar el desistimiento.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Registrar desistimiento</h1>
        <p className="mt-1 text-sm text-slate-500">
          Documenta el cierre voluntario del proceso por parte del estudiante. La ficha
          quedará en estado <strong>Desistida</strong>.
        </p>
      </header>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Esta acción es irreversible desde la interfaz. Verifica los datos antes de
        confirmar.
      </div>

      <Seccion titulo="Motivo del desistimiento">
        <div className="grid gap-2 md:col-span-2 sm:grid-cols-2">
          {MOTIVOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => actualizar('motivoCategoria', m)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                form.motivoCategoria === m
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <p className="font-semibold">{NOMBRE_MOTIVO_DESISTIMIENTO[m]}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {DESCRIPCION_MOTIVO_DESISTIMIENTO[m]}
              </p>
            </button>
          ))}
        </div>

        <Campo
          etiqueta={form.motivoCategoria === 'OTRO' ? 'Descripción del motivo (obligatorio)' : 'Descripción adicional'}
          ancho="md:col-span-2"
        >
          <textarea
            rows={3}
            value={form.motivoDescripcion}
            onChange={(e) => actualizar('motivoDescripcion', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Registro de la decisión">
        <Campo etiqueta="Informado por" ancho="md:col-span-2">
          <input
            type="text"
            value={form.informadoPor}
            onChange={(e) => actualizar('informadoPor', e.target.value)}
            placeholder="Ej. El propio estudiante, tutor académico, familiar."
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
          {enviando ? 'Guardando…' : 'Confirmar desistimiento'}
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
  ancho,
  children,
}: {
  etiqueta: string;
  ancho?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${ancho ?? ''}`}>
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">
        {etiqueta}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
