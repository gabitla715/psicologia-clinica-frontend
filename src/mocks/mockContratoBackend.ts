// ════════════════════════════════════════════════════════════════
// MOCK CENTRALIZADO
// ════════════════════════════════════════════════════════════════
//
// Este archivo reúne todo lo que el frontend necesita pero que el
// backend todavía no expone. Es el único lugar del proyecto con
// datos simulados: nada de mocks sueltos dentro de componentes o de
// otros servicios.
//
// Cuando exista el endpoint real correspondiente, el cambio sigue
// siempre el mismo patrón en 2 pasos:
//   1. Reemplazar el cuerpo de la función de aquí por una llamada
//      real con `apiClient` (mismo nombre, misma firma).
//   2. Borrar la sección de este archivo que ya no se necesite.
// Ningún componente que consuma este archivo debería tener que
// cambiar una sola línea cuando eso pase.
//
// Persistencia: localStorage, con el prefijo `mock:` para poder
// limpiarlo fácil (ver `resetearMocks()` al final).
// ════════════════════════════════════════════════════════════════

import type { TipoPsicologia } from '../api/fichaService';
import type { EstadoSolicitud } from '../api/solicitudService';

const PREFIJO = 'mock:';

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    return crudo ? (JSON.parse(crudo) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir<T>(clave: string, valor: T): void {
  localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
}

// ────────────────────────────────────────────────────────────────
// SECCIÓN 1 — Fecha/hora de la asignación y estados extendidos
// ────────────────────────────────────────────────────────────────
// Para que esto deje de ser simulado, `PATCH /solicitudes/{id}/asignar`
// necesitaría aceptar también `fechaHora` (ISO 8601), y el enum
// EstadoSolicitud debería crecer a: PENDIENTE, ASIGNADA, CONFIRMADA,
// ATENDIDA, CANCELADA, REAGENDADA, RECHAZADA. Mientras tanto, esto
// vive aquí.

export type EstadoSolicitudExtendido = EstadoSolicitud | 'CONFIRMADA' | 'ATENDIDA' | 'REAGENDADA';

export interface SolicitudSnapshot {
  estudianteId: number; // Student.id REAL (viene de SolicitudAtencionResponse.estudianteId).
  nombreEstudiante: string;
  tipoPsicologia: TipoPsicologia;
  motivoSolicitud: string;
  creadoEn: string;
}

export interface AsignacionExtra {
  solicitudId: number;
  fechaHora: string | null; // ISO 8601
  estadoExtendido: EstadoSolicitudExtendido;
  historial: EventoHistorial[];
  especialistaId: number;
  nombreEspecialista: string;
  solicitud: SolicitudSnapshot;
  /** Se llena cuando el especialista abre la ficha clínica real desde este
   * registro (ver mockAsignacionCita.vincularFicha). Mientras sea null, el
   * caso aparece como "designado, sin ficha abierta todavía". */
  fichaIdCreada: number | null;
}

export interface EventoHistorial {
  fecha: string; // ISO 8601
  descripcion: string;
}

function obtenerTodasLasAsignacionesExtra(): Record<number, AsignacionExtra> {
  return leer('asignaciones-extra', {} as Record<number, AsignacionExtra>);
}

export const mockAsignacionCita = {
  /** Se llama justo después de que `solicitudService.asignar(...)` (real) tuvo éxito. */
  registrarAsignacion(
    solicitudId: number,
    fechaHora: string | null,
    quienEscribio: string,
    especialistaId: number,
    nombreEspecialista: string,
    solicitud: SolicitudSnapshot
  ): AsignacionExtra {
    const todas = obtenerTodasLasAsignacionesExtra();
    const historialPrevio = todas[solicitudId]?.historial ?? [
      { fecha: solicitud.creadoEn, descripcion: 'Solicitud creada' },
    ];
    const registro: AsignacionExtra = {
      solicitudId,
      fechaHora,
      estadoExtendido: 'ASIGNADA',
      especialistaId,
      nombreEspecialista,
      solicitud,
      fichaIdCreada: todas[solicitudId]?.fichaIdCreada ?? null,
      historial: [
        ...historialPrevio,
        { fecha: new Date().toISOString(), descripcion: `Especialista asignado por ${quienEscribio}` },
      ],
    };
    todas[solicitudId] = registro;
    escribir('asignaciones-extra', todas);
    return registro;
  },

  obtener(solicitudId: number): AsignacionExtra | null {
    return obtenerTodasLasAsignacionesExtra()[solicitudId] ?? null;
  },

  listarTodas(): AsignacionExtra[] {
    return Object.values(obtenerTodasLasAsignacionesExtra());
  },

  /**
   * Casos asignados a un especialista concreto (usuario.datosEspecialista.id,
   * es decir Specialist.id) que todavía NO tienen ficha clínica abierta.
   * Esta es la lista de "estudiantes designados" del panel del psicólogo,
   * mientras no exista un endpoint real de "mis solicitudes asignadas".
   *
   * ⚠️ Limitación conocida: como esto vive en localStorage, solo aparece
   * si la asignación se hizo desde ESTE MISMO navegador. Para que el
   * psicólogo la vea desde su propia sesión real, se necesita el endpoint
   * pedido a Gabriel: GET /api/v1/solicitudes/asignadas (rol SPECIALIST).
   */
  listarDesignadosSinFicha(especialistaId: number): AsignacionExtra[] {
    return Object.values(obtenerTodasLasAsignacionesExtra()).filter(
      (a) =>
        a.especialistaId === especialistaId &&
        a.fichaIdCreada === null &&
        a.estadoExtendido !== 'CANCELADA'
    );
  },

  /** Se llama justo después de crear la ficha real (fichaService.crear) a
   * partir de un registro designado, para que deje de listarse como pendiente. */
  vincularFicha(solicitudId: number, fichaId: number): void {
    const todas = obtenerTodasLasAsignacionesExtra();
    const actual = todas[solicitudId];
    if (!actual) return;
    actual.fichaIdCreada = fichaId;
    todas[solicitudId] = actual;
    escribir('asignaciones-extra', todas);
  },

  cambiarEstado(solicitudId: number, nuevoEstado: EstadoSolicitudExtendido, descripcionEvento: string): void {
    const todas = obtenerTodasLasAsignacionesExtra();
    const actual = todas[solicitudId];
    if (!actual) return;
    actual.estadoExtendido = nuevoEstado;
    actual.historial.push({ fecha: new Date().toISOString(), descripcion: descripcionEvento });
    todas[solicitudId] = actual;
    escribir('asignaciones-extra', todas);
  },
};

// ────────────────────────────────────────────────────────────────
// SECCIÓN 1B — Nivel de atención (indicador administrativo, no clínico)
// ────────────────────────────────────────────────────────────────
// No existe en el backend. Es una anotación del propio especialista sobre
// su ficha, para priorizar su carga de trabajo. NO reemplaza el criterio
// clínico ni el nivel de riesgo registrado en la Entrevista Inicial.
// Pedido de backend (si se quiere hacer real): agregar campo opcional
// `nivelAtencion` a FichaPsicologica, editable solo por SPECIALIST.

export type NivelAtencion = 'BAJO' | 'MEDIO' | 'ALTO' | 'URGENTE';

export const META_NIVEL_ATENCION: Record<
  NivelAtencion,
  { etiqueta: string; emoji: string; claseBadge: string }
> = {
  BAJO: { etiqueta: 'Bajo', emoji: '🟢', claseBadge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  MEDIO: { etiqueta: 'Medio', emoji: '🟡', claseBadge: 'bg-amber-50 text-amber-700 ring-amber-200' },
  ALTO: { etiqueta: 'Alto', emoji: '🟠', claseBadge: 'bg-orange-50 text-orange-700 ring-orange-200' },
  URGENTE: { etiqueta: 'Urgente', emoji: '🔴', claseBadge: 'bg-red-50 text-red-700 ring-red-200' },
};

export const mockNivelAtencion = {
  obtener(fichaId: number): NivelAtencion {
    return leer(`nivel-atencion:${fichaId}`, 'BAJO' as NivelAtencion);
  },
  establecer(fichaId: number, nivel: NivelAtencion): void {
    escribir(`nivel-atencion:${fichaId}`, nivel);
  },
};

// ────────────────────────────────────────────────────────────────
// SECCIÓN 1D — Directorio local de estudiantes (cédula → Student.id)
// ────────────────────────────────────────────────────────────────
// Por qué esto NO es "inventar" un ID (a diferencia de lo que se evitó
// antes): aquí NUNCA se genera un estudianteId nuevo. Solo se guarda,
// bajo la cédula que el propio especialista escribe, un ID que YA SE
// USÓ CON ÉXITO en una llamada real a fichaService.crear (es decir, el
// backend ya lo validó como un Student.id existente). El backend
// sigue siendo la única fuente de verdad: si el ID fuera inválido, la
// creación de la ficha habría fallado antes de llegar aquí.
//
// Esto permite probar el flujo de búsqueda por cédula de punta a
// punta HOY, mientras Gabriel implementa el endpoint real
// (GET /clinica/estudiantes/buscar). Cuando ese endpoint exista, basta
// con que estudianteBusquedaService lo use como fuente principal y
// este directorio quede solo como respaldo (o se borre esta sección).
export interface EntradaDirectorio {
  identificacion: string;
  estudianteId: number;
  nombres: string;
  apellidos: string;
  carrera?: string;
}

export const mockDirectorioEstudiantes = {
  registrar(entrada: EntradaDirectorio): void {
    const todos = leer<Record<string, EntradaDirectorio>>('directorio-estudiantes', {});
    todos[entrada.identificacion.trim()] = entrada;
    escribir('directorio-estudiantes', todos);
  },
  buscarPorCedula(identificacion: string): EntradaDirectorio | null {
    const todos = obtenerDirectorioConSemillas();
    return todos[identificacion.trim()] ?? null;
  },
  listarTodos(): EntradaDirectorio[] {
    return Object.values(obtenerDirectorioConSemillas());
  },
};

// Datos de prueba para poder demostrar la búsqueda por cédula de punta a
// punta HOY mismo. Reemplázalos por los estudiantes reales que necesites
// probar (o bórralos) editando este arreglo — no requiere tocar ningún
// otro archivo. Los `estudianteId` deben corresponder a un Student.id que
// exista de verdad en tu base para que la creación de la ficha funcione.
const SEMILLAS_DIRECTORIO: EntradaDirectorio[] = [
  { identificacion: '1712345678', estudianteId: 1, nombres: 'Carlos', apellidos: 'Ramírez Solís', carrera: 'Educación Básica' },
  { identificacion: '1723456789', estudianteId: 2, nombres: 'María', apellidos: 'Estudiante', carrera: 'Psicología' },
  { identificacion: '1734567890', estudianteId: 3, nombres: 'Ana', apellidos: 'Torres López', carrera: 'Pedagogía' },
];

function obtenerDirectorioConSemillas(): Record<string, EntradaDirectorio> {
  const guardado = leer<Record<string, EntradaDirectorio>>('directorio-estudiantes', {});
  if (Object.keys(guardado).length > 0) return guardado;
  const conSemillas: Record<string, EntradaDirectorio> = {};
  for (const s of SEMILLAS_DIRECTORIO) conSemillas[s.identificacion] = s;
  escribir('directorio-estudiantes', conSemillas);
  return conSemillas;
}

// ────────────────────────────────────────────────────────────────
// SECCIÓN 1C — Alta / cierre general del caso
// ────────────────────────────────────────────────────────────────
// Verificado en el backend: FichaPsicologica.cerrar() existe en el
// dominio y deja el estado en CERRADA, pero NINGÚN caso de uso ni
// controlador lo invoca. Hoy solo son alcanzables DERIVADA (vía
// DerivacionController) y DESISTIDA (vía DesistimientoController).
// No hay ningún camino real para dar de alta un caso.
//
// Pedido de backend: un endpoint tipo
//   PATCH /api/v1/psicologia/fichas/{id}/cerrar
//   { motivoCierre, resultados, observaciones, fechaAlta }
// que invoque FichaPsicologica.cerrar() y deje estado=CERRADA.
//
// Mientras tanto, esto es una anotación local: no cambia el estado
// real de la ficha en el backend (seguirá en ACTIVA), pero el resto
// del frontend (estadoCaso.ts) la trata como "ALTA" en todas las
// vistas para mantener consistencia visual.
export interface RegistroAlta {
  fichaId: number;
  motivoCierre: string;
  resultados: string;
  observaciones?: string;
  fechaAlta: string; // ISO date
  registradoEn: string; // ISO datetime
}

export const mockCierreCaso = {
  registrarAlta(fichaId: number, datos: Omit<RegistroAlta, 'fichaId' | 'registradoEn'>): RegistroAlta {
    const registro: RegistroAlta = {
      fichaId,
      ...datos,
      registradoEn: new Date().toISOString(),
    };
    escribir(`alta:${fichaId}`, registro);
    return registro;
  },
  obtener(fichaId: number): RegistroAlta | null {
    return leer<RegistroAlta | null>(`alta:${fichaId}`, null);
  },
};

// ────────────────────────────────────────────────────────────────
// SECCIÓN 2 — Carga de trabajo por especialista
// ────────────────────────────────────────────────────────────────
// Requeriría un endpoint tipo `GET /admin/especialistas/{id}/carga`
// que devuelva { citasActivas: number, fichasActivas: number }.
// Mientras tanto, se estima contando las asignaciones hechas desde
// esta misma sesión del navegador (dato parcial, no exacto).

export const mockCargaEspecialista = {
  calcularCargaAproximada(especialistaId: number): 'baja' | 'media' | 'alta' {
    const activas = Object.values(obtenerTodasLasAsignacionesExtra()).filter(
      (a) => a.especialistaId === especialistaId && a.estadoExtendido !== 'ATENDIDA' && a.estadoExtendido !== 'CANCELADA'
    ).length;
    if (activas <= 2) return 'baja';
    if (activas <= 5) return 'media';
    return 'alta';
  },
};

// ────────────────────────────────────────────────────────────────
// SECCIÓN 3 — utilidades
// ────────────────────────────────────────────────────────────────

export function resetearMocks(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIJO))
    .forEach((k) => localStorage.removeItem(k));
}

