import api from "../../../api/api";

import type { ShiftRouteResponse } from "../types/telemetry.types";

/*
 * =========================================================
 * OBTENER RECORRIDO DE UNA JORNADA
 * =========================================================
 *
 * Devuelve:
 *
 * - datos generales de la jornada;
 * - resumen de telemetría;
 * - recorrido GPS;
 * - inicio y fin;
 * - intentos de entrega con GPS real.
 */

export async function getShiftRoute(
  shiftId: number,
): Promise<ShiftRouteResponse> {
  const response = await api.get<ShiftRouteResponse>(
    `/fleet/telemetry/shifts/${shiftId}/route`,
  );

  /*
   * Protección adicional:
   *
   * si una jornada vieja no posee points o deliveries,
   * normalizamos ambos a arrays vacíos.
   */

  return {
    ...response.data,

    points: Array.isArray(response.data?.points) ? response.data.points : [],

    deliveries: Array.isArray(response.data?.deliveries)
      ? response.data.deliveries
      : [],

    summary: {
      ...response.data.summary,

      total_points: Number(response.data?.summary?.total_points) || 0,

      total_delivery_markers:
        Number(response.data?.summary?.total_delivery_markers) || 0,
    },
  };
}
