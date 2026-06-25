import { Link } from 'react-router-dom';
import logoBienestar from '../../assets/images/logo-bienestar-universitario.png';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center">
          <img
            src={logoBienestar}
            alt="Bienestar Universitario — Universidad Central del Ecuador"
            className="h-12 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex">
          <a href="#quienes-somos" className="hover:text-slate-900">Quiénes somos</a>
          <a href="#servicios" className="hover:text-slate-900">Servicios</a>
          <a href="#ubicacion" className="hover:text-slate-900">Ubicación</a>
          <a href="#contacto" className="hover:text-slate-900">Contacto</a>
        </nav>

        <Link
          to="/ingresar"
          className="btn-primary"
        >
          Ingresar
        </Link>
      </div>
    </header>
  );
}
