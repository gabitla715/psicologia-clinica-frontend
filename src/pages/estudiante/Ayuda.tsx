import { useState } from 'react';
import { ChevronDown, LifeBuoy, Mail } from 'lucide-react';

const PREGUNTAS: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: '¿Cómo reagendo mi cita?',
    respuesta:
      'Ingresa a "Mi cita" o a "Inicio" y, cuando tengas una cita por confirmar, usa el botón "Solicitar otro horario" indicando brevemente el motivo. El coordinador te asignará un nuevo horario.',
  },
  {
    pregunta: '¿Qué pasa si no asisto a mi cita?',
    respuesta:
      'Se registra como inasistencia. Si acumulas varias inasistencias injustificadas, tu proceso puede cerrarse automáticamente por desistimiento. Si sabes que no podrás asistir, solicita reagendar con anticipación.',
  },
  {
    pregunta: '¿Cómo cancelo una cita?',
    respuesta:
      'Puedes solicitar la cancelación desde "Mi cita". Si ya fue confirmada y necesitas cancelarla, comunícate con el Área de Bienestar Estudiantil lo antes posible.',
  },
  {
    pregunta: '¿Cómo funciona Psicología Clínica?',
    respuesta:
      'Psicología Clínica atiende situaciones de mayor complejidad emocional (ansiedad, depresión, crisis, duelo, trauma). Incluye una entrevista inicial, un plan de intervención y sesiones de seguimiento con un especialista.',
  },
  {
    pregunta: '¿Cómo funciona Psicología General?',
    respuesta:
      'Psicología General brinda acompañamiento en situaciones del día a día universitario: estrés académico, orientación vocacional, adaptación y habilidades sociales.',
  },
  {
    pregunta: '¿Puedo cambiar de especialista?',
    respuesta:
      'Si tienes una razón justificada, puedes solicitarlo directamente al Área de Bienestar Estudiantil, quienes evaluarán tu caso.',
  },
];

export function Ayuda() {
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Ayuda</h1>
          <p className="text-sm text-slate-500">Preguntas frecuentes sobre tu proceso de atención.</p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {PREGUNTAS.map((item, i) => {
          const abiertaAhora = abierta === i;
          return (
            <div key={i}>
              <button
                onClick={() => setAbierta(abiertaAhora ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                {item.pregunta}
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${abiertaAhora ? 'rotate-180' : ''}`}
                />
              </button>
              {abiertaAhora && (
                <div className="px-5 pb-4 text-sm leading-relaxed text-slate-600">{item.respuesta}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          <Mail className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">¿No encontraste lo que buscabas?</p>
          <p className="text-sm text-slate-500">
            Escríbenos a <strong>bienestar.filosofia@uce.edu.ec</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
