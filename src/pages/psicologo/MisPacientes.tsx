import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { pacienteService, type Paciente } from '../../api/pacienteService';
import {
  NOMBRE_ESTADO_FICHA,
  COLOR_ESTADO_FICHA,
  NOMBRE_TIPO_PSICOLOGIA,
  type EstadoFicha,
} from '../../api/fichaService';
import { extraerMensajeError } from '../../api/client';

type FiltroEstado = 'TODAS' | EstadoFicha;

const FILTROS: Array<{ valor: FiltroEstado; etiqueta: string }> = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'ACTIVA', etiqueta: 'Activas' },
  { valor: 'CERRADA', etiqueta: 'Cerradas' },
  { valor: 'DERIVADA', etiqueta: 'Derivadas' },
  { valor: 'DESISTIDA', etiqueta: 'Desistidas' },
];

export function MisPacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroEstado>('ACTIVA');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    pacienteService
      .listarMisPacientes()
      .then((res) => {
        if (activo) setPacientes(res);
      })
      .catch((err) => {
        if (activo) setError(extraerMensajeError(err, 'No se pudo cargar la lista de pacientes.'));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const pacientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return pacientes.filter((p) => {
      if (filtro !== 'TODAS' && p.estado !== filtro) return false;
      if (!termino) return true;
      return (
        p.nombreEstudiante.toLowerCase().includes(termino) ||
        p.correoEstudiante.toLowerCase().includes(termino)
      );
    });
  }, [pacientes, filtro, busqueda]);

  const conteoPorEstado = useMemo(() => {
    const conteo: Record<FiltroEstado, number> = {
      TODAS: pacientes.length,
      ACTIVA: 0,
      CERRADA: 0,
      DERIVADA: 0,
      DESISTIDA: 0,
    };
    for (const p of pacientes) conteo[p.estado] += 1;
    return conteo;
  }, [pacientes]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Pacientes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Fichas clínicas asignadas a tu cuenta. Selecciona un filtro o usa la búsqueda
            para encontrar un caso específico.
          </p>
        </div>
        <Link
          to="/pacientes/nuevo"
          className="inline-flex shrink-0 items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          + Abrir nueva ficha
        </Link>
      </div>

      {/* Filtros y búsqueda */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
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
              <span className="ml-1.5 text-slate-500">({conteoPorEstado[f.valor]})</span>
            </button>
          ))}
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo del estudiante…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Estados de carga / error */}
      {cargando && (
        <p className="mt-6 text-sm text-slate-500">Cargando pacientes…</p>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Tabla */}
      {!cargando && !error && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {pacientesFiltrados.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-slate-500">
                {pacientes.length === 0
                  ? 'Aún no tienes pacientes asignados.'
                  : 'Ningún paciente coincide con los filtros aplicados.'}
              </p>
              {pacientes.length === 0 && (
                <Link
                  to="/pacientes/nuevo"
                  className="mt-3 inline-block text-sm font-medium text-brand-700 hover:underline"
                >
                  Abrir la primera ficha →
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Estudiante</th>
                  <th className="px-4 py-3 font-medium">Servicio</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Apertura</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pacientesFiltrados.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.nombreEstudiante}</p>
                      <p className="text-xs text-slate-500">{p.correoEstudiante}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {NOMBRE_TIPO_PSICOLOGIA[p.tipo]}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_ESTADO_FICHA[p.estado]}`}
                      >
                        {NOMBRE_ESTADO_FICHA[p.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.fechaCreacion.toLocaleDateString('es-EC', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/pacientes/${p.id}`}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
