import { useCallback, useEffect, useMemo, useState } from "react";
import { deliveryApi } from "../api/delivery.api";
import type {
  DeliveryDashboardKpis,
  DeliveryOrder,
} from "../types/delivery.types";
import {
  groupOrdersByMunicipality,
  sortOrdersByOperationalCriteria,
} from "../utils/delivery.sorting";

export type DriverDashboardStatusFilter =
  | "ACTIVE"
  | "ASSIGNED"
  | "IN_DELIVERY"
  | "DELIVERED_12H"
  | "DELIVERED_24H";

export type DriverDashboardFilters = {
  date?: string;
  zone?: string;
  municipality?: string;
  status?: DriverDashboardStatusFilter;
  onlyToday?: boolean;
  onlyNext12h?: boolean;
};

const isSameDay = (value?: string | null, date?: string) => {
  if (!value || !date) return false;
  return value.split("T")[0] === date;
};

const isWithinNext12Hours = (value?: string | null) => {
  if (!value) return false;
  const now = new Date();
  const target = new Date(value);
  const diff = target.getTime() - now.getTime();
  return diff >= 0 && diff <= 12 * 60 * 60 * 1000;
};

const wasDeliveredInLastHours = (value?: string | null, hours = 12) => {
  if (!value) return false;
  const deliveredAt = new Date(value);
  const diff = Date.now() - deliveredAt.getTime();
  return diff >= 0 && diff <= hours * 60 * 60 * 1000;
};

const getPendingAmount = (order: DeliveryOrder) => {
  const total = Number(order.amountToCharge ?? 0);
  const alreadyPaid = Number(order.paymentSummary?.total_paid ?? 0);
  return Math.max(0, total - alreadyPaid);
};

export const useDeliveryDashboard = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DriverDashboardFilters>({
    date: new Date().toISOString().split("T")[0],
    onlyToday: true,
    status: "ACTIVE",
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await deliveryApi.getDriverOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los pedidos de reparto.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusScopedOrders = useMemo(() => {
    switch (filters.status) {
      case "ASSIGNED":
        return orders.filter((o) => o.deliveryStatus === "ASSIGNED");

      case "IN_DELIVERY":
        return orders.filter((o) => o.deliveryStatus === "IN_DELIVERY");

      case "DELIVERED_12H":
        return orders.filter(
          (o) =>
            o.deliveryStatus === "DELIVERED" &&
            wasDeliveredInLastHours(o.deliveredAt, 12),
        );

      case "DELIVERED_24H":
        return orders.filter(
          (o) =>
            o.deliveryStatus === "DELIVERED" &&
            wasDeliveredInLastHours(o.deliveredAt, 24),
        );

      case "ACTIVE":
      default:
        return orders.filter((o) =>
          ["ASSIGNED", "IN_DELIVERY"].includes(o.deliveryStatus),
        );
    }
  }, [orders, filters.status]);

  const filteredOrders = useMemo(() => {
    return statusScopedOrders.filter((order) => {
      if (
        filters.onlyToday &&
        filters.date &&
        !isSameDay(order.deliveryDate, filters.date)
      ) {
        return false;
      }

      if (filters.onlyNext12h && !isWithinNext12Hours(order.deliveryDate)) {
        return false;
      }

      if (filters.zone && order.zone !== filters.zone) return false;
      if (filters.municipality && order.municipality !== filters.municipality) {
        return false;
      }

      return true;
    });
  }, [statusScopedOrders, filters]);

  const municipalityGroups = useMemo(() => {
    return groupOrdersByMunicipality(filteredOrders).map((group) => ({
      ...group,
      orders: sortOrdersByOperationalCriteria(group.orders, null),
    }));
  }, [filteredOrders]);

  const kpis: DeliveryDashboardKpis = useMemo(() => {
    const pending = orders.filter((o) =>
      ["ASSIGNED", "IN_DELIVERY", "PENDING_DELIVERY"].includes(
        o.deliveryStatus,
      ),
    ).length;

    const delivered = orders.filter(
      (o) => o.deliveryStatus === "DELIVERED",
    ).length;

    const partialDelivered = orders.filter(
      (o) => o.deliveryStatus === "PARTIAL_DELIVERED",
    ).length;

    const rescheduled = orders.filter(
      (o) => o.deliveryStatus === "RESCHEDULED",
    ).length;

    const notDelivered = orders.filter(
      (o) => o.deliveryStatus === "NOT_DELIVERED",
    ).length;

    const deliveredOrders = orders.filter((o) =>
      ["DELIVERED", "PARTIAL_DELIVERED"].includes(o.deliveryStatus),
    );

    const cashCollected = deliveredOrders.reduce((acc, order) => {
      const pendingAmount = getPendingAmount(order);
      if (order.paymentMethod === "CASH") return acc + pendingAmount;
      if (order.paymentMethod === "BOTH") return acc + pendingAmount / 2;
      return acc;
    }, 0);

    const transferCollected = deliveredOrders.reduce((acc, order) => {
      const pendingAmount = getPendingAmount(order);
      if (order.paymentMethod === "TRANSFER") return acc + pendingAmount;
      if (order.paymentMethod === "BOTH") return acc + pendingAmount / 2;
      return acc;
    }, 0);

    return {
      totalAssigned: orders.filter((o) => o.deliveryStatus === "ASSIGNED")
        .length,
      totalToday: filteredOrders.length,
      pending,
      delivered,
      partialDelivered,
      rescheduled,
      notDelivered,
      cashCollected,
      transferCollected,
      totalCollected: cashCollected + transferCollected,
    };
  }, [orders, filteredOrders]);

  const zones = useMemo(
    () =>
      [...new Set(statusScopedOrders.map((o) => o.zone).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [statusScopedOrders],
  );

  const municipalities = useMemo(
    () =>
      [
        ...new Set(
          statusScopedOrders.map((o) => o.municipality).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [statusScopedOrders],
  );

  const municipalitiesByZone = useMemo(() => {
    const map: Record<string, string[]> = {};

    statusScopedOrders.forEach((order) => {
      const zone = order.zone?.trim();
      const municipality = order.municipality?.trim();

      if (!zone || !municipality) return;

      if (!map[zone]) {
        map[zone] = [];
      }

      if (!map[zone].includes(municipality)) {
        map[zone].push(municipality);
      }
    });

    Object.keys(map).forEach((zone) => {
      map[zone] = [...map[zone]].sort((a, b) => a.localeCompare(b, "es"));
    });

    return map;
  }, [statusScopedOrders]);

  const next12hCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          ["ASSIGNED", "IN_DELIVERY"].includes(o.deliveryStatus) &&
          isWithinNext12Hours(o.deliveryDate),
      ).length,
    [orders],
  );

  return {
    orders: statusScopedOrders,
    filteredOrders,
    municipalityGroups,
    loading,
    error,
    filters,
    setFilters,
    fetchOrders,
    kpis,
    zones,
    municipalities,
    municipalitiesByZone,
    next12hCount,
  };
};
