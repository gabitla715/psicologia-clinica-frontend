// ────────────────────────────────────────────────────────────────
// Capa de datos SIMULADA del módulo Coordinador.
//
// ⚠️ IMPORTANTE — LEER ANTES DE TOCAR ESTE ARCHIVO:
// El backend NO tiene (todavía) ningún endpoint para el flujo de
// "solicitud del estudiante → asignación de especialista por el
// coordinador". El endpoint /psicologia/derivaciones NO sirve para
// esto: es SPECIALIST-only, exige una ficha ya abierta, el campo
// profesionalDestino es texto libre (no un especialistaId real) y
// marca la ficha como DERIVADA (=caso cerrado). Ver INSTRUCCIONES.md
// para el detalle completo del pedido a Gabo (backend).
//
// Mientras ese backend no exista, TODO este módulo vive en
// localStorage bajo la clave `coordinador:v1`. Cuando el backend
// esté listo, solo hay que reescribir las funciones de este archivo
// para que llamen a apiClient — las pantallas que consumen este
// servicio (coordinadorService más abajo) NO deberían necesitar
// cambios, porque ya trabajan con Promises y con estos mismos tipos.
// ────────────────────────────────────────────────────────────────

import type { TipoPsicologia } from './fichaService';

// ─── Tipos de dominio ────────────────────────────────────────────

export type EstadoSolicitud =
  | 'PENDIENTE'          // el estudiante pidió el servicio, nadie la ha tocado
  | 'ASIGNADA'           // el coordinador asignó especialista + fecha/hora
  | 'RECHAZADA_ESTUDIANTE' // el estudiante rechazó la hora propuesta
  | 'CONFIRMADA'         // el estudiante aceptó la hora propuesta
  | 'CANCELADA';         // el coordinador la canceló

export interface SolicitudCoordinador {
  id: number;
  estudianteId: number;
  nombreEstudiante: string;
  cedulaEstudiante: string;
  correoEstudiante: string;
  carreraEstudiante: string;
  tipoPsicologia: TipoPsicologia;
  estado: EstadoSolicitud;
  fechaSolicitud: string; // ISO
  especialistaAsignadoId?: number;
  nombreEspecialistaAsignado?: string;
  fechaHoraPropuesta?: string; // ISO LocalDateTime `YYYY-MM-DDTHH:mm:00`
  motivoAsignacion?: string;
  motivoRechazo?: string;
  historial: EventoSolicitud[];
}

export interface EventoSolicitud {
  fecha: string; // ISO
  tipo: 'CREADA' | 'ASIGNADA' | 'RECHAZADA' | 'REAGENDADA' | 'CONFIRMADA' | 'CANCELADA';
  detalle: string;
}

export interface EspecialistaCoordinador {
  id: number;
  nombre: string;
  correo: string;
  especialidad: string;
  tipoPsicologia: TipoPsicologia;
}

export interface BloqueOcupado {
  especialistaId: number;
  fechaHoraInicio: string; // ISO LocalDateTime
  duracionMinutos: number;
  motivo: string; // "Cita asignada", "Cita del backend real", etc.
}

// ─── Feriados Ecuador 2026 (nacionales, fijos + trasladados) ────
// Fuente: calendario oficial de feriados de Ecuador. Se usa solo
// para bloquear la asignación de citas en días no laborables.
export const FERIADOS_EC_2026: string[] = [
  '2026-01-01', // Año Nuevo
  '2026-02-16', // Carnaval (lunes)
  '2026-02-17', // Carnaval (martes)
  '2026-04-03', // Viernes Santo
  '2026-05-01', // Día del Trabajo
  '2026-05-24', // Batalla de Pichincha
  '2026-08-10', // Primer Grito de Independencia
  '2026-10-09', // Independencia de Guayaquil
  '2026-11-02', // Día de los Difuntos
  '2026-11-03', // Independencia de Cuenca
  '2026-12-25', // Navidad
];

const HORA_INICIO_JORNADA = 8; // 08:00
const HORA_FIN_JORNADA = 19; // 19:00 (última hora de inicio de bloque: 18:30)
const DURACION_BLOQUE_MIN = 30;

// ─── Helpers de fecha/disponibilidad ─────────────────────────────

/** true si la fecha (YYYY-MM-DD) es sábado o domingo. */
export function esFinDeSemana(fechaISO: string): boolean {
  const dia = new Date(`${fechaISO}T00:00:00`).getDay(); // 0=domingo, 6=sábado
  return dia === 0 || dia === 6;
}

