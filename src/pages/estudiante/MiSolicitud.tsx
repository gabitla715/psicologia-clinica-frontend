import { useAuth } from '../../auth/AuthContext';

const NOMBRE_SERVICIO: Record<string, string> = {
  CLINICA: 'Psicología Clínica',
  GENERAL: 'Psicología General',
};

export function MiSolicitud() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold text-slate-800">Hola, {usuario.nombres}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Esta es tu solicitud de atención psicológica.
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs uppercase tracking-wide text-slate-400">Servicio solicitado</p>
        <p className="mt-1 text-base font-medium text-slate-800">
          {usuario.servicioInteres ? NOMBRE_SERVICIO[usuario.servicioInteres] : 'Por definir'}
        </p>

        <p className="mt-4 text-xs uppercase tracking-wide text-slate-400">Estado</p>
        <span className="mt-1 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          Pendiente de asignación
        </span>

        <p className="mt-4 text-sm text-slate-500">
          Un profesional del Área de Bienestar Estudiantil revisará tu solicitud y se pondrá
          en contacto contigo a través de tu correo institucional para agendar tu primera cita.
        </p>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Nota de desarrollo: esta pantalla es un marcador de posición. La asignación real de
        citas, profesional y horario se implementa en los sprints de Agenda (Capítulo 4,
        Sprint 4) y todavía no está conectada a un backend funcional.
      </p>
    </div>
  );
}
