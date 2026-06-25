import { Link } from 'react-router-dom';
import { Stethoscope, Users, MapPin, Mail, Phone, Clock } from 'lucide-react';
import { PublicHeader } from '../../components/public/PublicHeader';

export function HomePage() {
  return (
    <div className="bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Universidad Central del Ecuador · Facultad de Filosofía, Letras y Ciencias de la Educación
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
            Acompañamiento psicológico para toda la comunidad estudiantil
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            El Área de Bienestar Estudiantil ofrece atención psicológica clínica y general,
            confidencial y gratuita, a los estudiantes de la Facultad. Conoce nuestros
            servicios y solicita tu atención.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#servicios"
              className="btn-primary"
            >
              Ver servicios
            </a>
            <a
              href="#ubicacion"
              className="btn-secondary"
            >
              ¿Dónde estamos?
            </a>
          </div>
        </div>
      </section>

      {/* Quiénes somos */}
      <section id="quienes-somos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Quiénes somos</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">
          Un espacio de bienestar dentro de tu propia Facultad
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">
          Somos el equipo de psicología del Área de Bienestar Estudiantil de la Facultad de
          Filosofía, Letras y Ciencias de la Educación. Acompañamos a estudiantes en procesos
          de evaluación, intervención y seguimiento psicológico, con un manejo confidencial de
          la información clínica y un enfoque centrado en las necesidades de cada persona.
        </p>
      </section>

      {/* Servicios */}
      <section id="servicios" className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Nuestros servicios</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">¿Qué tipo de atención necesitas?</h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <ServicioCard
              icono={<Stethoscope className="h-6 w-6" />}
              titulo="Psicología Clínica"
              descripcion="Evaluación y tratamiento de dificultades emocionales o de salud mental que requieren
              una intervención terapéutica estructurada: ansiedad, estados de ánimo, crisis, entre otras."
              servicio="CLINICA"
            />
            <ServicioCard
              icono={<Users className="h-6 w-6" />}
              titulo="Psicología General"
              descripcion="Orientación, acompañamiento y apoyo psicoeducativo para situaciones del día a día:
              adaptación académica, manejo del estrés, relaciones interpersonales y desarrollo personal."
              servicio="GENERAL"
            />
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section id="ubicacion" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Ubicación</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Dónde encontrarnos</h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Facultad de Filosofía, Letras y Ciencias de la Educación
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Universidad Central del Ecuador, Ciudadela Universitaria, Quito
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  * Ubicación referencial — confirma la dirección exacta del consultorio de
                  Bienestar Estudiantil antes de publicar este sitio.
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 sm:col-span-2">
            <iframe
              title="Mapa de ubicación — Universidad Central del Ecuador"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-78.5060%2C-0.2160%2C-78.4840%2C-0.2000&layer=mapnik&marker=-0.2103%2C-78.4950"
              className="h-72 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Contacto */}
      <section id="contacto" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Contáctanos</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Te escuchamos</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoContacto icono={<Mail className="h-5 w-5" />} etiqueta="Correo" valor="bienestar.filosofia@uce.edu.ec" />
            <InfoContacto icono={<Phone className="h-5 w-5" />} etiqueta="Teléfono" valor="(02) 000-0000" />
            <InfoContacto icono={<Clock className="h-5 w-5" />} etiqueta="Horario" valor="Lunes a viernes, 08:00–16:30" />
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-4 py-8 text-center text-xs text-slate-400 sm:px-6">
        Trabajo de titulación — Ingeniería en Sistemas de Información, Universidad Central del Ecuador, 2026.
      </footer>
    </div>
  );
}

interface ServicioCardProps {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  servicio: 'CLINICA' | 'GENERAL';
}

function ServicioCard({ icono, titulo, descripcion, servicio }: ServicioCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        {icono}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{descripcion}</p>
      <Link
        to={`/ingresar?servicio=${servicio}`}
        className="btn-primary mt-5 w-full"
      >
        Solicitar atención
      </Link>
    </div>
  );
}

function InfoContacto({ icono, etiqueta, valor }: { icono: React.ReactNode; etiqueta: string; valor: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        {icono}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">{etiqueta}</p>
        <p className="text-sm font-medium text-slate-700">{valor}</p>
      </div>
    </div>
  );
}
