import api from "../../../api/api";

import type { ShiftRouteResponse } from "../types/telemetry.types";

/*
 * =========================================================
 * RECORRIDO GPS DE UNA JORNADA
 * =========================================================
 */

export async function getShiftRoute(
  shiftId: number,
): Promise<ShiftRouteResponse> {
  const response = await api.get<ShiftRouteResponse>(
    `/fleet/telemetry/shifts/${shiftId}/route`,
  );

  return {
    ...response.data,

    points: Array.isArray(response.data?.points) ? response.data.points : [],
  };
}
