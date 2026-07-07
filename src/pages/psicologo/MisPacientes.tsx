import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { pacienteService } from '../../api/pacienteService';
import { entrevistaService } from '../../api/entrevistaService';
import { consentimientoService } from '../../api/consentimientoService';
import { sesionService, type Sesion } from '../../api/sesionService';
import { citaService, type Cita } from '../../api/citaService';
import { NOMBRE_TIPO_PSICOLOGIA } from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';
import {
  mockAsignacionCita,
  mockNivelAtencion,
  mockCierreCaso,
  META_NIVEL_ATENCION,
  type AsignacionExtra,
  type NivelAtencion,
} from '../../mocks/mockContratoBackend';
import { derivarEstadoCaso, META_ESTADO_CASO, accionPrincipal, type EstadoCaso } from '../../lib/estadoCaso';
import { calcularAlertas, META_ALERTA, type Alerta } from '../../lib/alertasCaso';
import { AlertTriangle } from 'lucide-react';

// Fila de la tabla "Casos asignados": puede venir de una ficha real ya
// abierta, o de un estudiante designado por el coordinador que todavía
// no tiene ficha (ver mockAsignacionCita.listarDesignadosSinFicha).
interface FilaCaso {
  key: string;
  esDesignadoSinFicha: boolean;
  fichaId: number | null;
  solicitudId: number | null;
  estudianteId: number;
  nombreEstudiante: string;
  correoEstudiante: string | null;
  tipo: 'CLINICA' | 'GENERAL';
  estadoCaso: EstadoCaso;
  nivelAtencion: NivelAtencion | null;
  ultimaSesion: Date | null;
  proximaCita: Date | null;
  alertas: Alerta[];
}

type FiltroRapido = 'TODOS' | 'ACTIVOS' | 'SIN_ENTREVISTA' | 'CON_CITAS_HOY' | 'CERRADOS';

const FILTROS: Array<{ valor: FiltroRapido; etiqueta: string }> = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'ACTIVOS', etiqueta: 'Activos' },
  { valor: 'SIN_ENTREVISTA', etiqueta: 'Sin entrevista' },
  { valor: 'CON_CITAS_HOY', etiqueta: 'Con citas hoy' },
  { valor: 'CERRADOS', etiqueta: 'Cerrados / Alta' },
];

