import api from "../../../api/api";

import type { TelemetryAuditEvent } from "../types/telemetry-audit.types";

/*
 * =========================================================
 * EVENTOS DE AUDITORÍA DE UNA JORNADA
 * =========================================================
 */

export async function getShiftTelemetryEvents(
  shiftId: number,
): Promise<TelemetryAuditEvent[]> {
  const response = await api.get<TelemetryAuditEvent[]>(
    `/fleet/telemetry/shifts/${shiftId}/events`,
  );

  return Array.isArray(response.data) ? response.data : [];
}
