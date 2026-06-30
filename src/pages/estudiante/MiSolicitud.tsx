import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  fichaService,
  type Ficha,
  type TipoPsicologia,
  NOMBRE_ESTADO_FICHA,
  COLOR_ESTADO_FICHA,
  NOMBRE_TIPO_PSICOLOGIA,
} from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';

export function MiSolicitud() {
  const { usuario } = useAuth();
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tipo de psicología que el estudiante eligió al registrarse.
  // Se guardó en localStorage durante el registro (mapearPerfilBackendAUsuario).
  const tipoSolicitado: TipoPsicologia = usuario?.servicioInteres ?? 'GENERAL';

  useEffect(() => {
    if (!usuario) return;

    let activo = true;
    setCargando(true);
    setError(null);

    fichaService
      .obtenerActiva(usuario.id, tipoSolicitado)
      .then((res) => {
        if (activo) setFicha(res);
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudo cargar tu solicitud.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [usuario, tipoSolicitado]);

  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">Hola, {usuario.nombres}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Aquí puedes ver el estado de tu solicitud de atención psicológica.
      </p>

      {/* Tarjeta con la solicitud */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Servicio solicitado
            </p>
            <p className="mt-1 text-base font-medium text-slate-800">
              {NOMBRE_TIPO_PSICOLOGIA[tipoSolicitado]}
            </p>
          </div>

          {cargando && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Consultando…
            </span>
          )}

          {!cargando && !error && ficha && (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${COLOR_ESTADO_FICHA[ficha.estado]}`}
            >
              {NOMBRE_ESTADO_FICHA[ficha.estado]}
            </span>
          )}

          {!cargando && !error && !ficha && (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              Pendiente de asignación
            </span>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {!cargando && !error && !ficha && (
          <div className="mt-5 space-y-3 text-sm text-slate-500">
            <p>
              Hemos recibido tu solicitud. Un profesional del Área de Bienestar Estudiantil
              revisará tu caso y se pondrá en contacto contigo a través de tu correo
              institucional para abrir tu ficha clínica y agendar tu primera cita.
            </p>
            <p className="text-xs text-slate-400">
              Mientras tanto, mantén actualizada tu información de contacto.
            </p>
          </div>
        )}

        {!cargando && !error && ficha && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            {ficha.nombreEspecialista && (
              <Dato
                titulo="Profesional asignado"
                valor={ficha.nombreEspecialista}
              />
            )}
            {ficha.motivoConsulta && (
              <Dato titulo="Motivo de consulta registrado" valor={ficha.motivoConsulta} />
            )}
            <Dato
              titulo="Apertura de ficha"
              valor={ficha.fechaCreacion.toLocaleDateString('es-EC', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            />
            <Dato
              titulo="Última actualización"
              valor={ficha.fechaActualizacion.toLocaleString('es-EC')}
            />
          </div>
        )}
      </div>

      {/* Información de contacto del estudiante */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-700">Tus datos de contacto</h2>
        <p className="mt-1 text-xs text-slate-500">
          Si necesitas actualizar algún dato, comunícate con Bienestar Estudiantil.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Dato titulo="Correo institucional" valor={usuario.email} />
          {usuario.telefono && <Dato titulo="Teléfono" valor={usuario.telefono} />}
          <Dato titulo="Cédula" valor={usuario.identificacion} />
          {usuario.datosEstudiante?.carrera && (
            <Dato titulo="Carrera" valor={usuario.datosEstudiante.carrera} />
          )}
          {usuario.datosEstudiante?.semestre && (
            <Dato titulo="Semestre" valor={usuario.datosEstudiante.semestre} />
          )}
        </div>
      </div>
    </div>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{valor}</p>
    </div>
  );
}
