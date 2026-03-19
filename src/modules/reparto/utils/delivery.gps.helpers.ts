import type { GPSPoint } from "../types/delivery.types";

export const buildOrderGpsFromCustomerGps = (
  customerGps?: GPSPoint | null,
): GPSPoint | null => {
  if (!customerGps) return null;

  return {
    lat: customerGps.lat,
    lng: customerGps.lng,
    accuracy: customerGps.accuracy,
    source: "ORDER_CONFIRMED",
    capturedAt: new Date().toISOString(),
  };
};
