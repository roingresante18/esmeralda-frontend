// hooks/useDriverOrders.ts
import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../../../api/api";

export interface OrderProduct {
  id: number;
  name: string;
  delivered?: boolean;
}

export interface Order {
  id: number;
  status: "ASSIGNED" | "IN_DELIVERY" | "DELIVERED";
  total_amount: number;
  payment_method: "CASH" | "TRANSFER" | "BOTH";
  delivery_date: string | null; // ⚠️ puede venir null
  delivery_latitude?: number;
  delivery_longitude?: number;
  client: {
    id: number;
    name: string;
    municipality: string;
    zone: string;
  };
  products?: OrderProduct[];
}

export const useDriverOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const today = new Date().toISOString().split("T")[0];

      const filtered = res.data.filter((o: Order) => {
        // ⚠️ protección contra null
        if (!o.delivery_date) return false;

        const deliveryDay = o.delivery_date.split("T")[0];

        return (
          deliveryDay === today &&
          ["ASSIGNED", "IN_DELIVERY", "DELIVERED"].includes(o.status)
        );
      });

      setOrders(filtered);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setError("Error cargando pedidos.");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Polling simple y estable
   */
  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  /**
   * Toggle producto
   */
  const toggleProductDelivered = (orderId: number, productId: number) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              products: order.products?.map((p) =>
                p.id === productId ? { ...p, delivered: !p.delivered } : p,
              ),
            }
          : order,
      ),
    );
  };

  /**
   * KPIs
   */
  const kpis = useMemo(() => {
    let estimated = 0;
    let delivered = 0;
    let cash = 0;
    let transfer = 0;

    orders.forEach((order) => {
      const amount = Number(order.total_amount);
      estimated += amount;

      if (order.status === "DELIVERED") {
        delivered += amount;

        if (order.payment_method === "CASH") cash += amount;
        else if (order.payment_method === "TRANSFER") transfer += amount;
        else {
          cash += amount / 2;
          transfer += amount / 2;
        }
      }
    });

    const deliveredCount = orders.filter(
      (o) => o.status === "DELIVERED",
    ).length;

    const progress =
      orders.length === 0 ? 0 : (deliveredCount / orders.length) * 100;

    return { estimated, delivered, cash, transfer, progress };
  }, [orders]);

  return {
    orders,
    loading,
    error,
    fetchOrders,
    toggleProductDelivered,
    kpis,
  };
};
