import api from "../../../api/api";

import type {
  AddOrdersToShiftPayload,
  CreateDriverShiftPayload,
  DriverShift,
  DriverShiftHistory,
  DriverShiftOrder,
  UpdateDriverShiftPayload,
} from "../types/shift.types";

/*
 * =========================================================
 * LISTAR JORNADAS
 * =========================================================
 */

export async function getDriverShifts(): Promise<DriverShift[]> {
  const response = await api.get<DriverShift[]>("/fleet/shifts");

  return Array.isArray(response.data) ? response.data : [];
}

/*
 * =========================================================
 * OBTENER JORNADA
 * =========================================================
 */

export async function getDriverShiftById(
  shiftId: number,
): Promise<DriverShift> {
  const response = await api.get<DriverShift>(`/fleet/shifts/${shiftId}`);

  return response.data;
}

/*
 * =========================================================
 * CREAR JORNADA
 * =========================================================
 *
 * La operación inicial es atómica.
 *
 * El backend:
 *
 * - crea DriverShift;
 * - crea OrderDelivery;
 * - cambia pedidos a ASSIGNED;
 * - crea historial;
 * - crea DriverShiftOrder.
 */

export async function createDriverShift(
  payload: CreateDriverShiftPayload,
): Promise<DriverShift> {
  const response = await api.post<DriverShift>("/fleet/shifts", payload);

  return response.data;
}

/*
 * =========================================================
 * PEDIDOS DE UNA JORNADA
 * =========================================================
 */

export async function getShiftOrders(
  shiftId: number,
): Promise<DriverShiftOrder[]> {
  const response = await api.get<DriverShiftOrder[]>(
    `/fleet/shifts/${shiftId}/orders`,
  );

  return Array.isArray(response.data) ? response.data : [];
}

/*
 * =========================================================
 * ACTUALIZAR JORNADA PENDIENTE
 * =========================================================
 *
 * Solamente:
 *
 * - scheduled_date;
 * - notes.
 *
 * Repartidor y vehículo permanecen fijos.
 */

export async function updateDriverShift(
  shiftId: number,
  payload: UpdateDriverShiftPayload,
): Promise<DriverShift> {
  const response = await api.patch<DriverShift>(
    `/fleet/shifts/${shiftId}`,
    payload,
  );

  return response.data;
}

/*
 * =========================================================
 * HISTORIAL ADMINISTRATIVO
 * =========================================================
 */

export async function getDriverShiftHistory(
  shiftId: number,
): Promise<DriverShiftHistory[]> {
  const response = await api.get<DriverShiftHistory[]>(
    `/fleet/shifts/${shiftId}/history`,
  );

  return Array.isArray(response.data) ? response.data : [];
}

/*
 * =========================================================
 * AGREGAR PEDIDOS A JORNADA EXISTENTE
 * =========================================================
 *
 * Solo corresponde mientras siga SCHEDULED.
 */

export async function addOrdersToShift(
  shiftId: number,
  orderIds: number[],
): Promise<DriverShiftOrder[]> {
  const payload: AddOrdersToShiftPayload = {
    order_ids: orderIds,
  };

  const response = await api.post<DriverShiftOrder[]>(
    `/fleet/shifts/${shiftId}/orders`,
    payload,
  );

  return Array.isArray(response.data) ? response.data : [];
}

/*
 * =========================================================
 * QUITAR PEDIDO DE JORNADA
 * =========================================================
 */

export interface RemoveOrderFromShiftResult {
  success: boolean;

  shift_id: number;

  order_id: number;

  restored_status: string;
}

export async function removeOrderFromShift(
  shiftId: number,
  orderId: number,
  reason: string,
): Promise<RemoveOrderFromShiftResult> {
  const response = await api.delete<RemoveOrderFromShiftResult>(
    `/fleet/shifts/${shiftId}/orders/${orderId}`,
    {
      /*
       * Axios envía el body de DELETE mediante data.
       */
      data: {
        reason: reason.trim(),
      },
    },
  );

  return response.data;
}

/*
 * =========================================================
 * CANCELAR JORNADA SCHEDULED
 * =========================================================
 */

export interface CancelDriverShiftResult {
  id: number;

  status: string;

  cancelled_at?: string | null;

  cancellation_reason?: string | null;

  cancelled_by?: {
    id: number;

    full_name?: string | null;

    email?: string | null;
  } | null;
}

export async function cancelDriverShift(
  shiftId: number,
  reason: string,
): Promise<CancelDriverShiftResult> {
  const response = await api.patch<CancelDriverShiftResult>(
    `/fleet/shifts/${shiftId}/cancel`,
    {
      reason: reason.trim(),
    },
  );

  return response.data;
}

/*
 * =========================================================
 * SUSPENDER JORNADA ACTIVA
 * =========================================================
 *
 * NO modifica:
 *
 * - pedidos;
 * - repartidor;
 * - vehículo;
 * - OrderDelivery;
 * - odómetros.
 *
 * Solamente cambia:
 *
 * ACTIVE → SUSPENDED
 */

export async function suspendDriverShift(
  shiftId: number,
  reason: string,
): Promise<DriverShift> {
  const response = await api.patch<DriverShift>(
    `/fleet/shifts/${shiftId}/suspend`,
    {
      reason: reason.trim(),
    },
  );

  return response.data;
}

/*
 * =========================================================
 * REANUDAR JORNADA
 * =========================================================
 *
 * SUSPENDED → ACTIVE
 *
 * Continúa exactamente la misma jornada.
 */

export async function resumeDriverShift(shiftId: number): Promise<DriverShift> {
  const response = await api.patch<DriverShift>(
    `/fleet/shifts/${shiftId}/resume`,
    {},
  );

  return response.data;
}
