import api from "../../../api/api";

import type {
  LogisticsDeliveryUser,
  LogisticsOrder,
} from "../types/logistics.types";

/*
 * =========================================================
 * PEDIDOS CONTROLADOS DISPONIBLES
 * =========================================================
 */

export async function getAvailableLogisticsOrders(): Promise<LogisticsOrder[]> {
  const response = await api.get("/orders", {
    params: {
      status: "QUALITY_CHECKED",
    },
  });

  const data = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

  /*
   * Defensa adicional si el backend
   * ignorara accidentalmente el filtro.
   */

  return data.filter(
    (order: LogisticsOrder) => order.status === "QUALITY_CHECKED",
  );
}

/*
 * =========================================================
 * REPARTIDORES
 * =========================================================
 */

export async function getDeliveryUsers(): Promise<LogisticsDeliveryUser[]> {
  const response = await api.get("/users");

  const users: LogisticsDeliveryUser[] = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.data?.data)
      ? response.data.data
      : [];

  return users.filter((user) => {
    const role = String(user.role ?? "").toUpperCase();

    return ["REPARTIDOR", "REPARTO", "DELIVERY"].includes(role);
  });
}
