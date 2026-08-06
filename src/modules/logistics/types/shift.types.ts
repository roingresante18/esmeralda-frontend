import type { Vehicle } from "./vehicle.types";

/*
 * =========================================================
 * ESTADOS DE JORNADA
 * =========================================================
 */
export type DriverShiftStatus =
  | "SCHEDULED"
  | "ACTIVE"
  | "SUSPENDED"
  | "FINISHED"
  | "CANCELLED";
/*
 * =========================================================
 * REPARTIDOR
 * =========================================================
 */

export interface ShiftDriver {
  id: number;

  email?: string | null;

  full_name?: string | null;

  name?: string | null;

  role?: string | null;

  is_active?: boolean;

  created_at?: string;

  updated_at?: string;
}

/*
 * =========================================================
 * MUNICIPIO
 * =========================================================
 */

export interface ShiftClientMunicipality {
  id: number;

  name: string;

  sortOrder?: number;

  isActive?: boolean;

  createdAt?: string;
}

/*
 * =========================================================
 * CLIENTE
 * =========================================================
 */

export interface ShiftOrderClient {
  id: number;

  name: string;

  address?: string | null;

  municipality?: ShiftClientMunicipality | null;

  phone?: string | null;

  email?: string | null;

  latitude?: number | string | null;

  longitude?: number | string | null;

  gps_updated_at?: string | null;

  gps_verified?: boolean;

  gps_verified_at?: string | null;

  gps_verified_by?: number | null;

  gps_source?: string | null;

  created_at?: string;
}

/*
 * =========================================================
 * PEDIDO
 * =========================================================
 */

export interface ShiftOrder {
  id: number;

  client?: ShiftOrderClient | null;

  status: string;

  payment_method?: string | null;

  total_amount?: string | number | null;

  payment_confirmed?: boolean;

  is_cancelled?: boolean;

  delivery_date?: string | null;

  notes?: string | null;

  delivery_address_snapshot?: string | null;

  municipality_snapshot?: string | null;

  zone_snapshot?: string | null;

  delivery_latitude?: string | number | null;

  delivery_longitude?: string | number | null;

  delivery_accuracy?: string | number | null;

  gps_updated_by?: number | null;

  gps_updated_at?: string | null;

  last_delivery_attempt_at?: string | null;

  tracking_token?: string | null;

  tracking_enabled?: boolean;

  tracking_expires_at?: string | null;

  confirmed_at?: string | null;

  delivered_at?: string | null;

  created_at?: string;

  updated_at?: string;

  deposit_print_count?: number;

  deposit_last_printed_at?: string | null;
}

/*
 * =========================================================
 * RELACIÓN JORNADA → PEDIDO
 * =========================================================
 */

export interface DriverShiftOrder {
  id: number;

  order: ShiftOrder;

  created_at?: string;
}

/*
 * =========================================================
 * JORNADA
 * =========================================================
 */

export interface DriverShift {
  id: number;

  company_id: number;

  driver: ShiftDriver;

  vehicle: Vehicle;

  status: DriverShiftStatus;

  scheduled_date: string;

  started_at?: string | null;

  ended_at?: string | null;

  start_odometer_km?: string | number | null;

  end_odometer_km?: string | number | null;

  total_distance_km?: string | number | null;

  estimated_fuel_liters?: string | number | null;

  average_speed_kmh?: string | number | null;

  max_speed_kmh?: string | number | null;

  speeding_seconds?: number;

  speeding_distance_km?: string | number;

  speeding_distance_percentage?: string | number;

  last_sync_at?: string | null;

  notes?: string | null;

  created_at?: string;

  updated_at?: string;

  shiftOrders?: DriverShiftOrder[];
  cancelled_at?: string | null;

  cancellation_reason?: string | null;

  cancelled_by?: ShiftDriver | null;
  suspended_at?: string | null;

  suspension_reason?: string | null;

  suspended_by?: ShiftDriver | null;

  resumed_at?: string | null;

  resumed_by?: ShiftDriver | null;
}

/*
 * =========================================================
 * CREAR JORNADA
 * =========================================================
 *
 * IMPORTANTE:
 *
 * order_ids es obligatorio.
 *
 * Una jornada debe nacer con al menos un pedido.
 *
 * El odómetro inicial NO forma parte de este payload.
 * Lo carga el chofer físicamente al iniciar la jornada.
 */

export interface CreateDriverShiftPayload {
  driver_id: number;

  vehicle_id: number;

  scheduled_date: string;

  order_ids: number[];

  notes?: string;
}

/*
 * =========================================================
 * AGREGAR PEDIDOS A UNA JORNADA EXISTENTE
 * =========================================================
 *
 * Conservamos este tipo porque el backend todavía permite
 * agregar pedidos posteriormente mientras la jornada siga
 * SCHEDULED.
 */

export interface AddOrdersToShiftPayload {
  order_ids: number[];
}

/*
 * =========================================================
 * ACTUALIZAR JORNADA PENDIENTE
 * =========================================================
 */

export interface UpdateDriverShiftPayload {
  scheduled_date?: string;

  notes?: string;
}

/*
 * =========================================================
 * HISTORIAL DE JORNADA
 * =========================================================
 */

export interface DriverShiftHistory {
  id: number;

  action: string;

  previous_scheduled_date?: string | null;

  new_scheduled_date?: string | null;

  previous_notes?: string | null;

  new_notes?: string | null;

  comment?: string | null;

  created_at: string;

  changed_by?: ShiftDriver | null;
}
