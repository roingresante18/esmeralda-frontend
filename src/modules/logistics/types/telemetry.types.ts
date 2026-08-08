/*
 * =========================================================
 * PUNTO GPS DEL RECORRIDO
 * =========================================================
 *
 * Representa una posición capturada por la telemetría
 * durante una jornada.
 */

export interface ShiftRoutePoint {
  id: string;

  latitude: number;
  longitude: number;

  accuracy?: number | null;
  altitude?: number | null;

  speed_mps?: number | null;
  speed_kmh?: number | null;

  heading?: number | null;

  recorded_at: string;
}

/*
 * =========================================================
 * RESULTADO DE UN INTENTO DE ENTREGA
 * =========================================================
 */

export type ShiftDeliveryResultStatus =
  | "DELIVERED"
  | "PARTIAL_DELIVERED"
  | "RESCHEDULED"
  | "NOT_DELIVERED";

/*
 * =========================================================
 * MARCADOR DE ENTREGA
 * =========================================================
 *
 * IMPORTANTE:
 *
 * latitude y longitude corresponden al GPS REAL capturado
 * por la aplicación del repartidor cuando registró el
 * resultado del intento.
 *
 * Nunca representan automáticamente la ubicación almacenada
 * en el perfil del cliente.
 */

export interface ShiftRouteDelivery {
  delivery_id: number;

  order_id: number;

  attempt_number: number;

  result_status: ShiftDeliveryResultStatus;

  latitude: number;

  longitude: number;

  accuracy?: number | null;

  attempted_at?: string | null;

  location_recorded_at?: string | null;

  delivered_at?: string | null;

  client_name: string;

  notes?: string | null;
}

/*
 * =========================================================
 * CHOFER
 * =========================================================
 */

export interface ShiftRouteDriver {
  id: number;

  full_name: string;

  email: string;
}

/*
 * =========================================================
 * VEHÍCULO
 * =========================================================
 */

export interface ShiftRouteVehicle {
  id: number;

  plate: string;

  brand: string;

  model: string;
}

/*
 * =========================================================
 * JORNADA
 * =========================================================
 */

export interface ShiftRouteInfo {
  id: number;

  status: string;

  scheduled_date: string;

  started_at?: string | null;

  ended_at?: string | null;

  start_odometer_km?: string | number | null;

  end_odometer_km?: string | number | null;

  total_distance_km?: string | number | null;

  driver: ShiftRouteDriver;

  vehicle: ShiftRouteVehicle;
}

/*
 * =========================================================
 * RESUMEN
 * =========================================================
 */

export interface ShiftRouteSummary {
  /*
   * Cantidad de puntos de telemetría utilizados
   * para reconstruir el recorrido.
   */
  total_points: number;

  /*
   * Cantidad de intentos con GPS real disponibles
   * como marcadores.
   */
  total_delivery_markers: number;

  first_recorded_at?: string | null;

  last_recorded_at?: string | null;

  max_speed_kmh?: number | null;
}

/*
 * =========================================================
 * RESPUESTA DEL ENDPOINT /route
 * =========================================================
 */

export interface ShiftRouteResponse {
  shift: ShiftRouteInfo;

  summary: ShiftRouteSummary;

  start_point?: ShiftRoutePoint | null;

  end_point?: ShiftRoutePoint | null;

  /*
   * Trayectoria GPS.
   */
  points: ShiftRoutePoint[];

  /*
   * Intentos de entrega realizados durante la jornada.
   */
  deliveries: ShiftRouteDelivery[];
}
