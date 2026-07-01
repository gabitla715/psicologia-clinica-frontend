import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { HomePage } from '../pages/public/HomePage';
import { TermsPage } from '../pages/public/TermsPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardHome } from '../pages/dashboard/DashboardHome';
import { MiSolicitud } from '../pages/estudiante/MiSolicitud';
import { ElegirServicio } from '../pages/estudiante/ElegirServicio';
import { MisPacientes } from '../pages/psicologo/MisPacientes';
import { NuevaFicha } from '../pages/psicologo/NuevaFicha';
import { DetalleFicha } from '../pages/psicologo/DetalleFicha';
import { EntrevistaInicialForm } from '../pages/psicologo/EntrevistaInicialForm';
import { ConsentimientoForm } from '../pages/psicologo/ConsentimientoForm';
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
      <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
      <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
      <Route path="/no-autorizado" element={<Unauthorized />} />

      <Route element={<PrivateRoute />}>
        <Route path="/cambiar-contrasena" element={<ChangePasswordPage />} />

        {/* Elegir servicio: solo estudiantes, FUERA del AppLayout porque
            no debe mostrar el menú lateral. */}
        <Route element={<PrivateRoute rolesPermitidos={['ESTUDIANTE']} />}>
          <Route path="/elegir-servicio" element={<ElegirServicio />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<PrivateRoute rolesPermitidos={['ADMIN', 'PSICOLOGO', 'COORDINADOR']} />}>
            <Route path="/dashboard" element={<DashboardHome />} />
          </Route>

          <Route element={<PrivateRoute rolesPermitidos={['ESTUDIANTE']} />}>
            <Route path="/mi-solicitud" element={<MiSolicitud />} />
          </Route>

          {/* Sprint B: módulos clínicos del psicólogo. */}
          <Route element={<PrivateRoute rolesPermitidos={['PSICOLOGO', 'ADMIN', 'COORDINADOR']} />}>
            <Route path="/pacientes" element={<MisPacientes />} />
            <Route path="/pacientes/:fichaId" element={<DetalleFicha />} />
          </Route>
          <Route element={<PrivateRoute rolesPermitidos={['PSICOLOGO']} />}>
            <Route path="/pacientes/nuevo" element={<NuevaFicha />} />
            <Route path="/pacientes/:fichaId/entrevista" element={<EntrevistaInicialForm />} />
            <Route path="/pacientes/:fichaId/consentimiento" element={<ConsentimientoForm />} />
          </Route>

          {/* Agrega aquí /citas, /sesiones, /reportes, /usuarios, /auditoria
              en los próximos sprints. */}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
