import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Rol } from '../types/auth';

interface PrivateRouteProps {
  rolesPermitidos?: Rol[];
}

export function PrivateRoute({ rolesPermitidos }: PrivateRouteProps) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">
        Cargando…
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/ingresar" state={{ from: location }} replace />;
  }

  if (usuario.debeCambiarContrasena && location.pathname !== '/cambiar-contrasena') {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/no-autorizado" replace />;
  }

  return <Outlet />;
}
