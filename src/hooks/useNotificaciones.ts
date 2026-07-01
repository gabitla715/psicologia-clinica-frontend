// ────────────────────────────────────────────────────────────────
// Hook custom que encapsula la carga y el refresco periódico de las
// notificaciones del usuario autenticado. Lo usan tanto el badge de
// la campana en el header como la página completa /notificaciones.
//
// Cada componente que llama a este hook mantiene su propio estado y
// su propio intervalo de polling (no hay un store global compartido);
// ────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  contarNoLeidas,
  notificationService,
  type Notificacion,
} from '../api/notificationService';
import { extraerMensajeError } from '../api/client';

const INTERVALO_POLLING_MS = 60_000;

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const montadoRef = useRef(true);

  const refrescar = useCallback(async () => {
    try {
      const datos = await notificationService.listarMisNotificaciones();
      if (montadoRef.current) {
        setNotificaciones(datos);
        setError(null);
      }
    } catch (err) {
      if (montadoRef.current) {
        setError(extraerMensajeError(err, 'No se pudieron cargar las notificaciones.'));
      }
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    refrescar();
    const intervalo = window.setInterval(refrescar, INTERVALO_POLLING_MS);
    return () => {
      montadoRef.current = false;
      window.clearInterval(intervalo);
    };
  }, [refrescar]);

  const marcarLeida = useCallback(async (id: number) => {
    // Actualización optimista: refleja el cambio de inmediato y revierte si falla.
    setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
    try {
      await notificationService.marcarComoLeida(id);
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo marcar la notificación como leída.'));
      setNotificaciones((prev) => prev.map((n) => (n.id === id ? { ...n, leida: false } : n)));
    }
  }, []);

  const marcarTodas = useCallback(async () => {
    const idsPendientes = notificaciones.filter((n) => !n.leida).map((n) => n.id);
    if (idsPendientes.length === 0) return;
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    try {
      await notificationService.marcarTodasComoLeidas();
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudieron marcar todas las notificaciones como leídas.'));
      setNotificaciones((prev) =>
        prev.map((n) => (idsPendientes.includes(n.id) ? { ...n, leida: false } : n))
      );
    }
  }, [notificaciones]);

  return {
    notificaciones,
    cargando,
    error,
    noLeidas: contarNoLeidas(notificaciones),
    refrescar,
    marcarLeida,
    marcarTodas,
  };
}
