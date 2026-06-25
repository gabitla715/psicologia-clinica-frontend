import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50 px-4 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-700">Error 404</p>
      <h1 className="text-xl font-semibold text-slate-800">Esta página no existe</h1>
      <Link to="/dashboard" className="mt-2 text-sm font-medium text-brand-700 hover:underline">
        Volver al panel principal
      </Link>
    </div>
  );
}
