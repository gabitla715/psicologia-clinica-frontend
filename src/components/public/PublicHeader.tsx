import { Link } from 'react-router-dom';
import logoBienestar from '../../assets/images/logo-bienestar.png';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
    <Link to="/" className="flex items-center">
      <img
        src={logoBienestar}
        alt="Bienestar Universitario — Universidad Central del Ecuador"
        className="h-16 w-auto"
      />
    </Link>

    <div className="flex items-center gap-6">
      <nav className="hidden items-center gap-4 text-sm font-medium text-white sm:flex">
        <a href="#quienes-somos" className="hover:text-blue-200">Quiénes somos</a>
        <a href="#servicios" className="hover:text-blue-200">Servicios</a>
        <a href="#ubicacion" className="hover:text-blue-200">Ubicación</a>
        <a href="#contacto" className="hover:text-blue-200">Contacto</a>
      </nav>

      <Link
        to="/ingresar"
        className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-blue-50"
      >
        Ingresar
      </Link>
    </div>
  </div>
</header>
  );
}
