import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Info,
  MessageSquareText,
  User2,
  UserRound,
} from 'lucide-react';
import { solicitudService, type SolicitudAtencionBackend } from '../../api/solicitudService';
import { coordinadorEstudiantesService } from '../../api/coordinadorEstudiantesService';
import { horarioService, NOMBRE_DIA_SEMANA, formatearHora, type HorarioDisponibleBackend, type DiaSemana } from '../../api/horarioService';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import type { Usuario } from '../../types/auth';
import {
  mockAsignacionCita,
  mockCargaEspecialista,
  ORDEN_ESTADO_EXTENDIDO,
  META_ESTADO_EXTENDIDO,
  type AsignacionExtra,
  type EstadoSolicitudExtendido,
} from '../../mocks/mockContratoBackend';

const DIAS_ISO: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'];

function diaSemanaDe(fechaISO: string): DiaSemana | null {
  const dow = new Date(fechaISO + 'T00:00:00').getDay();
  if (dow === 0 || dow === 6) return null;
  return DIAS_ISO[dow - 1];
}

export function AsignarEspecialista() {
  const { usuario: coordinador } = useAuth();
  const { solicitudId } = useParams<{ solicitudId: string }>();
  const id = solicitudId ? Number(solicitudId) : NaN;

  const [solicitud, setSolicitud] = useState<SolicitudAtencionBackend | null>(null);
  const [especialistas, setEspecialistas] = useState<Usuario[]>([]);
  const [especialistaId, setEspecialistaId] = useState<number | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponibleBackend[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');

  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AsignacionExtra | null>(null);

  const cargar = useCallback(() => {
    if (!Number.isFinite(id)) {
      setError('ID de solicitud inválido.');
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);

    const registroExistente = mockAsignacionCita.obtener(id);

    Promise.all([solicitudService.pendientes(), coordinadorEstudiantesService.listarEspecialistas()])
      .then(([pendientes, esp]) => {
        setEspecialistas(esp);
        if (registroExistente) {
          setSolicitud({
            id,
            estudianteId: 0,
            nombreEstudiante: registroExistente.solicitud.nombreEstudiante,
            tipoPsicologia: registroExistente.solicitud.tipoPsicologia,
            motivoSolicitud: registroExistente.solicitud.motivoSolicitud,
            estado: 'ASIGNADA',
            creadoEn: registroExistente.solicitud.creadoEn,
          });
          setEspecialistaId(registroExistente.especialistaId);
          setResultado(registroExistente);
          return;
        }
        const encontrada = pendientes.find((s) => s.id === id) ?? null;
        setSolicitud(encontrada);
        if (!encontrada) setError('Esta solicitud no se encontró entre las pendientes ni entre las ya asignadas.');
      })
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la información.')))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!especialistaId) {
      setHorarios([]);
      return;
    }
    setCargandoHorarios(true);
    horarioService
      .obtenerHorariosDe(especialistaId)
      .then(setHorarios)
      .catch(() => setHorarios([]))
      .finally(() => setCargandoHorarios(false));
  }, [especialistaId]);

  const especialistaSeleccionado = especialistas.find((e) => e.id === especialistaId) ?? null;
  const diasDisponibles = useMemo(
    () => new Set(horarios.filter((h) => h.activo).map((h) => h.diaSemana)),
    [horarios]
  );
  const diaDeLaFechaElegida = fecha ? diaSemanaDe(fecha) : null;
  const fechaFueraDeDisponibilidad =
    !!fecha && (!diaDeLaFechaElegida || (diasDisponibles.size > 0 && !diasDisponibles.has(diaDeLaFechaElegida)));

  const pasoEstudianteListo = !!solicitud;
  const pasoConfirmarListo = !!especialistaId && !!fecha && !!hora;

  async function confirmarAsignacion() {
    if (!solicitud || !especialistaSeleccionado || !fecha || !hora || !coordinador) return;
    setEnviando(true);
    setError(null);
    try {
      await solicitudService.asignar(solicitud.id, especialistaSeleccionado.id, notas.trim() || undefined);
      const fechaHoraISO = new Date(`${fecha}T${hora}:00`).toISOString();
      const registro = mockAsignacionCita.registrarAsignacion(
        solicitud.id,
        fechaHoraISO,
        `${coordinador.nombres} ${coordinador.apellidos}`,
        especialistaSeleccionado.id,
        `${especialistaSeleccionado.nombres} ${especialistaSeleccionado.apellidos}`,
        {
          nombreEstudiante: solicitud.nombreEstudiante,
          tipoPsicologia: solicitud.tipoPsicologia,
          motivoSolicitud: solicitud.motivoSolicitud,
          creadoEn: solicitud.creadoEn,
        }
      );
      setResultado(registro);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo asignar el especialista.'));
    } finally {
      setEnviando(false);
    }
  }

  function cambiarEstadoResultado(nuevo: EstadoSolicitudExtendido, descripcion: string) {
    if (!solicitud) return;
    mockAsignacionCita.cambiarEstado(solicitud.id, nuevo, descripcion);
    setResultado(mockAsignacionCita.obtener(solicitud.id));
  }

  if (cargando) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-4">
        <div className="h-6 w-48 rounded bg-slate-100" />
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error ?? 'Solicitud no encontrada.'}</p>
        <Link to="/coordinador/solicitudes" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a Solicitudes
        </Link>
      </div>
    );
  }

  if (resultado) {
    return (
      <TicketConfirmacion
        solicitud={solicitud}
        especialista={
          especialistaSeleccionado ??
          ({
            id: resultado.especialistaId,
            nombres: resultado.nombreEspecialista.split(' ')[0] ?? resultado.nombreEspecialista,
            apellidos: resultado.nombreEspecialista.split(' ').slice(1).join(' '),
          } as Usuario)
        }
        resultado={resultado}
        onCambiarEstado={cambiarEstadoResultado}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <Link to="/coordinador/solicitudes" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Solicitudes
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Asignar especialista</h1>
      <p className="mt-1 text-sm text-slate-500">Un flujo, tres pasos: revisa al estudiante, elige especialista y horario, confirma.</p>

      <div className="mt-6 flex items-center gap-2">
        <Escalon numero={1} activo etiqueta="Estudiante" completo={pasoEstudianteListo} />
        <Linea completa={pasoEstudianteListo} />
        <Escalon numero={2} activo={pasoEstudianteListo} etiqueta="Especialista y horario" completo={pasoConfirmarListo} />
        <Linea completa={pasoConfirmarListo} />
        <Escalon numero={3} activo={pasoConfirmarListo} etiqueta="Confirmar" completo={false} />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {solicitud.nombreEstudiante.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-800">{solicitud.nombreEstudiante}</p>
            <p className="text-xs text-slate-500">
              {NOMBRE_TIPO_PSICOLOGIA[solicitud.tipoPsicologia]} · Solicitado el{' '}
              {new Date(solicitud.creadoEn).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        {solicitud.motivoSolicitud && (
          <div className="flex items-start gap-2 px-5 py-4 text-sm text-slate-600">
            <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <p>{solicitud.motivoSolicitud}</p>
          </div>
        )}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <UserRound className="h-4 w-4 text-brand-600" /> Elegir especialista
          </h2>
          <div className="mt-3 space-y-2">
            {especialistas.map((e) => {
              const activo = especialistaId === e.id;
              const cargaEste = mockCargaEspecialista.calcularCargaAproximada(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => {
                    setEspecialistaId(e.id);
                    setHora('');
                  }}
                  className={`group w-full rounded-xl border px-3.5 py-3 text-left transition ${
                    activo ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${activo ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {e.nombres.charAt(0)}
                        {e.apellidos.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {e.nombres} {e.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">{e.datosEspecialista?.especialidad ?? 'Sin especialidad registrada'}</p>
                      </div>
                    </div>
                    {activo && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </div>
                  <IndicadorCarga carga={cargaEste} className="mt-2" />
                </button>
              );
            })}
            {especialistas.length === 0 && <p className="text-xs text-slate-400">No hay especialistas registrados.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarClock className="h-4 w-4 text-brand-600" /> Fecha y hora de la cita
          </h2>

          {!especialistaId ? (
            <p className="mt-8 text-center text-sm text-slate-400">Elige un especialista para continuar.</p>
          ) : (
            <>
              <p className="mt-1 text-xs text-slate-500">Disponibilidad semanal declarada por {especialistaSeleccionado?.nombres}:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {cargandoHorarios ? (
                  <span className="text-xs text-slate-400">Consultando…</span>
                ) : diasDisponibles.size === 0 ? (
                  <span className="text-xs text-slate-400">Sin horarios registrados.</span>
                ) : (
                  DIAS_ISO.map((d) => (
                    <span
                      key={d}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        diasDisponibles.has(d) ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-300 line-through'
                      }`}
                    >
                      {NOMBRE_DIA_SEMANA[d].slice(0, 3)}
                    </span>
                  ))
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setFecha(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">Hora</label>
                  <input
                    type="time"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {fechaFueraDeDisponibilidad && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Ese día no coincide con la disponibilidad declarada. Puedes continuar si lo
                  coordinaste directamente con el especialista.
                </p>
              )}

              {horarios.filter((h) => h.activo && h.diaSemana === diaDeLaFechaElegida).length > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  Ese día suele atender de{' '}
                  {horarios
                    .filter((h) => h.activo && h.diaSemana === diaDeLaFechaElegida)
                    .map((h) => `${formatearHora(h.horaInicio)} a ${formatearHora(h.horaFin)}`)
                    .join(' y ')}
                </p>
              )}

              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-500">Notas para el especialista (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                  placeholder="Ej: asignado por disponibilidad y experiencia en manejo de ansiedad."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}
        </div>
      </section>

      <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="text-sm text-slate-500">
          {pasoConfirmarListo ? (
            <span className="flex items-center gap-1.5 text-slate-700">
              <Check className="h-4 w-4 text-emerald-600" />
              Listo para asignar a <strong>{especialistaSeleccionado?.nombres}</strong> el{' '}
              {new Date(`${fecha}T${hora}`).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })} a las {hora}
            </span>
          ) : (
            'Completa especialista, fecha y hora para continuar.'
          )}
        </div>
        <button
          onClick={confirmarAsignacion}
          disabled={!pasoConfirmarListo || enviando}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'Asignando…' : 'Confirmar asignación'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Escalon({ numero, etiqueta, activo, completo }: { numero: number; etiqueta: string; activo: boolean; completo: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
          completo ? 'bg-emerald-500 text-white' : activo ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
        }`}
      >
        {completo ? <Check className="h-3.5 w-3.5" /> : numero}
      </div>
      <span className={`hidden text-xs font-medium sm:inline ${activo ? 'text-slate-700' : 'text-slate-400'}`}>{etiqueta}</span>
    </div>
  );
}

function Linea({ completa }: { completa: boolean }) {
  return <div className={`h-0.5 w-8 flex-1 rounded-full transition ${completa ? 'bg-emerald-400' : 'bg-slate-200'}`} />;
}

function IndicadorCarga({ carga, className = '' }: { carga: 'baja' | 'media' | 'alta'; className?: string }) {
  const meta = {
    baja: { texto: 'Carga baja', clase: 'bg-emerald-500' },
    media: { texto: 'Carga media', clase: 'bg-amber-500' },
    alta: { texto: 'Carga alta', clase: 'bg-red-500' },
  }[carga];
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.clase}`} />
      <span className="text-[11px] text-slate-500">{meta.texto}</span>
    </div>
  );
}

