// ────────────────────────────────────────────────────────────────
// Servicio de pacientes (vista de psicólogo sobre las fichas).
//
// Wrapper semántico sobre fichaService. La "ficha" es la unidad real
// de datos en el backend; "paciente" es la lectura desde la UI del
// psicólogo. Esta capa permite, más adelante, agregar lógica propia
// de paciente (resúmenes, métricas) sin tocar fichaService.
// ────────────────────────────────────────────────────────────────
import {
  fichaService,
  type Ficha,
  type EstadoFicha,
} from './fichaService';

/**
 * Un "paciente" desde la perspectiva del psicólogo es una ficha
 * asignada a él. Reutilizamos el tipo Ficha tal cual: no inventamos
 * un modelo paralelo que tendríamos que mantener sincronizado.
 */
export type Paciente = Ficha;

export const pacienteService = {
  /**
   * Lista todas las fichas del especialista autenticado.
   * Consume GET /psicologia/fichas/mis-fichas.
   */
  async listarMisPacientes(): Promise<Paciente[]> {
    return fichaService.listarMisFichas();
  },

  /**
   * Lista las fichas del especialista filtradas en cliente por estado.
   * El backend no expone filtro por estado en /mis-fichas; lo aplicamos aquí.
   */
  async listarPorEstado(estado: EstadoFicha): Promise<Paciente[]> {
    const todas = await fichaService.listarMisFichas();
    return todas.filter((f) => f.estado === estado);
  },

  /** Obtiene el detalle de una ficha por su ID. */
  async obtenerPorId(fichaId: number): Promise<Paciente> {
    return fichaService.obtenerPorId(fichaId);
  },
};
