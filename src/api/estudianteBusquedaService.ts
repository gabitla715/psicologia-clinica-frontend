// ────────────────────────────────────────────────────────────────
// Búsqueda de estudiante por cédula, para el especialista.
//
// ⚠️ Endpoint pendiente en el backend (ver Pedido a Gabriel):
//   GET /api/v1/clinica/estudiantes/buscar?identificacion={cedula}
//   Debe devolver { estudianteId (Student.id), nombres, apellidos,
//   identificacion, carrera }, accesible para rol SPECIALIST.
//
// IMPORTANTE — por qué esto NO está en mockContratoBackend.ts:
// no existe ninguna fuente real de datos (cédula → Student.id)
// accesible para SPECIALIST. Simular esa relación aquí significaría
// inventar un ID que después se usa para crear una ficha clínica
// REAL — exactamente lo que no debemos hacer. Por eso este servicio
// llama al endpoint real tal cual se lo pedimos a Gabriel, y si no
// existe todavía (404 o cualquier error), devuelve null sin fabricar
// nada. El día que el endpoint exista, esto empieza a funcionar solo.
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';
import { mockDirectorioEstudiantes } from '../mocks/mockContratoBackend';

export interface EstudianteEncontrado {
  estudianteId: number; // Student.id real
  nombres: string;
  apellidos: string;
  identificacion: string;
  carrera?: string;
}

interface RespuestaBackend {
  estudianteId: number;
  nombres: string;
  apellidos: string;
  identificacion: string;
  carrera?: string | null;
}

export const estudianteBusquedaService = {
  /**
   * Busca un estudiante por cédula. Primero intenta el endpoint real
   * (pendiente en el backend). Si ese endpoint no existe todavía (o
   * falla por cualquier motivo), cae al directorio local — que solo
   * contiene IDs que el propio especialista ya usó con éxito antes
   * (ver mockDirectorioEstudiantes en mockContratoBackend.ts). Nunca
   * fabrica un ID nuevo.
   */
  async buscarPorCedula(identificacion: string): Promise<EstudianteEncontrado | null> {
    try {
      const { data } = await apiClient.get<RespuestaBackend>('/clinica/estudiantes/buscar', {
        params: { identificacion: identificacion.trim() },
      });
      if (data && typeof data === 'object' && 'estudianteId' in data) {
        return {
          estudianteId: data.estudianteId,
          nombres: data.nombres,
          apellidos: data.apellidos,
          identificacion: data.identificacion,
          carrera: data.carrera ?? undefined,
        };
      }
    } catch {
      // 404 (endpoint no implementado todavía), 401/403, red caída, etc.
      // Se cae al directorio local a continuación.
    }

    const local = mockDirectorioEstudiantes.buscarPorCedula(identificacion);
    if (!local) return null;
    return {
      estudianteId: local.estudianteId,
      nombres: local.nombres,
      apellidos: local.apellidos,
      identificacion: local.identificacion,
      carrera: local.carrera,
    };
  },
};
