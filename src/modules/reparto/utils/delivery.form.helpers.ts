import type {
  DeliveryDataFormValues,
  DeliveryOrder,
  GPSPoint,
  PaymentMethod,
} from "../types/delivery.types";

interface SourceOrderLike {
  id: number;
  notes?: string;
  delivery_date?: string | null;
  payment_method?: PaymentMethod | null;
  client?: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    municipality?: string;
    zone?: string;
    gps_latitude?: number;
    gps_longitude?: number;
  };
  address?: string;
  municipality?: string;
  zone?: string;
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
}

export const buildInitialDeliveryDataValues = (
  order: SourceOrderLike,
): DeliveryDataFormValues => {
  const clientGps =
    order.customerGps ??
    (typeof order.client?.gps_latitude === "number" &&
    typeof order.client?.gps_longitude === "number"
      ? {
          lat: order.client.gps_latitude,
          lng: order.client.gps_longitude,
          source: "CUSTOMER_PROFILE" as const,
          capturedAt: new Date().toISOString(),
        }
      : null);

  return {
    deliveryDate: order.delivery_date ?? "",
    paymentMethod: order.payment_method ?? "",
    address: order.address ?? order.client?.address ?? "",
    municipality: order.municipality ?? order.client?.municipality ?? "",
    zone: order.zone ?? order.client?.zone ?? "",
    customerGps: clientGps,
    orderGps: order.orderGps ?? clientGps ?? null,
    notes: order.notes ?? "",
  };
};

export const mapDeliveryOrderToConfirmationDefaults = (
  order: DeliveryOrder,
): DeliveryDataFormValues => ({
  deliveryDate: order.deliveryDate ?? "",
  paymentMethod: order.paymentMethod ?? "",
  address: order.address,
  municipality: order.municipality,
  zone: order.zone,
  customerGps: order.customerGps ?? null,
  orderGps: order.orderGps ?? order.customerGps ?? null,
  notes: order.notes ?? "",
});
