import type { GPSPoint, DeliveryTraceability } from "../types/delivery.types";

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const getDistanceInMeters = (
  pointA?: GPSPoint | null,
  pointB?: GPSPoint | null,
): number | null => {
  if (!pointA || !pointB) return null;

  const R = 6371e3;
  const φ1 = toRad(pointA.lat);
  const φ2 = toRad(pointB.lat);
  const Δφ = toRad(pointB.lat - pointA.lat);
  const Δλ = toRad(pointB.lng - pointA.lng);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * d);
};

export const formatDistanceLabel = (meters?: number | null) => {
  if (meters == null) return "Sin datos";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(2)} km`;
};

export const getGpsConsistency = ({
  customerGps,
  orderGps,
  deliveredGps,
}: {
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
  deliveredGps?: GPSPoint | null;
}): Pick<
  DeliveryTraceability,
  | "distanceCustomerToOrderMeters"
  | "distanceOrderToDeliveredMeters"
  | "distanceCustomerToDeliveredMeters"
  | "gpsConsistencyStatus"
  | "gpsConsistencyMessage"
> => {
  const customerToOrder = getDistanceInMeters(customerGps, orderGps);
  const orderToDelivered = getDistanceInMeters(orderGps, deliveredGps);
  const customerToDelivered = getDistanceInMeters(customerGps, deliveredGps);

  if (!customerGps && !orderGps && !deliveredGps) {
    return {
      distanceCustomerToOrderMeters: null,
      distanceOrderToDeliveredMeters: null,
      distanceCustomerToDeliveredMeters: null,
      gpsConsistencyStatus: "NO_DATA",
      gpsConsistencyMessage: "No hay datos GPS disponibles para este pedido.",
    };
  }

  if (!deliveredGps) {
    return {
      distanceCustomerToOrderMeters: customerToOrder,
      distanceOrderToDeliveredMeters: null,
      distanceCustomerToDeliveredMeters: null,
      gpsConsistencyStatus: "WARNING",
      gpsConsistencyMessage: "Todavía no se capturó el GPS real de entrega.",
    };
  }

  const referenceDistance = orderToDelivered ?? customerToDelivered ?? null;

  if (referenceDistance == null) {
    return {
      distanceCustomerToOrderMeters: customerToOrder,
      distanceOrderToDeliveredMeters: orderToDelivered,
      distanceCustomerToDeliveredMeters: customerToDelivered,
      gpsConsistencyStatus: "WARNING",
      gpsConsistencyMessage:
        "No hay suficiente información para comparar el punto real de entrega.",
    };
  }

  if (referenceDistance <= 100) {
    return {
      distanceCustomerToOrderMeters: customerToOrder,
      distanceOrderToDeliveredMeters: orderToDelivered,
      distanceCustomerToDeliveredMeters: customerToDelivered,
      gpsConsistencyStatus: "OK",
      gpsConsistencyMessage: "La entrega ocurrió muy cerca del punto esperado.",
    };
  }

  if (referenceDistance <= 300) {
    return {
      distanceCustomerToOrderMeters: customerToOrder,
      distanceOrderToDeliveredMeters: orderToDelivered,
      distanceCustomerToDeliveredMeters: customerToDelivered,
      gpsConsistencyStatus: "WARNING",
      gpsConsistencyMessage:
        "La entrega ocurrió con una desviación moderada respecto al punto esperado.",
    };
  }

  return {
    distanceCustomerToOrderMeters: customerToOrder,
    distanceOrderToDeliveredMeters: orderToDelivered,
    distanceCustomerToDeliveredMeters: customerToDelivered,
    gpsConsistencyStatus: "CRITICAL",
    gpsConsistencyMessage:
      "La entrega ocurrió lejos del punto esperado. Revisar trazabilidad.",
  };
};
