import { useState } from 'react';
import { Brain, HeartHandshake, CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { TipoPsicologia } from '../../api/fichaService';
import imgGeneral from '../../assets/images/hero/terapia-general.jpeg';
import imgClinica from '../../assets/images/hero/terapia-clinica.jpeg';

interface ServicioInfo {
  tipo: TipoPsicologia;
  etiquetaTab: string;
  Icono: typeof Brain;
  imagen: string;
  titulo: string;
  descripcion: string;
  servicios: string[];
}

const SERVICIOS: ServicioInfo[] = [
  {
    tipo: 'GENERAL',
    etiquetaTab: 'Psicología General',
    Icono: HeartHandshake,
    imagen: imgGeneral,
    titulo: 'Psicología General',
    descripcion:
      'Acompañamiento y orientación psicoeducativa para el día a día universitario. Ideal si buscas un espacio de escucha y apoyo para situaciones que afectan tu bienestar sin necesitar una intervención clínica estructurada.',
    servicios: [
      'Orientación psicológica',
      'Manejo del estrés académico',
      'Adaptación a la vida universitaria',
      'Autoestima y habilidades sociales',
      'Orientación vocacional',
      'Acompañamiento emocional',
    ],
  },
  {
    tipo: 'CLINICA',
    etiquetaTab: 'Psicología Clínica',
    Icono: Brain,
    imagen: imgClinica,
    titulo: 'Psicología Clínica',
    descripcion:
      'Evaluación, diagnóstico e intervención de dificultades emocionales o de salud mental que requieren un tratamiento terapéutico estructurado, con seguimiento profesional a lo largo del proceso.',
    servicios: [
      'Evaluación psicológica',
      'Psicoterapia individual',
      'Terapia familiar y de pareja',
      'Intervención en ansiedad y depresión',
      'Acompañamiento en duelo',
      'Manejo de crisis emocionales',
    ],
  },
];

interface Props {
  /** Estado de cada tipo: si ya tiene un proceso activo, cambia el botón. */
  tieneProcesoActivo: (tipo: TipoPsicologia) => boolean;
  onAgendar: (tipo: TipoPsicologia) => void;
  cargando?: boolean;
}

export function ServiciosTabs({ tieneProcesoActivo, onAgendar, cargando }: Props) {
  const [activo, setActivo] = useState<TipoPsicologia>('GENERAL');
  const servicio = SERVICIOS.find((s) => s.tipo === activo)!;
  const yaActivo = tieneProcesoActivo(activo);

  return (
    <div id="nuestros-servicios" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Barra de pestañas */}
      <div className="flex justify-center gap-10 border-b border-slate-100 px-6 pt-6 sm:gap-16">
        {SERVICIOS.map((s) => {
          const Icono = s.Icono;
          const esActivo = s.tipo === activo;
          return (
            <button
              key={s.tipo}
              onClick={() => setActivo(s.tipo)}
              className="group flex flex-col items-center gap-2 pb-4"
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full border-2 transition ${
                  esActivo
                    ? 'border-brand-600 text-brand-700'
                    : 'border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-500'
                }`}
              >
                <Icono className="h-5 w-5" />
              </span>
              <span className={`text-xs font-semibold sm:text-sm ${esActivo ? 'text-slate-800' : 'text-slate-400'}`}>
                {s.etiquetaTab}
              </span>
              <span
                className={`h-0.5 w-full rounded-full transition-all ${
                  esActivo ? 'bg-brand-600' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="grid gap-8 px-6 py-8 sm:grid-cols-2 sm:px-10 sm:py-10">
        <div className="relative mx-auto w-full max-w-xs">
          <div className="overflow-hidden rounded-[45%] border-4 border-brand-100 shadow-md">
            <img src={servicio.imagen} alt={servicio.titulo} className="h-64 w-full object-cover" />
          </div>
          <span className="absolute -right-2 -top-2 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg">
            <servicio.Icono className="h-6 w-6" />
          </span>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-slate-900">{servicio.titulo}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{servicio.descripcion}</p>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Le ofrecemos
          </p>
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {servicio.servicios.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {item}
              </li>
            ))}
          </ul>

          <button
            onClick={() => onAgendar(servicio.tipo)}
            disabled={cargando || yaActivo}
            className="btn-primary mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarPlus className="h-4 w-4" />
            {yaActivo ? 'Ya tienes una solicitud en curso' : 'Agendar cita'}
          </button>
          {yaActivo && (
            <p className="mt-2 text-xs text-slate-400">
              Revisa el estado de tu solicitud arriba. Podrás pedir este servicio de nuevo cuando el proceso actual se cierre.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
