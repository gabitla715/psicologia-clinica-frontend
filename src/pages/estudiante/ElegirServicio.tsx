import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { ServicioPsicologico } from '../../types/auth';
import { coordinadorMockService } from '../../api/coordinadorMockService';

/**
 * Pantalla que aparece solo para estudiantes que aún no han elegido el servicio
 * (Psicología Clínica vs Psicología General). Se accede:
 *   - Justo después del primer login del estudiante.
 *   - O cuando entra al sistema y no tiene servicio guardado.
 *
 * El servicio se guarda en localStorage por correo, porque el backend NO tiene
 * un campo equivalente. Esto se usa después para llamar a /psicologia/fichas/activa.
 */
export function ElegirServicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  // Si ya tiene servicio elegido, no debería estar aquí.
  if (usuario.servicioInteres) {
    return <Navigate to="/mi-solicitud" replace />;
  }

  function seleccionar(servicio: ServicioPsicologico) {
    if (!usuario) return;
    localStorage.setItem(`servicioInteres:${usuario.email}`, servicio);
    // Actualizamos el objeto sesionUsuario en localStorage para reflejar el cambio
    const guardado = localStorage.getItem('sesionUsuario');
    if (guardado) {
      const parsed = JSON.parse(guardado);
      parsed.servicioInteres = servicio;
      localStorage.setItem('sesionUsuario', JSON.stringify(parsed));
    }

    // Registra la solicitud en el "backend simulado" del coordinador
    // (ver coordinadorMockService.ts) para que aparezca en su bandeja.
    // No bloqueamos la navegación si esto falla: es un módulo de
    // demostración, no debe romper el flujo real de elección de servicio.
    coordinadorMockService
      .crearSolicitud({
        estudianteId: usuario.id,
        nombreEstudiante: `${usuario.nombres} ${usuario.apellidos}`,
        cedulaEstudiante: usuario.identificacion,
        correoEstudiante: usuario.email,
        carreraEstudiante: usuario.datosEstudiante?.carrera ?? 'No registrada',
        tipoPsicologia: servicio,
      })
      .catch(() => {
        /* silencioso: módulo de demostración */
      });

    // Recargamos para que el AuthContext relea desde localStorage.
    window.location.href = '/mi-solicitud';
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
            Bienvenido/a, {usuario.nombres}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-800">
            ¿Qué tipo de atención psicológica necesitas?
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Selecciona el servicio que mejor describe lo que estás buscando. Un profesional
            del Área de Bienestar Estudiantil revisará tu solicitud y se pondrá en contacto.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TarjetaServicio
            servicio="CLINICA"
            titulo="Psicología Clínica"
            descripcion="Para situaciones de mayor complejidad emocional: ansiedad, depresión, crisis, ideación suicida, duelo, trauma. Se realiza una evaluación clínica y un plan de intervención estructurado."
            ejemplos={[
              'Sientes que tu malestar emocional persiste por semanas o meses.',
              'Te cuesta dormir, comer o concentrarte por causa emocional.',
              'Has tenido pensamientos de hacerte daño.',
              'Pasaste por una pérdida o experiencia traumática reciente.',
            ]}
            onSeleccionar={() => seleccionar('CLINICA')}
          />

          <TarjetaServicio
            servicio="GENERAL"
            titulo="Psicología General"
            descripcion="Para acompañamiento en situaciones de la vida universitaria: estrés académico, manejo del tiempo, orientación vocacional, dificultades en relaciones interpersonales, adaptación a la universidad."
            ejemplos={[
              'Sientes estrés por exámenes, tesis o carga académica.',
              'Tienes dudas sobre tu carrera o tu futuro profesional.',
              'Quieres mejorar tus habilidades sociales o de comunicación.',
              'Buscas un espacio de escucha para ordenar tus ideas.',
            ]}
            onSeleccionar={() => seleccionar('GENERAL')}
          />
        </div>

        <div className="mt-8 rounded-lg bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
          <strong>¿No estás seguro/a?</strong> Puedes elegir Psicología General y, si el
          profesional lo considera, será derivado/a a Psicología Clínica.
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Si estás en una situación de emergencia, comunícate inmediatamente con la línea
          ECU 911 o acude al servicio médico más cercano.
        </p>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-500 hover:underline"
          >
            ← Volver
          </button>
        </div>
      </div>
    </div>
  );
}

interface TarjetaServicioProps {
  servicio: ServicioPsicologico;
  titulo: string;
  descripcion: string;
  ejemplos: string[];
  onSeleccionar: () => void;
}

function TarjetaServicio({ titulo, descripcion, ejemplos, onSeleccionar }: TarjetaServicioProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-600 hover:shadow-md">
      <h2 className="text-lg font-semibold text-slate-800">{titulo}</h2>
      <p className="mt-2 text-sm text-slate-600">{descripcion}</p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        ¿Cuándo elegirlo?
      </p>
      <ul className="mt-2 space-y-1 text-xs text-slate-600">
        {ejemplos.map((ej, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-brand-700">•</span>
            <span>{ej}</span>
          </li>
        ))}
      </ul>

      <button onClick={onSeleccionar} className="btn-primary mt-6 w-full">
        Solicitar {titulo}
      </button>
    </div>
  );
}
