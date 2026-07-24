// import type {
//   DeliveryOrder,
//   DeliveryStatus,
//   PaymentMethod,
//   GPSPoint,
//   DeliveryPayment,
//   DeliveryPaymentSummary,
// } from "../types/delivery.types";

// type ApiOrder = {
//   id: number;
//   status:
//     | "ASSIGNED"
//     | "IN_DELIVERY"
//     | "DELIVERED"
//     | "RESCHEDULED"
//     | "PARTIAL_DELIVERED"
//     | "NOT_DELIVERED"
//     | "PENDING_DELIVERY";
//   total_amount?: number;
//   payment_method?: PaymentMethod;
//   delivery_date: string | null;
//   delivery_address_snapshot?: string | null;
//   municipality_snapshot?: string | null;
//   zone_snapshot?: string | null;
//   delivery_latitude?: number | string | null;
//   delivery_longitude?: number | string | null;
//   delivered_latitude?: number | string | null;
//   delivered_longitude?: number | string | null;
//   delivered_at?: string | null;
//   notes?: string | null;
//   route_order?: number | null;
//   municipality_order?: number | null;
//   assigned_driver_id?: number | null;
//   assigned_driver_name?: string | null;
//   payment_summary?: {
//     cash?: number;
//     transfer?: number;
//     card?: number;
//     check?: number;
//     other?: number;
//     total_paid?: number;
//   };
//   payments?: Array<{
//     id: number;
//     amount: number | string;
//     method: string;
//     type: string;
//     status: string;
//     reference?: string | null;
//     external_id?: string | null;
//     notes?: string | null;
//     created_at: string;
//     confirmed_at?: string | null;
//   }>;
//   client: {
//     id: number;
//     name: string;
//     phone?: string;
//     address?: string | null;
//     municipality?: string;
//     zone?: string;
//     gps_latitude?: number | string | null;
//     gps_longitude?: number | string | null;
//     latitude?: number | string | null;
//     longitude?: number | string | null;
//   };
//   products?: Array<{
//     id: number;
//     name: string;
//     quantity?: number;
//     quantity_delivered?: number;
//     delivered?: boolean;
//   }>;
//   items?: Array<{
//     id: number;
//     quantity?: number;
//     quantity_delivered?: number;
//     delivered?: boolean;
//     product?: {
//       id: number;
//       description?: string;
//       name?: string;
//     };
//   }>;
// };

// const toValidNumber = (value?: number | string | null) => {
//   if (value == null || value === "") return null;
//   const parsed = Number(value);
//   return Number.isNaN(parsed) ? null : parsed;
// };

// const toGps = (
//   lat?: number | string | null,
//   lng?: number | string | null,
//   source?: GPSPoint["source"],
// ): GPSPoint | null => {
//   const parsedLat = toValidNumber(lat);
//   const parsedLng = toValidNumber(lng);

//   if (parsedLat == null || parsedLng == null) {
//     return null;
//   }

//   return {
//     latitude: parsedLat,
//     longitude: parsedLng,
//     source,
//   };
// };

// const toPaymentSummary = (
//   summary?: ApiOrder["payment_summary"],
// ): DeliveryPaymentSummary => ({
//   cash: Number(summary?.cash ?? 0),
//   transfer: Number(summary?.transfer ?? 0),
//   card: Number(summary?.card ?? 0),
//   check: Number(summary?.check ?? 0),
//   other: Number(summary?.other ?? 0),
//   total_paid: Number(summary?.total_paid ?? 0),
// });

// const toPayments = (payments?: ApiOrder["payments"]): DeliveryPayment[] =>
//   (payments ?? []).map((payment) => ({
//     id: payment.id,
//     amount: Number(payment.amount ?? 0),
//     method: payment.method,
//     type: payment.type,
//     status: payment.status,
//     reference: payment.reference ?? null,
//     external_id: payment.external_id ?? null,
//     notes: payment.notes ?? null,
//     created_at: payment.created_at,
//     confirmed_at: payment.confirmed_at ?? null,
//   }));

// export const adaptApiOrderToDeliveryOrder = (
//   order: ApiOrder,
// ): DeliveryOrder => {
//   const deliveryStatusMap: Record<ApiOrder["status"], DeliveryStatus> = {
//     ASSIGNED: "ASSIGNED",
//     IN_DELIVERY: "IN_DELIVERY",
//     DELIVERED: "DELIVERED",
//     RESCHEDULED: "RESCHEDULED",
//     PARTIAL_DELIVERED: "PARTIAL_DELIVERED",
//     NOT_DELIVERED: "NOT_DELIVERED",
//     PENDING_DELIVERY: "PENDING_DELIVERY",
//   };

//   const customerGps = toGps(
//     order.client.gps_latitude ?? order.client.latitude,
//     order.client.gps_longitude ?? order.client.longitude,
//     "CUSTOMER_PROFILE",
//   );

//   const orderGps = toGps(
//     order.delivery_latitude,
//     order.delivery_longitude,
//     "ORDER_CONFIRMED",
//   );

