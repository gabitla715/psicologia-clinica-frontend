import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { registroSchema, type RegistroFormValues } from '../../lib/validators';
import type { ServicioPsicologico } from '../../types/auth';

export function RegisterPage() {
  const { registrarse } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const servicioInicial = (searchParams.get('servicio') as ServicioPsicologico | null) ?? 'GENERAL';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: { servicioInteres: servicioInicial, aceptaTerminos: false, aceptaDatos: false },
  });

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
      setError(e instanceof Error ? e.message : 'No se pudo completar el registro.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-sage-700">
            Universidad Central del Ecuador
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Crear cuenta de estudiante</h1>
          <p className="mt-1 text-sm text-slate-500">Para solicitar atención psicológica</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Nombres" error={errors.nombres?.message}>
                <input className="campo-input" {...register('nombres')} />
              </Campo>
              <Campo label="Apellidos" error={errors.apellidos?.message}>
                <input className="campo-input" {...register('apellidos')} />
              </Campo>
            </div>

            <Campo label="Cédula" error={errors.identificacion?.message}>
              <input className="campo-input" maxLength={10} {...register('identificacion')} />
            </Campo>

            <Campo label="Correo institucional" error={errors.email?.message}>
              <input type="email" className="campo-input" placeholder="nombre@uce.edu.ec" {...register('email')} />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Contraseña" error={errors.contrasena?.message}>
                <input type="password" className="campo-input" {...register('contrasena')} />
              </Campo>
              <Campo label="Confirmar contraseña" error={errors.confirmarContrasena?.message}>
                <input type="password" className="campo-input" {...register('confirmarContrasena')} />
              </Campo>
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">¿Qué servicio necesitas?</span>
              <div className="flex gap-4 text-sm text-slate-600">
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
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-0.5" {...register('aceptaTerminos')} />
                <span>
                  He leído y acepto los{' '}
                  <Link to="/terminos" target="_blank" className="font-medium text-sage-700 hover:underline">
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
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/ingresar" className="font-medium text-sage-700 hover:underline">
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
