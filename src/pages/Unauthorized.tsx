import { Link } from 'react-router-dom';

export function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-red-700">Acceso restringido</p>
      <h1 className="text-xl font-semibold text-slate-800">
        Tu rol no tiene permiso para ver esta sección
      </h1>
      <Link to="/dashboard" className="mt-2 text-sm font-medium text-sage-700 hover:underline">
        Volver al panel principal
      </Link>
    </div>
  );
}
