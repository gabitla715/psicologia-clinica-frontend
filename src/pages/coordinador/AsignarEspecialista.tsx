import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Send, Ban } from 'lucide-react';
import {
  coordinadorMockService,
  esDiaHabil,
  NOMBRE_ESTADO_SOLICITUD,
  COLOR_ESTADO_SOLICITUD,
  type SolicitudCoordinador,
} from '../../api/coordinadorMockService';
import { coordinadorEstudiantesService } from '../../api/coordinadorEstudiantesService';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import type { Usuario } from '../../types/auth';
import { extraerMensajeError } from '../../api/client';

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AsignarEspecialista() {
  const { solicitudId } = useParams<{ solicitudId: string }>();
  const id = solicitudId ? Number(solicitudId) : NaN;
  const navegar = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudCoordinador | null>(null);
  const [especialistas, setEspecialistas] = useState<Usuario[]>([]);
  const [especialistaId, setEspecialistaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [hora, setHora] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');
  const [bloques, setBloques] = useState<{ hora: string; ocupado: boolean }[]>([]);

  const [cargando, setCargando] = useState(true);
  const [cargandoBloques, setCargandoBloques] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!Number.isFinite(id)) {
      setError('ID de solicitud inválido.');
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    Promise.all([
      coordinadorMockService.obtenerSolicitud(id),
      coordinadorEstudiantesService.listarEspecialistas(),
    ])
      .then(([s, esp]) => {
        setSolicitud(s);
        setEspecialistas(esp);
        if (s?.especialistaAsignadoId) setEspecialistaId(s.especialistaAsignadoId);
      })
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la información.')))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!especialistaId || !fecha) {
      setBloques([]);
      return;
    }
    setCargandoBloques(true);
    coordinadorMockService
      .obtenerDisponibilidad(especialistaId, fecha)
      .then(setBloques)
      .finally(() => setCargandoBloques(false));
  }, [especialistaId, fecha]);

  const diaHabil = esDiaHabil(fecha);

  const nombreEspecialistaSeleccionado = useMemo(
    () => especialistas.find((e) => e.id === especialistaId)?.nombres,
    [especialistas, especialistaId]
  );

  async function confirmarAsignacion() {
    if (!solicitud || !especialistaId || !hora) return;
    const especialista = especialistas.find((e) => e.id === especialistaId);
    if (!especialista) return;

    setEnviando(true);
    setError(null);
    setExito(null);
    try {
      await coordinadorMockService.asignarEspecialista({
        solicitudId: solicitud.id,
        especialistaId: especialista.id,
        nombreEspecialista: `${especialista.nombres} ${especialista.apellidos}`,
        fechaISO: fecha,
        hora,
        motivo: motivo.trim() || 'Asignación estándar por disponibilidad.',
      });
      setExito(
        `Cita asignada. Se simuló el envío de un correo a ${solicitud.correoEstudiante} informando ` +
          `que fue asignado con ${especialista.nombres} ${especialista.apellidos} el ${fecha} a las ${hora}.`
      );
      cargar();
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo asignar la cita.'));
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando…</p>;

  if (!solicitud) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? 'Solicitud no encontrada.'}
        </p>
        <Link to="/coordinador/solicitudes" className="mt-3 inline-block text-sm text-brand-700 hover:underline">
          ← Volver a Solicitudes
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/coordinador/solicitudes" className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a Solicitudes
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-800">{solicitud.nombreEstudiante}</h1>
            <p className="text-sm text-slate-500">
              {solicitud.cedulaEstudiante} · {solicitud.carreraEstudiante} · {solicitud.correoEstudiante}
            </p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${COLOR_ESTADO_SOLICITUD[solicitud.estado]}`}>
            {NOMBRE_ESTADO_SOLICITUD[solicitud.estado]}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Servicio solicitado: <strong>{NOMBRE_TIPO_PSICOLOGIA[solicitud.tipoPsicologia]}</strong>
        </p>
        {solicitud.motivoRechazo && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            El estudiante rechazó la hora anterior. Motivo: {solicitud.motivoRechazo}
          </p>
        )}
      </div>

      {exito && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{exito}</p>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Selección de especialista */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">1. Especialista</h2>
            <p className="mt-1 text-xs text-slate-500">
              Datos reales (GET /admin/users). El backend no guarda a qué tipo de psicología
              se dedica cada especialista, así que verifica la especialidad manualmente.
            </p>
            <div className="mt-3 space-y-2">
              {especialistas.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setEspecialistaId(e.id);
                    setHora(null);
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    especialistaId === e.id
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-medium">
                    {e.nombres} {e.apellidos}
                  </p>
                  <p className="text-xs text-slate-500">{e.datosEspecialista?.especialidad ?? 'Sin especialidad registrada'}</p>
                </button>
              ))}
              {especialistas.length === 0 && (
                <p className="text-xs text-slate-400">No hay especialistas registrados todavía.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-700">2. Motivo de la asignación</h2>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ej: Asignado según disponibilidad y especialidad en manejo de ansiedad."
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Calendario de disponibilidad */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <CalendarDays className="h-4 w-4 text-brand-600" />
              3. Fecha y hora
            </h2>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                setHora(null);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {!especialistaId ? (
            <p className="mt-6 text-sm text-slate-400">Selecciona un especialista para ver su disponibilidad.</p>
          ) : !diaHabil ? (
            <p className="mt-6 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-800">
              <Ban className="h-4 w-4 shrink-0" />
              Este día no es hábil (fin de semana o feriado nacional). Elige otra fecha.
            </p>
          ) : cargandoBloques ? (
            <p className="mt-6 text-sm text-slate-500">Consultando disponibilidad…</p>
          ) : (
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {bloques.map((b) => (
                <button
                  key={b.hora}
                  disabled={b.ocupado}
                  onClick={() => setHora(b.hora)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    b.ocupado
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through'
                      : hora === b.hora
                      ? 'border-brand-600 bg-brand-800 text-white'
                      : 'border-slate-200 text-slate-700 hover:bg-brand-50'
                  }`}
                >
                  {b.hora}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              {especialistaId && hora
                ? `Se asignará a ${nombreEspecialistaSeleccionado} el ${fecha} a las ${hora}.`
                : 'Elige especialista, fecha y hora para continuar.'}
            </p>
            <button
              onClick={confirmarAsignacion}
              disabled={!especialistaId || !hora || enviando}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {enviando ? 'Asignando…' : 'Confirmar asignación y notificar'}
            </button>
          </div>
        </div>
      </div>

      <button onClick={() => navegar('/coordinador/solicitudes')} className="mt-6 text-xs text-slate-400 hover:underline">
        Cancelar y volver al listado
      </button>
    </div>
  );
}
