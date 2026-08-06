export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface Vehicle {
  id: number;

  company_id: number;

  plate: string;

  brand: string;

  model: string;

  year?: number | null;

  fuel_type?: string | null;

  estimated_consumption_l_100km?: number | string | null;

  max_allowed_speed_kmh?: number | string | null;

  current_odometer_km?: number | string | null;

  status: VehicleStatus;

  notes?: string | null;

  created_at: string;

  updated_at: string;
}

export interface CreateVehiclePayload {
  plate: string;

  brand: string;

  model: string;

  year?: number;

  fuel_type?: string;

  estimated_consumption_l_100km?: number;

  max_allowed_speed_kmh?: number;

  current_odometer_km?: number;

  notes?: string;
}

export interface UpdateVehiclePayload {
  plate?: string;

  brand?: string;

  model?: string;

  year?: number;

  fuel_type?: string;

  estimated_consumption_l_100km?: number;

  max_allowed_speed_kmh?: number;

  current_odometer_km?: number;

  status?: VehicleStatus;

  notes?: string;
}
