// // hooks/useDriverOrders.ts
// import { useEffect, useMemo, useState, useCallback } from "react";
// import api from "../../../api/api";

// export interface OrderProduct {
//   id: number;
//   name: string;
//   delivered?: boolean;
// }

// export interface Order {
//   id: number;
//   status: "ASSIGNED" | "IN_DELIVERY" | "DELIVERED";
//   total_amount: number;
//   payment_method: "CASH" | "TRANSFER" | "BOTH";
//   delivery_date: string | null; // ⚠️ puede venir null
//   delivery_latitude?: number;
//   delivery_longitude?: number;
//   client: {
//     id: number;
//     name: string;
//     municipality: string;
//     zone: string;
//   };
//   products?: OrderProduct[];
// }

// export const useDriverOrders = () => {
//   const [orders, setOrders] = useState<Order[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const fetchOrders = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await api.get("/orders?last_2_weeks=true");

//       const today = new Date().toISOString().split("T")[0];

//       const filtered = res.data.filter((o: Order) => {
//         // ⚠️ protección contra null
//         if (!o.delivery_date) return false;

//         const deliveryDay = o.delivery_date.split("T")[0];

//         return (
//           deliveryDay === today &&
//           ["ASSIGNED", "IN_DELIVERY", "DELIVERED"].includes(o.status)
//         );
//       });

//       setOrders(filtered);
//     } catch (err) {
//       console.error("Error cargando pedidos:", err);
//       setError("Error cargando pedidos.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   /**
//    * Polling simple y estable
//    */
//   useEffect(() => {
//     fetchOrders();

//     const interval = setInterval(fetchOrders, 10000);

//     return () => clearInterval(interval);
//   }, [fetchOrders]);

//   /**
//    * Toggle producto
//    */
//   const toggleProductDelivered = (orderId: number, productId: number) => {
//     setOrders((prev) =>
//       prev.map((order) =>
//         order.id === orderId
//           ? {
//               ...order,
//               products: order.products?.map((p) =>
//                 p.id === productId ? { ...p, delivered: !p.delivered } : p,
//               ),
//             }
//           : order,
//       ),
//     );
//   };

//   /**
//    * KPIs
//    */
//   const kpis = useMemo(() => {
//     let estimated = 0;
//     let delivered = 0;
//     let cash = 0;
//     let transfer = 0;

//     orders.forEach((order) => {
//       const amount = Number(order.total_amount);
//       estimated += amount;

//       if (order.status === "DELIVERED") {
//         delivered += amount;

//         if (order.payment_method === "CASH") cash += amount;
//         else if (order.payment_method === "TRANSFER") transfer += amount;
//         else {
//           cash += amount / 2;
//           transfer += amount / 2;
//         }
//       }
//     });

//     const deliveredCount = orders.filter(
//       (o) => o.status === "DELIVERED",
//     ).length;

//     const progress =
//       orders.length === 0 ? 0 : (deliveredCount / orders.length) * 100;

//     return { estimated, delivered, cash, transfer, progress };
//   }, [orders]);

//   return {
//     orders,
//     loading,
//     error,
//     fetchOrders,
//     toggleProductDelivered,
//     kpis,
//   };
// };
// hooks/useDriverOrders.ts

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