//   const deliveredGps = toGps(
//     order.delivered_latitude,
//     order.delivered_longitude,
//     "DRIVER_CAPTURE",
//   );

//   const products =
//     order.products?.map((p) => ({
//       productId: p.id,
//       productName: p.name,
//       quantityOrdered: Number(p.quantity ?? 1),
//       quantityDelivered: Number(
//         p.quantity_delivered ?? (p.delivered ? (p.quantity ?? 1) : 0),
//       ),
//       delivered: Boolean(p.delivered),
//     })) ??
//     order.items?.map((item) => ({
//       productId: item.product?.id ?? item.id,
//       productName:
//         item.product?.description ?? item.product?.name ?? "Producto",
//       quantityOrdered: Number(item.quantity ?? 1),
//       quantityDelivered: Number(
//         item.quantity_delivered ?? (item.delivered ? (item.quantity ?? 1) : 0),
//       ),
//       delivered: Boolean(item.delivered),
//     })) ??
//     [];

//   return {
//     id: order.id,
//     customerId: order.client.id,
//     customerName: order.client.name,
//     phone: order.client.phone,
//     address:
//       order.delivery_address_snapshot ??
//       order.client.address ??
//       "Sin dirección cargada",
//     municipality:
//       order.municipality_snapshot ??
//       order.client.municipality ??
//       "Sin municipio",
//     zone: order.zone_snapshot ?? order.client.zone ?? "Sin zona",
//     deliveryDate: order.delivery_date,
//     deliveryStatus: deliveryStatusMap[order.status] ?? "ASSIGNED",
//     paymentMethod: order.payment_method ?? "CASH",
//     amountToCharge: Number(order.total_amount ?? 0),
//     assignedDriverId: order.assigned_driver_id ?? null,
//     assignedDriverName: order.assigned_driver_name ?? null,
//     notes: order.notes ?? undefined,
//     products,
//     totals: {
//       total: Number(order.total_amount ?? 0),
//       currency: "ARS",
//     },
//     routeOrder: order.route_order ?? null,
//     municipalityOrder: order.municipality_order ?? 9999,
//     customerGps,
//     orderGps,
//     deliveredGps,
//     deliveredAt: order.delivered_at ?? null,
//     deliveredBy: null,
//     evidencePending: true,
//     paymentSummary: toPaymentSummary(order.payment_summary),
//     payments: toPayments(order.payments),
//   };
// };

import type {
  DeliveryOrder,
  DeliveryStatus,
  PaymentMethod,
  GPSPoint,
  DeliveryPayment,
  DeliveryPaymentSummary,
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

  /*
   * GPS confirmado específicamente para el pedido.
   */
  delivery_latitude?: number | string | null;
  delivery_longitude?: number | string | null;

  /*
   * GPS capturado por el repartidor al confirmar la entrega.
   */
  delivered_latitude?: number | string | null;
  delivered_longitude?: number | string | null;

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

    /*
     * Posibles nombres que puede utilizar el backend
     * para el GPS guardado en el perfil del cliente.
     */
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
    delivered?: boolean | null;
  }>;

  items?: Array<{
    id: number;
    quantity?: number | string | null;
    quantity_delivered?: number | string | null;
    delivered?: boolean | null;

    product?: {
      id: number;
      description?: string | null;
      name?: string | null;
    } | null;
  }>;
};

/**
 * Convierte un valor recibido desde la API en un número válido.
 *
 * Devuelve null cuando el valor:
 * - no existe;
 * - está vacío;
 * - no puede convertirse a número;
 * - es infinito.
 */
