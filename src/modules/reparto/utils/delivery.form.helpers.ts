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
    latitude?: number;
    longitude?: number;
  };
  address?: string;
  delivery_address_snapshot?: string | null;
  municipality?: string;
  municipality_snapshot?: string | null;
  zone?: string;
  zone_snapshot?: string | null;
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
}

const toValidNumber = (value?: number | string | null) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const buildInitialDeliveryDataValues = (
  order: SourceOrderLike,
): DeliveryDataFormValues => {
  const clientLat =
    toValidNumber(order.client?.gps_latitude) ??
    toValidNumber(order.client?.latitude);

  const clientLng =
    toValidNumber(order.client?.gps_longitude) ??
    toValidNumber(order.client?.longitude);

  const clientGps: GPSPoint | null =
    order.customerGps ??
    (clientLat != null && clientLng != null
      ? {
          latitude: clientLat,
          longitude: clientLng,
          source: "CUSTOMER_PROFILE",
          capturedAt: new Date().toISOString(),
        }
      : null);

  return {
    deliveryDate: order.delivery_date ?? "",
    paymentMethod: order.payment_method ?? "",
    address:
      order.delivery_address_snapshot ??
      order.address ??
      order.client?.address ??
      "",
    municipality:
      order.municipality_snapshot ??
      order.municipality ??
      order.client?.municipality ??
      "",
    zone: order.zone_snapshot ?? order.zone ?? order.client?.zone ?? "",
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
