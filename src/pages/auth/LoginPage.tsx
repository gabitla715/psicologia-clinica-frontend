import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { loginSchema, type LoginFormValues } from '../../lib/validators';
import { extraerMensajeError } from '../../api/client';

export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    try {
      const usuario = await iniciarSesion(values);
      const estado = location.state as { from?: { pathname: string } } | null;

      // Estudiante sin servicio elegido → va a elegir servicio.
      if (usuario.rol === 'ESTUDIANTE' && !usuario.servicioInteres) {
        navigate(estado?.from?.pathname ?? '/elegir-servicio', { replace: true });
        return;
      }

      const destinoPorDefecto =
        usuario.rol === 'ESTUDIANTE' ? '/mi-solicitud' : '/dashboard';
      navigate(estado?.from?.pathname ?? destinoPorDefecto, { replace: true });
    } catch (e) {
      setError(extraerMensajeError(e, 'Correo o contraseña incorrectos.'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Universidad Central del Ecuador
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">
            Bienestar Estudiantil — Psicología
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Facultad de Filosofía, Letras y Ciencias de la Educación
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Correo
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="campo-input"
                placeholder="nombre@uce.edu.ec"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="contrasena" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                className="campo-input"
                placeholder="••••••••"
                {...register('contrasena')}
              />
              {errors.contrasena && (
                <p className="mt-1 text-xs text-red-600">{errors.contrasena.message}</p>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-brand-700 hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link to="/" className="hover:underline">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
