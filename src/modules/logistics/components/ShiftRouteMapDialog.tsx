import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FlagIcon from "@mui/icons-material/Flag";
import SpeedIcon from "@mui/icons-material/Speed";
import RouteIcon from "@mui/icons-material/Route";
import TimelineIcon from "@mui/icons-material/Timeline";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";

import { getShiftRoute } from "../api/telemetry.api";

import type {
  ShiftRoutePoint,
  ShiftRouteResponse,
} from "../types/telemetry.types";

/*
 * =========================================================
 * PROPS
 * =========================================================
 */

interface ShiftRouteMapDialogProps {
  open: boolean;

  shiftId: number | null;

  onClose: () => void;
}

/*
 * =========================================================
 * FORMATEAR FECHA Y HORA
 * =========================================================
 */

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

/*
 * =========================================================
 * FORMATEAR KILÓMETROS
 * =========================================================
 */

function formatKm(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${number.toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })} km`;
}

/*
 * =========================================================
 * FORMATEAR VELOCIDAD
 * =========================================================
 */

function formatSpeed(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })} km/h`;
}

/*
 * =========================================================
 * VALIDAR PUNTO
 * =========================================================
 *
 * Aunque el backend valida coordenadas al sincronizar,
 * mantenemos una protección adicional en el frontend.
 */

function isValidPoint(point: ShiftRoutePoint): boolean {
  return (
    Number.isFinite(Number(point.latitude)) &&
    Number.isFinite(Number(point.longitude)) &&
    Number(point.latitude) >= -90 &&
    Number(point.latitude) <= 90 &&
    Number(point.longitude) >= -180 &&
    Number(point.longitude) <= 180
  );
}

/*
 * =========================================================
 * AJUSTAR MAPA AL RECORRIDO
 * =========================================================
 *
 * MapContainer solamente utiliza center durante su
 * inicialización.
 *
 * Este componente escucha los puntos y reajusta
 * automáticamente la cámara.
 */

function FitRouteBounds({ points }: { points: ShiftRoutePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }

    /*
     * Un solo punto:
     * simplemente centramos el mapa.
     */

    if (points.length === 1) {
      map.setView(
        [Number(points[0].latitude), Number(points[0].longitude)],
        16,
      );

      return;
    }

    /*
     * Dos o más puntos:
     * calculamos automáticamente los límites.
     */

    const bounds: LatLngBoundsExpression = points.map((point) => [
      Number(point.latitude),
      Number(point.longitude),
    ]);

    map.fitBounds(bounds, {
      padding: [40, 40],

      /*
       * Evita que un recorrido extremadamente corto
       * produzca un zoom excesivo.
       */
      maxZoom: 17,
    });
  }, [map, points]);

  return null;
}

/*
 * =========================================================
 * POPUP DE PUNTO
 * =========================================================
 */

function RoutePointPopup({
  point,
  title,
}: {
  point: ShiftRoutePoint;

  title: string;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography fontWeight={800}>{title}</Typography>

      <Typography variant="body2">
        Fecha: {formatDateTime(point.recorded_at)}
      </Typography>

      <Typography variant="body2">
        Latitud: {Number(point.latitude).toFixed(7)}
      </Typography>

      <Typography variant="body2">
        Longitud: {Number(point.longitude).toFixed(7)}
      </Typography>

      <Typography variant="body2">
        Velocidad: {formatSpeed(point.speed_kmh)}
      </Typography>

      {point.accuracy != null && (
        <Typography variant="body2">
          Precisión:{" "}
          {Number(point.accuracy).toLocaleString("es-AR", {
            maximumFractionDigits: 1,
          })}{" "}
          m
        </Typography>
      )}
    </Stack>
  );
}

/*
 * =========================================================
 * COMPONENTE
 * =========================================================
 */

