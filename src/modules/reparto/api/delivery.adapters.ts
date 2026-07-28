import type {
  DeliveryOrder,
  DeliveryStatus,
  PaymentMethod,
  GPSPoint,
  DeliveryPayment,
  DeliveryPaymentSummary,
  DeliveryProduct,
} from "../types/delivery.types";

import { getGpsConsistency } from "../utils/delivery.gps.metrics";

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

  total_amount?: number | string | null;
  payment_method?: PaymentMethod | null;

  delivery_date: string | null;

  delivery_address_snapshot?: string | null;
  municipality_snapshot?: string | null;
  zone_snapshot?: string | null;

  delivery_latitude?: number | string | null;
  delivery_longitude?: number | string | null;
  delivery_accuracy?: number | string | null;

  delivered_latitude?: number | string | null;
  delivered_longitude?: number | string | null;
  delivered_accuracy?: number | string | null;

  delivered_at?: string | null;

  notes?: string | null;

  route_order?: number | string | null;
  municipality_order?: number | string | null;

  assigned_driver_id?: number | string | null;
  assigned_driver_name?: string | null;

  payment_summary?: {
    cash?: number | string | null;
    transfer?: number | string | null;
    card?: number | string | null;
    check?: number | string | null;
    other?: number | string | null;
    total_paid?: number | string | null;
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
    phone?: string | null;
    address?: string | null;
    municipality?: string | null;
    zone?: string | null;
    gps_latitude?: number | string | null;
    gps_longitude?: number | string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  };

  products?: Array<{
    id: number;
    name: string;
    quantity?: number | string | null;
    quantity_delivered?: number | string | null;
  }>;

  items?: Array<{
    id: number;
    quantity?: number | string | null;
    delivered_quantity?: number | string | null;
    quantity_delivered?: number | string | null;

    product?: {
      id: number;
      description?: string | null;
      name?: string | null;
    } | null;
  }>;
};

