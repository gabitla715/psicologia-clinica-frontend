import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { cambiarContrasenaSchema, type CambiarContrasenaValues } from '../../lib/validators';

export function ChangePasswordPage() {
  const { marcarContrasenaActualizada } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CambiarContrasenaValues>({ resolver: zodResolver(cambiarContrasenaSchema) });

  async function onSubmit() {
    // TODO: cuando el backend tenga el endpoint, llamar aquí a
    // POST /auth/cambiar-contrasena antes de actualizar el estado local.
    marcarContrasenaActualizada();
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800">Cambio de contraseña obligatorio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Por seguridad, debes definir una nueva contraseña antes de continuar.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña actual</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('contrasenaActual')}
            />
            {errors.contrasenaActual && (
              <p className="mt-1 text-xs text-red-600">{errors.contrasenaActual.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('contrasenaNueva')}
            />
            {errors.contrasenaNueva && (
              <p className="mt-1 text-xs text-red-600">{errors.contrasenaNueva.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...register('confirmarContrasena')}
            />
            {errors.confirmarContrasena && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmarContrasena.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            Guardar y continuar
          </button>
        </form>
      </div>
    </div>
  );
}
