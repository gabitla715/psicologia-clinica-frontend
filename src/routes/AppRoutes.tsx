import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { HomePage } from '../pages/public/HomePage';
import { TermsPage } from '../pages/public/TermsPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardHome } from '../pages/dashboard/DashboardHome';
import { MiSolicitud } from '../pages/estudiante/MiSolicitud';
import { NotFound } from '../pages/NotFound';
import { Unauthorized } from '../pages/Unauthorized';

export function AppRoutes() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<HomePage />} />
      <Route path="/terminos" element={<TermsPage />} />
      <Route path="/ingresar" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route path="/no-autorizado" element={<Unauthorized />} />

      <Route element={<PrivateRoute />}>
        <Route path="/cambiar-contrasena" element={<ChangePasswordPage />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<PrivateRoute rolesPermitidos={['ADMIN', 'PSICOLOGO', 'COORDINADOR']} />}>
            <Route path="/dashboard" element={<DashboardHome />} />
          </Route>

          <Route element={<PrivateRoute rolesPermitidos={['ESTUDIANTE']} />}>
            <Route path="/mi-solicitud" element={<MiSolicitud />} />
          </Route>

          {/*
            Sprint 2+: agrega aquí /pacientes, /fichas, /citas, /sesiones,
            /reportes, /usuarios, /auditoria — cada una como <Route> dentro
            de este mismo <AppLayout/>. Para restringir por rol, envuelve la
            ruta en <PrivateRoute rolesPermitidos={['ADMIN','COORDINADOR']} />.
          */}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
