import { Link } from 'react-router-dom';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-sage-700">UCE</span>
          <span className="text-sm font-semibold text-slate-800">Bienestar Estudiantil · Psicología</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#quienes-somos" className="hover:text-slate-900">Quiénes somos</a>
          <a href="#servicios" className="hover:text-slate-900">Servicios</a>
          <a href="#ubicacion" className="hover:text-slate-900">Ubicación</a>
          <a href="#contacto" className="hover:text-slate-900">Contacto</a>
        </nav>

        <Link
          to="/ingresar"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Ingresar
        </Link>
      </div>
    </header>
  );
}
