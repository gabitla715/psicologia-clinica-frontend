import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  consentimientoService,
  CONSENTIMIENTO_VERSION_ACTUAL,
  TEXTO_CONSENTIMIENTO_INSTITUCIONAL,
} from '../../api/consentimientoService';
import { extraerMensajeError } from '../../api/client';

export function ConsentimientoForm() {
  const { fichaId } = useParams<{ fichaId: string }>();
  const id = fichaId ? Number(fichaId) : NaN;
  const navegar = useNavigate();

  const [acepta, setAcepta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modoLocal = consentimientoService.modoLocal;

  async function guardar() {
    if (!Number.isFinite(id)) {
      setError('ID de ficha inválido.');
      return;
    }
    if (!acepta) {
      setError('Debes marcar la aceptación del estudiante antes de continuar.');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await consentimientoService.registrar(id, {
        textoVersion: CONSENTIMIENTO_VERSION_ACTUAL,
        estudianteAcepta: true,
      });
      navegar(`/pacientes/${id}`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar el consentimiento.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Consentimiento informado</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lee con el estudiante el documento institucional y registra su aceptación.
          Versión vigente: <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{CONSENTIMIENTO_VERSION_ACTUAL}</code>
        </p>
      </header>

      {modoLocal && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>⚠️ Modo demo:</strong> el backend aún no implementa el endpoint del
          consentimiento. La firma se guarda localmente en este navegador, vinculada al
          ID de la ficha. Cuando el backend exponga el endpoint, este mismo formulario
          enviará los datos a la base de datos institucional.
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Texto del consentimiento</h2>
        <p className="mt-1 text-xs text-slate-500">
          Desplázate para revisar el documento completo antes de continuar.
        </p>
        <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {TEXTO_CONSENTIMIENTO_INSTITUCIONAL}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-700">
            El estudiante declara haber leído y comprendido el texto del consentimiento
            informado y acepta libremente el inicio del proceso de atención psicológica
            en los términos descritos.
          </span>
        </label>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navegar(`/pacientes/${id}`)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={enviando || !acepta}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {enviando ? 'Guardando…' : 'Registrar firma'}
          </button>
        </div>
      </section>
    </div>
  );
}
