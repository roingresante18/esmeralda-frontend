import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../../api/api";
import type { DriverKpis, Order } from "../types";

const isToday = (dateString: string | null) => {
  if (!dateString) return false;

  const today = new Date().toISOString().split("T")[0];
  const orderDate = dateString.split("T")[0];

  return orderDate === today;
};

const statusPriority: Record<Order["status"], number> = {
  IN_DELIVERY: 0,
  ASSIGNED: 1,
  DELIVERED: 2,
};

const normalizeOrder = (order: Partial<Order>): Order => ({
  id: Number(order.id),
  status: (order.status as Order["status"]) ?? "ASSIGNED",
  total_amount: Number(order.total_amount ?? 0),
  payment_method: (order.payment_method as Order["payment_method"]) ?? "CASH",
  delivery_date: order.delivery_date ?? null,
  delivery_latitude: order.delivery_latitude,
  delivery_longitude: order.delivery_longitude,
  client: {
    id: Number(order.client?.id ?? 0),
    name: order.client?.name ?? "Sin nombre",
    municipality: order.client?.municipality ?? "Sin municipio",
    zone: order.client?.zone ?? "Sin zona",
  },
  products: Array.isArray(order.products)
    ? order.products.map((p) => ({
        id: Number(p.id),
        name: p.name ?? "Producto",
        delivered: Boolean(p.delivered),
      }))
    : [],
});

export const useDriverOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingRef = useRef<number | null>(null);

  const fetchOrders = useCallback(async (showLoader = false) => {
    try {
      setError(null);

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const res = await api.get("/orders?last_2_weeks=true");

      const filtered = (res.data as Partial<Order>[])
        .map(normalizeOrder)
        .filter((order) =>
          ["ASSIGNED", "IN_DELIVERY", "DELIVERED"].includes(order.status),
        )
        .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
      setOrders(filtered);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setError("No se pudieron cargar los pedidos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(true);

    pollingRef.current = window.setInterval(() => {
      if (document.hidden) return;
      fetchOrders(false);
    }, 15000);

    return () => {
      if (pollingRef.current !== null) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchOrders]);

  const toggleProductDelivered = useCallback(
    (orderId: number, productId: number) => {
      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== orderId) return order;
          if (order.status === "DELIVERED") return order;

          return {
            ...order,
            products: order.products.map((product) =>
              product.id === productId
                ? { ...product, delivered: !product.delivered }
                : product,
            ),
          };
        }),
      );
    },
    [],
  );

  const kpis: DriverKpis = useMemo(() => {
    let estimated = 0;
    let delivered = 0;
    let cash = 0;
    let transfer = 0;

    for (const order of orders) {
      const amount = Number(order.total_amount || 0);
      estimated += amount;

      if (order.status === "DELIVERED") {
        delivered += amount;

        if (order.payment_method === "CASH") {
          cash += amount;
        } else if (order.payment_method === "TRANSFER") {
          transfer += amount;
        } else {
          cash += amount / 2;
          transfer += amount / 2;
        }
      }
    }

    const deliveredOrders = orders.filter(
      (o) => o.status === "DELIVERED",
    ).length;
    const totalOrders = orders.length;
    const progress =
      totalOrders === 0 ? 0 : (deliveredOrders / totalOrders) * 100;

    return {
      estimated,
      delivered,
      cash,
      transfer,
      progress,
      totalOrders,
      deliveredOrders,
    };
  }, [orders]);

  return {
    orders,
    loading,
    refreshing,
    error,
    fetchOrders,
    toggleProductDelivered,
    kpis,
  };
};
