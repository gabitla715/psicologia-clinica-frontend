import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { fichaService, type Ficha, type TipoPsicologia } from '../../api/fichaService';
import { coordinadorMockService, type SolicitudCoordinador } from '../../api/coordinadorMockService';
import { extraerMensajeError } from '../../api/client';
import { calcularProgreso, type ProgresoProceso } from '../../lib/estadoProceso';

export interface ProcesoTipo {
  tipo: TipoPsicologia;
  ficha: Ficha | null;
  solicitud: SolicitudCoordinador | null;
  progreso: ProgresoProceso;
}

const TIPOS: TipoPsicologia[] = ['GENERAL', 'CLINICA'];

/**
 * Hook compartido por todas las pantallas del estudiante (Inicio, Mi cita,
 * Estado de la solicitud, Historial). Carga el proceso de Psicología
 * General Y de Psicología Clínica de forma independiente, para que el
 * estudiante pueda tener (o solicitar) ambos servicios cuando quiera,
 * sin que uno bloquee al otro.
 */
export function useProcesosEstudiante() {
  const { usuario } = useAuth();
  const [procesos, setProcesos] = useState<Record<TipoPsicologia, ProcesoTipo> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!usuario) return;
    setCargando(true);
    setError(null);
    try {
      const resultados = await Promise.all(
        TIPOS.map(async (tipo) => {
          const [ficha, solicitud] = await Promise.all([
            fichaService.obtenerActiva(usuario.id, tipo).catch(() => null),
            coordinadorMockService.obtenerSolicitudDeEstudiantePorTipo(usuario.id, tipo),
          ]);
          const proceso: ProcesoTipo = { tipo, ficha, solicitud, progreso: calcularProgreso(solicitud, ficha) };
          return proceso;
        })
      );
      setProcesos({
        GENERAL: resultados.find((r) => r.tipo === 'GENERAL')!,
        CLINICA: resultados.find((r) => r.tipo === 'CLINICA')!,
      });
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cargar tu información.'));
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  /** Crea una nueva solicitud para el tipo de servicio indicado (idempotente si ya tiene una activa). */
  const solicitarServicio = useCallback(
    async (tipo: TipoPsicologia) => {
      if (!usuario) return;
      await coordinadorMockService.crearSolicitud({
        estudianteId: usuario.id,
        nombreEstudiante: `${usuario.nombres} ${usuario.apellidos}`,
        cedulaEstudiante: usuario.identificacion,
        correoEstudiante: usuario.email,
        carreraEstudiante: usuario.datosEstudiante?.carrera ?? 'No registrada',
        tipoPsicologia: tipo,
      });
      await recargar();
    },
    [usuario, recargar]
  );

  const listaProcesos = procesos ? [procesos.GENERAL, procesos.CLINICA] : [];
  const procesosActivos = listaProcesos.filter((p) => !p.progreso.sinSolicitud);

  return { usuario, procesos, listaProcesos, procesosActivos, cargando, error, recargar, solicitarServicio };
}
