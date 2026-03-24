import { useCallback, useEffect, useMemo, useState } from "react";
import { deliveryApi } from "../api/delivery.api";
import type {
  DeliveryDashboardKpis,
  DeliveryFilters,
  DeliveryOrder,
} from "../types/delivery.types";
import {
  groupOrdersByMunicipality,
  sortOrdersByOperationalCriteria,
} from "../utils/delivery.sorting";

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

const getPendingAmount = (order: DeliveryOrder) => {
  const total = Number(order.amountToCharge ?? 0);
  const alreadyPaid = Number(order.paymentSummary?.total_paid ?? 0);
  return Math.max(0, total - alreadyPaid);
};

export const useDeliveryDashboard = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DeliveryFilters>({
    date: new Date().toISOString().split("T")[0],
    onlyToday: true,
    status: "ALL",
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
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
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

      if (
        filters.status &&
        filters.status !== "ALL" &&
        order.deliveryStatus !== filters.status
      ) {
        return false;
      }

      return true;
    });
  }, [orders, filters]);

  const municipalityGroups = useMemo(() => {
    return groupOrdersByMunicipality(filteredOrders).map((group) => ({
      ...group,
      orders: sortOrdersByOperationalCriteria(group.orders, null),
    }));
  }, [filteredOrders]);

  const kpis: DeliveryDashboardKpis = useMemo(() => {
    const totalAssigned = filteredOrders.length;
    const totalToday = filteredOrders.length;

    const pending = filteredOrders.filter((o) =>
      ["ASSIGNED", "IN_DELIVERY", "PENDING_DELIVERY"].includes(
        o.deliveryStatus,
      ),
    ).length;

    const delivered = filteredOrders.filter(
      (o) => o.deliveryStatus === "DELIVERED",
    ).length;

    const partialDelivered = filteredOrders.filter(
      (o) => o.deliveryStatus === "PARTIAL_DELIVERED",
    ).length;

    const rescheduled = filteredOrders.filter(
      (o) => o.deliveryStatus === "RESCHEDULED",
    ).length;

    const notDelivered = filteredOrders.filter(
      (o) => o.deliveryStatus === "NOT_DELIVERED",
    ).length;

    const deliveredOrders = filteredOrders.filter((o) =>
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
      totalAssigned,
      totalToday,
      pending,
      delivered,
      partialDelivered,
      rescheduled,
      notDelivered,
      cashCollected,
      transferCollected,
      totalCollected: cashCollected + transferCollected,
    };
  }, [filteredOrders]);

  const zones = useMemo(
    () => [...new Set(orders.map((o) => o.zone).filter(Boolean))],
    [orders],
  );

  const municipalities = useMemo(
    () => [...new Set(orders.map((o) => o.municipality).filter(Boolean))],
    [orders],
  );

  const next12hCount = useMemo(
    () => orders.filter((o) => isWithinNext12Hours(o.deliveryDate)).length,
    [orders],
  );

  return {
    orders,
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
    next12hCount,
  };
};
