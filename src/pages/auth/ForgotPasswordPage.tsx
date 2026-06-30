import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../../lib/validators';
import { solicitarRecuperacion } from '../../api/authService';

export function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordValues) {
    setError(null);
    try {
      await solicitarRecuperacion(values.email);
      setEnviado(values.email);
    } catch (e) {
      // Por seguridad, mostramos el mismo mensaje pase lo que pase.
      // El backend tampoco revela si el correo existe o no.
      void e;
      setEnviado(values.email);
    }
  }

  if (enviado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            ✓
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-slate-600">
            Si la dirección <strong>{enviado}</strong> está registrada en el sistema, te
            enviamos un enlace para restablecer tu contraseña.
          </p>
          <p className="mt-3 text-sm text-slate-500">
            El enlace expira en unas horas. Si no llega el correo, revisa tu carpeta de
            spam o vuelve a intentarlo.
          </p>
          <Link to="/ingresar" className="btn-primary mt-6 inline-block w-full">
            Volver al inicio de sesión
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
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-slate-500">
            Te enviaremos un enlace a tu correo institucional para restablecerla.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Correo institucional
              </label>
              <input
                type="email"
                autoComplete="email"
                className="campo-input"
                placeholder="nombre@uce.edu.ec"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            ¿Recordaste tu contraseña?{' '}
            <Link to="/ingresar" className="font-medium text-brand-700 hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