const toValidNumber = (value?: number | string | null): number | null => {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

/**
 * Convierte un valor en número y utiliza un valor alternativo
 * cuando la conversión no es posible.
 */
const toNumberOrDefault = (
  value: number | string | null | undefined,
  defaultValue = 0,
): number => {
  return toValidNumber(value) ?? defaultValue;
};

/**
 * Convierte dos coordenadas recibidas desde la API al tipo GPSPoint.
 *
 * GPSPoint utiliza:
 * - latitude
 * - longitude
 *
 * No utiliza:
 * - lat
 * - lng
 */
const toGps = (
  latitude?: number | string | null,
  longitude?: number | string | null,
  source?: GPSPoint["source"],
): GPSPoint | null => {
  const parsedLatitude = toValidNumber(latitude);
  const parsedLongitude = toValidNumber(longitude);

  if (parsedLatitude == null || parsedLongitude == null) {
    return null;
  }

  /*
   * Validación de los límites geográficos posibles.
   *
   * Latitud:  -90 a 90
   * Longitud: -180 a 180
   */
  if (
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    console.warn("Coordenadas GPS inválidas recibidas desde la API:", {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      source,
    });

    return null;
  }

  return {
    latitude: parsedLatitude,
    longitude: parsedLongitude,
    source,
  };
};

/**
 * Adapta el resumen de pagos recibido desde el backend.
 */
const toPaymentSummary = (
  summary?: ApiOrder["payment_summary"],
): DeliveryPaymentSummary => {
  return {
    cash: toNumberOrDefault(summary?.cash),
    transfer: toNumberOrDefault(summary?.transfer),
    card: toNumberOrDefault(summary?.card),
    check: toNumberOrDefault(summary?.check),
    other: toNumberOrDefault(summary?.other),
    total_paid: toNumberOrDefault(summary?.total_paid),
  };
};

/**
 * Adapta la lista de pagos del backend al modelo del frontend.
 */
const toPayments = (payments?: ApiOrder["payments"]): DeliveryPayment[] => {
  return (payments ?? []).map((payment) => ({
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
};

/**
 * Mapa explícito entre los estados enviados por la API
 * y los estados utilizados por el frontend.
 */
const deliveryStatusMap: Record<ApiOrder["status"], DeliveryStatus> = {
  ASSIGNED: "ASSIGNED",
  IN_DELIVERY: "IN_DELIVERY",
  DELIVERED: "DELIVERED",
  RESCHEDULED: "RESCHEDULED",
  PARTIAL_DELIVERED: "PARTIAL_DELIVERED",
  NOT_DELIVERED: "NOT_DELIVERED",
  PENDING_DELIVERY: "PENDING_DELIVERY",
};

/**
 * Adapta un pedido recibido desde el backend al modelo DeliveryOrder
 * utilizado por el módulo de reparto.
 */
export const adaptApiOrderToDeliveryOrder = (
  order: ApiOrder,
): DeliveryOrder => {
  /*
   * GPS guardado en el perfil general del cliente.
   */
  const customerGps = toGps(
    order.client.gps_latitude ?? order.client.latitude,
    order.client.gps_longitude ?? order.client.longitude,
    "CUSTOMER_PROFILE",
  );

  /*
   * GPS establecido al confirmar los datos específicos del pedido.
   */
  const orderGps = toGps(
    order.delivery_latitude,
    order.delivery_longitude,
    "ORDER_CONFIRMED",
  );

  /*
   * GPS capturado por el repartidor en el momento de la entrega.
   */
  const deliveredGps = toGps(
    order.delivered_latitude,
    order.delivered_longitude,
    "DRIVER_CAPTURE",
  );

  /*
   * Calcula:
   *
   * 1. Distancia entre GPS del cliente y GPS del pedido.
   * 2. Distancia entre GPS del pedido y GPS real de entrega.
   * 3. Distancia entre GPS del cliente y GPS real de entrega.
   * 4. Estado de consistencia GPS.
   */
  const gpsConsistency = getGpsConsistency({
    customerGps,
    orderGps,
    deliveredGps,
  });

  /*
   * La API puede devolver los productos directamente en "products"
   * o dentro de "items".
   */
  const products =
    order.products?.map((product) => {
      const quantityOrdered = toNumberOrDefault(product.quantity, 1);

      const quantityDelivered = toNumberOrDefault(
        product.quantity_delivered,
        product.delivered ? quantityOrdered : 0,
      );

      return {
        productId: product.id,
        productName: product.name || "Producto",
        quantityOrdered,
        quantityDelivered,
        delivered: Boolean(product.delivered),
      };
    }) ??
    order.items?.map((item) => {
      const quantityOrdered = toNumberOrDefault(item.quantity, 1);

      const quantityDelivered = toNumberOrDefault(
        item.quantity_delivered,
        item.delivered ? quantityOrdered : 0,
      );

      return {
        productId: item.product?.id ?? item.id,
        productName:
          item.product?.description ?? item.product?.name ?? "Producto",
        quantityOrdered,
        quantityDelivered,
        delivered: Boolean(item.delivered),
      };
    }) ??
    [];

  const amountToCharge = toNumberOrDefault(order.total_amount);

  const assignedDriverId = toValidNumber(order.assigned_driver_id);

  const routeOrder = toValidNumber(order.route_order);

  const municipalityOrder = toValidNumber(order.municipality_order) ?? 9999;

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

    deliveryStatus: deliveryStatusMap[order.status] ?? "ASSIGNED",

    paymentMethod: order.payment_method ?? "CASH",

    amountToCharge,

    assignedDriverId,
    assignedDriverName: order.assigned_driver_name ?? null,

    notes: order.notes ?? undefined,

    products,

    totals: {
      total: amountToCharge,
      currency: "ARS",
    },

    routeOrder,
    municipalityOrder,

    /*
     * Coordenadas individuales disponibles directamente en el pedido.
     */
    customerGps,
    orderGps,
    deliveredGps,

    /*
     * Trazabilidad completa, incluyendo coordenadas,
     * distancias calculadas y nivel de consistencia.
     */
    traceability: {
      customerGps,
      orderGps,
      deliveredGps,
      ...gpsConsistency,
    },

    deliveredAt: order.delivered_at ?? null,

    /*
     * El backend todavía no proporciona los datos de quién realizó
     * la entrega en el objeto ApiOrder actual.
     */
    deliveredBy: null,

    deliveryObservation: undefined,

    /*
     * Este valor puede ajustarse posteriormente si el backend
     * devuelve información sobre evidencias o comprobantes.
     */
    evidencePending: true,

    paymentSummary: toPaymentSummary(order.payment_summary),

    payments: toPayments(order.payments),
  };
};
