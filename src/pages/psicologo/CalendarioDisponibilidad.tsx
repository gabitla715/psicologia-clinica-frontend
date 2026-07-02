import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import {
  citaService,
  NOMBRE_ESTADO_CITA,
  type Cita,
} from '../../api/citaService';
import { extraerMensajeError } from '../../api/client';


const HORA_INICIO = 8;
const HORA_FIN = 19;
const SLOTS_POR_HORA = 2; // bloques de 30 min
const TOTAL_SLOTS = (HORA_FIN - HORA_INICIO) * SLOTS_POR_HORA;
const ALTO_SLOT_PX = 32;
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const COLOR_BLOQUE: Record<Cita['estado'], string> = {
  PENDIENTE: 'bg-amber-100 border-amber-300 text-amber-800',
  CONFIRMADA: 'bg-blue-100 border-blue-300 text-blue-800',
  REALIZADA: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  CANCELADA: 'bg-slate-100 border-slate-300 text-slate-400 line-through',
};

function lunesDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  const dia = d.getDay(); // 0=domingo, 1=lunes...
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatoFechaISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function slotAHora(slot: number): string {
  const minutosDesdeInicio = slot * 30;
  const hora = HORA_INICIO + Math.floor(minutosDesdeInicio / 60);
  const minuto = minutosDesdeInicio % 60;
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

export function CalendarioDisponibilidad() {
  const navegar = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inicioSemana, setInicioSemana] = useState(() => lunesDeSemana(new Date()));

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    citaService
      .listarMisCitas()
      .then(setCitas)
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar tu agenda.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const diasVisibles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(inicioSemana);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [inicioSemana]
  );

  const etiquetasHora = useMemo(
    () => Array.from({ length: TOTAL_SLOTS }, (_, i) => slotAHora(i)),
    []
  );

  function citasDelDia(dia: Date): Cita[] {
    return citas.filter((c) => {
      const f = c.fechaHora;
      return (
        f.getFullYear() === dia.getFullYear() &&
        f.getMonth() === dia.getMonth() &&
        f.getDate() === dia.getDate()
      );
    });
  }

  function irASlotVacio(dia: Date, slot: number) {
    const hora = slotAHora(slot);
    navegar(`/citas/nueva?fecha=${formatoFechaISO(dia)}&hora=${hora}`);
  }

  const formatoTituloRango = useMemo(() => {
    const fin = new Date(inicioSemana);
    fin.setDate(fin.getDate() + 5);
    const fmt = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short' });
    return `${fmt.format(inicioSemana)} – ${fmt.format(fin)}, ${fin.getFullYear()}`;
  }, [inicioSemana]);

  const hoyISO = formatoFechaISO(new Date());

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
            <CalendarDays className="h-5 w-5 text-brand-600" />
            Calendario de disponibilidad
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Haz clic en un espacio libre para agendar una cita en ese horario.
          </p>
        </div>
      </div>

      {/* Navegación de semana */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <button
          onClick={() => setInicioSemana((s) => { const d = new Date(s); d.setDate(d.getDate() - 7); return d; })}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" /> Semana anterior
        </button>
        <div className="flex items-center gap-3">
          <p className="text-sm font-semibold text-slate-800">{formatoTituloRango}</p>
          <button
            onClick={() => setInicioSemana(lunesDeSemana(new Date()))}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => setInicioSemana((s) => { const d = new Date(s); d.setDate(d.getDate() + 7); return d; })}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Semana siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <Leyenda color="bg-amber-100 border-amber-300" texto={NOMBRE_ESTADO_CITA.PENDIENTE} />
        <Leyenda color="bg-blue-100 border-blue-300" texto={NOMBRE_ESTADO_CITA.CONFIRMADA} />
        <Leyenda color="bg-emerald-100 border-emerald-300" texto={NOMBRE_ESTADO_CITA.REALIZADA} />
        <Leyenda color="bg-white border-slate-200" texto="Disponible (clic para agendar)" />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {cargando ? (
        <p className="mt-6 text-sm text-slate-500">Cargando tu agenda…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="grid min-w-[720px] grid-cols-[64px_repeat(6,1fr)]">
            {/* Encabezados de día */}
            <div className="border-b border-r border-slate-100" />
            {diasVisibles.map((dia, i) => {
              const esHoy = formatoFechaISO(dia) === hoyISO;
              return (
                <div
                  key={i}
                  className={`border-b border-slate-100 px-2 py-2 text-center ${
                    esHoy ? 'bg-brand-50' : ''
                  }`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {DIAS_SEMANA[i]}
                  </p>
                  <p className={`text-sm font-semibold ${esHoy ? 'text-brand-700' : 'text-slate-700'}`}>
                    {dia.getDate()}
                  </p>
                </div>
              );
            })}

            {/* Columna de horas */}
            <div
              className="border-r border-slate-100"
              style={{ display: 'grid', gridTemplateRows: `repeat(${TOTAL_SLOTS}, ${ALTO_SLOT_PX}px)` }}
            >
              {etiquetasHora.map((h, i) => (
                <div
                  key={i}
                  style={{ gridRow: i + 1 }}
                  className="flex items-start justify-end border-t border-slate-50 pr-2 text-[10px] text-slate-400"
                >
                  {h.endsWith(':00') ? h : ''}
                </div>
              ))}
            </div>

            {/* Columnas de día con bloques de citas */}
            {diasVisibles.map((dia, i) => {
              const delDia = citasDelDia(dia).filter((c) => c.estado !== 'CANCELADA');
              const bloques = delDia.map((c) => {
                const minutosDesdeInicio =
                  (c.fechaHora.getHours() - HORA_INICIO) * 60 + c.fechaHora.getMinutes();
                const startSlot = Math.max(0, Math.floor(minutosDesdeInicio / 30));
                const spanSlots = Math.max(1, Math.ceil(c.duracionMinutos / 30));
                return { cita: c, startSlot, spanSlots };
              });
              const ocupados = new Set<number>();
              bloques.forEach((b) => {
                for (let s = b.startSlot; s < b.startSlot + b.spanSlots && s < TOTAL_SLOTS; s++) {
                  ocupados.add(s);
                }
              });

              return (
                <div
                  key={i}
                  className="relative border-r border-slate-100 last:border-r-0"
                  style={{ display: 'grid', gridTemplateRows: `repeat(${TOTAL_SLOTS}, ${ALTO_SLOT_PX}px)` }}
                >
                  {etiquetasHora.map((_, slot) => {
                    if (ocupados.has(slot)) return null;
                    return (
                      <button
                        key={slot}
                        style={{ gridRow: slot + 1 }}
                        onClick={() => irASlotVacio(dia, slot)}
                        title={`Agendar a las ${slotAHora(slot)}`}
                        className="border-t border-slate-50 transition hover:bg-brand-50"
                      />
                    );
                  })}
                  {bloques.map(({ cita, startSlot, spanSlots }) => (
                    <div
                      key={cita.id}
                      style={{ gridRow: `${startSlot + 1} / span ${Math.min(spanSlots, TOTAL_SLOTS - startSlot)}` }}
                      className={`m-0.5 overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight ${COLOR_BLOQUE[cita.estado]}`}
                      title={`${cita.nombreEstudiante} · ${NOMBRE_ESTADO_CITA[cita.estado]}`}
                    >
                      <p className="truncate font-medium">{cita.nombreEstudiante}</p>
                      <p className="truncate opacity-80">
                        {cita.fechaHora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded border ${color}`} />
      {texto}
    </span>
  );
}
