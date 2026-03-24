import { useMemo } from "react";
import type { DeliveryOrder } from "../types/delivery.types";
import { sortOrdersByOperationalCriteria } from "../utils/delivery.sorting";

interface DriverLocation {
  lat: number;
  lng: number;
}

interface Params {
  orders: DeliveryOrder[];
  municipality: string;
  zone?: string;
  status?: DeliveryOrder["deliveryStatus"] | "ALL";
  driverLocation?: DriverLocation | null;
}

export const useMunicipalityOrders = ({
  orders,
  municipality,
  zone,
  status = "ALL",
  driverLocation = null,
}: Params) => {
  const municipalityOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      if (order.municipality !== municipality) return false;
      if (zone && order.zone !== zone) return false;
      if (status !== "ALL" && order.deliveryStatus !== status) return false;
      return true;
    });

    return sortOrdersByOperationalCriteria(filtered, driverLocation);
  }, [orders, municipality, zone, status, driverLocation]);

  const summary = useMemo(() => {
    const total = municipalityOrders.length;
    const delivered = municipalityOrders.filter((o) =>
      ["DELIVERED", "PARTIAL_DELIVERED"].includes(o.deliveryStatus),
    ).length;
    const pending = municipalityOrders.filter((o) =>
      ["ASSIGNED", "IN_DELIVERY", "PENDING_DELIVERY"].includes(
        o.deliveryStatus,
      ),
    ).length;
    const notDelivered = municipalityOrders.filter(
      (o) => o.deliveryStatus === "NOT_DELIVERED",
    ).length;
    const rescheduled = municipalityOrders.filter(
      (o) => o.deliveryStatus === "RESCHEDULED",
    ).length;

    const progress = total === 0 ? 0 : (delivered / total) * 100;

    return {
      total,
      delivered,
      pending,
      notDelivered,
      rescheduled,
      progress,
    };
  }, [municipalityOrders]);

  const availableZones = useMemo(
    () => [...new Set(municipalityOrders.map((o) => o.zone).filter(Boolean))],
    [municipalityOrders],
  );

  return {
    municipalityOrders,
    summary,
    availableZones,
  };
};
