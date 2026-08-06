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

export interface ShiftRouteDriver {
  id: number;
  full_name: string;
  email: string;
}

export interface ShiftRouteVehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
}

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

export interface ShiftRouteSummary {
  total_points: number;

  first_recorded_at?: string | null;
  last_recorded_at?: string | null;

  max_speed_kmh?: number | null;
}

export interface ShiftRouteResponse {
  shift: ShiftRouteInfo;

  summary: ShiftRouteSummary;

  start_point?: ShiftRoutePoint | null;
  end_point?: ShiftRoutePoint | null;

  points: ShiftRoutePoint[];
}
