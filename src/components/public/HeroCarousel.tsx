import { useEffect, useState } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { TikTokIcon } from './TikTokIcon';
import slideComunidad from '../../assets/images/hero/portada1.png';
import slideCampus from '../../assets/images/hero/slide-2-campus.jpg';
import slidePlaceholder from '../../assets/images/hero/portada3.jpg';

const SLIDES = [
  { src: slideComunidad, alt: 'Estudiantes de la UCE reunidos en el campus' },
  { src: slideCampus, alt: 'Vista aérea del campus de la Universidad Central del Ecuador' },
  { src: slidePlaceholder, alt: 'Salud mental' },
];

const INTERVALO_MS = 6000;

const REDES = [
  { nombre: 'Facebook', href: 'https://facebook.com', Icono: Facebook },
  { nombre: 'Instagram', href: 'https://instagram.com', Icono: Instagram },
  { nombre: 'TikTok', href: 'https://tiktok.com', Icono: TikTokIcon },
];

export function HeroCarousel() {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActual((prev) => (prev + 1) % SLIDES.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [actual]);

  return (
    <section className="relative h-[560px] overflow-hidden text-white sm:h-[640px]">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            i === actual ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Contenido: concepto (Capítulo 4 del diseño) — título a la izquierda, texto a la derecha */}
      <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-4 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
          <div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Acompañamiento psicológico para toda la comunidad estudiantil
            </h1>
          </div>

          <div className="sm:border-l sm:border-white/25 sm:pl-8">
            <p className="text-sm leading-relaxed text-blue-50/90">
              El Área de Bienestar Estudiantil ofrece atención psicológica clínica y general, confidencial y gratuita, a los estudiantes de la Facultad. Conoce nuestros servicios y solicita tu atención.
            </p>
          </div>
        </div>
      </div>

      {/* Barra inferior: línea = control del carrusel, a la derecha las redes sociales */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-6 sm:px-6">
          <div className="flex flex-1 items-center gap-3">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={i === actual}
                className={`h-[2px] max-w-[90px] flex-1 rounded-full transition-colors ${
                  i === actual ? 'bg-white' : 'bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            {REDES.map(({ nombre, href, Icono }) => (
              <a
                key={nombre}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={nombre}
                className="text-white/80 transition hover:text-white"
              >
                <Icono className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
