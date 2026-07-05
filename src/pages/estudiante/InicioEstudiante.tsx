import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, MapPin } from 'lucide-react';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { coordinadorMockService } from '../../api/coordinadorMockService';
import { extraerMensajeError } from '../../api/client';
import { ProcesoCard } from '../../components/estudiante/ProcesoCard';
import { ServiciosTabs } from '../../components/estudiante/ServiciosTabs';
import { useProcesosEstudiante } from './useProcesosEstudiante';

export function InicioEstudiante() {
  const { usuario, procesosActivos, cargando, error, recargar, solicitarServicio } = useProcesosEstudiante();

  const [procesando, setProcesando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  if (!usuario) return null;

  async function confirmar(solicitudId: number) {
    setProcesando(true);
    setErrorAccion(null);
    try {
      await coordinadorMockService.confirmarAsignacion(solicitudId);
      setAviso('Confirmaste tu cita. Te esperamos en la fecha y hora indicadas.');
      await recargar();
    } catch (err) {
      setErrorAccion(extraerMensajeError(err, 'No se pudo confirmar la cita.'));
    } finally {
      setProcesando(false);
    }
  }

  async function rechazar(solicitudId: number, motivo: string) {
    if (!motivo) return;
    setProcesando(true);
    setErrorAccion(null);
    try {
      await coordinadorMockService.rechazarYSolicitarReagenda(solicitudId, motivo);
      setAviso('Se notificó al coordinador que necesitas otro horario. Te contactaremos pronto.');
      await recargar();
    } catch (err) {
      setErrorAccion(extraerMensajeError(err, 'No se pudo enviar tu solicitud de reagenda.'));
    } finally {
      setProcesando(false);
    }
  }

  async function agendar(tipo: 'GENERAL' | 'CLINICA') {
    setProcesando(true);
    setErrorAccion(null);
    try {
      await solicitarServicio(tipo);
      setAviso(
        `Tu solicitud de ${NOMBRE_TIPO_PSICOLOGIA[tipo]} fue enviada. Un profesional del Área de Bienestar Estudiantil la revisará pronto.`
      );
    } catch (err) {
      setErrorAccion(extraerMensajeError(err, 'No se pudo enviar tu solicitud.'));
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-800">Hola, {usuario.nombres} 👋</h1>
      <p className="mt-1 text-sm text-slate-500">
        Este es el resumen de tu proceso de atención psicológica. Puedes solicitar Psicología
        General o Psicología Clínica cuando lo necesites.
      </p>

      {cargando && (
        <div className="mt-6 animate-pulse rounded-2xl border border-slate-200 bg-white p-8">
          <div className="h-4 w-40 rounded bg-slate-100" />
          <div className="mt-4 h-6 w-64 rounded bg-slate-100" />
        </div>
      )}

      {!cargando && error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!cargando && !error && (
        <>
          {aviso && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{aviso}</p>
          )}
          {errorAccion && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorAccion}</p>
          )}

          {/* Procesos activos: uno por cada servicio que el estudiante ya solicitó */}
          {procesosActivos.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                Todavía no tienes ninguna solicitud de atención.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Conoce nuestros servicios más abajo y agenda tu cita cuando quieras.
              </p>
            </div>
          )}

          <div className="mt-6 space-y-6">
            {procesosActivos.map((proceso) => (
              <ProcesoCard
                key={proceso.tipo}
                proceso={proceso}
                procesando={procesando}
                onConfirmar={() => confirmar(proceso.solicitud!.id)}
                onRechazar={(motivo) => rechazar(proceso.solicitud!.id, motivo)}
              />
            ))}
          </div>

          {/* Resumen rápido, solo si hay al menos un proceso activo */}
          {procesosActivos.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {procesosActivos.map((p) => (
                <TarjetaResumen
                  key={p.tipo}
                  icono={<Stethoscope className="h-4 w-4" />}
                  etiqueta={NOMBRE_TIPO_PSICOLOGIA[p.tipo]}
                  valor={p.progreso.tituloEstado}
                />
              ))}
              <TarjetaResumen icono={<MapPin className="h-4 w-4" />} etiqueta="Modalidad" valor="Presencial" />
            </div>
          )}

          {/* Accesos rápidos */}
          {procesosActivos.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link to="/mi-cita" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:shadow-md">
                📅 Ver mi cita
              </Link>
              <Link to="/estado-solicitud" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:shadow-md">
                📋 Estado de mi solicitud
              </Link>
              <Link to="/historial" className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:shadow-md">
                📄 Historial de atenciones
              </Link>
            </div>
          )}

          {/* Nuestros servicios: el estudiante puede agendar cuando quiera */}
          <div className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Nuestros servicios</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              ¿Qué necesitas hoy? Agenda tu cita cuando quieras
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Puedes solicitar Psicología General y Psicología Clínica de forma independiente,
              las veces que lo necesites.
            </p>

            <div className="mt-5">
              <ServiciosTabs
                tieneProcesoActivo={(tipo) => procesosActivos.some((p) => p.tipo === tipo)}
                onAgendar={agendar}
                cargando={procesando}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaResumen({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {icono}
        <p className="text-[11px] uppercase tracking-wide">{etiqueta}</p>
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold text-slate-800">{valor}</p>
    </div>
  );
}