export default function ShiftRouteMapDialog({
  open,
  shiftId,
  onClose,
}: ShiftRouteMapDialogProps) {
  const [route, setRoute] = useState<ShiftRouteResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * =======================================================
   * CARGAR RECORRIDO
   * =======================================================
   */

  useEffect(() => {
    if (!open || !shiftId) {
      return;
    }

    let cancelled = false;

    async function loadRoute() {
      try {
        setLoading(true);

        setError(null);

        setRoute(null);

        const data = await getShiftRoute(shiftId!);

        if (!cancelled) {
          setRoute(data);
        }
      } catch (error: any) {
        console.error("[LOGISTICS][SHIFT_ROUTE]", error);

        if (!cancelled) {
          const backendMessage = error?.response?.data?.message;

          setError(
            typeof backendMessage === "string"
              ? backendMessage
              : "No se pudo cargar el recorrido de la jornada.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadRoute();

    return () => {
      cancelled = true;
    };
  }, [open, shiftId]);

  /*
   * =======================================================
   * PUNTOS VÁLIDOS
   * =======================================================
   */

  const validPoints = useMemo(
    () => (route?.points ?? []).filter(isValidPoint),
    [route],
  );

  /*
   * =======================================================
   * COORDENADAS PARA POLYLINE
   * =======================================================
   */

  const polylinePositions = useMemo<LatLngExpression[]>(
    () =>
      validPoints.map((point) => [
        Number(point.latitude),
        Number(point.longitude),
      ]),
    [validPoints],
  );

  /*
   * =======================================================
   * INICIO Y FIN
   * =======================================================
   */

  const startPoint = validPoints.length > 0 ? validPoints[0] : null;

  const endPoint =
    validPoints.length > 1 ? validPoints[validPoints.length - 1] : null;

  /*
   * =======================================================
   * CENTRO INICIAL
   * =======================================================
   *
   * Solamente se utiliza durante el montaje.
   * FitRouteBounds luego ajustará la cámara.
   */

  const initialCenter = useMemo<LatLngExpression>(() => {
    if (startPoint) {
      return [Number(startPoint.latitude), Number(startPoint.longitude)];
    }

    /*
     * Centro aproximado de Argentina.
     *
     * Solamente aparecerá brevemente si todavía
     * no existen puntos.
     */
    return [-38.4161, -63.6167];
  }, [startPoint]);

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 3,

          minHeight: {
            xs: "90vh",
            md: "85vh",
          },
        },
      }}
    >
      {/* HEADER */}

      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <RouteIcon color="primary" />

            <Box>
              <Typography variant="h6" fontWeight={900}>
                Recorrido de la jornada
                {shiftId ? ` #${shiftId}` : ""}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Recorrido reconstruido desde la telemetría GPS del repartidor
              </Typography>
            </Box>
          </Stack>

          <IconButton onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {/* LOADING */}

        {loading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{
              minHeight: 500,
            }}
          >
            <CircularProgress />

            <Typography color="text.secondary">
              Cargando recorrido...
            </Typography>
          </Stack>
        )}

        {/* ERROR */}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {/* SIN TELEMETRÍA */}

        {!loading && !error && route && validPoints.length === 0 && (
          <Stack spacing={2}>
            <Alert severity="info">
              Esta jornada todavía no posee puntos GPS sincronizados.
            </Alert>

            <Paper
              variant="outlined"
              sx={{
                p: 4,

                minHeight: 350,

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                borderRadius: 3,
              }}
            >
              <Stack alignItems="center" spacing={1}>
                <LocationOnIcon
                  color="disabled"
                  sx={{
                    fontSize: 56,
                  }}
                />

                <Typography variant="h6" fontWeight={800}>
                  Sin recorrido disponible
                </Typography>

                <Typography color="text.secondary" textAlign="center">
                  Cuando la aplicación del repartidor sincronice puntos GPS, el
                  recorrido aparecerá automáticamente aquí.
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* RECORRIDO */}

        {!loading && !error && route && validPoints.length > 0 && (
          <Stack spacing={2}>
            {/* RESUMEN */}

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              flexWrap="wrap"
            >
              <Chip
                icon={<TimelineIcon />}
                label={`${validPoints.length.toLocaleString(
                  "es-AR",
                )} puntos GPS`}
              />

              <Chip
                icon={<SpeedIcon />}
                label={`Máxima: ${formatSpeed(route.summary?.max_speed_kmh)}`}
              />

              <Chip
                icon={<RouteIcon />}
                label={`Odómetro: ${formatKm(route.shift?.total_distance_km)}`}
              />

              {route.shift?.vehicle && (
                <Chip
                  label={`${route.shift.vehicle.plate} · ${route.shift.vehicle.brand} ${route.shift.vehicle.model}`}
                />
              )}

              {route.shift?.driver && (
                <Chip label={route.shift.driver.full_name} />
              )}
            </Stack>

            {/* MAPA */}

            <Paper
              variant="outlined"
              sx={{
                height: {
                  xs: 500,
                  md: 620,
                },

                width: "100%",

                borderRadius: 3,

                overflow: "hidden",
              }}
            >
              <MapContainer
                center={initialCenter}
                zoom={13}
                scrollWheelZoom
                style={{
                  height: "100%",
                  width: "100%",
                }}
              >
                {/*
                 * OpenStreetMap.
                 */}

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* AJUSTE AUTOMÁTICO */}

                <FitRouteBounds points={validPoints} />

                {/* RECORRIDO */}

                {polylinePositions.length >= 2 && (
                  <Polyline
                    positions={polylinePositions}
                    pathOptions={{
                      weight: 5,
                      opacity: 0.8,
                    }}
                  />
                )}

                {/* INICIO */}

                {startPoint && (
                  <CircleMarker
                    center={[
                      Number(startPoint.latitude),
                      Number(startPoint.longitude),
                    ]}
                    radius={9}
                    pathOptions={{
                      color: "#2e7d32",
                      fillColor: "#2e7d32",
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <RoutePointPopup
                        point={startPoint}
                        title="Inicio del recorrido"
                      />
                    </Popup>
                  </CircleMarker>
                )}

                {/* FIN */}

                {endPoint && (
                  <CircleMarker
                    center={[
                      Number(endPoint.latitude),
                      Number(endPoint.longitude),
                    ]}
                    radius={9}
                    pathOptions={{
                      color: "#d32f2f",
                      fillColor: "#d32f2f",
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <RoutePointPopup
                        point={endPoint}
                        title="Fin del recorrido"
                      />
                    </Popup>
                  </CircleMarker>
                )}
              </MapContainer>
            </Paper>

            {/* INFORMACIÓN */}

            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,

                  borderRadius: 2,

                  flex: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOnIcon color="success" />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Inicio GPS
                    </Typography>

                    <Typography fontWeight={800}>
                      {formatDateTime(route.summary?.first_recorded_at)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 2,

                  borderRadius: 2,

                  flex: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <FlagIcon color="error" />

                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Último punto GPS
                    </Typography>

                    <Typography fontWeight={800}>
                      {formatDateTime(route.summary?.last_recorded_at)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
