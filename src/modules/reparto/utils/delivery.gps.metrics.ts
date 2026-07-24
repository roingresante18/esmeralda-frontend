import type { GPSPoint, DeliveryTraceability } from "../types/delivery.types";

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const getDistanceInMeters = (
  pointA?: GPSPoint | null,
  pointB?: GPSPoint | null,
): number | null => {
  if (!pointA || !pointB) return null;

  const R = 6_371_000;

  const lat1 = toRad(pointA.latitude);
  const lat2 = toRad(pointB.latitude);

  const deltaLat = toRad(pointB.latitude - pointA.latitude);

  const deltaLongitude = toRad(pointB.longitude - pointA.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;

  const distance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * distance);
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