function TicketConfirmacion({
  solicitud,
  especialista,
  resultado,
  onCambiarEstado,
}: {
  solicitud: SolicitudAtencionBackend;
  especialista: Usuario;
  resultado: AsignacionExtra;
  onCambiarEstado: (nuevo: EstadoSolicitudExtendido, descripcion: string) => void;
}) {
  const navegar = useNavigate();
  const fechaHora = resultado.fechaHora ? new Date(resultado.fechaHora) : null;
  const indiceActual = ORDEN_ESTADO_EXTENDIDO.indexOf(
    resultado.estadoExtendido === 'CANCELADA' || resultado.estadoExtendido === 'RECHAZADA' || resultado.estadoExtendido === 'REAGENDADA'
      ? 'ASIGNADA'
      : resultado.estadoExtendido
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <Check className="h-4 w-4" />
        Especialista asignado correctamente. Pendiente de confirmación por parte del estudiante.
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-6 text-white">
          <p className="text-xs uppercase tracking-wider text-brand-100">Asignación de atención psicológica</p>
          <h2 className="mt-1 text-xl font-semibold">{NOMBRE_TIPO_PSICOLOGIA[solicitud.tipoPsicologia]}</h2>
        </div>

        <div className="relative px-6 py-5">
          <div className="grid grid-cols-2 gap-5">
            <Campo icono={<User2 className="h-4 w-4" />} etiqueta="Estudiante" valor={solicitud.nombreEstudiante} />
            <Campo icono={<UserRound className="h-4 w-4" />} etiqueta="Especialista" valor={`${especialista.nombres} ${especialista.apellidos}`} />
            <Campo
              icono={<CalendarClock className="h-4 w-4" />}
              etiqueta="Fecha"
              valor={fechaHora ? fechaHora.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
            />
            <Campo icono={<Clock3 className="h-4 w-4" />} etiqueta="Hora" valor={fechaHora ? fechaHora.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) : '—'} />
          </div>
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-slate-50" />
        </div>

        <div className="border-t border-dashed border-slate-200 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Estado del proceso</p>
          <div className="mt-3 flex items-center">
            {ORDEN_ESTADO_EXTENDIDO.map((estado, i) => (
              <div key={estado} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-3 w-3 rounded-full ${i <= indiceActual ? META_ESTADO_EXTENDIDO[estado].claseSolida : 'bg-slate-200'}`} />
                  <span className={`text-[10px] ${i <= indiceActual ? 'text-slate-600' : 'text-slate-300'}`}>{META_ESTADO_EXTENDIDO[estado].etiqueta}</span>
                </div>
                {i < ORDEN_ESTADO_EXTENDIDO.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 ${i < indiceActual ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {resultado.estadoExtendido === 'ASIGNADA' && (
              <>
                <BotonEstado onClick={() => onCambiarEstado('CONFIRMADA', 'Estudiante confirmó asistencia')}>Marcar confirmada</BotonEstado>
                <BotonEstado onClick={() => onCambiarEstado('REAGENDADA', 'Cita reagendada')} variante="secundario">Reagendar</BotonEstado>
                <BotonEstado onClick={() => onCambiarEstado('CANCELADA', 'Asignación cancelada')} variante="peligro">Cancelar</BotonEstado>
              </>
            )}
            {resultado.estadoExtendido === 'CONFIRMADA' && (
              <BotonEstado onClick={() => onCambiarEstado('ATENDIDA', 'Sesión realizada')}>Marcar como atendida</BotonEstado>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Historial de cambios</p>
          <ol className="mt-3 space-y-3">
            {resultado.historial.map((evento, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <div className="flex flex-col items-center">
                  <span className="h-2 w-2 rounded-full bg-brand-500" />
                  {i < resultado.historial.length - 1 && <span className="mt-0.5 w-px flex-1 bg-slate-200" />}
                </div>
                <div className="pb-3">
                  <p className="text-slate-700">{evento.descripcion}</p>
                  <p className="text-xs text-slate-400">{new Date(evento.fecha).toLocaleString('es-EC')}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <button onClick={() => navegar('/coordinador/solicitudes')} className="mt-5 text-sm font-medium text-brand-700 hover:underline">
        ← Volver al listado de solicitudes
      </button>
    </div>
  );
}

function Campo({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 text-slate-400">{icono}</div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{etiqueta}</p>
        <p className="text-sm font-medium text-slate-800">{valor}</p>
      </div>
    </div>
  );
}

function BotonEstado({
  children,
  onClick,
  variante = 'primario',
}: {
  children: React.ReactNode;
  onClick: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
}) {
  const clases = {
    primario: 'bg-brand-600 text-white hover:bg-brand-700',
    secundario: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
    peligro: 'border border-red-200 text-red-600 hover:bg-red-50',
  }[variante];
  return (
    <button onClick={onClick} className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${clases}`}>
      {children}
    </button>
  );
}