const toValidNumber = (value?: number | string | null): number | null => {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const toNumberOrDefault = (
  value: number | string | null | undefined,
  defaultValue = 0,
): number => {
  return toValidNumber(value) ?? defaultValue;
};

const toGps = (
  latitude?: number | string | null,
  longitude?: number | string | null,
  accuracy?: number | string | null,
  source?: GPSPoint["source"],
): GPSPoint | null => {
  const parsedLatitude = toValidNumber(latitude);
  const parsedLongitude = toValidNumber(longitude);
  const parsedAccuracy = toValidNumber(accuracy);

  if (parsedLatitude == null || parsedLongitude == null) {
    return null;
  }

  if (
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    accuracy:
      parsedAccuracy != null && parsedAccuracy >= 0
        ? parsedAccuracy
        : undefined,
    source,
  };
};

const toPaymentSummary = (
  summary?: ApiOrder["payment_summary"],
): DeliveryPaymentSummary => ({
  cash: toNumberOrDefault(summary?.cash),
  transfer: toNumberOrDefault(summary?.transfer),
  card: toNumberOrDefault(summary?.card),
  check: toNumberOrDefault(summary?.check),
  other: toNumberOrDefault(summary?.other),
  total_paid: toNumberOrDefault(summary?.total_paid),
});

const toPayments = (payments?: ApiOrder["payments"]): DeliveryPayment[] =>
  (payments ?? []).map((payment) => ({
    id: payment.id,
    amount: toNumberOrDefault(payment.amount),
    method: payment.method,
    type: payment.type,
    status: payment.status,
    reference: payment.reference ?? null,
    external_id: payment.external_id ?? null,
    notes: payment.notes ?? null,
    created_at: payment.created_at,
    confirmed_at: payment.confirmed_at ?? null,
  }));

const deliveryStatusMap: Record<ApiOrder["status"], DeliveryStatus> = {
  ASSIGNED: "ASSIGNED",
  IN_DELIVERY: "IN_DELIVERY",
  DELIVERED: "DELIVERED",
  RESCHEDULED: "RESCHEDULED",
  PARTIAL_DELIVERED: "PARTIAL_DELIVERED",
  NOT_DELIVERED: "NOT_DELIVERED",
  PENDING_DELIVERY: "PENDING_DELIVERY",
};

const buildDeliveryProduct = ({
  productId,
  productName,
  quantityOrderedValue,
  quantityPreviouslyDeliveredValue,
}: {
  productId: number;
  productName: string;
  quantityOrderedValue?: number | string | null;
  quantityPreviouslyDeliveredValue?: number | string | null;
}): DeliveryProduct => {
  const quantityOrdered = Math.max(toNumberOrDefault(quantityOrderedValue), 0);

  const quantityPreviouslyDelivered = Math.min(
    Math.max(toNumberOrDefault(quantityPreviouslyDeliveredValue), 0),
    quantityOrdered,
  );

  const quantityPending = Math.max(
    quantityOrdered - quantityPreviouslyDelivered,
    0,
  );

  return {
    productId,
    productName,
    quantityOrdered,
    quantityPreviouslyDelivered,
    quantityPending,

    /*
     * El formulario siempre empieza el intento actual en cero.
     */
    quantityDelivered: 0,
    delivered: false,
  };
};

export const adaptApiOrderToDeliveryOrder = (
  order: ApiOrder,
): DeliveryOrder => {
  const customerGps = toGps(
    order.client.gps_latitude ?? order.client.latitude,
    order.client.gps_longitude ?? order.client.longitude,
    undefined,
    "CUSTOMER_PROFILE",
  );

  const orderGps = toGps(
    order.delivery_latitude,
    order.delivery_longitude,
    order.delivery_accuracy,
    "ORDER_CONFIRMED",
  );

  const deliveredGps = toGps(
    order.delivered_latitude,
    order.delivered_longitude,
    order.delivered_accuracy,
    "DRIVER_CAPTURE",
  );

  const gpsConsistency = getGpsConsistency({
    customerGps,
    orderGps,
    deliveredGps,
  });

  const products: DeliveryProduct[] =
    order.products?.map((product) =>
      buildDeliveryProduct({
        productId: product.id,
        productName: product.name || "Producto",
        quantityOrderedValue: product.quantity,
        quantityPreviouslyDeliveredValue: product.quantity_delivered,
      }),
    ) ??
    order.items?.map((item) =>
      buildDeliveryProduct({
        productId: item.product?.id ?? item.id,
        productName:
          item.product?.description ?? item.product?.name ?? "Producto",
        quantityOrderedValue: item.quantity,
        quantityPreviouslyDeliveredValue:
          item.delivered_quantity ?? item.quantity_delivered,
      }),
    ) ??
    [];

  const amountToCharge = toNumberOrDefault(order.total_amount);

  return {
    id: order.id,

    customerId: order.client.id,
    customerName: order.client.name,
    phone: order.client.phone ?? undefined,

    address:
      order.delivery_address_snapshot?.trim() ||
      order.client.address?.trim() ||
      "Sin dirección cargada",

    municipality:
      order.municipality_snapshot?.trim() ||
      order.client.municipality?.trim() ||
      "Sin municipio",

    zone:
      order.zone_snapshot?.trim() || order.client.zone?.trim() || "Sin zona",

    deliveryDate: order.delivery_date,

    deliveryStatus: deliveryStatusMap[order.status] ?? "IN_DELIVERY",

    paymentMethod: order.payment_method ?? "CASH",

    amountToCharge,

    assignedDriverId: toValidNumber(order.assigned_driver_id),

    assignedDriverName: order.assigned_driver_name ?? null,

    notes: order.notes ?? undefined,

    products,

    totals: {
      total: amountToCharge,
      currency: "ARS",
    },

    routeOrder: toValidNumber(order.route_order),

    municipalityOrder: toValidNumber(order.municipality_order) ?? 9999,

    customerGps,
    orderGps,
    deliveredGps,

    traceability: {
      customerGps,
      orderGps,
      deliveredGps,
      ...gpsConsistency,
    },

    deliveredAt: order.delivered_at ?? null,

    deliveredBy: null,
    deliveryObservation: undefined,
    evidencePending: true,

    paymentSummary: toPaymentSummary(order.payment_summary),

    payments: toPayments(order.payments),
  };
};
