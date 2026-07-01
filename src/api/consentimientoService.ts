// ────────────────────────────────────────────────────────────────
// Servicio de consentimiento informado.
//
// IMPORTANTE: a la fecha, el backend tiene la clase ConsentimientoController
// VACÍA (sin endpoints) aunque la entidad y la tabla consentimientos_psicologia
// sí existen. Por eso este servicio opera en modo "local" por defecto: persiste
// la firma del estudiante en localStorage para que el flujo del prototipo sea
// demostrable de extremo a extremo.
//
// Cuando el backend exponga los endpoints, basta con cambiar USAR_BACKEND = true
// para que el servicio empiece a consumir la API real, sin que cambie ningún
// componente que lo invoque.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

// Cambiar a true cuando el backend exponga los endpoints reales.
const USAR_BACKEND = false;

export const CONSENTIMIENTO_VERSION_ACTUAL = 'UCE-OBU-PSC-COI-2025 v2';

// ─── DTOs ───────────────────────────────────────────────────────
export interface RegistrarConsentimientoRequest {
  textoVersion: string;
  estudianteAcepta: boolean;
}

export interface ConsentimientoResponseBackend {
  id: number;
  fichaId: number;
  especialistaId: number;
  nombreEspecialista: string;
  textoVersion: string;
  fechaFirma: string;
  ipCliente?: string | null;
  estudianteAcepta: boolean;
  creadoEn: string;
}

export interface Consentimiento {
  id: number;
  fichaId: number;
  textoVersion: string;
  fechaFirma: Date;
  estudianteAcepta: boolean;
  nombreEspecialista?: string;
  modoLocal: boolean;
}

// ─── Persistencia local ─────────────────────────────────────────
function keyLocal(fichaId: number): string {
  return `consentimiento:${fichaId}`;
}

interface RegistroLocal {
  id: number;
  fichaId: number;
  textoVersion: string;
  fechaFirma: string;
  estudianteAcepta: boolean;
}

