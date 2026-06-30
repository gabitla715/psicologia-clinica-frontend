import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { resetPasswordSchema, type ResetPasswordValues } from '../../lib/validators';
import { restablecerContrasena } from '../../api/authService';
import { extraerMensajeError } from '../../api/client';

/**
 * Pantalla a la que llega el usuario desde el enlace en su correo:
 *   /restablecer-contrasena?token=XXXX
 * Si no hay token en la URL, mostramos un error claro.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(values: ResetPasswordValues) {
    setError(null);
    try {
      await restablecerContrasena({
        token: values.token,
        contrasenaNueva: values.contrasenaNueva,
      });
      setExito(true);
      setTimeout(() => navigate('/ingresar', { replace: true }), 3000);
    } catch (e) {
      setError(
        extraerMensajeError(
          e,
          'El enlace expiró o ya fue usado. Solicita uno nuevo desde "Recuperar contraseña".'
        )
      );
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-800">Enlace inválido</h1>
          <p className="mt-2 text-sm text-slate-600">
            Este enlace no es válido o está incompleto. Por favor solicita uno nuevo.
          </p>
          <Link to="/recuperar-contrasena" className="btn-primary mt-6 inline-block w-full">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </div>
          <h1 className="text-lg font-semibold text-slate-800">¡Contraseña actualizada!</h1>
          <p className="mt-2 text-sm text-slate-600">
            Tu contraseña fue restablecida correctamente. Serás redirigido al inicio de
            sesión en unos segundos.
          </p>
          <Link to="/ingresar" className="btn-primary mt-6 inline-block w-full">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Universidad Central del Ecuador
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">Ingresa tu nueva contraseña.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <input type="hidden" {...register('token')} />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nueva contraseña
              </label>
              <input type="password" className="campo-input" {...register('contrasenaNueva')} />
              {errors.contrasenaNueva && (
                <p className="mt-1 text-xs text-red-600">{errors.contrasenaNueva.message}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Mínimo 8 caracteres, una mayúscula y un número.
              </p>
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
              {isSubmitting ? 'Guardando…' : 'Restablecer contraseña'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            <Link to="/ingresar" className="font-medium text-brand-700 hover:underline">
              ← Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
