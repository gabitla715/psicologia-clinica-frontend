// ────────────────────────────────────────────────────────────────
// Servicio REAL de documentos clínicos (subida y verificación).
// Endpoints bajo /api/v1/documentos, verificados en
// DocumentoController.java:
//   POST   /{fichaId}              (STUDENT, SPECIALIST, COORDINATOR)
//   GET    /{fichaId}              (SPECIALIST, COORDINATOR, ADMIN)
//   PATCH  /{documentoId}/verificar (COORDINATOR, ADMIN)
//   PATCH  /{documentoId}/rechazar  (COORDINATOR, ADMIN)
//
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

export type TipoDocumento =
  | 'CONSENTIMIENTO_INFORMADO'
  | 'ENTREVISTA_INICIAL'
  | 'DESISTIMIENTO'
  | 'DERIVACION'
  | 'OTRO';

export type EstadoDocumento = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';

export interface DocumentoClinicoBackend {
  id: number;
  fichaId: number;
  tipoDocumento: TipoDocumento;
  estado: EstadoDocumento;
  nombreArchivo: string;
  subidoPor: number;
  verificadoPor?: number | null;
  notas?: string | null;
  creadoEn: string;
}

export const documentoService = {
  async porFicha(fichaId: number): Promise<DocumentoClinicoBackend[]> {
    const { data } = await apiClient.get<DocumentoClinicoBackend[]>(`/documentos/${fichaId}`);
    return data;
  },

  async verificar(documentoId: number): Promise<DocumentoClinicoBackend> {
    const { data } = await apiClient.patch<DocumentoClinicoBackend>(`/documentos/${documentoId}/verificar`);
    return data;
  },

  async rechazar(documentoId: number, motivo: string): Promise<DocumentoClinicoBackend> {
    const { data } = await apiClient.patch<DocumentoClinicoBackend>(
      `/documentos/${documentoId}/rechazar`,
      null,
      { params: { motivo } }
    );
    return data;
  },
};
