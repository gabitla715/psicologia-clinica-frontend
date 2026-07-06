// ────────────────────────────────────────────────────────────────
// Servicio REAL de estadísticas para Coordinador/Admin.
// Endpoint: GET /api/v1/dashboard/stats, verificado en
// DashboardController.java.
//
// ────────────────────────────────────────────────────────────────
import { apiClient } from './client';

export interface DashboardStatsBackend {
  totalEstudiantes: number; // ⚠️ siempre 0 (bug backend)
  totalEspecialistas: number; // ⚠️ siempre 0 (bug backend)
  fichasActivas: number;
  fichasCerradas: number;
  fichasDerivadas: number;
  fichasDesistidas: number;
  solicitudesPendientes: number;
  fichasClinica: number;
  fichasGeneral: number;
}

export const dashboardService = {
  async obtenerStats(): Promise<DashboardStatsBackend> {
    const { data } = await apiClient.get<DashboardStatsBackend>('/dashboard/stats');
    return data;
  },
};
