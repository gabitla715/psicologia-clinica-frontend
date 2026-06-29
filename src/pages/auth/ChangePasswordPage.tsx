import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { cambiarContrasenaSchema, type CambiarContrasenaValues } from '../../lib/validators';
import { cambiarContrasena } from '../../api/authService';
import { extraerMensajeError } from '../../api/client';

export function ChangePasswordPage() {
  const { marcarContrasenaActualizada, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CambiarContrasenaValues>({ resolver: zodResolver(cambiarContrasenaSchema) });

  async function onSubmit(values: CambiarContrasenaValues) {
    setError(null);
    try {
      await cambiarContrasena({
        contrasenaActual: values.contrasenaActual,
        contrasenaNueva: values.contrasenaNueva,
      });
      // El backend cierra todas las sesiones al cambiar la contraseña, así que
      // limpiamos el lado del cliente y mandamos al login a re-autenticarse.
      marcarContrasenaActualizada();
      await cerrarSesion();
      navigate('/ingresar', { replace: true });
    } catch (e) {
      setError(extraerMensajeError(e, 'No se pudo cambiar la contraseña.'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-800">Cambiar contraseña</h1>
        <p className="mt-1 text-sm text-slate-500">
          Por seguridad, todas tus sesiones se cerrarán y deberás iniciar sesión nuevamente.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Contraseña actual</label>
            <input type="password" className="campo-input" {...register('contrasenaActual')} />
            {errors.contrasenaActual && (
              <p className="mt-1 text-xs text-red-600">{errors.contrasenaActual.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Nueva contraseña</label>
            <input type="password" className="campo-input" {...register('contrasenaNueva')} />
            {errors.contrasenaNueva && (
              <p className="mt-1 text-xs text-red-600">{errors.contrasenaNueva.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirmar nueva contraseña
            </label>
            <input type="password" className="campo-input" {...register('confirmarContrasena')} />
            {errors.confirmarContrasena && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmarContrasena.message}</p>
            )}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Actualizando…' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