// Metadata visual de los estados extendidos (color + orden para el
// stepper). Vive aquí porque está atada 1:1 a `EstadoSolicitudExtendido`.
export const ORDEN_ESTADO_EXTENDIDO: EstadoSolicitudExtendido[] = [
  'PENDIENTE',
  'ASIGNADA',
  'CONFIRMADA',
  'ATENDIDA',
];

export const META_ESTADO_EXTENDIDO: Record<
  EstadoSolicitudExtendido,
  { etiqueta: string; claseBadge: string; claseSolida: string }
> = {
  PENDIENTE: { etiqueta: 'Pendiente', claseBadge: 'bg-amber-50 text-amber-700 ring-amber-200', claseSolida: 'bg-amber-500' },
  ASIGNADA: { etiqueta: 'Asignada', claseBadge: 'bg-blue-50 text-blue-700 ring-blue-200', claseSolida: 'bg-blue-500' },
  CONFIRMADA: { etiqueta: 'Confirmada', claseBadge: 'bg-indigo-50 text-indigo-700 ring-indigo-200', claseSolida: 'bg-indigo-500' },
  ATENDIDA: { etiqueta: 'Atendida', claseBadge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', claseSolida: 'bg-emerald-500' },
  CANCELADA: { etiqueta: 'Cancelada', claseBadge: 'bg-red-50 text-red-700 ring-red-200', claseSolida: 'bg-red-500' },
  RECHAZADA: { etiqueta: 'Rechazada', claseBadge: 'bg-red-50 text-red-700 ring-red-200', claseSolida: 'bg-red-500' },
  REAGENDADA: { etiqueta: 'Reagendada', claseBadge: 'bg-violet-50 text-violet-700 ring-violet-200', claseSolida: 'bg-violet-500' },
};

export type { TipoPsicologia };
