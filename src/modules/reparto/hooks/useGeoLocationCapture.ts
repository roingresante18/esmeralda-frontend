import { useState } from "react";
import type { GPSPoint } from "../types/delivery.types";

export const useGeoLocationCapture = () => {
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsPoint, setGpsPoint] = useState<GPSPoint | null>(null);

  const captureGps = async () => {
    if (!navigator.geolocation) {
      setGpsError("Este dispositivo no soporta geolocalización.");
      return null;
    }

    setLoadingGps(true);
    setGpsError(null);

    const point = await new Promise<GPSPoint | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            source: "DRIVER_CAPTURE",
            capturedAt: new Date().toISOString(),
          }),
        () => resolve(null),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        },
      );
    });

    setLoadingGps(false);

    if (!point) {
      setGpsError("No se pudo capturar el GPS. Verificá permisos y señal.");
      return null;
    }

    setGpsPoint(point);
    return point;
  };

  return {
    gpsPoint,
    gpsError,
    loadingGps,
    captureGps,
  };
};
