import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Link to="/registro" className="text-sm text-sage-700 hover:underline">
        ← Volver al registro
      </Link>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Texto borrador para fines de prototipo. Antes de publicar este sitio, este contenido
        debe ser redactado/validado por la Dirección Jurídica y el área de Bienestar
        Estudiantil de la UCE, en cumplimiento de la LOPDP y el Código de Ética del Psicólogo.
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-slate-900">
        Términos y Condiciones — Tratamiento de Datos Personales y de Salud
      </h1>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-600">
        <p>
          El presente documento regula el registro y uso de la plataforma del Área de
          Bienestar Estudiantil de la Facultad de Filosofía, Letras y Ciencias de la Educación
          de la Universidad Central del Ecuador para la solicitud de atención psicológica.
        </p>
        <p>
          <strong className="text-slate-800">1. Datos recopilados.</strong> Al registrarte,
          recopilamos tus datos de identificación, contacto y la información clínica que
          generes durante tu proceso de atención (ficha clínica, sesiones, planes de
          intervención), conforme a lo descrito en la Ley Orgánica de Protección de Datos
          Personales (LOPDP).
        </p>
        <p>
          <strong className="text-slate-800">2. Finalidad.</strong> Tus datos se usan
          exclusivamente para gestionar tu atención psicológica dentro del Área de Bienestar
          Estudiantil, incluyendo agendamiento de citas, seguimiento terapéutico y generación
          de estadísticas institucionales anonimizadas.
        </p>
        <p>
          <strong className="text-slate-800">3. Confidencialidad.</strong> La información
          clínica registrada solo es accesible para los profesionales directamente
          involucrados en tu atención, conforme al Código de Ética del Psicólogo y al deber
          de secreto profesional.
        </p>
        <p>
          <strong className="text-slate-800">4. Tus derechos.</strong> Puedes solicitar el
          acceso, rectificación o eliminación de tus datos personales en cualquier momento,
          escribiendo al correo de contacto del Área de Bienestar Estudiantil.
        </p>
      </div>
    </div>
  );
}
