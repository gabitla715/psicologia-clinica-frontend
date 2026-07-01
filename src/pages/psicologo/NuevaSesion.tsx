import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  sesionService,
  type SesionRequestBackend,
  MODALIDADES,
  ESTADOS_ASISTENCIA,
  ETIQUETA_ESCALA_EMOCIONAL,
} from '../../api/sesionService';
import {
  type NivelRiesgo,
  NOMBRE_NIVEL_RIESGO,
} from '../../api/entrevistaService';
import { extraerMensajeError } from '../../api/client';

interface Formulario {
  fecha: string;                  // yyyy-MM-dd
  hora: string;                   // HH:mm
  duracionMinutos: string;
  modalidad: string;
  estadoAsistencia: string;
  notaClinica: string;
  tecnicasAplicadas: string;
  logrosSesion: string;
  obstaculosSesion: string;
  tareaCasa: string;
  estadoEmocionalInicio: string;  // 1-5, "" = sin registro
  estadoEmocionalFinal: string;
  motivacionCompromiso: string;
  pensamientosAutolesion: string;
  evaluacionRiesgo: NivelRiesgo | '';
  notasRiesgoConfidencial: string;
}

function ahoraLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return { fecha: `${yyyy}-${mm}-${dd}`, hora: `${hh}:${mi}` };
}

const ESTADO_INICIAL: Formulario = (() => {
  const { fecha, hora } = ahoraLocal();
  return {
    fecha,
    hora,
    duracionMinutos: '45',
    modalidad: 'Presencial',
    estadoAsistencia: 'Asistió',
    notaClinica: '',
    tecnicasAplicadas: '',
    logrosSesion: '',
    obstaculosSesion: '',
    tareaCasa: '',
    estadoEmocionalInicio: '',
    estadoEmocionalFinal: '',
    motivacionCompromiso: '',
    pensamientosAutolesion: '',
    evaluacionRiesgo: '',
    notasRiesgoConfidencial: '',
  };
})();

