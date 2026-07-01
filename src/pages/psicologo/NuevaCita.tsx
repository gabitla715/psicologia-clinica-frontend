import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  citaService,
  type CitaRequestBackend,
  type TipoCita,
  MODALIDADES_CITA,
  DURACIONES_SUGERIDAS,
  NOMBRE_TIPO_CITA,
} from '../../api/citaService';
import {
  NOMBRE_TIPO_PSICOLOGIA,
  type TipoPsicologia,
} from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';

interface Formulario {
  estudianteId: string;
  tipoPsicologia: TipoPsicologia;
  fecha: string;
  hora: string;
  duracionMinutos: number;
  tipoCita: TipoCita;
  modalidad: string;
  notas: string;
}

export function NuevaCita() {
  const navegar = useNavigate();
  const [searchParams] = useSearchParams();

  // Permite prellenar el estudiante y el tipo desde la ficha (DetalleFicha).
  const estudianteIdParam = searchParams.get('estudianteId') ?? '';
  const tipoParam = (searchParams.get('tipoPsicologia') as TipoPsicologia | null) ?? 'CLINICA';

  const [form, setForm] = useState<Formulario>({
    estudianteId: estudianteIdParam,
    tipoPsicologia: tipoParam,
    fecha: '',
    hora: '',
    duracionMinutos: 50,
    tipoCita: 'PRIMERA_CONVOCATORIA',
    modalidad: 'Presencial',
    notas: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar<K extends keyof Formulario>(campo: K, valor: Formulario[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validar(): string | null {
    if (!form.estudianteId.trim()) return 'El ID del estudiante es obligatorio.';
    if (!/^\d+$/.test(form.estudianteId.trim())) {
      return 'El ID del estudiante debe ser un número.';
    }
    if (!form.fecha) return 'La fecha es obligatoria.';
    if (!form.hora) return 'La hora es obligatoria.';
    // Combinamos y verificamos que sea a futuro.
    const cuando = new Date(`${form.fecha}T${form.hora}:00`);
    if (Number.isNaN(cuando.getTime())) return 'La fecha y hora no son válidas.';
    if (cuando.getTime() < Date.now()) return 'No se puede agendar una cita en el pasado.';
    if (form.duracionMinutos < 15) return 'La duración mínima es 15 minutos.';
    return null;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }
    setError(null);
    setEnviando(true);

    const datos: CitaRequestBackend = {
      estudianteId: Number(form.estudianteId),
      tipoPsicologia: form.tipoPsicologia,
      fechaHora: `${form.fecha}T${form.hora}:00`,
      duracionMinutos: form.duracionMinutos,
      tipoCita: form.tipoCita,
      modalidad: form.modalidad || undefined,
      notas: form.notas.trim() || undefined,
    };

    try {
      await citaService.agendar(datos);
      navegar('/citas', { replace: true });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo agendar la cita.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-800">Agendar cita</h1>
        <p className="mt-1 text-sm text-slate-500">
          El backend verifica automáticamente el solapamiento de horarios con tus otras
          citas. Si el horario está ocupado, la solicitud fallará y podrás elegir otro.
        </p>
      </header>

      {/* Estudiante y servicio */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Estudiante y servicio</h2>

        {!estudianteIdParam && (
          <div className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Nota:</strong> el ID del estudiante lo asigna el coordinador del Área
            de Bienestar Estudiantil. Consúltalo si no lo tienes a mano. Si llegaste aquí
            desde una ficha, ya viene prellenado.
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Campo etiqueta="ID del estudiante" obligatorio>
            <input
              type="text"
              inputMode="numeric"
              value={form.estudianteId}
              onChange={(e) => actualizar('estudianteId', e.target.value)}
              className={inputCls}
            />
          </Campo>
          <Campo etiqueta="Tipo de servicio" obligatorio>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['CLINICA', 'GENERAL'] as TipoPsicologia[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => actualizar('tipoPsicologia', t)}
                  className={botonCls(form.tipoPsicologia === t)}
                >
                  {NOMBRE_TIPO_PSICOLOGIA[t]}
                </button>
              ))}
            </div>
          </Campo>
        </div>
      </section>

      {/* Fecha y hora */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Fecha y hora</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Campo etiqueta="Fecha" obligatorio>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => actualizar('fecha', e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
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
          <Campo etiqueta="Duración">
            <select
              value={form.duracionMinutos}
              onChange={(e) => actualizar('duracionMinutos', Number(e.target.value))}
              className={inputCls}
            >
              {DURACIONES_SUGERIDAS.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </section>

      {/* Tipo, modalidad y notas */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-800">Detalles de la cita</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Campo etiqueta="Tipo de cita" obligatorio ancho="md:col-span-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {(['PRIMERA_CONVOCATORIA', 'SEGUIMIENTO'] as TipoCita[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => actualizar('tipoCita', t)}
                  className={botonCls(form.tipoCita === t)}
                >
                  {NOMBRE_TIPO_CITA[t]}
                </button>
              ))}
            </div>
          </Campo>
          <Campo etiqueta="Modalidad" ancho="md:col-span-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {MODALIDADES_CITA.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => actualizar('modalidad', m)}
                  className={botonCls(form.modalidad === m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </Campo>
          <Campo etiqueta="Notas" ancho="md:col-span-2">
            <textarea
              rows={3}
              value={form.notas}
              onChange={(e) => actualizar('notas', e.target.value)}
              placeholder="Información adicional relevante para la cita (opcional)."
              className={inputCls}
            />
          </Campo>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => navegar('/citas')}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {enviando ? 'Agendando…' : 'Agendar cita'}
        </button>
      </div>
    </form>
  );
}

// ─── Helpers visuales ────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

function botonCls(activo: boolean) {
  return `rounded-lg border px-4 py-2.5 text-sm transition ${
    activo
      ? 'border-brand-500 bg-brand-50 text-brand-800'
      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
  }`;
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
