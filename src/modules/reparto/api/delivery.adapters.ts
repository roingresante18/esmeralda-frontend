import type {
  DeliveryOrder,
  DeliveryStatus,
  PaymentMethod,
  GPSPoint,
  DeliveryPayment,
  DeliveryPaymentSummary,
} from "../types/delivery.types";

type ApiOrder = {
  id: number;
  status:
    | "ASSIGNED"
    | "IN_DELIVERY"
    | "DELIVERED"
    | "RESCHEDULED"
    | "PARTIAL_DELIVERED"
    | "NOT_DELIVERED"
    | "PENDING_DELIVERY";
  total_amount?: number;
  payment_method?: PaymentMethod;
  delivery_date: string | null;
  delivery_address_snapshot?: string | null;
  municipality_snapshot?: string | null;
  zone_snapshot?: string | null;
  delivery_latitude?: number | string | null;
  delivery_longitude?: number | string | null;
  delivered_latitude?: number | string | null;
  delivered_longitude?: number | string | null;
  delivered_at?: string | null;
  notes?: string | null;
  route_order?: number | null;
  municipality_order?: number | null;
  assigned_driver_id?: number | null;
  assigned_driver_name?: string | null;
  payment_summary?: {
    cash?: number;
    transfer?: number;
    card?: number;
    check?: number;
    other?: number;
    total_paid?: number;
  };
  payments?: Array<{
    id: number;
    amount: number | string;
    method: string;
    type: string;
    status: string;
    reference?: string | null;
    external_id?: string | null;
    notes?: string | null;
    created_at: string;
    confirmed_at?: string | null;
  }>;
  client: {
    id: number;
    name: string;
    phone?: string;
    address?: string | null;
    municipality?: string;
    zone?: string;
    gps_latitude?: number | string | null;
    gps_longitude?: number | string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  };
  products?: Array<{
    id: number;
    name: string;
    quantity?: number;
    quantity_delivered?: number;
    delivered?: boolean;
  }>;
  items?: Array<{
    id: number;
    quantity?: number;
    quantity_delivered?: number;
    delivered?: boolean;
    product?: {
      id: number;
      description?: string;
      name?: string;
    };
  }>;
};

const toValidNumber = (value?: number | string | null) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toGps = (
  lat?: number | string | null,
  lng?: number | string | null,
  source?: GPSPoint["source"],
): GPSPoint | null => {
  const parsedLat = toValidNumber(lat);
  const parsedLng = toValidNumber(lng);

  if (parsedLat == null || parsedLng == null) return null;

  return { lat: parsedLat, lng: parsedLng, source };
};

const toPaymentSummary = (
  summary?: ApiOrder["payment_summary"],
): DeliveryPaymentSummary => ({
  cash: Number(summary?.cash ?? 0),
  transfer: Number(summary?.transfer ?? 0),
  card: Number(summary?.card ?? 0),
  check: Number(summary?.check ?? 0),
  other: Number(summary?.other ?? 0),
  total_paid: Number(summary?.total_paid ?? 0),
});

const toPayments = (payments?: ApiOrder["payments"]): DeliveryPayment[] =>
  (payments ?? []).map((payment) => ({
    id: payment.id,
    amount: Number(payment.amount ?? 0),
    method: payment.method,
    type: payment.type,
    status: payment.status,
    reference: payment.reference ?? null,
    external_id: payment.external_id ?? null,
    notes: payment.notes ?? null,
    created_at: payment.created_at,
    confirmed_at: payment.confirmed_at ?? null,
  }));

export const adaptApiOrderToDeliveryOrder = (
  order: ApiOrder,
): DeliveryOrder => {
  const deliveryStatusMap: Record<ApiOrder["status"], DeliveryStatus> = {
    ASSIGNED: "ASSIGNED",
    IN_DELIVERY: "IN_DELIVERY",
    DELIVERED: "DELIVERED",
    RESCHEDULED: "RESCHEDULED",
    PARTIAL_DELIVERED: "PARTIAL_DELIVERED",
    NOT_DELIVERED: "NOT_DELIVERED",
    PENDING_DELIVERY: "PENDING_DELIVERY",
  };

  const customerGps = toGps(
    order.client.gps_latitude ?? order.client.latitude,
    order.client.gps_longitude ?? order.client.longitude,
    "CUSTOMER_PROFILE",
  );

  const orderGps = toGps(
    order.delivery_latitude,
    order.delivery_longitude,
    "ORDER_CONFIRMED",
  );

  const deliveredGps = toGps(
    order.delivered_latitude,
    order.delivered_longitude,
    "DRIVER_CAPTURE",
  );

  const products =
    order.products?.map((p) => ({
      productId: p.id,
      productName: p.name,
      quantityOrdered: Number(p.quantity ?? 1),
      quantityDelivered: Number(
        p.quantity_delivered ?? (p.delivered ? (p.quantity ?? 1) : 0),
      ),
      delivered: Boolean(p.delivered),
    })) ??
    order.items?.map((item) => ({
      productId: item.product?.id ?? item.id,
      productName:
        item.product?.description ?? item.product?.name ?? "Producto",
      quantityOrdered: Number(item.quantity ?? 1),
      quantityDelivered: Number(
        item.quantity_delivered ?? (item.delivered ? (item.quantity ?? 1) : 0),
      ),
      delivered: Boolean(item.delivered),
    })) ??
    [];

  return {
    id: order.id,
    customerId: order.client.id,
    customerName: order.client.name,
    phone: order.client.phone,
    address:
      order.delivery_address_snapshot ??
      order.client.address ??
      "Sin dirección cargada",
    municipality:
      order.municipality_snapshot ??
      order.client.municipality ??
      "Sin municipio",
    zone: order.zone_snapshot ?? order.client.zone ?? "Sin zona",
    deliveryDate: order.delivery_date,
    deliveryStatus: deliveryStatusMap[order.status] ?? "ASSIGNED",
    paymentMethod: order.payment_method ?? "CASH",
    amountToCharge: Number(order.total_amount ?? 0),
    assignedDriverId: order.assigned_driver_id ?? null,
    assignedDriverName: order.assigned_driver_name ?? null,
    notes: order.notes ?? undefined,
    products,
    totals: {
      total: Number(order.total_amount ?? 0),
      currency: "ARS",
    },
    routeOrder: order.route_order ?? null,
    municipalityOrder: order.municipality_order ?? 9999,
    customerGps,
    orderGps,
    deliveredGps,
    deliveredAt: order.delivered_at ?? null,
    deliveredBy: null,
    evidencePending: true,
    paymentSummary: toPaymentSummary(order.payment_summary),
    payments: toPayments(order.payments),
  };
};