/** true si la fecha (YYYY-MM-DD) es feriado nacional (lista 2026). */
export function esFeriado(fechaISO: string): boolean {
  return FERIADOS_EC_2026.includes(fechaISO);
}

/** true si la fecha es hábil: no es fin de semana ni feriado. */
export function esDiaHabil(fechaISO: string): boolean {
  return !esFinDeSemana(fechaISO) && !esFeriado(fechaISO);
}

/** Genera los bloques de 30 min de la jornada laboral (08:00–18:30). */
export function generarBloquesJornada(): string[] {
  const bloques: string[] = [];
  for (let h = HORA_INICIO_JORNADA; h < HORA_FIN_JORNADA; h++) {
    bloques.push(`${String(h).padStart(2, '0')}:00`);
    bloques.push(`${String(h).padStart(2, '0')}:30`);
  }
  return bloques;
}

// ─── Persistencia local (localStorage) ───────────────────────────

const STORAGE_KEY = 'coordinador:v1';

interface EstadoAlmacenado {
  solicitudes: SolicitudCoordinador[];
  especialistas: EspecialistaCoordinador[];
  bloquesOcupados: BloqueOcupado[];
  siguienteIdSolicitud: number;
}

function estadoInicial(): EstadoAlmacenado {
  const especialistas: EspecialistaCoordinador[] = [
    { id: 101, nombre: 'Ps. María Fernanda López', correo: 'mlopez@uce.edu.ec', especialidad: 'Psicología Clínica', tipoPsicologia: 'CLINICA' },
    { id: 102, nombre: 'Ps. Carlos Andrés Herrera', correo: 'cherrera@uce.edu.ec', especialidad: 'Psicología Clínica', tipoPsicologia: 'CLINICA' },
    { id: 103, nombre: 'Ps. Daniela Salazar', correo: 'dsalazar@uce.edu.ec', especialidad: 'Psicología Educativa', tipoPsicologia: 'GENERAL' },
    { id: 104, nombre: 'Ps. Jorge Iván Paredes', correo: 'jparedes@uce.edu.ec', especialidad: 'Psicología Educativa', tipoPsicologia: 'GENERAL' },
  ];

  const solicitudes: SolicitudCoordinador[] = [
    {
      id: 1,
      estudianteId: 501,
      nombreEstudiante: 'Ana Belén Chicaiza',
      cedulaEstudiante: '1723456789',
      correoEstudiante: 'abchicaiza@uce.edu.ec',
      carreraEstudiante: 'Pedagogía de las Ciencias Experimentales',
      tipoPsicologia: 'CLINICA',
      estado: 'PENDIENTE',
      fechaSolicitud: new Date(Date.now() - 2 * 86400000).toISOString(),
      historial: [
        { fecha: new Date(Date.now() - 2 * 86400000).toISOString(), tipo: 'CREADA', detalle: 'Estudiante solicitó Psicología Clínica.' },
      ],
    },
    {
      id: 2,
      estudianteId: 502,
      nombreEstudiante: 'Luis Fernando Quinatoa',
      cedulaEstudiante: '1798765432',
      correoEstudiante: 'lfquinatoa@uce.edu.ec',
      carreraEstudiante: 'Educación Básica',
      tipoPsicologia: 'GENERAL',
      estado: 'PENDIENTE',
      fechaSolicitud: new Date(Date.now() - 1 * 86400000).toISOString(),
      historial: [
        { fecha: new Date(Date.now() - 1 * 86400000).toISOString(), tipo: 'CREADA', detalle: 'Estudiante solicitó Psicología General.' },
      ],
    },
  ];

  return {
    solicitudes,
    especialistas,
    bloquesOcupados: [],
    siguienteIdSolicitud: 3,
  };
}

function cargarEstado(): EstadoAlmacenado {
  const crudo = localStorage.getItem(STORAGE_KEY);
  if (!crudo) {
    const inicial = estadoInicial();
    guardarEstado(inicial);
    return inicial;
  }
  try {
    return JSON.parse(crudo) as EstadoAlmacenado;
  } catch {
    const inicial = estadoInicial();
    guardarEstado(inicial);
    return inicial;
  }
}

function guardarEstado(estado: EstadoAlmacenado): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

/** Simula latencia de red para que las pantallas se sientan reales. */
function retardo<T>(valor: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(valor), ms));
}

// ─── Servicio ─────────────────────────────────────────────────────

