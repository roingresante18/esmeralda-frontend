import type {
  DeliveryOrder,
  DeliveryStatus,
  PaymentMethod,
  GPSPoint,
} from "../types/delivery.types";

type ApiOrder = {
  id: number;
  status: "ASSIGNED" | "IN_DELIVERY" | "DELIVERED" | "RESCHEDULED";
  total_amount: number;
  payment_method: PaymentMethod;
  delivery_date: string | null;
  delivery_latitude?: number;
  delivery_longitude?: number;
  delivered_latitude?: number;
  delivered_longitude?: number;
  delivered_at?: string | null;
  notes?: string;
  route_order?: number | null;
  municipality_order?: number | null;
  client: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    municipality: string;
    zone: string;
    gps_latitude?: number;
    gps_longitude?: number;
  };
  products?: Array<{
    id: number;
    name: string;
    quantity?: number;
    quantity_delivered?: number;
    delivered?: boolean;
  }>;
  assigned_driver_id?: number | null;
  assigned_driver_name?: string | null;
};

const toGps = (
  lat?: number,
  lng?: number,
  source?: GPSPoint["source"],
): GPSPoint | null => {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return { lat, lng, source };
};

export const adaptApiOrderToDeliveryOrder = (
  order: ApiOrder,
): DeliveryOrder => {
  const deliveryStatusMap: Record<ApiOrder["status"], DeliveryStatus> = {
    ASSIGNED: "ASSIGNED",
    IN_DELIVERY: "IN_DELIVERY",
    DELIVERED: "DELIVERED",
    RESCHEDULED: "RESCHEDULED",
  };

  return {
    id: order.id,
    customerId: order.client.id,
    customerName: order.client.name,
    phone: order.client.phone,
    address: order.client.address ?? "Sin dirección cargada",
    municipality: order.client.municipality,
    zone: order.client.zone,
    deliveryDate: order.delivery_date,
    deliveryStatus: deliveryStatusMap[order.status] ?? "ASSIGNED",
    paymentMethod: order.payment_method,
    amountToCharge: Number(order.total_amount ?? 0),
    assignedDriverId: order.assigned_driver_id,
    assignedDriverName: order.assigned_driver_name,
    notes: order.notes,
    products:
      order.products?.map((p) => ({
        productId: p.id,
        productName: p.name,
        quantityOrdered: Number(p.quantity ?? 1),
        quantityDelivered: Number(
          p.quantity_delivered ?? (p.delivered ? (p.quantity ?? 1) : 0),
        ),
        delivered: Boolean(p.delivered),
      })) ?? [],
    totals: {
      total: Number(order.total_amount ?? 0),
      currency: "ARS",
    },
    routeOrder: order.route_order ?? null,
    municipalityOrder: order.municipality_order ?? 9999,
    customerGps: toGps(
      order.client.gps_latitude,
      order.client.gps_longitude,
      "CUSTOMER_PROFILE",
    ),
    orderGps: toGps(
      order.delivery_latitude,
      order.delivery_longitude,
      "ORDER_CONFIRMED",
    ),
    deliveredGps: toGps(
      order.delivered_latitude,
      order.delivered_longitude,
      "DRIVER_CAPTURE",
    ),
    deliveredAt: order.delivered_at ?? null,
    deliveredBy: null,
    evidencePending: true,
  };
};
