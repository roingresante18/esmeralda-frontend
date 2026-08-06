import api from "../../../api/api";

import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  Vehicle,
} from "../types/vehicle.types";

/*
 * =========================================================
 * LISTAR VEHÍCULOS
 * =========================================================
 */

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await api.get<Vehicle[]>("/fleet/vehicles");

  return Array.isArray(response.data) ? response.data : [];
}

/*
 * =========================================================
 * OBTENER VEHÍCULO
 * =========================================================
 */

export async function getVehicleById(vehicleId: number): Promise<Vehicle> {
  const response = await api.get<Vehicle>(`/fleet/vehicles/${vehicleId}`);

  return response.data;
}

/*
 * =========================================================
 * CREAR VEHÍCULO
 * =========================================================
 */

export async function createVehicle(
  payload: CreateVehiclePayload,
): Promise<Vehicle> {
  const response = await api.post<Vehicle>("/fleet/vehicles", payload);

  return response.data;
}

/*
 * =========================================================
 * ACTUALIZAR VEHÍCULO
 * =========================================================
 */

export async function updateVehicle(
  vehicleId: number,
  payload: UpdateVehiclePayload,
): Promise<Vehicle> {
  const response = await api.patch<Vehicle>(
    `/fleet/vehicles/${vehicleId}`,
    payload,
  );

  return response.data;
}