export function NuevaSesion() {
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
    if (!form.fecha || !form.hora) {
      setError('La fecha y hora de la sesión son obligatorias.');
      return;
    }
    const duracion = Number(form.duracionMinutos);
    if (!Number.isFinite(duracion) || duracion < 15 || duracion > 120) {
      setError('La duración debe estar entre 15 y 120 minutos.');
      return;
    }

    const nOrUndef = (v: string): number | undefined => {
      if (v === '') return undefined;
      const parsed = Number(v);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    const norm = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);

    const datos: SesionRequestBackend = {
      // El backend espera LocalDateTime; enviamos "yyyy-MM-ddTHH:mm:00".
      fecha: `${form.fecha}T${form.hora}:00`,
      duracionMinutos: duracion,
      modalidad: norm(form.modalidad),
      estadoAsistencia: norm(form.estadoAsistencia),
      notaClinica: norm(form.notaClinica),
      tecnicasAplicadas: norm(form.tecnicasAplicadas),
      logrosSesion: norm(form.logrosSesion),
      obstaculosSesion: norm(form.obstaculosSesion),
      tareaCasa: norm(form.tareaCasa),
      estadoEmocionalInicio: nOrUndef(form.estadoEmocionalInicio),
      estadoEmocionalFinal: nOrUndef(form.estadoEmocionalFinal),
      motivacionCompromiso: nOrUndef(form.motivacionCompromiso),
      pensamientosAutolesion: norm(form.pensamientosAutolesion),
      evaluacionRiesgo: form.evaluacionRiesgo || undefined,
      notasRiesgoConfidencial: norm(form.notasRiesgoConfidencial),
    };

    setEnviando(true);
    setError(null);
    try {
      await sesionService.registrar(id, datos);
      navegar(`/pacientes/${id}/sesiones`, { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la sesión.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Nueva sesión</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registra la nota clínica y la valoración de la sesión. El sistema calcula
          automáticamente el número de sesión secuencial dentro de la ficha.
        </p>
      </header>

      <Seccion titulo="Datos de la sesión">
        <Campo etiqueta="Fecha" obligatorio>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => actualizar('fecha', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Hora" obligatorio>
          <input
            type="time"
            value={form.hora}
            onChange={(e) => actualizar('hora', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Duración (min)" obligatorio>
          <input
            type="number"
            min={15}
            max={120}
            value={form.duracionMinutos}
            onChange={(e) => actualizar('duracionMinutos', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Modalidad">
          <select
            value={form.modalidad}
            onChange={(e) => actualizar('modalidad', e.target.value)}
            className={inputCls}
          >
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Estado de asistencia" ancho="md:col-span-2">
          <select
            value={form.estadoAsistencia}
            onChange={(e) => actualizar('estadoAsistencia', e.target.value)}
            className={inputCls}
          >
            {ESTADOS_ASISTENCIA.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Campo>
      </Seccion>

      <Seccion titulo="Nota clínica">
        <Campo etiqueta="Nota clínica" ancho="md:col-span-2">
          <textarea
            rows={4}
            value={form.notaClinica}
            onChange={(e) => actualizar('notaClinica', e.target.value)}
            placeholder="Descripción del contenido y desarrollo de la sesión."
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Técnicas aplicadas">
          <textarea
            rows={2}
            value={form.tecnicasAplicadas}
            onChange={(e) => actualizar('tecnicasAplicadas', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Tarea para casa">
          <textarea
            rows={2}
            value={form.tareaCasa}
            onChange={(e) => actualizar('tareaCasa', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Logros de la sesión">
          <textarea
            rows={2}
            value={form.logrosSesion}
            onChange={(e) => actualizar('logrosSesion', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Obstáculos observados">
          <textarea
            rows={2}
            value={form.obstaculosSesion}
            onChange={(e) => actualizar('obstaculosSesion', e.target.value)}
            className={inputCls}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Valoración emocional (escala 1-5)">
        <Campo etiqueta="Estado emocional al inicio">
          <EscalaEmocional
            valor={form.estadoEmocionalInicio}
            onChange={(v) => actualizar('estadoEmocionalInicio', v)}
          />
        </Campo>
        <Campo etiqueta="Estado emocional al final">
          <EscalaEmocional
            valor={form.estadoEmocionalFinal}
            onChange={(v) => actualizar('estadoEmocionalFinal', v)}
          />
        </Campo>
        <Campo etiqueta="Motivación / compromiso" ancho="md:col-span-2">
          <EscalaEmocional
            valor={form.motivacionCompromiso}
            onChange={(v) => actualizar('motivacionCompromiso', v)}
          />
        </Campo>
      </Seccion>

      <Seccion titulo="Evaluación de riesgo">
        <Campo etiqueta="Pensamientos de autolesión reportados" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.pensamientosAutolesion}
            onChange={(e) => actualizar('pensamientosAutolesion', e.target.value)}
            className={inputCls}
          />
        </Campo>
        <Campo etiqueta="Nivel de riesgo evaluado en esta sesión" ancho="md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => actualizar('evaluacionRiesgo', '')}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                form.evaluacionRiesgo === ''
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Sin evaluación
            </button>
            {(['SIN_IDEACION', 'IDEACION_PASIVA', 'IDEACION_ACTIVA'] as NivelRiesgo[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => actualizar('evaluacionRiesgo', r)}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  form.evaluacionRiesgo === r
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {NOMBRE_NIVEL_RIESGO[r]}
              </button>
            ))}
          </div>
        </Campo>
        <Campo etiqueta="Notas confidenciales de riesgo" ancho="md:col-span-2">
          <textarea
            rows={2}
            value={form.notasRiesgoConfidencial}
            onChange={(e) => actualizar('notasRiesgoConfidencial', e.target.value)}
            placeholder="Contenido de acceso restringido al especialista tratante."
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
          {enviando ? 'Guardando…' : 'Registrar sesión'}
        </button>
      </div>
    </form>
  );
}

// ─── Helpers visuales ────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

function EscalaEmocional({
  valor,
  onChange,
}: {
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`rounded-lg border px-3 py-2 text-xs transition ${
          valor === ''
            ? 'border-brand-500 bg-brand-50 text-brand-800'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        —
      </button>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(String(n))}
          className={`rounded-lg border px-3 py-2 text-xs transition ${
            valor === String(n)
              ? 'border-brand-500 bg-brand-50 text-brand-800'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {n} · {ETIQUETA_ESCALA_EMOCIONAL[n]}
        </button>
      ))}
    </div>
  );
}

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
