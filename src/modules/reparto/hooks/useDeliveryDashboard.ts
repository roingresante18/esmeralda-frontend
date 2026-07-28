import { useCallback, useEffect, useMemo, useState } from "react";

import { deliveryApi } from "../api/delivery.api";

import type {
  DeliveryDashboardKpis,
  DeliveryOrder,
  DriverDailyDeliverySummary,
} from "../types/delivery.types";

import {
  groupOrdersByMunicipality,
  sortOrdersByOperationalCriteria,
} from "../utils/delivery.sorting";

export type DriverDashboardStatusFilter = "ACTIVE" | "IN_DELIVERY";

export type DriverDashboardFilters = {
  date?: string;
  zone?: string;
  municipality?: string;
  status?: DriverDashboardStatusFilter;
  onlyToday?: boolean;
  onlyNext12h?: boolean;
};

const getLocalDateValue = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getDatePart = (value?: string | null): string | null => {
  if (!value) return null;

  return value.includes("T") ? value.split("T")[0] : value.substring(0, 10);
};

const isSameDay = (value?: string | null, date?: string) => {
  if (!value || !date) return false;

  return getDatePart(value) === date;
};

const isWithinNext12Hours = (value?: string | null) => {
  if (!value) return false;

  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return false;
  }

  const difference = target.getTime() - Date.now();

  return difference >= 0 && difference <= 12 * 60 * 60 * 1000;
};

const emptySummary = (
  date: string,
  activeOrders: number,
): DriverDailyDeliverySummary => ({
  date,
  assignedOrders: activeOrders,
  activeOrders,
  deliveredOrders: 0,
  partialDeliveredOrders: 0,
  rescheduledOrders: 0,
  notDeliveredOrders: 0,
  cashCollected: 0,
  transferCollected: 0,
  totalCollected: 0,
});

export const useDeliveryDashboard = () => {
  const today = getLocalDateValue();

  const [orders, setOrders] = useState<DeliveryOrder[]>([]);

  const [dailySummary, setDailySummary] = useState<DriverDailyDeliverySummary>(
    emptySummary(today, 0),
  );

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [filters, setFilters] = useState<DriverDashboardFilters>({
    date: today,

    /*
     * No ocultar asignaciones activas por fecha al ingresar.
     */
    onlyToday: false,
    onlyNext12h: false,
    status: "ACTIVE",
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSummaryError(null);

    const selectedDate = filters.date || getLocalDateValue();

    try {
      const activeOrders = await deliveryApi.getDriverOrders();

      setOrders(activeOrders);

      try {
        const summary = await deliveryApi.getDriverDailySummary(selectedDate);

        setDailySummary(summary);
      } catch (summaryRequestError) {
        console.error(
          "No se pudo cargar el resumen diario:",
          summaryRequestError,
        );

        setDailySummary(emptySummary(selectedDate, activeOrders.length));

        setSummaryError(
          "El resumen diario todavía no está disponible. Se muestran únicamente los pedidos activos.",
        );
      }
    } catch (requestError) {
      console.error(requestError);

      setOrders([]);

      setError("No se pudieron cargar los pedidos de reparto.");
    } finally {
      setLoading(false);
    }
  }, [filters.date]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /*
   * /my-deliveries ya devuelve únicamente IN_DELIVERY.
   * Se conserva este filtro como defensa adicional.
   */
  const statusScopedOrders = useMemo(
    () => orders.filter((order) => order.deliveryStatus === "IN_DELIVERY"),
    [orders],
  );

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

      if (filters.zone && order.zone !== filters.zone) {
        return false;
      }

      if (filters.municipality && order.municipality !== filters.municipality) {
        return false;
      }

      return true;
    });
  }, [statusScopedOrders, filters]);

  const municipalityGroups = useMemo(
    () =>
      groupOrdersByMunicipality(filteredOrders).map((group) => ({
        ...group,
        orders: sortOrdersByOperationalCriteria(group.orders, null),
      })),
    [filteredOrders],
  );

  const kpis = useMemo<DeliveryDashboardKpis>(
    () => ({
      totalAssigned: dailySummary.assignedOrders,

      totalToday: dailySummary.assignedOrders,

      pending: dailySummary.activeOrders,

      delivered: dailySummary.deliveredOrders,

      partialDelivered: dailySummary.partialDeliveredOrders,

      rescheduled: dailySummary.rescheduledOrders,

      notDelivered: dailySummary.notDeliveredOrders,

      cashCollected: Number(dailySummary.cashCollected || 0),

      transferCollected: Number(dailySummary.transferCollected || 0),

      totalCollected: Number(dailySummary.totalCollected || 0),
    }),
    [dailySummary],
  );

  const zones = useMemo(
    () =>
      [
        ...new Set(
          statusScopedOrders.map((order) => order.zone).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [statusScopedOrders],
  );

  const municipalities = useMemo(
    () =>
      [
        ...new Set(
          statusScopedOrders.map((order) => order.municipality).filter(Boolean),
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [statusScopedOrders],
  );

  const municipalitiesByZone = useMemo(() => {
    const map: Record<string, string[]> = {};

    statusScopedOrders.forEach((order) => {
      const zone = order.zone?.trim();

      const municipality = order.municipality?.trim();

      if (!zone || !municipality) {
        return;
      }

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
      statusScopedOrders.filter((order) =>
        isWithinNext12Hours(order.deliveryDate),
      ).length,
    [statusScopedOrders],
  );

  return {
    orders: statusScopedOrders,
    filteredOrders,
    municipalityGroups,

    dailySummary,

    loading,
    error,
    summaryError,

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
