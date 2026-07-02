import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { adminUserService, type ActualizarUsuarioRequest } from '../../api/adminUserService';
import { extraerMensajeError } from '../../api/client';
import { CARRERAS_UCE } from '../../lib/carreras-uce';
import { REGEX_TELEFONO_EC, limpiarSoloDigitos } from '../../lib/validators';
import type { Usuario } from '../../types/auth';

// Agrupa la lista plana de carreras por facultad (mismo criterio que RegisterPage).
function agruparCarrerasPorFacultad(): Array<[string, string[]]> {
  const mapa = new Map<string, string[]>();
  for (const item of CARRERAS_UCE) {
    const lista = mapa.get(item.facultad) ?? [];
    lista.push(item.carrera);
    mapa.set(item.facultad, lista);
  }
  return Array.from(mapa.entries());
}

export function EditarUsuario() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const id = Number(userId);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<ActualizarUsuarioRequest | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [errorTelefono, setErrorTelefono] = useState<string | null>(null);

  const grupos = useMemo(() => agruparCarrerasPorFacultad(), []);

  const cargar = useCallback(() => {
    if (!Number.isFinite(id)) {
      setError('Identificador de usuario inválido.');
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    adminUserService
      .obtenerUsuario(id)
      .then((u) => {
        setUsuario(u);
        // El backend exige un PUT completo: precargamos TODOS los campos
        // que ya existen para el usuario, no solo los visibles en el form.
        setForm({
          firstName: u.nombres,
          lastName: u.apellidos,
          email: u.email,
          phone: u.telefono ?? '',
          isActive: u.activo,
          carrera: u.datosEstudiante?.carrera,
          term: u.datosEstudiante?.semestre,
          birthDate: u.datosEstudiante?.fechaNacimiento,
          address: u.datosEstudiante?.direccion,
          nationality: u.datosEstudiante?.nacionalidad,
          ethnicity: u.datosEstudiante?.etnia,
          gender: u.datosEstudiante?.genero,
          sex: u.datosEstudiante?.sexo,
          hasDisability: u.datosEstudiante?.tieneDiscapacidad,
          disabilityType: u.datosEstudiante?.tipoDiscapacidad,
          disabilityPercentage: u.datosEstudiante?.porcentajeDiscapacidad,
          conadisId: u.datosEstudiante?.conadisId,
          academicSchedule: u.datosEstudiante?.horarioAcademico,
          specialty: u.datosEspecialista?.especialidad,
          professionalCode: u.datosEspecialista?.codigoProfesional,
        });
      })
      .catch((err) => setError(extraerMensajeError(err, 'No se pudo cargar el usuario.')))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function actualizarCampo<K extends keyof ActualizarUsuarioRequest>(
    campo: K,
    valor: ActualizarUsuarioRequest[K]
  ) {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;

    if (form.phone && !REGEX_TELEFONO_EC.test(form.phone)) {
      setErrorTelefono('Debe ser un número ecuatoriano (10 dígitos comenzando con 0)');
      return;
    }
    setErrorTelefono(null);

    setGuardando(true);
    setErrorGuardar(null);
    try {
      await adminUserService.actualizarUsuario(id, form);
      navigate('/usuarios', { state: { mensaje: 'Usuario actualizado correctamente.' } });
    } catch (err) {
      setErrorGuardar(extraerMensajeError(err, 'No se pudo guardar los cambios.'));
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando usuario…</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!usuario || !form) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800">
        Editar usuario — {usuario.nombres} {usuario.apellidos}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Identificación: {usuario.identificacion} · Rol: {NOMBRE_ROL[usuario.rol]}
      </p>

      {errorGuardar && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorGuardar}</p>
      )}

      <form onSubmit={manejarEnvio} className="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        {/* Datos base, comunes a todos los roles */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Datos generales
          </legend>
          <Campo label="Cédula / identificación">
            <input
              value={usuario.identificacion}
              disabled
              className="campo-input cursor-not-allowed bg-slate-50 text-slate-500"
            />
            <p className="mt-1 text-xs text-slate-400">
              No editable por ahora: el backend todavía no acepta este campo en la
              actualización de usuario. Si el estudiante/especialista registró mal su
              cédula, pídele a tu compañero que agregue{' '}
              <code className="rounded bg-slate-100 px-1">identification</code> a{' '}
              <code className="rounded bg-slate-100 px-1">UpdateUserByAdminRequest</code>.
            </p>
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Nombres *">
              <input
                required
                value={form.firstName}
                onChange={(e) => actualizarCampo('firstName', e.target.value)}
                className="campo-input"
              />
            </Campo>
            <Campo label="Apellidos *">
              <input
                required
                value={form.lastName}
                onChange={(e) => actualizarCampo('lastName', e.target.value)}
                className="campo-input"
              />
            </Campo>
          </div>
          <Campo label="Correo *">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => actualizarCampo('email', e.target.value)}
              className="campo-input"
            />
          </Campo>
          <Campo label="Teléfono" error={errorTelefono ?? undefined}>
            <input
              value={form.phone ?? ''}
              onChange={(e) => actualizarCampo('phone', limpiarSoloDigitos(e.target.value, 10))}
              className="campo-input"
              inputMode="numeric"
            />
          </Campo>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => actualizarCampo('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Cuenta activa
          </label>
        </fieldset>

        {/* Datos de estudiante: solo si el usuario es ESTUDIANTE */}
        {usuario.rol === 'ESTUDIANTE' && (
          <fieldset className="space-y-4 border-t border-slate-100 pt-4">
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Datos de estudiante
            </legend>
            <Campo label="Carrera">
              <select
                value={form.carrera ?? ''}
                onChange={(e) => actualizarCampo('carrera', e.target.value)}
                className="campo-input"
              >
                <option value="">Selecciona una carrera…</option>
                {grupos.map(([facultad, carreras]) => (
                  <optgroup key={facultad} label={facultad}>
                    {carreras.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Semestre">
                <input
                  value={form.term ?? ''}
                  onChange={(e) => actualizarCampo('term', e.target.value)}
                  className="campo-input"
                />
              </Campo>
              <Campo label="Fecha de nacimiento">
                <input
                  type="date"
                  value={form.birthDate ?? ''}
                  onChange={(e) => actualizarCampo('birthDate', e.target.value)}
                  className="campo-input"
                />
              </Campo>
            </div>
            <Campo label="Dirección">
              <input
                value={form.address ?? ''}
                onChange={(e) => actualizarCampo('address', e.target.value)}
                className="campo-input"
              />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nacionalidad">
                <input
                  value={form.nationality ?? ''}
                  onChange={(e) => actualizarCampo('nationality', e.target.value)}
                  className="campo-input"
                />
              </Campo>
              <Campo label="Etnia">
                <input
                  value={form.ethnicity ?? ''}
                  onChange={(e) => actualizarCampo('ethnicity', e.target.value)}
                  className="campo-input"
                />
              </Campo>
              <Campo label="Género">
                <input
                  value={form.gender ?? ''}
                  onChange={(e) => actualizarCampo('gender', e.target.value)}
                  className="campo-input"
                />
              </Campo>
              <Campo label="Sexo">
                <input
                  value={form.sex ?? ''}
                  onChange={(e) => actualizarCampo('sex', e.target.value)}
                  className="campo-input"
                />
              </Campo>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.hasDisability ?? false}
                onChange={(e) => actualizarCampo('hasDisability', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Tiene discapacidad
            </label>
            {form.hasDisability && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Campo label="Tipo de discapacidad">
                  <input
                    value={form.disabilityType ?? ''}
                    onChange={(e) => actualizarCampo('disabilityType', e.target.value)}
                    className="campo-input"
                  />
                </Campo>
                <Campo label="Porcentaje">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.disabilityPercentage ?? ''}
                    onChange={(e) =>
                      actualizarCampo(
                        'disabilityPercentage',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="campo-input"
                  />
                </Campo>
                <Campo label="ID Conadis">
                  <input
                    value={form.conadisId ?? ''}
                    onChange={(e) => actualizarCampo('conadisId', e.target.value)}
                    className="campo-input"
                  />
                </Campo>
              </div>
            )}
          </fieldset>
        )}

        {/* Datos de especialista: solo si el usuario es PSICOLOGO */}
        {usuario.rol === 'PSICOLOGO' && (
          <fieldset className="space-y-4 border-t border-slate-100 pt-4">
            <legend className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Datos de especialista
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Especialidad">
                <input
                  value={form.specialty ?? ''}
                  onChange={(e) => actualizarCampo('specialty', e.target.value)}
                  className="campo-input"
                />
              </Campo>
              <Campo label="Código profesional (Senescyt)">
                <input
                  value={form.professionalCode ?? ''}
                  onChange={(e) => actualizarCampo('professionalCode', e.target.value)}
                  className="campo-input"
                />
              </Campo>
            </div>
          </fieldset>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => navigate('/usuarios')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const NOMBRE_ROL: Record<Usuario['rol'], string> = {
  ESTUDIANTE: 'Estudiante',
  PSICOLOGO: 'Especialista',
  ADMIN: 'Administrador',
  COORDINADOR: 'Coordinador/a',
};
