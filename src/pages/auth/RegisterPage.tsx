import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { registroSchema, type RegistroFormValues } from '../../lib/validators';
import type { ServicioPsicologico } from '../../types/auth';
import { extraerMensajeError } from '../../api/client';

export function RegisterPage() {
  const { registrarse } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const servicioInicial = (searchParams.get('servicio') as ServicioPsicologico | null) ?? 'GENERAL';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      servicioInteres: servicioInicial,
      aceptaTerminos: false,
      aceptaDatos: false,
      tieneDiscapacidad: false,
      nacionalidad: 'Ecuatoriana',
    },
  });

  const tieneDiscapacidad = watch('tieneDiscapacidad');

  async function onSubmit(values: RegistroFormValues) {
    setError(null);
    try {
      const { confirmarContrasena, aceptaTerminos, aceptaDatos, ...datos } = values;
      void confirmarContrasena;
      void aceptaTerminos;
      void aceptaDatos;
      await registrarse(datos);
      navigate('/mi-solicitud', { replace: true });
    } catch (e) {
      setError(extraerMensajeError(e, 'No se pudo completar el registro.'));
    }
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Identificación */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Datos personales</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nombres *" error={errors.nombres?.message}>
                  <input className="campo-input" {...register('nombres')} />
                </Campo>
                <Campo label="Apellidos *" error={errors.apellidos?.message}>
                  <input className="campo-input" {...register('apellidos')} />
                </Campo>
                <Campo label="Cédula o pasaporte *" error={errors.identificacion?.message}>
                  <input className="campo-input" maxLength={20} {...register('identificacion')} />
                </Campo>
                <Campo label="Teléfono *" error={errors.telefono?.message}>
                  <input className="campo-input" {...register('telefono')} placeholder="0991234567" />
                </Campo>
                <Campo label="Fecha de nacimiento *" error={errors.fechaNacimiento?.message}>
                  <input type="date" className="campo-input" {...register('fechaNacimiento')} />
                </Campo>
                <Campo label="Nacionalidad *" error={errors.nacionalidad?.message}>
                  <input className="campo-input" {...register('nacionalidad')} />
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

            {/* Datos académicos */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Datos académicos</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Carrera *" error={errors.carrera?.message}>
                  <input className="campo-input" {...register('carrera')} placeholder="Ej. Pedagogía de las Ciencias Experimentales" />
                </Campo>
                <Campo label="Semestre / Paralelo *" error={errors.semestre?.message}>
                  <input className="campo-input" {...register('semestre')} placeholder="Ej. 5to / A" />
                </Campo>
              </div>
            </section>

            {/* Discapacidad */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">¿Tienes alguna discapacidad?</h2>
              <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" {...register('tieneDiscapacidad')} />
                Sí, tengo discapacidad reconocida.
              </label>
              {tieneDiscapacidad && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Campo label="Tipo de discapacidad" error={errors.tipoDiscapacidad?.message}>
                    <input className="campo-input" {...register('tipoDiscapacidad')} />
                  </Campo>
                  <Campo label="Porcentaje (0-100)" error={errors.porcentajeDiscapacidad?.message}>
                    <input
                      type="number"
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

            {/* Credenciales */}
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Credenciales de acceso</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Correo institucional *" error={errors.email?.message}>
                  <input type="email" className="campo-input" placeholder="nombre@uce.edu.ec" {...register('email')} />
                </Campo>
                <div /> {/* spacer */}
                <Campo label="Contraseña *" error={errors.contrasena?.message}>
                  <input type="password" className="campo-input" {...register('contrasena')} />
                </Campo>
                <Campo label="Confirmar contraseña *" error={errors.confirmarContrasena?.message}>
                  <input type="password" className="campo-input" {...register('confirmarContrasena')} />
                </Campo>
              </div>
            </section>

            {/* Servicio */}
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-700">¿Qué servicio necesitas?</h2>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input type="radio" value="CLINICA" {...register('servicioInteres')} />
                  Psicología Clínica
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="GENERAL" {...register('servicioInteres')} />
                  Psicología General
                </label>
              </div>
              {errors.servicioInteres && (
                <p className="mt-1 text-xs text-red-600">{errors.servicioInteres.message}</p>
              )}
            </section>

            {/* Aceptaciones */}
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

function Campo({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