function esMismoDia(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function MisPacientes() {
  const { usuario } = useAuth();
  const especialistaId = usuario?.datosEspecialista?.id;

  const [filas, setFilas] = useState<FilaCaso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroRapido>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    Promise.all([
      pacienteService.listarMisPacientes(),
      citaService.listarMisCitas().catch(() => [] as Cita[]),
    ])
      .then(async ([pacientes, citas]) => {
        if (!activo) return;

        // Para cada ficha real: ¿tiene entrevista? ¿cuántas sesiones?
        // (para derivar el estado enriquecido del caso).
        const detalles = await Promise.all(
          pacientes.map(async (p) => {
            const [entrevista, sesiones, consentimiento] = await Promise.all([
              entrevistaService.obtenerPorFicha(p.id).catch(() => null),
              sesionService.listarPorFicha(p.id).catch(() => [] as Sesion[]),
              consentimientoService.obtenerPorFicha(p.id).catch(() => null),
            ]);
            return { paciente: p, tieneEntrevista: !!entrevista, sesiones, tieneConsentimiento: !!consentimiento };
          })
        );
        if (!activo) return;

        const citasPorEstudiante = new Map<number, Cita[]>();
        for (const c of citas) {
          const lista = citasPorEstudiante.get(c.estudianteId) ?? [];
          lista.push(c);
          citasPorEstudiante.set(c.estudianteId, lista);
        }
        const ahora = new Date();

        const filasReales: FilaCaso[] = detalles.map(({ paciente, tieneEntrevista, sesiones, tieneConsentimiento }) => {
          const citasEstudiante = citasPorEstudiante.get(paciente.estudianteId) ?? [];
          const realizadas = citasEstudiante
            .filter((c) => c.estado === 'REALIZADA' && c.fechaHora <= ahora)
            .sort((a, b) => b.fechaHora.getTime() - a.fechaHora.getTime());
          const futuras = citasEstudiante
            .filter((c) => (c.estado === 'PENDIENTE' || c.estado === 'CONFIRMADA') && c.fechaHora >= ahora)
            .sort((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime());
          const ultimaSesion = realizadas[0]?.fechaHora ?? null;
          const proximaCita = futuras[0]?.fechaHora ?? null;

          return {
            key: `ficha-${paciente.id}`,
            esDesignadoSinFicha: false,
            fichaId: paciente.id,
            solicitudId: null,
            estudianteId: paciente.estudianteId,
            nombreEstudiante: paciente.nombreEstudiante,
            correoEstudiante: paciente.correoEstudiante,
            tipo: paciente.tipo,
            estadoCaso: derivarEstadoCaso({
              estadoFicha: paciente.estado,
              tieneEntrevista,
              numeroSesiones: sesiones.length,
              altaRegistrada: !!mockCierreCaso.obtener(paciente.id),
            }),
            nivelAtencion: mockNivelAtencion.obtener(paciente.id),
            ultimaSesion,
            proximaCita,
            alertas: calcularAlertas({
              estadoFicha: paciente.estado,
              tieneConsentimiento,
              proximaCita,
              ultimaActividad: ultimaSesion ?? paciente.fechaCreacion,
            }),
          };
        });

        const designados: FilaCaso[] = especialistaId
          ? mockAsignacionCita
              .listarDesignadosSinFicha(especialistaId)
              .map((a: AsignacionExtra) => ({
                key: `designado-${a.solicitudId}`,
                esDesignadoSinFicha: true,
                fichaId: null,
                solicitudId: a.solicitudId,
                estudianteId: a.solicitud.estudianteId,
                nombreEstudiante: a.solicitud.nombreEstudiante,
                correoEstudiante: null,
                tipo: a.solicitud.tipoPsicologia,
                estadoCaso: 'PENDIENTE_ENTREVISTA' as EstadoCaso,
                nivelAtencion: null,
                ultimaSesion: null,
                proximaCita: a.fechaHora ? new Date(a.fechaHora) : null,
                alertas: [],
              }))
          : [];

        if (activo) setFilas([...designados, ...filasReales]);
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudo cargar la lista de casos.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [especialistaId]);

  const filasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return filas.filter((f) => {
      if (filtro === 'ACTIVOS' && !['EN_TRATAMIENTO', 'SEGUIMIENTO'].includes(f.estadoCaso)) return false;
      if (filtro === 'SIN_ENTREVISTA' && f.estadoCaso !== 'PENDIENTE_ENTREVISTA') return false;
      if (filtro === 'CERRADOS' && !['ALTA', 'CERRADO', 'DERIVADO', 'DESISTIDO'].includes(f.estadoCaso)) return false;
      if (filtro === 'CON_CITAS_HOY' && !(f.proximaCita && esMismoDia(f.proximaCita, new Date()))) return false;
      if (!termino) return true;
      return (
        f.nombreEstudiante.toLowerCase().includes(termino) ||
        (f.correoEstudiante ?? '').toLowerCase().includes(termino)
      );
    });
  }, [filas, filtro, busqueda]);

  const conteo = useMemo(() => {
    const c: Record<FiltroRapido, number> = {
      TODOS: filas.length,
      ACTIVOS: 0,
      SIN_ENTREVISTA: 0,
      CON_CITAS_HOY: 0,
      CERRADOS: 0,
    };
    const hoy = new Date();
    for (const f of filas) {
      if (['EN_TRATAMIENTO', 'SEGUIMIENTO'].includes(f.estadoCaso)) c.ACTIVOS += 1;
      if (f.estadoCaso === 'PENDIENTE_ENTREVISTA') c.SIN_ENTREVISTA += 1;
      if (['CERRADO', 'DERIVADO', 'DESISTIDO', 'ALTA'].includes(f.estadoCaso)) c.CERRADOS += 1;
      if (f.proximaCita && esMismoDia(f.proximaCita, hoy)) c.CON_CITAS_HOY += 1;
    }
    return c;
  }, [filas]);

  const totalAlertas = useMemo(() => filas.reduce((acc, f) => acc + f.alertas.length, 0), [filas]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Casos asignados</h1>
          <p className="mt-1 text-sm text-slate-500">
            Estudiantes designados por el coordinador y fichas clínicas a tu cargo, en un
            solo lugar.
          </p>
        </div>
        <Link
          to="/pacientes/nuevo"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          <UserPlus className="h-4 w-4" />
          Abrir ficha manualmente
        </Link>
      </div>

      {/* Búsqueda grande */}
      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o correo del estudiante…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Alertas administrativas */}
      {totalAlertas > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Tienes {totalAlertas} {totalAlertas === 1 ? 'alerta' : 'alertas'} entre tus casos activos — revisa la columna Alertas en la tabla.
        </div>
      )}

      {/* Filtros rápidos */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            onClick={() => setFiltro(f.valor)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filtro === f.valor
                ? 'bg-brand-100 text-brand-800'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.etiqueta}
            <span className="ml-1.5 text-slate-500">({conteo[f.valor]})</span>
          </button>
        ))}
      </div>

      {cargando && <p className="mt-6 text-sm text-slate-500">Cargando casos…</p>}
      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!cargando && !error && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filasFiltradas.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                {filas.length === 0
                  ? 'Aún no tienes casos asignados.'
                  : 'Ningún caso coincide con los filtros aplicados.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Estudiante</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Nivel de atención</th>
                  <th className="px-4 py-3 font-medium">Última sesión</th>
                  <th className="px-4 py-3 font-medium">Próxima cita</th>
                  <th className="px-4 py-3 font-medium">Alertas</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filasFiltradas.map((f) => (
                  <FilaCasoTabla key={f.key} fila={f} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function FilaCasoTabla({ fila }: { fila: FilaCaso }) {
  const meta = META_ESTADO_CASO[fila.estadoCaso];
  const accion = fila.fichaId
    ? accionPrincipal(fila.estadoCaso, fila.fichaId)
    : {
        etiqueta: 'Abrir ficha e iniciar entrevista',
        ruta: `/pacientes/nuevo?estudianteId=${fila.estudianteId}&solicitudId=${fila.solicitudId}&nombre=${encodeURIComponent(
          fila.nombreEstudiante
        )}&tipo=${fila.tipo}`,
      };

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{fila.nombreEstudiante}</p>
        <p className="text-xs text-slate-500">{fila.correoEstudiante ?? '—'}</p>
      </td>
      <td className="px-4 py-3 text-slate-700">{NOMBRE_TIPO_PSICOLOGIA[fila.tipo]}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${meta.claseBadge}`}>
          {meta.etiqueta}
        </span>
      </td>
      <td className="px-4 py-3">
        {fila.nivelAtencion ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${META_NIVEL_ATENCION[fila.nivelAtencion].claseBadge}`}
          >
            {META_NIVEL_ATENCION[fila.nivelAtencion].emoji} {META_NIVEL_ATENCION[fila.nivelAtencion].etiqueta}
          </span>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {fila.ultimaSesion
          ? fila.ultimaSesion.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      <td className="px-4 py-3 text-slate-600">
        {fila.proximaCita
          ? fila.proximaCita.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—'}
      </td>
      <td className="px-4 py-3">
        {fila.alertas.length === 0 ? (
          <span className="text-xs text-slate-300">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {fila.alertas.map((a) => (
              <span
                key={a.tipo}
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${META_ALERTA[a.tipo].claseBadge}`}
              >
                {a.etiqueta}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <Link to={accion.ruta} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
          {accion.etiqueta} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}
