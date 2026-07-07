import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  UserX,
  GraduationCap,
  Stethoscope,
  ClipboardList,
  CalendarClock,
  CalendarCheck2,
  ClipboardCheck,
  FolderCheck,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { adminUserService } from '../../api/adminUserService';
import { pacienteService } from '../../api/pacienteService';
import { citaService, esProxima } from '../../api/citaService';
import { consentimientoService } from '../../api/consentimientoService';
import { extraerMensajeError } from '../../api/client';
import { mockAsignacionCita, type AsignacionExtra } from '../../mocks/mockContratoBackend';

export function DashboardHome() {
  const { usuario } = useAuth();

  if (!usuario) return null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-semibold text-slate-800">
        Hola, {usuario.nombres}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Este es tu panel principal. Aquí tienes un resumen rápido de lo más relevante hoy.
      </p>

      {(usuario.rol === 'ADMIN' || usuario.rol === 'COORDINADOR') && <PanelAdministrativo />}
      {usuario.rol === 'PSICOLOGO' && <PanelPsicologo />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Panel para ADMIN / COORDINADOR: indicadores de usuarios del sistema.
// ────────────────────────────────────────────────────────────────
function PanelAdministrativo() {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conteos, setConteos] = useState({
    total: 0,
    estudiantes: 0,
    especialistas: 0,
    activos: 0,
    inactivos: 0,
  });

  useEffect(() => {
    let activo = true;
    adminUserService
      .listarUsuarios()
      .then((usuarios) => {
        if (!activo) return;
        setConteos({
          total: usuarios.length,
          estudiantes: usuarios.filter((u) => u.rol === 'ESTUDIANTE').length,
          especialistas: usuarios.filter((u) => u.rol === 'PSICOLOGO').length,
          activos: usuarios.filter((u) => u.activo).length,
          inactivos: usuarios.filter((u) => !u.activo).length,
        });
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudieron cargar los indicadores.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaKpi
          icono={Users}
          titulo="Usuarios registrados"
          valor={cargando ? '—' : conteos.total}
          color="brand"
        />
        <TarjetaKpi
          icono={GraduationCap}
          titulo="Estudiantes"
          valor={cargando ? '—' : conteos.estudiantes}
          color="blue"
        />
        <TarjetaKpi
          icono={Stethoscope}
          titulo="Especialistas"
          valor={cargando ? '—' : conteos.especialistas}
          color="emerald"
        />
        <TarjetaKpi
          icono={UserX}
          titulo="Cuentas inactivas"
          valor={cargando ? '—' : conteos.inactivos}
          color="rose"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TarjetaAcceso
          icono={Users}
          titulo="Gestionar usuarios"
          descripcion="Registra especialistas, activa o desactiva cuentas y edita perfiles."
          ruta="/usuarios"
        />
        <TarjetaAcceso
          icono={UserCheck}
          titulo="Registrar especialista"
          descripcion="Crea una cuenta nueva de Psicología Clínica o General."
          ruta="/usuarios/nuevo-especialista"
        />
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-4">
        <p className="text-sm font-medium text-slate-700">Reportes y auditoría</p>
        <p className="mt-1 text-sm text-slate-500">
          Estos módulos se habilitarán cuando se tenga más cifras.
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Panel para PSICOLOGO: 6 indicadores + estudiantes designados
// pendientes de ficha (en vez de la lista de próximas citas, que ahora
// vive en la Agenda y en la tabla "Casos asignados" de /pacientes).
// ────────────────────────────────────────────────────────────────
function PanelPsicologo() {
  const { usuario } = useAuth();
  const especialistaId = usuario?.datosEspecialista?.id;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState({
    totalPacientes: 0,
    casosActivos: 0,
    casosCerrados: 0,
    citasHoy: 0,
    proximasCitas: 0,
    consentimientosPendientes: 0,
  });
  const [designados, setDesignados] = useState<AsignacionExtra[]>([]);

  useEffect(() => {
    let activo = true;
    Promise.all([pacienteService.listarMisPacientes(), citaService.listarMisCitas()])
      .then(async ([pacientes, citas]) => {
        if (!activo) return;

        const hoy = new Date();
        const activas = pacientes.filter((p) => p.estado === 'ACTIVA');
        const cerradas = pacientes.filter((p) => p.estado !== 'ACTIVA');
        const citasHoy = citas.filter(
          (c) => c.fechaHora.toDateString() === hoy.toDateString() && c.estado !== 'CANCELADA'
        );

        // Consentimientos pendientes: solo tiene sentido para casos activos.
        const consentimientos = await Promise.all(
          activas.map((p) => consentimientoService.obtenerPorFicha(p.id).catch(() => null))
        );
        const pendientes = consentimientos.filter((c) => c === null).length;

        if (!activo) return;
        setKpis({
          totalPacientes: pacientes.length,
          casosActivos: activas.length,
          casosCerrados: cerradas.length,
          citasHoy: citasHoy.length,
          proximasCitas: citas.filter(esProxima).length,
          consentimientosPendientes: pendientes,
        });

        if (especialistaId) {
          setDesignados(mockAsignacionCita.listarDesignadosSinFicha(especialistaId));
        }
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudieron cargar tus indicadores.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [especialistaId]);

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TarjetaKpi icono={ClipboardList} titulo="Total pacientes asignados" valor={cargando ? '—' : kpis.totalPacientes} color="brand" />
        <TarjetaKpi icono={UserCheck} titulo="Casos activos" valor={cargando ? '—' : kpis.casosActivos} color="emerald" />
        <TarjetaKpi icono={FolderCheck} titulo="Casos cerrados" valor={cargando ? '—' : kpis.casosCerrados} color="blue" />
        <TarjetaKpi icono={CalendarClock} titulo="Citas de hoy" valor={cargando ? '—' : kpis.citasHoy} color="brand" />
        <TarjetaKpi icono={CalendarCheck2} titulo="Próximas citas" valor={cargando ? '—' : kpis.proximasCitas} color="blue" />
        <TarjetaKpi icono={ClipboardCheck} titulo="Consentimientos pendientes" valor={cargando ? '—' : kpis.consentimientosPendientes} color="rose" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-800">Estudiantes designados</p>
          <Link
            to="/pacientes"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
          >
            Ver todos los casos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {cargando ? (
          <p className="px-5 py-6 text-sm text-slate-500">Cargando…</p>
        ) : designados.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">
            No tienes estudiantes designados pendientes de ficha.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {designados.slice(0, 5).map((d) => (
              <li key={d.solicitudId} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {d.solicitud.nombreEstudiante.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{d.solicitud.nombreEstudiante}</p>
                    <p className="text-xs text-slate-500">
                      {d.solicitud.tipoPsicologia === 'CLINICA' ? 'Psicología Clínica' : 'Psicología General'}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/pacientes/nuevo?estudianteId=${d.solicitud.estudianteId}&solicitudId=${d.solicitudId}&nombre=${encodeURIComponent(
                    d.solicitud.nombreEstudiante
                  )}&tipo=${d.solicitud.tipoPsicologia}`}
                  className="shrink-0 rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800"
                >
                  Abrir ficha
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Componentes de presentación reutilizables
// ────────────────────────────────────────────────────────────────
type ColorKpi = 'brand' | 'blue' | 'emerald' | 'rose';

const ESTILOS_KPI: Record<ColorKpi, string> = {
  brand: 'bg-brand-50 text-brand-700',
  blue: 'bg-blue-50 text-blue-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
};

function TarjetaKpi({
  icono: Icono,
  titulo,
  valor,
  color,
}: {
  icono: typeof Users;
  titulo: string;
  valor: string | number;
  color: ColorKpi;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`inline-flex items-center justify-center rounded-lg p-2 ${ESTILOS_KPI[color]}`}>
        <Icono className="h-4 w-4" strokeWidth={2} />
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{valor}</p>
      <p className="text-xs text-slate-500">{titulo}</p>
    </div>
  );
}

function TarjetaAcceso({
  icono: Icono,
  titulo,
  descripcion,
  ruta,
}: {
  icono: typeof Users;
  titulo: string;
  descripcion: string;
  ruta: string;
}) {
  return (
    <Link
      to={ruta}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
    >
      <div className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-50 p-2 text-brand-700">
        <Icono className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-800">{titulo}</p>
        <p className="mt-0.5 text-xs text-slate-500">{descripcion}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
    </Link>
  );
}
