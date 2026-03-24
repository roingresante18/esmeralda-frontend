import { useEffect, useMemo, useState } from "react";
import { deliveryApi } from "../api/delivery.api";
import type {
  DeliveryOrder,
  PreparationSummary,
} from "../types/delivery.types";

const toDay = (d: Date) => d.toISOString().split("T")[0];

export const useTruckPreparation = () => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await deliveryApi.getDriverOrders();
        setOrders(data);
      } catch (e) {
        console.error(e);
        setError("No se pudo cargar la preparación de camión.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const today = toDay(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = toDay(tomorrowDate);

  const summary: PreparationSummary = useMemo(() => {
    const totalToday = orders.filter((o) =>
      o.deliveryDate?.startsWith(today),
    ).length;

    const totalTomorrow = orders.filter((o) =>
      o.deliveryDate?.startsWith(tomorrow),
    ).length;

    const totalNext12h = orders.filter((o) => {
      if (!o.deliveryDate) return false;
      const diff = new Date(o.deliveryDate).getTime() - Date.now();
      return diff >= 0 && diff <= 12 * 60 * 60 * 1000;
    }).length;

    const groupCount = <T extends string>(values: T[]) =>
      Object.entries(
        values.reduce(
          (acc, item) => {
            acc[item] = (acc[item] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        ),
      ).map(([key, count]) => ({
        key,
        count,
      }));

    return {
      totalToday,
      totalTomorrow,
      totalNext12h,
      groupedByDate: groupCount(
        orders.map((o) => o.deliveryDate?.split("T")[0] || "Sin fecha"),
      ).map((i) => ({ date: i.key, count: i.count })),
      groupedByZone: groupCount(orders.map((o) => o.zone || "Sin zona")).map(
        (i) => ({
          zone: i.key,
          count: i.count,
        }),
      ),
      groupedByMunicipality: groupCount(
        orders.map((o) => o.municipality || "Sin municipio"),
      ).map((i) => ({
        municipality: i.key,
        count: i.count,
      })),
      groupedByDriver: groupCount(
        orders.map((o) => o.assignedDriverName || "Sin chofer"),
      ).map((i) => ({
        driverName: i.key,
        count: i.count,
      })),
    };
  }, [orders, today, tomorrow]);

  return {
    orders,
    loading,
    error,
    summary,
    today,
    tomorrow,
  };
};
