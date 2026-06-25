import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { Rol } from '../../types/auth';

interface ItemMenu {
  etiqueta: string;
  ruta: string;
  roles: Rol[];
}


const MENU: ItemMenu[] = [
  { etiqueta: 'Panel principal', ruta: '/dashboard', roles: ['ADMIN', 'PSICOLOGO', 'COORDINADOR'] },
  { etiqueta: 'Mi solicitud', ruta: '/mi-solicitud', roles: ['ESTUDIANTE'] },
  { etiqueta: 'Pacientes', ruta: '/pacientes', roles: ['ADMIN', 'PSICOLOGO', 'COORDINADOR'] },
  { etiqueta: 'Fichas clínicas', ruta: '/fichas', roles: ['PSICOLOGO'] },
  { etiqueta: 'Agenda de citas', ruta: '/citas', roles: ['PSICOLOGO', 'COORDINADOR'] },
  { etiqueta: 'Reportes', ruta: '/reportes', roles: ['ADMIN', 'COORDINADOR'] },
  { etiqueta: 'Usuarios', ruta: '/usuarios', roles: ['ADMIN'] },
  { etiqueta: 'Auditoría', ruta: '/auditoria', roles: ['ADMIN', 'PSICOLOGO'] },
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
      <aside className="w-60 shrink-0 border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">UCE</p>
          <p className="text-sm font-semibold text-slate-800">Bienestar Estudiantil</p>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {itemsVisibles.map((item) => (
            <NavLink
              key={item.ruta}
              to={item.ruta}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-100 text-brand-800' : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {usuario.nombres} {usuario.apellidos}
            </p>
            <p className="text-xs text-slate-500">{NOMBRE_ROL[usuario.rol]}</p>
          </div>
          <button
            onClick={() => cerrarSesion()}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
