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
import { InicioEstudiante } from '../pages/estudiante/InicioEstudiante';
import { MiCita } from '../pages/estudiante/MiCita';
import { EstadoSolicitud } from '../pages/estudiante/EstadoSolicitud';
import { MisDatos } from '../pages/estudiante/MisDatos';
import { HistorialAtenciones } from '../pages/estudiante/HistorialAtenciones';
import { Ayuda } from '../pages/estudiante/Ayuda';
import { MisPacientes } from '../pages/psicologo/MisPacientes';
import { NuevaFicha } from '../pages/psicologo/NuevaFicha';
import { DetalleFicha } from '../pages/psicologo/DetalleFicha';
import { EntrevistaInicialForm } from '../pages/psicologo/EntrevistaInicialForm';
import { ConsentimientoForm } from '../pages/psicologo/ConsentimientoForm';
import { PlanIntervencionForm } from '../pages/psicologo/PlanIntervencionForm';
import { NuevaSesion } from '../pages/psicologo/NuevaSesion';
import { HistorialSesiones } from '../pages/psicologo/HistorialSesiones';
import { DerivacionForm } from '../pages/psicologo/DerivacionForm';
import { DesistimientoForm } from '../pages/psicologo/DesistimientoForm';
import { AgendaCitas } from '../pages/psicologo/AgendaCitas';
import { NuevaCita } from '../pages/psicologo/NuevaCita';
import { CalendarioDisponibilidad } from '../pages/psicologo/CalendarioDisponibilidad';
import { Notificaciones } from '../pages/Notificaciones';
import { UsuariosList } from '../pages/admin/UsuariosList';
import { RegistrarEspecialista } from '../pages/admin/RegistrarEspecialista';
import { EditarUsuario } from '../pages/admin/EditarUsuario';
import { CoordinadorSolicitudes } from '../pages/coordinador/CoordinadorSolicitudes';
import { AsignarEspecialista } from '../pages/coordinador/AsignarEspecialista';
import { CoordinadorEstudiantes } from '../pages/coordinador/CoordinadorEstudiantes';
import { CoordinadorEspecialistas } from '../pages/coordinador/CoordinadorEspecialistas';
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
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<PrivateRoute rolesPermitidos={['ADMIN', 'PSICOLOGO', 'COORDINADOR']} />}>
            <Route path="/dashboard" element={<DashboardHome />} />
          </Route>

          <Route element={<PrivateRoute rolesPermitidos={['ESTUDIANTE']} />}>
            {/* "/mi-solicitud" es el destino directo del login/registro del
                estudiante: ya no existe una pantalla previa de "elegir
                servicio" — el estudiante entra directo a su panel y desde
                ahí solicita Psicología General y/o Clínica cuando quiera. */}
            <Route path="/mi-solicitud" element={<InicioEstudiante />} />
            <Route path="/mi-cita" element={<MiCita />} />
            <Route path="/estado-solicitud" element={<EstadoSolicitud />} />
            <Route path="/mis-datos" element={<MisDatos />} />
            <Route path="/historial" element={<HistorialAtenciones />} />
            <Route path="/ayuda" element={<Ayuda />} />
          </Route>


          <Route element={<PrivateRoute rolesPermitidos={['PSICOLOGO']} />}>
            <Route path="/pacientes" element={<MisPacientes />} />
            <Route path="/pacientes/:fichaId" element={<DetalleFicha />} />
            <Route path="/pacientes/:fichaId/sesiones" element={<HistorialSesiones />} />
          </Route>
          <Route element={<PrivateRoute rolesPermitidos={['PSICOLOGO']} />}>
            <Route path="/pacientes/nuevo" element={<NuevaFicha />} />
            <Route path="/pacientes/:fichaId/entrevista" element={<EntrevistaInicialForm />} />
            <Route path="/pacientes/:fichaId/consentimiento" element={<ConsentimientoForm />} />

            {/* Sprint C: plan, sesiones, cierre. */}
            <Route path="/pacientes/:fichaId/plan" element={<PlanIntervencionForm />} />
            <Route path="/pacientes/:fichaId/sesiones/nueva" element={<NuevaSesion />} />
            <Route path="/pacientes/:fichaId/derivacion" element={<DerivacionForm />} />
            <Route path="/pacientes/:fichaId/desistimiento" element={<DesistimientoForm />} />
          </Route>

   
          <Route element={<PrivateRoute rolesPermitidos={['PSICOLOGO']} />}>
            <Route path="/citas" element={<AgendaCitas />} />
            <Route path="/citas/nueva" element={<NuevaCita />} />
            <Route path="/citas/calendario" element={<CalendarioDisponibilidad />} />
          </Route>


          <Route path="/notificaciones" element={<Notificaciones />} />


          {/* Gestión de cuentas (crear/editar/activar/desactivar) es
              EXCLUSIVA de ADMIN. Antes también incluía a COORDINADOR:
              se quitó por RBAC (ver PEDIDO-PARA-GABO-v3.md). El backend
              hoy NO impide esto a nivel de API (AdminUserController
              acepta ambos roles), así que esta restricción es solo de
              frontend mientras se corrige el backend. */}
          <Route element={<PrivateRoute rolesPermitidos={['ADMIN']} />}>
            <Route path="/usuarios" element={<UsuariosList />} />
            <Route path="/usuarios/nuevo-especialista" element={<RegistrarEspecialista />} />
            <Route path="/usuarios/:userId" element={<EditarUsuario />} />
          </Route>

          {/* Módulo del coordinador: gestor operativo de atención
              psicológica (solicitudes, asignación, consulta de solo
              lectura de estudiantes/especialistas). Ya conectado al
              backend real (solicitudService, coordinadorEstudiantesService,
              horarioService) — ver notas en cada componente sobre los
              gaps de backend pendientes. */}
          <Route element={<PrivateRoute rolesPermitidos={['COORDINADOR']} />}>
            <Route path="/coordinador/solicitudes" element={<CoordinadorSolicitudes />} />
            <Route path="/coordinador/solicitudes/:solicitudId/asignar" element={<AsignarEspecialista />} />
            <Route path="/coordinador/estudiantes" element={<CoordinadorEstudiantes />} />
            <Route path="/coordinador/especialistas" element={<CoordinadorEspecialistas />} />
          </Route>

          {/* /reportes: NO implementado todavía (no existía ni siquiera
              como página — era un ítem de menú sin ruta). Ver Fase 5
              pendiente en el plan de trabajo.
              /auditoria: no implementado porque SecurityAuditLogEntity
              no está expuesto por ningún controlador REST del backend. */}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