export const coordinadorMockService = {
  /** Lista todas las solicitudes (opcionalmente filtradas por estado). */
  async listarSolicitudes(estado?: EstadoSolicitud): Promise<SolicitudCoordinador[]> {
    const { solicitudes } = cargarEstado();
    const ordenadas = [...solicitudes].sort(
      (a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
    );
    const filtradas = estado ? ordenadas.filter((s) => s.estado === estado) : ordenadas;
    return retardo(filtradas);
  },

  async obtenerSolicitud(id: number): Promise<SolicitudCoordinador | null> {
    const { solicitudes } = cargarEstado();
    return retardo(solicitudes.find((s) => s.id === id) ?? null);
  },

  /**
   * Busca la solicitud más reciente de un estudiante (por su ID real de
   * usuario). Usado por `MiSolicitud.tsx` para mostrarle al estudiante el
   * estado de su propia solicitud/asignación.
   */
  async obtenerSolicitudDeEstudiante(estudianteId: number): Promise<SolicitudCoordinador | null> {
    const { solicitudes } = cargarEstado();
    const propias = solicitudes
      .filter((s) => s.estudianteId === estudianteId)
      .sort((a, b) => new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime());
    return retardo(propias[0] ?? null);
  },

  /** Lista especialistas, opcionalmente filtrados por tipo de psicología. */
  async listarEspecialistas(tipo?: TipoPsicologia): Promise<EspecialistaCoordinador[]> {
    const { especialistas } = cargarEstado();
    const filtrados = tipo ? especialistas.filter((e) => e.tipoPsicologia === tipo) : especialistas;
    return retardo(filtrados);
  },

  /**
   * Disponibilidad de un especialista para una fecha (YYYY-MM-DD).
   * Devuelve el listado de bloques de 30 min con su estado de ocupación.
   * Si la fecha no es hábil, devuelve un arreglo vacío.
   */
  async obtenerDisponibilidad(
    especialistaId: number,
    fechaISO: string
  ): Promise<{ hora: string; ocupado: boolean }[]> {
    if (!esDiaHabil(fechaISO)) return retardo([]);

    const { bloquesOcupados } = cargarEstado();
    const ocupadosDelDia = new Set(
      bloquesOcupados
        .filter((b) => b.especialistaId === especialistaId && b.fechaHoraInicio.startsWith(fechaISO))
        .map((b) => b.fechaHoraInicio.slice(11, 16))
    );

    const bloques = generarBloquesJornada().map((hora) => ({
      hora,
      ocupado: ocupadosDelDia.has(hora),
    }));
    return retardo(bloques);
  },

  /**
   * El coordinador asigna especialista + fecha/hora a una solicitud.
   * Simula el envío del correo al estudiante (ver notas en la UI).
   */
  async asignarEspecialista(args: {
    solicitudId: number;
    especialistaId: number;
    fechaISO: string; // YYYY-MM-DD
    hora: string; // HH:mm
    motivo: string;
  }): Promise<SolicitudCoordinador> {
    if (!esDiaHabil(args.fechaISO)) {
      throw new Error('No se puede asignar una cita en fin de semana o feriado.');
    }

    const estado = cargarEstado();
    const solicitud = estado.solicitudes.find((s) => s.id === args.solicitudId);
    if (!solicitud) throw new Error('Solicitud no encontrada.');

    const especialista = estado.especialistas.find((e) => e.id === args.especialistaId);
    if (!especialista) throw new Error('Especialista no encontrado.');

    const fechaHoraPropuesta = `${args.fechaISO}T${args.hora}:00`;

    const yaOcupado = estado.bloquesOcupados.some(
      (b) => b.especialistaId === args.especialistaId && b.fechaHoraInicio === fechaHoraPropuesta
    );
    if (yaOcupado) throw new Error('Ese horario ya fue asignado a otro estudiante.');

    solicitud.estado = 'ASIGNADA';
    solicitud.especialistaAsignadoId = especialista.id;
    solicitud.nombreEspecialistaAsignado = especialista.nombre;
    solicitud.fechaHoraPropuesta = fechaHoraPropuesta;
    solicitud.motivoAsignacion = args.motivo;
    solicitud.motivoRechazo = undefined;
    solicitud.historial.push({
      fecha: new Date().toISOString(),
      tipo: 'ASIGNADA',
      detalle: `Asignado a ${especialista.nombre} el ${args.fechaISO} a las ${args.hora}. Motivo: ${args.motivo}`,
    });

    estado.bloquesOcupados.push({
      especialistaId: especialista.id,
      fechaHoraInicio: fechaHoraPropuesta,
      duracionMinutos: DURACION_BLOQUE_MIN,
      motivo: `Cita asignada — solicitud #${solicitud.id}`,
    });

    guardarEstado(estado);

    // ── Simulación de envío de correo al estudiante ──
    console.info(
      `[MOCK EMAIL] Para: ${solicitud.correoEstudiante} — ` +
        `"Se te ha asignado con ${especialista.nombre} el ${args.fechaISO} a las ${args.hora}."`
    );

    return retardo(solicitud);
  },

  /** El estudiante rechaza la hora propuesta y pide reagendar. */
  async rechazarYSolicitarReagenda(solicitudId: number, motivoRechazo: string): Promise<SolicitudCoordinador> {
    const estado = cargarEstado();
    const solicitud = estado.solicitudes.find((s) => s.id === solicitudId);
    if (!solicitud) throw new Error('Solicitud no encontrada.');

    // Libera el bloque ocupado previo, si existía.
    if (solicitud.fechaHoraPropuesta && solicitud.especialistaAsignadoId) {
      estado.bloquesOcupados = estado.bloquesOcupados.filter(
        (b) =>
          !(
            b.especialistaId === solicitud.especialistaAsignadoId &&
            b.fechaHoraInicio === solicitud.fechaHoraPropuesta
          )
      );
    }

    solicitud.estado = 'RECHAZADA_ESTUDIANTE';
    solicitud.motivoRechazo = motivoRechazo;
    solicitud.historial.push({
      fecha: new Date().toISOString(),
      tipo: 'RECHAZADA',
      detalle: `Estudiante rechazó la hora propuesta. Motivo: ${motivoRechazo}`,
    });

    guardarEstado(estado);
    return retardo(solicitud);
  },

  /** El estudiante confirma la hora propuesta por el coordinador. */
  async confirmarAsignacion(solicitudId: number): Promise<SolicitudCoordinador> {
    const estado = cargarEstado();
    const solicitud = estado.solicitudes.find((s) => s.id === solicitudId);
    if (!solicitud) throw new Error('Solicitud no encontrada.');

    solicitud.estado = 'CONFIRMADA';
    solicitud.historial.push({
      fecha: new Date().toISOString(),
      tipo: 'CONFIRMADA',
      detalle: 'Estudiante confirmó la cita asignada.',
    });

    guardarEstado(estado);
    return retardo(solicitud);
  },

  /** Crea una nueva solicitud (simula lo que hoy hace ElegirServicio.tsx solo en localStorage propio). */
  async crearSolicitud(datos: {
    estudianteId: number;
    nombreEstudiante: string;
    cedulaEstudiante: string;
    correoEstudiante: string;
    carreraEstudiante: string;
    tipoPsicologia: TipoPsicologia;
  }): Promise<SolicitudCoordinador> {
    const estado = cargarEstado();

    // Evita duplicar la solicitud si el estudiante ya tiene una activa
    // (PENDIENTE, ASIGNADA o CONFIRMADA) del mismo tipo.
    const existente = estado.solicitudes.find(
      (s) =>
        s.estudianteId === datos.estudianteId &&
        s.tipoPsicologia === datos.tipoPsicologia &&
        s.estado !== 'CANCELADA' &&
        s.estado !== 'RECHAZADA_ESTUDIANTE'
    );
    if (existente) return retardo(existente);

    const nueva: SolicitudCoordinador = {
      id: estado.siguienteIdSolicitud++,
      ...datos,
      estado: 'PENDIENTE',
      fechaSolicitud: new Date().toISOString(),
      historial: [
        {
          fecha: new Date().toISOString(),
          tipo: 'CREADA',
          detalle: `Estudiante solicitó ${datos.tipoPsicologia === 'CLINICA' ? 'Psicología Clínica' : 'Psicología General'}.`,
        },
      ],
    };
    estado.solicitudes.push(nueva);
    guardarEstado(estado);
    return retardo(nueva);
  },
};

export const NOMBRE_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente de asignación',
  ASIGNADA: 'Asignada — esperando confirmación',
  RECHAZADA_ESTUDIANTE: 'Rechazada por el estudiante',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
};

export const COLOR_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 ring-amber-200',
  ASIGNADA: 'bg-blue-50 text-blue-700 ring-blue-200',
  RECHAZADA_ESTUDIANTE: 'bg-red-50 text-red-700 ring-red-200',
  CONFIRMADA: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CANCELADA: 'bg-slate-100 text-slate-600 ring-slate-200',
};
