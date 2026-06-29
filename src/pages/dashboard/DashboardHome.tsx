import { useAuth } from '../../auth/AuthContext';

export function DashboardHome() {
  const { usuario } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800">Hola, {usuario?.nombres}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Este es el panel principal. Los módulos de pacientes, fichas, citas y reportes se
        irán habilitando en los siguientes sprints, siguiendo el orden del Capítulo 4.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Tarjeta titulo="Sesión activa" valor={usuario?.rol ?? '-'} />
        <Tarjeta titulo="Estado" valor="Conectado al backend" />
        <Tarjeta titulo="Identificación" valor={usuario?.identificacion ?? '-'} />
      </div>
    </div>
  );
}

function Tarjeta({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{valor}</p>
    </div>
  );
}
