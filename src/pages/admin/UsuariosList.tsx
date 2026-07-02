import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminUserService } from '../../api/adminUserService';
import { extraerMensajeError } from '../../api/client';
import type { Rol, Usuario } from '../../types/auth';

type FiltroRol = 'TODOS' | Rol;

const FILTROS_ROL: Array<{ valor: FiltroRol; etiqueta: string }> = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'ESTUDIANTE', etiqueta: 'Estudiantes' },
  { valor: 'PSICOLOGO', etiqueta: 'Especialistas' },
  { valor: 'ADMIN', etiqueta: 'Administradores' },
  { valor: 'COORDINADOR', etiqueta: 'Coordinadores' },
];

const COLOR_ROL: Record<Rol, string> = {
  ESTUDIANTE: 'bg-slate-100 text-slate-700 ring-slate-200',
  PSICOLOGO: 'bg-blue-50 text-blue-700 ring-blue-200',
  ADMIN: 'bg-purple-50 text-purple-700 ring-purple-200',
  COORDINADOR: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export function UsuariosList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroRol, setFiltroRol] = useState<FiltroRol>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [accionEnCurso, setAccionEnCurso] = useState<number | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    adminUserService
      .listarUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar la lista de usuarios.')))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return usuarios.filter((u) => {
      if (filtroRol !== 'TODOS' && u.rol !== filtroRol) return false;
      if (!termino) return true;
      return (
        `${u.nombres} ${u.apellidos}`.toLowerCase().includes(termino) ||
        u.email.toLowerCase().includes(termino) ||
        u.identificacion.toLowerCase().includes(termino)
      );
    });
  }, [usuarios, filtroRol, busqueda]);

  const conteoPorRol = useMemo(() => {
    const conteo: Record<FiltroRol, number> = {
      TODOS: usuarios.length,
      ESTUDIANTE: 0,
      PSICOLOGO: 0,
      ADMIN: 0,
      COORDINADOR: 0,
    };
    for (const u of usuarios) conteo[u.rol] += 1;
    return conteo;
  }, [usuarios]);

  async function alternarEstado(usuario: Usuario) {
    const nuevoEstado = !usuario.activo;
    const mensaje = nuevoEstado
      ? `¿Activar la cuenta de ${usuario.nombres} ${usuario.apellidos}?`
      : `¿Desactivar la cuenta de ${usuario.nombres} ${usuario.apellidos}? Se cerrarán todas sus sesiones activas.`;
    if (!window.confirm(mensaje)) return;

    setAccionEnCurso(usuario.id);
    setErrorAccion(null);
    try {
      await adminUserService.cambiarEstado(usuario.id, nuevoEstado);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === usuario.id ? { ...u, activo: nuevoEstado } : u))
      );
    } catch (err) {
      setErrorAccion(extraerMensajeError(err, 'No se pudo actualizar el estado del usuario.'));
    } finally {
      setAccionEnCurso(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra las cuentas registradas en el sistema y su estado de acceso.
          </p>
        </div>
        <Link
          to="/usuarios/nuevo-especialista"
          className="inline-flex shrink-0 items-center rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
        >
          + Registrar especialista
        </Link>
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rol</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {FILTROS_ROL.map((f) => (
              <button
                key={f.valor}
                onClick={() => setFiltroRol(f.valor)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filtroRol === f.valor
                    ? 'bg-brand-100 text-brand-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.etiqueta}
                <span className="ml-1.5 text-slate-500">({conteoPorRol[f.valor]})</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o identificación…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {errorAccion && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorAccion}</p>
      )}

      {cargando && <p className="mt-6 text-sm text-slate-500">Cargando usuarios…</p>}

      {error && !cargando && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!cargando && !error && (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {usuariosFiltrados.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              {usuarios.length === 0
                ? 'Aún no hay usuarios registrados.'
                : 'Ningún usuario coincide con los filtros aplicados.'}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Identificación</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">
                        {u.nombres} {u.apellidos}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.identificacion}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${COLOR_ROL[u.rol]}`}
                      >
                        {NOMBRE_ROL[u.rol]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                          u.activo
                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                            : 'bg-rose-50 text-rose-700 ring-rose-200'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/usuarios/${u.id}`}
                          className="text-xs font-medium text-brand-700 hover:underline"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => alternarEstado(u)}
                          disabled={accionEnCurso === u.id}
                          className={`text-xs font-medium hover:underline disabled:opacity-60 ${
                            u.activo ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {accionEnCurso === u.id
                            ? 'Actualizando…'
                            : u.activo
                            ? 'Desactivar'
                            : 'Activar'}
                        </button>
                      </div>
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

const NOMBRE_ROL: Record<Rol, string> = {
  ESTUDIANTE: 'Estudiante',
  PSICOLOGO: 'Especialista',
  ADMIN: 'Administrador',
  COORDINADOR: 'Coordinador/a',
};