function leerLocal(fichaId: number): Consentimiento | null {
  const raw = localStorage.getItem(keyLocal(fichaId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RegistroLocal;
    return {
      id: parsed.id,
      fichaId: parsed.fichaId,
      textoVersion: parsed.textoVersion,
      fechaFirma: new Date(parsed.fechaFirma),
      estudianteAcepta: parsed.estudianteAcepta,
      modoLocal: true,
    };
  } catch {
    return null;
  }
}

function escribirLocal(fichaId: number, datos: RegistrarConsentimientoRequest): Consentimiento {
  const registro: RegistroLocal = {
    id: Date.now(),
    fichaId,
    textoVersion: datos.textoVersion,
    fechaFirma: new Date().toISOString(),
    estudianteAcepta: datos.estudianteAcepta,
  };
  localStorage.setItem(keyLocal(fichaId), JSON.stringify(registro));
  return {
    id: registro.id,
    fichaId: registro.fichaId,
    textoVersion: registro.textoVersion,
    fechaFirma: new Date(registro.fechaFirma),
    estudianteAcepta: registro.estudianteAcepta,
    modoLocal: true,
  };
}

function esNotFound(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 404;
}

function mapearDelBackend(b: ConsentimientoResponseBackend): Consentimiento {
  return {
    id: b.id,
    fichaId: b.fichaId,
    textoVersion: b.textoVersion,
    fechaFirma: new Date(b.fechaFirma),
    estudianteAcepta: b.estudianteAcepta,
    nombreEspecialista: b.nombreEspecialista,
    modoLocal: false,
  };
}

// ─── Servicio ───────────────────────────────────────────────────
export const consentimientoService = {
  modoLocal: !USAR_BACKEND,

  async registrar(
    fichaId: number,
    datos: RegistrarConsentimientoRequest
  ): Promise<Consentimiento> {
    if (!USAR_BACKEND) {
      return escribirLocal(fichaId, datos);
    }
    const { data } = await apiClient.post<ConsentimientoResponseBackend>(
      `/clinica/consentimientos/${fichaId}`,
      datos
    );
    return mapearDelBackend(data);
  },

  async obtenerPorFicha(fichaId: number): Promise<Consentimiento | null> {
    if (!USAR_BACKEND) {
      return leerLocal(fichaId);
    }
    try {
      const { data } = await apiClient.get<ConsentimientoResponseBackend>(
        `/clinica/consentimientos/${fichaId}`
      );
      return mapearDelBackend(data);
    } catch (err) {
      if (esNotFound(err)) return null;
      throw err;
    }
  },
};

// ─── Texto institucional del consentimiento informado ───────────
// Redactado como referencia institucional para el prototipo. La versión
// definitiva debe ser revisada por la Oficina de Bienestar Universitario
// (OBU) y por la unidad jurídica de la UCE antes de su uso real.
export const TEXTO_CONSENTIMIENTO_INSTITUCIONAL = `
CONSENTIMIENTO INFORMADO PARA ATENCIÓN PSICOLÓGICA
Oficina de Bienestar Universitario — Facultad de Filosofía, Letras y Ciencias de la Educación
Universidad Central del Ecuador
Versión: ${CONSENTIMIENTO_VERSION_ACTUAL}

1. NATURALEZA Y PROPÓSITO DEL SERVICIO
La Oficina de Bienestar Universitario (OBU) de la Facultad de Filosofía, Letras y Ciencias de la Educación de la Universidad Central del Ecuador ofrece, a través del presente sistema, atención psicológica gratuita en sus modalidades de Psicología Clínica y Psicología General a los estudiantes regularmente matriculados. El presente documento tiene por objeto informar al estudiante sobre las condiciones de la atención, sus derechos y obligaciones, y obtener su aceptación libre e informada para iniciar el proceso de intervención psicológica.

2. ALCANCE DE LA ATENCIÓN
La atención psicológica brindada por la OBU comprende, según corresponda al caso: la entrevista inicial y evaluación psicológica, la elaboración de un plan de intervención, la realización de sesiones de seguimiento, la derivación a otros servicios profesionales cuando el caso lo amerite, y el cierre del expediente clínico. La OBU no presta servicios de atención psiquiátrica, ni emite recetas farmacológicas, ni emite peritajes psicológicos con fines legales. En los casos en que se identifique una necesidad fuera del alcance del servicio, el estudiante será derivado de manera oportuna a la instancia correspondiente.

3. CARÁCTER VOLUNTARIO
La asistencia al servicio es estrictamente voluntaria. El estudiante puede solicitar la suspensión del proceso, sin que ello afecte su situación académica, mediante comunicación al especialista a cargo o a la coordinación de la OBU. El profesional, por su parte, podrá derivar el caso cuando lo considere clínicamente pertinente.

4. CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS
Toda la información clínica registrada con motivo de la atención está protegida por el secreto profesional al que están obligados los profesionales de la psicología, en concordancia con el Código de Ética del Psicólogo del Ecuador. Adicionalmente, el tratamiento de datos personales y sensibles se realiza conforme a la Ley Orgánica de Protección de Datos Personales (LOPDP) del Ecuador y a sus reglamentos. La información clínica únicamente podrá ser consultada por: (a) el o los especialistas directamente involucrados en la atención del estudiante; (b) el personal autorizado de la OBU para fines estrictamente administrativos; y (c) las autoridades judiciales competentes cuando así lo requieran mediante mandato debidamente notificado.

5. EXCEPCIONES AL DEBER DE CONFIDENCIALIDAD
El especialista podrá levantar la confidencialidad, de manera excepcional y proporcionada, cuando: (a) exista riesgo grave e inminente para la vida o la integridad del propio estudiante o de terceros; (b) exista sospecha fundada de vulneración de derechos de niñas, niños o adolescentes; o (c) lo disponga expresamente la autoridad judicial competente. En tales casos, el estudiante será informado de la actuación realizada, salvo que ello comprometa la finalidad de protección.

6. REGISTRO DIGITAL DE LA INFORMACIÓN CLÍNICA
La información clínica del estudiante se registra en el sistema digital institucional de la OBU. Dicho sistema cuenta con mecanismos de autenticación de usuarios, control de acceso por rol, registro de auditoría y respaldos periódicos. El acceso al expediente del estudiante queda restringido al especialista asignado y, de manera limitada, al personal de coordinación y administración del servicio.

7. DERECHOS DEL TITULAR DE LOS DATOS
En su calidad de titular de los datos personales, el estudiante tiene derecho a: solicitar el acceso a la información que sobre él se encuentra registrada; solicitar la rectificación de datos inexactos; solicitar la cancelación de su expediente en los términos previstos por la LOPDP; oponerse al tratamiento de sus datos para finalidades distintas de la atención psicológica; y presentar reclamaciones ante la autoridad nacional de protección de datos personales cuando considere vulnerados sus derechos.

8. SESIONES Y ASISTENCIA
La frecuencia, duración y modalidad de las sesiones serán acordadas con el especialista a cargo. El estudiante se compromete a asistir puntualmente a las citas programadas y a notificar con la mayor antelación posible cualquier inasistencia. La acumulación de tres (3) inasistencias injustificadas constituye causal de cierre automático del expediente, sin perjuicio del derecho del estudiante a solicitar una nueva apertura en el futuro.

9. ALCANCE DEL PROTOTIPO TECNOLÓGICO
El presente servicio se brinda como parte de un sistema institucional en proceso de implementación. Algunas funcionalidades del sistema (por ejemplo, notificaciones automáticas, descarga de documentos) pueden encontrarse en fase de desarrollo. La validez del proceso clínico, sin embargo, no depende de dichas funcionalidades técnicas.

10. ACEPTACIÓN
Al marcar la casilla de aceptación que acompaña a este documento, el estudiante declara haber leído, comprendido y aceptado las condiciones aquí establecidas, y autoriza el inicio del proceso de atención psicológica y el tratamiento de su información clínica en los términos descritos.
`.trim();
