import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserCheck, UserX, GraduationCap } from 'lucide-react';
import { coordinadorEstudiantesService } from '../../api/coordinadorEstudiantesService';
import type { Usuario } from '../../types/auth';
import { extraerMensajeError } from '../../api/client';

/**
 * Listado real de estudiantes (GET /admin/users filtrado por rol),
 * con activar/desactivar (PATCH /admin/users/{id}/status) y acceso a la
 * edición completa (reutiliza /usuarios/:userId, ya construido en el
 * Sprint F para ADMIN/COORDINADOR).
 */
export function CoordinadorEstudiantes() {
  const [estudiantes, setEstudiantes] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cambiandoId, setCambiandoId] = useState<number | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    coordinadorEstudiantesService
      .listarEstudiantes()
      .then(setEstudiantes)
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la lista de estudiantes.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return estudiantes;
    return estudiantes.filter(
      (e) =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) ||
        e.identificacion.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.datosEstudiante?.carrera ?? '').toLowerCase().includes(q)
    );
  }, [estudiantes, busqueda]);

  async function alternarEstado(u: Usuario) {
    setCambiandoId(u.id);
    try {
      await coordinadorEstudiantesService.cambiarEstadoEstudiante(u.id, !u.activo);
      setEstudiantes((prev) => prev.map((e) => (e.id === u.id ? { ...e, activo: !e.activo } : e)));
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cambiar el estado del estudiante.'));
    } finally {
      setCambiandoId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-800">
            <GraduationCap className="h-5 w-5 text-brand-600" />
            Estudiantes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Listado real de estudiantes registrados en el sistema ({estudiantes.length} en total).
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, cédula, correo o carrera…"
          className="w-full border-none text-sm text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {cargando ? (
        <p className="mt-6 text-sm text-slate-500">Cargando estudiantes…</p>
      ) : filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          No se encontraron estudiantes con ese criterio.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Estudiante</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Cédula</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Carrera</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Correo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.nombres} {u.apellidos}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.identificacion}</td>
                  <td className="px-4 py-3 text-slate-600">{u.datosEstudiante?.carrera ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        u.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/usuarios/${u.id}`}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => alternarEstado(u)}
                        disabled={cambiandoId === u.id}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 ${
                          u.activo
                            ? 'border border-red-200 text-red-700 hover:bg-red-50'
                            : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.activo ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
