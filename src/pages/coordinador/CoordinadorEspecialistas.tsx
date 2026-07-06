import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Stethoscope, X, CalendarClock } from 'lucide-react';
import { coordinadorEstudiantesService } from '../../api/coordinadorEstudiantesService';
import { horarioService, NOMBRE_DIA_SEMANA, formatearHora, type HorarioDisponibleBackend } from '../../api/horarioService';
import type { Usuario } from '../../types/auth';
import { extraerMensajeError } from '../../api/client';

/**
 * Módulo independiente de Especialistas. Solo lectura para el
 * coordinador. Muestra la disponibilidad semanal declarada de cada
 * especialista al hacer clic en "Ver".
 */
export function CoordinadorEspecialistas() {
  const [especialistas, setEspecialistas] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null);
  const [horarios, setHorarios] = useState<HorarioDisponibleBackend[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    coordinadorEstudiantesService
      .listarEspecialistas()
      .then(setEspecialistas)
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la lista de especialistas.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!seleccionado) {
      setHorarios([]);
      return;
    }
    setCargandoHorarios(true);
    horarioService
      .obtenerHorariosDe(seleccionado.id)
      .then(setHorarios)
      .catch(() => setHorarios([]))
      .finally(() => setCargandoHorarios(false));
  }, [seleccionado]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return especialistas;
    return especialistas.filter(
      (e) =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.datosEspecialista?.especialidad ?? '').toLowerCase().includes(q)
    );
  }, [especialistas, busqueda]);

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
          <Stethoscope className="h-5 w-5 text-brand-600" />
          Especialistas
        </h1>
        <p className="mt-1 text-sm text-slate-500">Consulta de solo lectura ({especialistas.length} especialistas registrados).</p>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o especialidad…"
          className="w-full border-none text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="mt-6 text-sm text-slate-500">Cargando especialistas…</p>
      ) : filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No se encontraron especialistas con ese criterio.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Especialista</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Especialidad</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Correo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {e.nombres} {e.apellidos}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{e.datosEspecialista?.especialidad ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{e.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        e.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSeleccionado(e)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                {seleccionado.nombres} {seleccionado.apellidos}
              </h3>
              <button onClick={() => setSeleccionado(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <Dato etiqueta="Correo" valor={seleccionado.email} />
              <Dato etiqueta="Especialidad" valor={seleccionado.datosEspecialista?.especialidad ?? '—'} />
              <Dato etiqueta="Código profesional" valor={seleccionado.datosEspecialista?.codigoProfesional ?? '—'} />
              <Dato etiqueta="Estado" valor={seleccionado.activo ? 'Activo' : 'Inactivo'} />
            </div>

            <div className="mt-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <CalendarClock className="h-3.5 w-3.5" /> Disponibilidad semanal declarada
              </p>
              {cargandoHorarios ? (
                <p className="mt-2 text-sm text-slate-400">Consultando…</p>
              ) : horarios.filter((h) => h.activo).length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">No ha registrado horarios.</p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  {horarios
                    .filter((h) => h.activo)
                    .map((h) => (
                      <div key={h.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm">
                        <span className="text-slate-700">{NOMBRE_DIA_SEMANA[h.diaSemana]}</span>
                        <span className="text-slate-500">
                          {formatearHora(h.horaInicio)} – {formatearHora(h.horaFin)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button onClick={() => setSeleccionado(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
      <span className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</span>
      <span className="font-medium text-slate-800">{valor}</span>
    </div>
  );
}
