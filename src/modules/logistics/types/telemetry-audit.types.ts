/*
 * =========================================================
 * EVENTOS DE AUDITORÍA DE TELEMETRÍA
 * =========================================================
 *
 * Deben coincidir con el enum del backend.
 */

export type TelemetryAuditEventType =
  | "GPS_DISABLED"
  | "GPS_RESTORED"
  | "LOCATION_PERMISSION_REVOKED"
  | "LOCATION_PERMISSION_RESTORED"
  | "TRACKING_STOPPED_UNEXPECTEDLY"
  | "TRACKING_RESTORED"
  | "APP_FOREGROUND"
  | "APP_BACKGROUND"
  | "APP_LOCKED"
  | "APP_UNLOCKED"
  | "TELEMETRY_GAP_DETECTED";

export interface TelemetryAuditEvent {
  id: string;

  client_event_id: string;

  company_id: number;

  shift_id: number;

  driver_id: number;

  vehicle_id: number;

  event_type: TelemetryAuditEventType;

  recorded_at: string;

  latitude?: number | null;

  longitude?: number | null;

  accuracy?: number | null;

  metadata?: Record<string, unknown> | null;

  message?: string | null;

  created_at: string;
}
