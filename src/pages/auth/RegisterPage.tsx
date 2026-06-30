import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  registroSchema,
  type RegistroFormValues,
  limpiarSoloLetras,
  limpiarSoloDigitos,
} from '../../lib/validators';
import { extraerMensajeError } from '../../api/client';
import { CARRERAS_UCE } from '../../lib/carreras-uce';

export function RegisterPage() {
  const { registrarse } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [emailRegistrado, setEmailRegistrado] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      aceptaTerminos: false,
      aceptaDatos: false,
      discapacidad: 'NO',
      nacionalidad: 'Ecuatoriana',
    },
  });

  const tieneDiscapacidad = watch('discapacidad') === 'SI';

  async function onSubmit(values: RegistroFormValues) {
    setError(null);
    try {
      const {
        confirmarContrasena,
        aceptaTerminos,
        aceptaDatos,
        discapacidad,
        tipoDiscapacidad,
        porcentajeDiscapacidad,
        conadisId,
        ...resto
      } = values;
      void confirmarContrasena;
      void aceptaTerminos;
      void aceptaDatos;

      const datos = {
        ...resto,
        tieneDiscapacidad: discapacidad === 'SI',
        tipoDiscapacidad: discapacidad === 'SI' ? tipoDiscapacidad : undefined,
        porcentajeDiscapacidad: discapacidad === 'SI' ? porcentajeDiscapacidad : undefined,
        conadisId: discapacidad === 'SI' ? conadisId : undefined,
      };

      const resultado = await registrarse(datos);
      if (resultado.tipo === 'LISTO') {
        navigate('/elegir-servicio', { replace: true });
      } else {
        setEmailRegistrado(resultado.email);
      }
    } catch (e) {
      setError(extraerMensajeError(e, 'No se pudo completar el registro.'));
    }
  }

  // Pantalla de confirmación (PENDING_VERIFICATION)
  if (emailRegistrado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </div>
          <h1 className="text-lg font-semibold text-slate-800">¡Cuenta creada!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tu solicitud fue registrada correctamente. Enviamos un enlace de verificación a:
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{emailRegistrado}</p>
          <p className="mt-3 text-sm text-slate-500">
            Revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace para
            activar tu cuenta antes de iniciar sesión.
          </p>
          <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-left text-xs text-amber-800">
            Si no recibes el correo en unos minutos, comunícate con el Área de Bienestar
            Estudiantil para activar tu cuenta manualmente.
          </div>
          <Link to="/ingresar" className="btn-primary mt-6 inline-block w-full">
            Ir al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Universidad Central del Ecuador
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Crear cuenta de estudiante</h1>
          <p className="mt-1 text-sm text-slate-500">Para solicitar atención psicológica</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* ── Datos personales ── */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Datos personales</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nombres *" error={errors.nombres?.message}>
                  <input
                    className="campo-input"
                    autoComplete="given-name"
                    {...register('nombres')}
                    onChange={(e) => setValue('nombres', limpiarSoloLetras(e.target.value), { shouldValidate: true })}
                  />
                </Campo>
                <Campo label="Apellidos *" error={errors.apellidos?.message}>
                  <input
                    className="campo-input"
                    autoComplete="family-name"
                    {...register('apellidos')}
                    onChange={(e) => setValue('apellidos', limpiarSoloLetras(e.target.value), { shouldValidate: true })}
                  />
                </Campo>
                <Campo label="Cédula o pasaporte *" error={errors.identificacion?.message}>
                  <input
                    className="campo-input"
                    maxLength={20}
                    placeholder="1700000000"
                    {...register('identificacion')}
                  />
                </Campo>
                <Campo label="Teléfono *" error={errors.telefono?.message}>
                  <input
                    className="campo-input"
                    inputMode="numeric"
                    placeholder="0991234567"
                    {...register('telefono')}
                    onChange={(e) => setValue('telefono', limpiarSoloDigitos(e.target.value, 10), { shouldValidate: true })}
                  />
                </Campo>
                <Campo label="Fecha de nacimiento *" error={errors.fechaNacimiento?.message}>
                  <input type="date" className="campo-input" {...register('fechaNacimiento')} />
                </Campo>
                <Campo label="Nacionalidad *" error={errors.nacionalidad?.message}>
                  <input
                    className="campo-input"
                    {...register('nacionalidad')}
                    onChange={(e) => setValue('nacionalidad', limpiarSoloLetras(e.target.value), { shouldValidate: true })}
                  />
                </Campo>
                <Campo label="Sexo *" error={errors.sexo?.message}>
                  <select className="campo-input" {...register('sexo')}>
                    <option value="">Selecciona…</option>
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                    <option value="Intersexual">Intersexual</option>
                  </select>
                </Campo>
                <Campo label="Género *" error={errors.genero?.message}>
                  <select className="campo-input" {...register('genero')}>
                    <option value="">Selecciona…</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="No binario">No binario</option>
                    <option value="Otro">Otro</option>
                    <option value="Prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                </Campo>
                <Campo label="Etnia *" error={errors.etnia?.message}>
                  <select className="campo-input" {...register('etnia')}>
                    <option value="">Selecciona…</option>
                    <option value="Mestizo">Mestizo/a</option>
                    <option value="Indigena">Indígena</option>
                    <option value="Afroecuatoriano">Afroecuatoriano/a</option>
                    <option value="Montubio">Montubio/a</option>
                    <option value="Blanco">Blanco/a</option>
                    <option value="Otro">Otro</option>
                  </select>
                </Campo>
                <Campo label="Dirección *" error={errors.direccion?.message}>
                  <input className="campo-input" {...register('direccion')} placeholder="Calle, número, ciudad" />
                </Campo>
              </div>
            </section>

            {/* ── Datos académicos ── */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Datos académicos</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Carrera *" error={errors.carrera?.message}>
                  <select className="campo-input" {...register('carrera')}>
                    <option value="">Selecciona tu carrera…</option>
                    {agruparCarrerasPorFacultad().map(([facultad, carreras]) => (
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
                <Campo label="Semestre *" error={errors.semestre?.message}>
                  <select className="campo-input" {...register('semestre')}>
                    <option value="">Selecciona…</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={String(n)}>
                        {n}.º semestre
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            </section>

            {/* ── Discapacidad ── */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                ¿Tienes alguna discapacidad reconocida? *
              </h2>
              <div className="flex gap-6 text-sm text-slate-700">
                <label className="flex items-center gap-2">
                  <input type="radio" value="SI" {...register('discapacidad')} />
                  Sí
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="NO" {...register('discapacidad')} />
                  No
                </label>
              </div>
              {errors.discapacidad && (
                <p className="mt-1 text-xs text-red-600">{errors.discapacidad.message}</p>
              )}

              {tieneDiscapacidad && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <Campo label="Tipo de discapacidad" error={errors.tipoDiscapacidad?.message}>
                    <select className="campo-input" {...register('tipoDiscapacidad')}>
                      <option value="">Selecciona…</option>
                      <option value="Física">Física</option>
                      <option value="Visual">Visual</option>
                      <option value="Auditiva">Auditiva</option>
                      <option value="Intelectual">Intelectual</option>
                      <option value="Psicosocial">Psicosocial</option>
                      <option value="Múltiple">Múltiple</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </Campo>
                  <Campo label="Porcentaje (0-100)" error={errors.porcentajeDiscapacidad?.message}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="campo-input"
                      {...register('porcentajeDiscapacidad', { valueAsNumber: true })}
                    />
                  </Campo>
                  <Campo label="N° carnet CONADIS" error={errors.conadisId?.message}>
                    <input className="campo-input" {...register('conadisId')} />
                  </Campo>
                </div>
              )}
            </section>

            {/* ── Credenciales ── */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Credenciales de acceso</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Correo institucional *" error={errors.email?.message}>
                  <input type="email" className="campo-input" placeholder="nombre@uce.edu.ec" {...register('email')} />
                </Campo>
                <div />
                <Campo label="Contraseña *" error={errors.contrasena?.message}>
                  <input type="password" className="campo-input" {...register('contrasena')} />
                </Campo>
                <Campo label="Confirmar contraseña *" error={errors.confirmarContrasena?.message}>
                  <input type="password" className="campo-input" {...register('confirmarContrasena')} />
                </Campo>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Mínimo 8 caracteres, debe incluir una mayúscula y un número.
              </p>
            </section>

            {/* ── Aceptaciones ── */}
            <section className="space-y-2 border-t border-slate-100 pt-4">
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-0.5" {...register('aceptaTerminos')} />
                <span>
                  He leído y acepto los{' '}
                  <Link to="/terminos" target="_blank" className="font-medium text-brand-700 hover:underline">
                    Términos y Condiciones
                  </Link>
                  .
                </span>
              </label>
              {errors.aceptaTerminos && (
                <p className="text-xs text-red-600">{errors.aceptaTerminos.message}</p>
              )}

              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-0.5" {...register('aceptaDatos')} />
                <span>
                  Autorizo el tratamiento de mis datos personales y de salud conforme a la
                  Ley Orgánica de Protección de Datos Personales (LOPDP).
                </span>
              </label>
              {errors.aceptaDatos && <p className="text-xs text-red-600">{errors.aceptaDatos.message}</p>}
            </section>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/ingresar" className="font-medium text-brand-700 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper: agrupa la lista plana de carreras por facultad para usar <optgroup>.
function agruparCarrerasPorFacultad(): Array<[string, string[]]> {
  const mapa = new Map<string, string[]>();
  for (const item of CARRERAS_UCE) {
    const lista = mapa.get(item.facultad) ?? [];
    lista.push(item.carrera);
    mapa.set(item.facultad, lista);
  }
  return Array.from(mapa.entries());
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
