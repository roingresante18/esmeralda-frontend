import type {
  DeliveryOrder,
  DeliveryTraceability,
} from "../types/delivery.types";
import { getGpsConsistency } from "./delivery.gps.metrics";

export const buildOrderTraceability = (
  order: Pick<DeliveryOrder, "customerGps" | "orderGps" | "deliveredGps">,
): DeliveryTraceability => {
  const consistency = getGpsConsistency({
    customerGps: order.customerGps,
    orderGps: order.orderGps,
    deliveredGps: order.deliveredGps,
  });

  return {
    customerGps: order.customerGps ?? null,
    orderGps: order.orderGps ?? null,
    deliveredGps: order.deliveredGps ?? null,
    ...consistency,
  };
};
