import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Users,
  BarChart3,
  ShieldCheck,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import type { Rol } from '../../types/auth';
import { NotificacionesBadge } from './NotificacionesBadge';
import logoBienestar from '../../assets/images/logo-bienestar-universitario.png';

interface ItemMenu {
  etiqueta: string;
  ruta: string;
  icono: LucideIcon;
  roles: Rol[];
}

// Nota: "Pacientes" y "Agenda de citas" se restringen solo a PSICOLOGO.
// El backend exige que el usuario autenticado tenga un perfil de
// Specialist para /fichas/mis-fichas y /citas/mis-citas
// (ver comentarios en AppRoutes.tsx); ADMIN/COORDINADOR no tienen ese
// perfil, así que antes veían "Especialista no encontrado" al entrar.
const MENU: ItemMenu[] = [
  { etiqueta: 'Panel principal', ruta: '/dashboard', icono: LayoutDashboard, roles: ['ADMIN', 'PSICOLOGO', 'COORDINADOR'] },
  { etiqueta: 'Mi solicitud', ruta: '/mi-solicitud', icono: ClipboardList, roles: ['ESTUDIANTE'] },
  { etiqueta: 'Pacientes', ruta: '/pacientes', icono: ClipboardList, roles: ['PSICOLOGO'] },
  { etiqueta: 'Agenda de citas', ruta: '/citas', icono: CalendarDays, roles: ['PSICOLOGO'] },
  { etiqueta: 'Usuarios', ruta: '/usuarios', icono: Users, roles: ['ADMIN', 'COORDINADOR'] },
  { etiqueta: 'Reportes', ruta: '/reportes', icono: BarChart3, roles: ['ADMIN', 'COORDINADOR'] },
  { etiqueta: 'Auditoría', ruta: '/auditoria', icono: ShieldCheck, roles: ['ADMIN'] },
];

const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  PSICOLOGO: 'Psicólogo/a',
  COORDINADOR: 'Coordinador/a',
  ESTUDIANTE: 'Estudiante',
};

export function AppLayout() {
  const { usuario, cerrarSesion } = useAuth();

  if (!usuario) return null;

  const itemsVisibles = MENU.filter((item) => item.roles.includes(usuario.rol));

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Sidebar ── */}
      <aside className="flex w-64 shrink-0 flex-col bg-brand-800">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
          <img
            src={logoBienestar}
            alt="Bienestar Estudiantil UCE"
            className="h-11 w-11 rounded-lg bg-white/90 object-contain p-1"
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-200">
              UCE
            </p>
            <p className="text-sm font-semibold leading-tight text-white">
              Bienestar Estudiantil
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {itemsVisibles.map((item) => {
            const Icono = item.icono;
            return (
              <NavLink
                key={item.ruta}
                to={item.ruta}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-brand-800 shadow-sm'
                      : 'text-brand-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icono className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                {item.etiqueta}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] text-brand-200">
            Oficina de Bienestar Universitario
          </p>
          <p className="text-[11px] text-brand-300">Facultad de Filosofía · UCE</p>
        </div>
      </aside>

      {/* ── Contenido ── */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between bg-red-700 px-6 py-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-white">
              {usuario.nombres} {usuario.apellidos}
            </p>
            <p className="text-xs text-red-100">{NOMBRE_ROL[usuario.rol]}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificacionesBadge />
            <button
              onClick={() => cerrarSesion()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-brand-800 hover:bg-brand-50"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
