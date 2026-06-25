import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { loginSchema, type LoginFormValues } from '../../lib/validators';

const NOMBRE_SERVICIO: Record<string, string> = {
  CLINICA: 'Psicología Clínica',
  GENERAL: 'Psicología General',
};

export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const servicio = searchParams.get('servicio');
  const nombreServicio = servicio ? NOMBRE_SERVICIO[servicio] : null;

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
      const destinoPorDefecto = usuario.rol === 'ESTUDIANTE' ? '/mi-solicitud' : '/dashboard';
      navigate(estado?.from?.pathname ?? destinoPorDefecto, { replace: true });
    } catch {
      setError('Correo o contraseña incorrectos.');
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
          {nombreServicio ? (
            <p className="mt-1 text-sm text-slate-500">
              Inicia sesión para solicitar atención de <strong>{nombreServicio}</strong>
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Facultad de Filosofía, Letras y Ciencias de la Educación
            </p>
          )}
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="nombre@uce.edu.ec"
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="contrasena" className="mb-1 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <input
                id="contrasena"
                type="password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="••••••••"
                {...register('contrasena')}
              />
              {errors.contrasena && (
                <p className="mt-1 text-xs text-red-600">{errors.contrasena.message}</p>
              )}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link
              to={`/registro${servicio ? `?servicio=${servicio}` : ''}`}
              className="font-medium text-brand-700 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-800">
          <p className="font-medium">Modo de prueba (datos simulados, sin backend)</p>
          <ul className="mt-1 space-y-0.5">
            <li>admin@uce.edu.ec / Admin123 — Administrador</li>
            <li>psicologo@uce.edu.ec / Psico123 — Psicólogo/a</li>
            <li>coordinador@uce.edu.ec / Coord123 — Coordinador/a (fuerza cambio de contraseña)</li>
            <li>estudiante@uce.edu.ec / Estud123 — Estudiante</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          <Link to="/" className="hover:underline">← Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
