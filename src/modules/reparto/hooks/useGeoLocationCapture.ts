import { useState } from "react";
import type { GPSPoint } from "../types/delivery.types";

export const useGeoLocationCapture = () => {
  const [gpsPoint, setGpsPoint] = useState<GPSPoint | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);

  const captureGps = (): Promise<GPSPoint | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const message =
          "La geolocalización no está disponible en este dispositivo.";

        setGpsError(message);
        resolve(null);
        return;
      }

      setLoadingGps(true);
      setGpsError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = Number(position.coords.latitude);
          const longitude = Number(position.coords.longitude);
          const accuracy = Number(position.coords.accuracy);

          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            setGpsError("El dispositivo devolvió coordenadas inválidas.");
            setLoadingGps(false);
            resolve(null);
            return;
          }

          const point: GPSPoint = {
            latitude,
            longitude,
            accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
            source: "DRIVER_CAPTURE",
            capturedAt: new Date().toISOString(),
          };

          setGpsPoint(point);
          setGpsError(null);
          setLoadingGps(false);

          resolve(point);
        },
        (error) => {
          let message = "No se pudo obtener la ubicación.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              message =
                "El permiso de ubicación fue rechazado. Habilitalo en el navegador.";
              break;

            case error.POSITION_UNAVAILABLE:
              message = "La ubicación no está disponible en este momento.";
              break;

            case error.TIMEOUT:
              message = "Se agotó el tiempo para obtener la ubicación.";
              break;
          }

          setGpsError(message);
          setLoadingGps(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 20_000,
          maximumAge: 0,
        },
      );
    });
  };

  return {
    gpsPoint,
    gpsError,
    loadingGps,
    captureGps,
  };
};
