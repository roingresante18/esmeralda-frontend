import { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FlagIcon from "@mui/icons-material/Flag";
import SpeedIcon from "@mui/icons-material/Speed";
import RouteIcon from "@mui/icons-material/Route";
import TimelineIcon from "@mui/icons-material/Timeline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import LayersIcon from "@mui/icons-material/Layers";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MapIcon from "@mui/icons-material/Map";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import TerrainIcon from "@mui/icons-material/Terrain";

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

import { getShiftTelemetryEvents } from "../api/telemetry-audit.api";

import type {
  ShiftDeliveryResultStatus,
  ShiftRouteDelivery,
  ShiftRoutePoint,
  ShiftRouteResponse,
} from "../types/telemetry.types";

import type {
  TelemetryAuditEvent,
  TelemetryAuditEventType,
} from "../types/telemetry-audit.types";

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
 * CONSTANTES
 * =========================================================
 *
 * Si entre dos puntos consecutivos transcurren 120 segundos
 * o más, NO dibujamos una línea entre ambos.
 *
 * Así evitamos inventar un trayecto que no conocemos.
 */

const DEFAULT_GAP_SECONDS = 120;

/*
 * =========================================================
 * SEGMENTO DE RECORRIDO
 * =========================================================
 */

interface RouteSegment {
  id: string;

  points: ShiftRoutePoint[];
}

/*
 * =========================================================
 * MARCADOR DE INCIDENTE
 * =========================================================
 */

interface IncidentMapMarker {
  id: string;

  event: TelemetryAuditEvent;

  latitude: number;

  longitude: number;

  /*
   * true:
   * coordenada provista directamente por el evento.
   *
   * false:
   * usamos el último punto de telemetría conocido anterior.
   */
  exactLocation: boolean;
}

/*
 * =========================================================
 * FORMATO FECHA / HORA
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
 * KILÓMETROS
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
 * VELOCIDAD
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
 * PRECISIÓN GPS
 * =========================================================
 */

function formatAccuracy(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })} m`;
}

/*
 * =========================================================
 * VALIDAR PUNTO DE TELEMETRÍA
 * =========================================================
 */

function isValidPoint(point: ShiftRoutePoint): boolean {
  const latitude = Number(point.latitude);

  const longitude = Number(point.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/*
 * =========================================================
 * VALIDAR GPS DE ENTREGA
 * =========================================================
 */

function isValidDeliveryPoint(delivery: ShiftRouteDelivery): boolean {
  const latitude = Number(delivery.latitude);

  const longitude = Number(delivery.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/*
 * =========================================================
 * VALIDAR GPS DE EVENTO
 * =========================================================
 */

function hasValidEventCoordinates(event: TelemetryAuditEvent): boolean {
  if (event.latitude == null || event.longitude == null) {
    return false;
  }

  const latitude = Number(event.latitude);

  const longitude = Number(event.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/*
 * =========================================================
 * ESTADO DEL INTENTO
 * =========================================================
 */

function getDeliveryStatusLabel(status: ShiftDeliveryResultStatus): string {
  switch (status) {
    case "DELIVERED":
      return "Entregado";

    case "PARTIAL_DELIVERED":
      return "Entrega parcial";

    case "RESCHEDULED":
      return "Reprogramado";

    case "NOT_DELIVERED":
      return "No entregado";

    default:
      return status;
  }
}

/*
 * =========================================================
 * COLOR DEL MARCADOR DE ENTREGA
 * =========================================================
 */

function getDeliveryMarkerColor(status: ShiftDeliveryResultStatus): string {
  switch (status) {
    case "DELIVERED":
      return "#2e7d32";

    case "PARTIAL_DELIVERED":
      return "#ed6c02";

    case "RESCHEDULED":
      return "#0288d1";

    case "NOT_DELIVERED":
      return "#d32f2f";

    default:
      return "#616161";
  }
}

/*
 * =========================================================
 * PRESENTACIÓN DE INCIDENTES
 * =========================================================
 */

function getIncidentPresentation(eventType: TelemetryAuditEventType): {
  label: string;
  color: string;
  fillColor: string;
  icon: React.ReactNode;
} {
  switch (eventType) {
    case "GPS_DISABLED":
      return {
        label: "GPS desactivado",
        color: "#b71c1c",
        fillColor: "#d32f2f",
        icon: <GpsOffIcon fontSize="small" />,
      };

    case "GPS_RESTORED":
      return {
        label: "GPS restaurado",
        color: "#1b5e20",
        fillColor: "#2e7d32",
        icon: <GpsFixedIcon fontSize="small" />,
      };

    case "LOCATION_PERMISSION_REVOKED":
      return {
        label: "Permiso de ubicación revocado",
        color: "#b71c1c",
        fillColor: "#d32f2f",
        icon: <GpsOffIcon fontSize="small" />,
      };

    case "LOCATION_PERMISSION_RESTORED":
      return {
        label: "Permiso de ubicación restaurado",
        color: "#1b5e20",
        fillColor: "#2e7d32",
        icon: <GpsFixedIcon fontSize="small" />,
      };

    case "TRACKING_STOPPED_UNEXPECTEDLY":
      return {
        label: "Tracking detenido",
        color: "#e65100",
        fillColor: "#ed6c02",
        icon: <WarningAmberIcon fontSize="small" />,
      };

    case "TRACKING_RESTORED":
      return {
        label: "Tracking restaurado",
        color: "#1b5e20",
        fillColor: "#2e7d32",
        icon: <RouteIcon fontSize="small" />,
      };

    case "APP_LOCKED":
      return {
        label: "App bloqueada",
        color: "#e65100",
        fillColor: "#ed6c02",
        icon: <LockIcon fontSize="small" />,
      };

    case "APP_UNLOCKED":
      return {
        label: "App desbloqueada",
        color: "#1b5e20",
        fillColor: "#2e7d32",
        icon: <LockOpenIcon fontSize="small" />,
      };

    case "APP_FOREGROUND":
      return {
        label: "App en primer plano",
        color: "#01579b",
        fillColor: "#0288d1",
        icon: <PhoneAndroidIcon fontSize="small" />,
      };

    case "APP_BACKGROUND":
      return {
        label: "App en segundo plano",
        color: "#424242",
        fillColor: "#757575",
        icon: <PhoneAndroidIcon fontSize="small" />,
      };

    case "TELEMETRY_GAP_DETECTED":
      return {
        label: "Hueco de telemetría",
        color: "#e65100",
        fillColor: "#ff9800",
        icon: <WarningAmberIcon fontSize="small" />,
      };

    default:
      return {
        label: eventType,
        color: "#424242",
        fillColor: "#757575",
        icon: <TimelineIcon fontSize="small" />,
      };
  }
}

/*
 * =========================================================
 * ÚLTIMO PUNTO CONOCIDO ANTES DE UN EVENTO
 * =========================================================
 *
 * Se usa cuando un incidente NO posee coordenadas propias.
 *
 * Ejemplo:
 *
 * GPS_DISABLED puede llegar sin lat/lng precisamente porque
 * el servicio de ubicación ya estaba apagado.
 *
 * En ese caso mostramos el último punto conocido anterior,
 * pero el popup deja explícito que es una ubicación
 * aproximada y NO la ubicación exacta del incidente.
 */

function findLastPointBefore(
  points: ShiftRoutePoint[],
  timestamp: string,
): ShiftRoutePoint | null {
  const targetTime = new Date(timestamp).getTime();

  if (!Number.isFinite(targetTime)) {
    return null;
  }

  let candidate: ShiftRoutePoint | null = null;

  for (const point of points) {
    const pointTime = new Date(point.recorded_at).getTime();

    if (!Number.isFinite(pointTime) || pointTime > targetTime) {
      break;
    }

    candidate = point;
  }

  return candidate;
}

/*
 * =========================================================
 * SEGMENTAR RECORRIDO
 * =========================================================
 *
 * Cortamos la polilínea cuando:
 *
 * 1. entre dos puntos hay >= DEFAULT_GAP_SECONDS;
 *
 * o
 *
 * 2. existe TELEMETRY_GAP_DETECTED cuyo intervalo coincide
 *    con esos dos puntos.
 *
 * La primera regla permite funcionar aun si todavía no se
 * sincronizó el evento de auditoría.
 */

function buildRouteSegments(
  points: ShiftRoutePoint[],
  telemetryEvents: TelemetryAuditEvent[],
): RouteSegment[] {
  if (points.length === 0) {
    return [];
  }

  const gapEvents = telemetryEvents.filter(
    (event) => event.event_type === "TELEMETRY_GAP_DETECTED",
  );

  const explicitGapKeys = new Set<string>();

  for (const event of gapEvents) {
    const metadata = event.metadata;

    const gapStart =
      metadata && typeof metadata.gap_start === "string"
        ? metadata.gap_start
        : null;

    const gapEnd =
      metadata && typeof metadata.gap_end === "string"
        ? metadata.gap_end
        : null;

    if (gapStart && gapEnd) {
      explicitGapKeys.add(`${gapStart}|${gapEnd}`);
    }
  }

  const segments: RouteSegment[] = [];

  let current: ShiftRoutePoint[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];

    const currentPoint = points[index];

    const previousTime = new Date(previous.recorded_at).getTime();

    const currentTime = new Date(currentPoint.recorded_at).getTime();

    const gapSeconds =
      Number.isFinite(previousTime) && Number.isFinite(currentTime)
        ? Math.max(0, (currentTime - previousTime) / 1000)
        : 0;

    const explicitGap = explicitGapKeys.has(
      `${previous.recorded_at}|${currentPoint.recorded_at}`,
    );

    const shouldBreak = gapSeconds >= DEFAULT_GAP_SECONDS || explicitGap;

    if (shouldBreak) {
      if (current.length > 0) {
        segments.push({
          id: `segment-${segments.length}-${current[0].id}`,
          points: current,
        });
      }

      current = [currentPoint];

      continue;
    }

    current.push(currentPoint);
  }

  if (current.length > 0) {
    segments.push({
      id: `segment-${segments.length}-${current[0].id}`,
      points: current,
    });
  }

  return segments;
}

/*
 * =========================================================
 * AJUSTAR MAPA
 * =========================================================
 *
 * Consideramos:
 *
 * - recorrido;
 * - puntos de entrega;
 * - incidentes con ubicación conocida/aproximada.
 */

function FitRouteBounds({
  points,
  deliveries,
  incidents,
}: {
  points: ShiftRoutePoint[];

  deliveries: ShiftRouteDelivery[];

  incidents: IncidentMapMarker[];
}) {
  const map = useMap();

  useEffect(() => {
    /*
     * =====================================================
     * VIEWPORT SEGURO
     * =====================================================
     *
     * IMPORTANTE:
     *
     * No utilizamos map.fitBounds().
     *
     * En algunas combinaciones de Leaflet + React 19 +
     * Dialog redimensionable, fitBounds puede calcular
     * temporalmente zoom = Infinity y provocar:
     *
     * "Attempted to load an infinite number of tiles"
     *
     * En su lugar calculamos nosotros:
     *
     * - centro geográfico aproximado;
     * - zoom finito según la amplitud del recorrido.
     */

    const rawCoordinates: [number, number][] = [
      ...points.map((point): [number, number] => [
        Number(point.latitude),
        Number(point.longitude),
      ]),

      ...deliveries.map((delivery): [number, number] => [
        Number(delivery.latitude),
        Number(delivery.longitude),
      ]),

      ...incidents.map((incident): [number, number] => [
        Number(incident.latitude),
        Number(incident.longitude),
      ]),
    ];

    const validCoordinates = rawCoordinates.filter(
      ([latitude, longitude]) =>
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180,
    );

    if (validCoordinates.length === 0) {
      return;
    }

    /*
     * Eliminamos duplicados para evitar cálculos inútiles.
     */
    const uniqueCoordinates = Array.from(
      new Map(
        validCoordinates.map(([latitude, longitude]) => [
          `${latitude.toFixed(7)}|${longitude.toFixed(7)}`,
          [latitude, longitude] as [number, number],
        ]),
      ).values(),
    );

    const latitudes = uniqueCoordinates.map(([latitude]) => latitude);

    const longitudes = uniqueCoordinates.map(([, longitude]) => longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const center: [number, number] = [
      (minLat + maxLat) / 2,
      (minLng + maxLng) / 2,
    ];

    const latitudeSpan = Math.abs(maxLat - minLat);
    const longitudeSpan = Math.abs(maxLng - minLng);

    const span = Math.max(latitudeSpan, longitudeSpan);

    /*
     * Zoom aproximado y SIEMPRE finito.
     *
     * Para reparto urbano normalmente estaremos entre
     * zoom 13 y 16.
     */
    let zoom = 13;

    if (uniqueCoordinates.length === 1 || span < 0.0008) {
      zoom = 17;
    } else if (span < 0.002) {
      zoom = 16;
    } else if (span < 0.006) {
      zoom = 15;
    } else if (span < 0.02) {
      zoom = 14;
    } else if (span < 0.06) {
      zoom = 13;
    } else if (span < 0.15) {
      zoom = 12;
    } else if (span < 0.4) {
      zoom = 11;
    } else if (span < 1) {
      zoom = 9;
    } else {
      zoom = 7;
    }

    /*
     * Defensa absoluta.
     */
    if (!Number.isFinite(zoom)) {
      zoom = 13;
    }

    zoom = Math.max(3, Math.min(18, zoom));

    let cancelled = false;

    const timeout = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      try {
        /*
         * Primero fijamos explícitamente un zoom válido.
         *
         * Esto evita que Leaflet conserve un zoom Infinity
         * de un cálculo previo fallido.
         */
        map.setView(center, zoom, {
          animate: false,
        });

        /*
         * Después recalculamos el canvas.
         *
         * debounceMoveend evita disparos innecesarios.
         */
        map.invalidateSize({
          animate: false,
          debounceMoveend: true,
        });
      } catch (error) {
        console.error("[LOGISTICS][SHIFT_ROUTE][SAFE_VIEWPORT]", error);
      }
    }, 180);

    return () => {
      cancelled = true;

      window.clearTimeout(timeout);
    };
  }, [map, points, deliveries, incidents]);

  return null;
}

/*
 * =========================================================
 * POPUP DE TELEMETRÍA
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

      <Typography variant="body2">
        Precisión: {formatAccuracy(point.accuracy)}
      </Typography>
    </Stack>
  );
}

/*
 * =========================================================
 * POPUP DE ENTREGA
 * =========================================================
 */

function DeliveryPopup({ delivery }: { delivery: ShiftRouteDelivery }) {
  return (
    <Stack
      spacing={0.75}
      sx={{
        minWidth: 230,
      }}
    >
      <Typography fontWeight={900}>Pedido #{delivery.order_id}</Typography>

      <Chip
        size="small"
        label={getDeliveryStatusLabel(delivery.result_status)}
        sx={{
          alignSelf: "flex-start",

          color: "#fff",

          bgcolor: getDeliveryMarkerColor(delivery.result_status),

          fontWeight: 800,
        }}
      />

      <Divider />

      <Typography variant="body2">
        <strong>Cliente:</strong> {delivery.client_name || "—"}
      </Typography>

      <Typography variant="body2">
        <strong>Intento:</strong> #{delivery.attempt_number}
      </Typography>

      <Typography variant="body2">
        <strong>Fecha:</strong>{" "}
        {formatDateTime(delivery.location_recorded_at ?? delivery.attempted_at)}
      </Typography>

      <Typography variant="body2">
        <strong>Precisión GPS:</strong> {formatAccuracy(delivery.accuracy)}
      </Typography>

      <Typography variant="body2">
        <strong>Latitud:</strong> {Number(delivery.latitude).toFixed(7)}
      </Typography>

      <Typography variant="body2">
        <strong>Longitud:</strong> {Number(delivery.longitude).toFixed(7)}
      </Typography>

      {delivery.notes && (
        <>
          <Divider />

          <Typography variant="body2">
            <strong>Observación:</strong> {delivery.notes}
          </Typography>
        </>
      )}
    </Stack>
  );
}

/*
 * =========================================================
 * POPUP DE INCIDENTE
 * =========================================================
 */

function IncidentPopup({ incident }: { incident: IncidentMapMarker }) {
  const presentation = getIncidentPresentation(incident.event.event_type);

  const durationMinutes =
    incident.event.metadata &&
    typeof incident.event.metadata.duration_minutes === "number"
      ? incident.event.metadata.duration_minutes
      : null;

  const orderId =
    incident.event.metadata &&
    typeof incident.event.metadata.order_id === "number"
      ? incident.event.metadata.order_id
      : null;

  return (
    <Stack
      spacing={0.75}
      sx={{
        minWidth: 245,
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center">
        {presentation.icon}

        <Typography fontWeight={900}>{presentation.label}</Typography>
      </Stack>

      <Divider />

      <Typography variant="body2">
        <strong>Fecha:</strong> {formatDateTime(incident.event.recorded_at)}
      </Typography>

      {incident.event.message && (
        <Typography variant="body2">
          <strong>Detalle:</strong> {incident.event.message}
        </Typography>
      )}

      {orderId != null && (
        <Typography variant="body2">
          <strong>Pedido relacionado:</strong> #{orderId}
        </Typography>
      )}

      {durationMinutes != null && (
        <Typography variant="body2">
          <strong>Duración del hueco:</strong>{" "}
          {Number(durationMinutes).toLocaleString("es-AR", {
            maximumFractionDigits: 2,
          })}{" "}
          min
        </Typography>
      )}

      <Typography variant="body2">
        <strong>Latitud:</strong> {incident.latitude.toFixed(7)}
      </Typography>

      <Typography variant="body2">
        <strong>Longitud:</strong> {incident.longitude.toFixed(7)}
      </Typography>

      {incident.event.accuracy != null && incident.exactLocation && (
        <Typography variant="body2">
          <strong>Precisión:</strong> {formatAccuracy(incident.event.accuracy)}
        </Typography>
      )}

      {!incident.exactLocation && (
        <Alert
          severity="warning"
          sx={{
            mt: 0.5,
          }}
        >
          Ubicación aproximada: se muestra el último punto GPS conocido antes
          del incidente. No representa la posición exacta donde ocurrió.
        </Alert>
      )}
    </Stack>
  );
}

/*
 * =========================================================
 * CAPAS BASE DEL MAPA
 * =========================================================
 */

type BaseMapType = "STREETS" | "SATELLITE" | "TERRAIN";

const BASE_MAPS: Record<
  BaseMapType,
  {
    label: string;
    url: string;
    attribution: string;
    maxZoom?: number;
  }
> = {
  STREETS: {
    label: "Calles",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  },

  SATELLITE: {
    label: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
  },

  TERRAIN: {
    label: "Relieve",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      "Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap",
    maxZoom: 17,
  },
};

/*
 * =========================================================
 * INVALIDAR TAMAÑO DE LEAFLET
 * =========================================================
 *
 * Cuando el Dialog entra o sale de pantalla completa,
 * Leaflet necesita recalcular el tamaño disponible.
 */

function RefreshMapSize({ dependency }: { dependency: string | boolean }) {
  const map = useMap();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const currentZoom = map.getZoom();

        /*
         * Si una ejecución anterior dejó un zoom inválido,
         * lo normalizamos ANTES de recalcular el tamaño.
         */
        if (!Number.isFinite(currentZoom)) {
          map.setZoom(13, {
            animate: false,
          });
        }

        map.invalidateSize({
          animate: false,
          debounceMoveend: true,
        });
      } catch (error) {
        console.error("[LOGISTICS][SHIFT_ROUTE][RESIZE]", error);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [map, dependency]);

  return null;
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

  const [telemetryEvents, setTelemetryEvents] = useState<TelemetryAuditEvent[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  /*
   * =======================================================
   * ESTADO VISUAL DEL MAPA
   * =======================================================
   */

  const [baseMap, setBaseMap] = useState<BaseMapType>("STREETS");
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [showRoute, setShowRoute] = useState(true);
  const [showDeliveries, setShowDeliveries] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showEndpoints, setShowEndpoints] = useState(true);

  /*
   * =======================================================
   * CARGAR RECORRIDO + AUDITORÍA
   * =======================================================
   */

  useEffect(() => {
    if (!open || shiftId == null) {
      return;
    }

    const currentShiftId = shiftId;
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        setEventsError(null);
        setRoute(null);
        setTelemetryEvents([]);

        const [routeResult, eventsResult] = await Promise.allSettled([
          getShiftRoute(currentShiftId),
          getShiftTelemetryEvents(currentShiftId),
        ]);

        if (cancelled) {
          return;
        }

        if (routeResult.status === "fulfilled") {
          setRoute(routeResult.value);
        } else {
          const backendMessage = routeResult.reason?.response?.data?.message;

          if (typeof backendMessage === "string") {
            setError(backendMessage);
          } else if (Array.isArray(backendMessage)) {
            setError(backendMessage.join("\n"));
          } else {
            setError("No se pudo cargar el recorrido de la jornada.");
          }
        }

        if (eventsResult.status === "fulfilled") {
          setTelemetryEvents(eventsResult.value);
        } else {
          console.error(
            "[LOGISTICS][SHIFT_ROUTE][EVENTS]",
            eventsResult.reason,
          );

          setEventsError(
            "El recorrido se cargó, pero no se pudieron obtener los incidentes de auditoría.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [open, shiftId]);

  /*
   * Al cerrar el Dialog salimos también del modo expandido.
   */
  useEffect(() => {
    if (!open) {
      setMapFullscreen(false);
      setDetailsOpen(false);
    }
  }, [open]);

  /*
   * =======================================================
   * DATOS NORMALIZADOS
   * =======================================================
   */

  const validPoints = useMemo(() => {
    return (route?.points ?? [])
      .filter(isValidPoint)
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      );
  }, [route]);

  const validDeliveries = useMemo(
    () => (route?.deliveries ?? []).filter(isValidDeliveryPoint),
    [route],
  );

  const routeSegments = useMemo(
    () => buildRouteSegments(validPoints, telemetryEvents),
    [validPoints, telemetryEvents],
  );

  const incidentMarkers = useMemo<IncidentMapMarker[]>(() => {
    const markers: IncidentMapMarker[] = [];

    for (const event of telemetryEvents) {
      if (hasValidEventCoordinates(event)) {
        markers.push({
          id: `incident-${event.id}`,
          event,
          latitude: Number(event.latitude),
          longitude: Number(event.longitude),
          exactLocation: true,
        });
        continue;
      }

      const lastKnownPoint = findLastPointBefore(
        validPoints,
        event.recorded_at,
      );

      if (!lastKnownPoint) {
        continue;
      }

      markers.push({
        id: `incident-${event.id}`,
        event,
        latitude: Number(lastKnownPoint.latitude),
        longitude: Number(lastKnownPoint.longitude),
        exactLocation: false,
      });
    }

    return markers;
  }, [telemetryEvents, validPoints]);

  const startPoint = validPoints.length > 0 ? validPoints[0] : null;

  const endPoint =
    validPoints.length > 1 ? validPoints[validPoints.length - 1] : null;

  const initialCenter = useMemo<LatLngExpression>(() => {
    if (startPoint) {
      return [Number(startPoint.latitude), Number(startPoint.longitude)];
    }

    if (validDeliveries.length > 0) {
      return [
        Number(validDeliveries[0].latitude),
        Number(validDeliveries[0].longitude),
      ];
    }

    if (incidentMarkers.length > 0) {
      return [incidentMarkers[0].latitude, incidentMarkers[0].longitude];
    }

    return [-38.4161, -63.6167];
  }, [startPoint, validDeliveries, incidentMarkers]);

  const deliveryCounters = useMemo(() => {
    return {
      delivered: validDeliveries.filter(
        (delivery) => delivery.result_status === "DELIVERED",
      ).length,

      partial: validDeliveries.filter(
        (delivery) => delivery.result_status === "PARTIAL_DELIVERED",
      ).length,

      rescheduled: validDeliveries.filter(
        (delivery) => delivery.result_status === "RESCHEDULED",
      ).length,

      notDelivered: validDeliveries.filter(
        (delivery) => delivery.result_status === "NOT_DELIVERED",
      ).length,
    };
  }, [validDeliveries]);

  const incidentCounters = useMemo(() => {
    return {
      gpsDisabled: telemetryEvents.filter(
        (event) => event.event_type === "GPS_DISABLED",
      ).length,

      gaps: telemetryEvents.filter(
        (event) => event.event_type === "TELEMETRY_GAP_DETECTED",
      ).length,

      trackingStopped: telemetryEvents.filter(
        (event) => event.event_type === "TRACKING_STOPPED_UNEXPECTEDLY",
      ).length,

      locked: telemetryEvents.filter(
        (event) => event.event_type === "APP_LOCKED",
      ).length,
    };
  }, [telemetryEvents]);

  const hasMapData =
    validPoints.length > 0 ||
    validDeliveries.length > 0 ||
    incidentMarkers.length > 0;

  const activeBaseMap = BASE_MAPS[baseMap];

  const sortedTelemetryEvents = useMemo(
    () =>
      [...telemetryEvents].sort(
        (a, b) =>
          new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
      ),
    [telemetryEvents],
  );

  /*
   * =======================================================
   * RENDER DEL MAPA
   * =======================================================
   */

  const mapContent =
    route && hasMapData ? (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 0,
          bgcolor: "grey.100",
        }}
      >
        <MapContainer
          center={initialCenter}
          zoom={13}
          minZoom={3}
          maxZoom={18}
          scrollWheelZoom
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            key={baseMap}
            attribution={activeBaseMap.attribution}
            url={activeBaseMap.url}
            maxZoom={activeBaseMap.maxZoom}
          />

          <RefreshMapSize
            dependency={`${mapFullscreen}-${detailsOpen}-${baseMap}`}
          />

          <FitRouteBounds
            points={validPoints}
            deliveries={showDeliveries ? validDeliveries : []}
            incidents={showIncidents ? incidentMarkers : []}
          />

          {showRoute &&
            routeSegments.map((segment) => {
              if (segment.points.length < 2) {
                return null;
              }

              const positions: LatLngExpression[] = segment.points.map(
                (point) => [Number(point.latitude), Number(point.longitude)],
              );

              return (
                <Polyline
                  key={segment.id}
                  positions={positions}
                  pathOptions={{
                    color: "#1976d2",
                    weight: 5,
                    opacity: 0.88,
                  }}
                />
              );
            })}

          {showEndpoints && startPoint && (
            <CircleMarker
              center={[
                Number(startPoint.latitude),
                Number(startPoint.longitude),
              ]}
              radius={10}
              pathOptions={{
                color: "#1b5e20",
                fillColor: "#2e7d32",
                fillOpacity: 1,
                weight: 3,
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

          {showEndpoints && endPoint && (
            <CircleMarker
              center={[Number(endPoint.latitude), Number(endPoint.longitude)]}
              radius={10}
              pathOptions={{
                color: "#8e0000",
                fillColor: "#d32f2f",
                fillOpacity: 1,
                weight: 3,
              }}
            >
              <Popup>
                <RoutePointPopup point={endPoint} title="Fin del recorrido" />
              </Popup>
            </CircleMarker>
          )}

          {showDeliveries &&
            validDeliveries.map((delivery) => {
              const color = getDeliveryMarkerColor(delivery.result_status);

              return (
                <CircleMarker
                  key={delivery.delivery_id}
                  center={[
                    Number(delivery.latitude),
                    Number(delivery.longitude),
                  ]}
                  radius={8}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.96,
                    weight: 3,
                  }}
                >
                  <Popup>
                    <DeliveryPopup delivery={delivery} />
                  </Popup>
                </CircleMarker>
              );
            })}

          {showIncidents &&
            incidentMarkers.map((incident) => {
              const presentation = getIncidentPresentation(
                incident.event.event_type,
              );

              return (
                <CircleMarker
                  key={incident.id}
                  center={[incident.latitude, incident.longitude]}
                  radius={
                    incident.event.event_type === "TELEMETRY_GAP_DETECTED"
                      ? 10
                      : 7
                  }
                  pathOptions={{
                    color: presentation.color,
                    fillColor: presentation.fillColor,
                    fillOpacity: incident.exactLocation ? 0.95 : 0.55,
                    weight: incident.exactLocation ? 3 : 2,
                    dashArray: incident.exactLocation ? undefined : "5 5",
                  }}
                >
                  <Popup>
                    <IncidentPopup incident={incident} />
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>

        {/* ===================================================
          SELECTOR DE MAPA BASE
          =================================================== */}

        <Paper
          elevation={8}
          sx={{
            position: "absolute",
            top: 14,
            left: 14,
            zIndex: 1000,
            p: 0.5,
            borderRadius: 2.5,
            bgcolor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
          }}
        >
          <ToggleButtonGroup
            exclusive
            size="small"
            value={baseMap}
            onChange={(_event, value: BaseMapType | null) => {
              if (value) {
                setBaseMap(value);
              }
            }}
            aria-label="Tipo de mapa"
          >
            <ToggleButton value="STREETS">
              <Tooltip title="Mapa de calles">
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <MapIcon fontSize="small" />
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Calles
                  </Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>

            <ToggleButton value="SATELLITE">
              <Tooltip title="Imagen satelital">
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <SatelliteAltIcon fontSize="small" />
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Satélite
                  </Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>

            <ToggleButton value="TERRAIN">
              <Tooltip title="Mapa topográfico / relieve">
                <Stack direction="row" spacing={0.6} alignItems="center">
                  <TerrainIcon fontSize="small" />
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Relieve
                  </Typography>
                </Stack>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {/* ===================================================
          ACCIONES DEL MAPA
          =================================================== */}

        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            zIndex: 1000,
          }}
        >
          <Tooltip title="Detalles y capas de información">
            <Button
              variant="contained"
              size="small"
              startIcon={<InfoOutlinedIcon />}
              onClick={() => setDetailsOpen((current) => !current)}
              sx={{
                bgcolor: "rgba(255,255,255,0.96)",
                color: "text.primary",
                boxShadow: 4,
                "&:hover": {
                  bgcolor: "background.paper",
                },
              }}
            >
              Detalles
            </Button>
          </Tooltip>

          <Tooltip
            title={
              mapFullscreen ? "Salir de pantalla completa" : "Expandir mapa"
            }
          >
            <IconButton
              onClick={() => setMapFullscreen((current) => !current)}
              sx={{
                bgcolor: "rgba(255,255,255,0.96)",
                boxShadow: 4,
                "&:hover": {
                  bgcolor: "background.paper",
                },
              }}
            >
              {mapFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Stack>

        {/* ===================================================
          PANEL LATERAL DE DETALLES
          =================================================== */}

        {detailsOpen && (
          <Paper
            elevation={10}
            sx={{
              position: "absolute",
              top: 66,
              right: 14,
              zIndex: 1000,
              width: { xs: "calc(100% - 28px)", sm: 330 },
              maxHeight: "calc(100% - 138px)",
              overflowY: "auto",
              borderRadius: 3,
              p: 2,
              bgcolor: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Stack spacing={2}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <LayersIcon color="primary" />
                  <Typography fontWeight={900}>Detalles del mapa</Typography>
                </Stack>

                <IconButton size="small" onClick={() => setDetailsOpen(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Divider />

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={800}
                >
                  CAPAS DE INFORMACIÓN
                </Typography>

                <Stack sx={{ mt: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showRoute}
                        onChange={(_event, checked) => setShowRoute(checked)}
                      />
                    }
                    label="Recorrido GPS"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={showDeliveries}
                        onChange={(_event, checked) =>
                          setShowDeliveries(checked)
                        }
                      />
                    }
                    label="Entregas"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={showIncidents}
                        onChange={(_event, checked) =>
                          setShowIncidents(checked)
                        }
                      />
                    }
                    label="Incidentes / auditoría"
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={showEndpoints}
                        onChange={(_event, checked) =>
                          setShowEndpoints(checked)
                        }
                      />
                    }
                    label="Inicio y fin"
                  />
                </Stack>
              </Box>

              <Divider />

              <Stack spacing={1}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={800}
                >
                  JORNADA
                </Typography>

                <Typography variant="body2">
                  <strong>Chofer:</strong>{" "}
                  {route.shift?.driver?.full_name || "—"}
                </Typography>

                <Typography variant="body2">
                  <strong>Vehículo:</strong>{" "}
                  {route.shift?.vehicle
                    ? `${route.shift.vehicle.plate} · ${route.shift.vehicle.brand} ${route.shift.vehicle.model}`
                    : "—"}
                </Typography>

                <Typography variant="body2">
                  <strong>Puntos GPS:</strong>{" "}
                  {validPoints.length.toLocaleString("es-AR")}
                </Typography>

                <Typography variant="body2">
                  <strong>Segmentos reales:</strong> {routeSegments.length}
                </Typography>

                <Typography variant="body2">
                  <strong>Velocidad máxima:</strong>{" "}
                  {formatSpeed(route.summary?.max_speed_kmh)}
                </Typography>

                <Typography variant="body2">
                  <strong>Odómetro:</strong>{" "}
                  {formatKm(route.shift?.total_distance_km)}
                </Typography>

                <Typography variant="body2">
                  <strong>Inicio GPS:</strong>{" "}
                  {formatDateTime(route.summary?.first_recorded_at)}
                </Typography>

                <Typography variant="body2">
                  <strong>Último GPS:</strong>{" "}
                  {formatDateTime(route.summary?.last_recorded_at)}
                </Typography>
              </Stack>

              <Alert severity="info">
                Los pedidos usan exclusivamente el GPS capturado en el intento
                de entrega. Los incidentes sin coordenadas propias se posicionan
                sobre el último punto conocido y se marcan como aproximados.
              </Alert>
            </Stack>
          </Paper>
        )}
      </Box>
    ) : null;

  /*
   * =======================================================
   * ACORDEONES INFERIORES
   * =======================================================
   */

  const accordions = route ? (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{
        width: "100%",
        alignItems: "flex-start",
      }}
    >
      <Accordion
        disableGutters
        sx={{
          flex: 1,
          width: "100%",
          borderRadius: "12px !important",
          overflow: "hidden",
          boxShadow: 2,
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <LocalShippingIcon color="primary" />
            <Typography fontWeight={900}>Entregas</Typography>
            <Chip size="small" label={validDeliveries.length} color="info" />
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                label={`Entregados: ${deliveryCounters.delivered}`}
                color="success"
              />
              <Chip
                size="small"
                label={`Parciales: ${deliveryCounters.partial}`}
                color="warning"
              />
              <Chip
                size="small"
                label={`Reprogramados: ${deliveryCounters.rescheduled}`}
                color="info"
              />
              <Chip
                size="small"
                label={`No entregados: ${deliveryCounters.notDelivered}`}
                color="error"
              />
            </Stack>

            <Divider />

            {validDeliveries.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay intentos con GPS registrados.
              </Typography>
            ) : (
              <Stack
                spacing={1}
                sx={{
                  maxHeight: 260,
                  overflowY: "auto",
                  pr: 0.5,
                }}
              >
                {validDeliveries.map((delivery) => (
                  <Paper
                    key={delivery.delivery_id}
                    variant="outlined"
                    sx={{ p: 1.25, borderRadius: 2 }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={800}>
                          Pedido #{delivery.order_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {delivery.client_name || "—"} · Intento #
                          {delivery.attempt_number}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={getDeliveryStatusLabel(delivery.result_status)}
                        sx={{
                          color: "#fff",
                          bgcolor: getDeliveryMarkerColor(
                            delivery.result_status,
                          ),
                        }}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion
        disableGutters
        sx={{
          flex: 1,
          width: "100%",
          borderRadius: "12px !important",
          overflow: "hidden",
          boxShadow: 2,
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <WarningAmberIcon color="warning" />
            <Typography fontWeight={900}>Incidentes y auditoría</Typography>
            <Chip
              size="small"
              label={telemetryEvents.length}
              color={telemetryEvents.length > 0 ? "warning" : "default"}
            />
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                size="small"
                icon={<GpsOffIcon />}
                label={`GPS apagado: ${incidentCounters.gpsDisabled}`}
                color={incidentCounters.gpsDisabled > 0 ? "error" : "default"}
              />
              <Chip
                size="small"
                label={`Huecos: ${incidentCounters.gaps}`}
                color={incidentCounters.gaps > 0 ? "warning" : "default"}
              />
              <Chip
                size="small"
                label={`Tracking detenido: ${incidentCounters.trackingStopped}`}
                color={
                  incidentCounters.trackingStopped > 0 ? "warning" : "default"
                }
              />
              <Chip
                size="small"
                label={`Bloqueos: ${incidentCounters.locked}`}
                color={incidentCounters.locked > 0 ? "warning" : "default"}
              />
            </Stack>

            <Divider />

            {eventsError && <Alert severity="warning">{eventsError}</Alert>}

            {sortedTelemetryEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No hay eventos de auditoría registrados.
              </Typography>
            ) : (
              <Stack
                spacing={1}
                sx={{
                  maxHeight: 260,
                  overflowY: "auto",
                  pr: 0.5,
                }}
              >
                {sortedTelemetryEvents.map((event) => {
                  const presentation = getIncidentPresentation(
                    event.event_type,
                  );

                  return (
                    <Paper
                      key={event.id}
                      variant="outlined"
                      sx={{ p: 1.25, borderRadius: 2 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                      >
                        <Box
                          sx={{
                            mt: 0.15,
                            color: presentation.color,
                            display: "flex",
                          }}
                        >
                          {presentation.icon}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={800}>
                            {presentation.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(event.recorded_at)}
                          </Typography>
                          {event.message && (
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mt: 0.35 }}
                            >
                              {event.message}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  ) : null;

  /*
   * =======================================================
   * RENDER GENERAL
   * =======================================================
   */

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      fullScreen={mapFullscreen}
      PaperProps={{
        sx: {
          borderRadius: mapFullscreen ? 0 : 3,
          overflow: "hidden",
          height: mapFullscreen ? "100vh" : { xs: "94vh", md: "92vh" },
        },
      }}
    >
      <DialogTitle
        sx={{
          py: mapFullscreen ? 1.25 : 1.75,
          px: { xs: 1.5, sm: 2.5 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1.5}
        >
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            minWidth={0}
          >
            <RouteIcon color="primary" />

            <Box minWidth={0}>
              <Typography
                variant={mapFullscreen ? "h6" : "h5"}
                fontWeight={900}
                noWrap
              >
                Jornada {shiftId ? `#${shiftId}` : ""}
              </Typography>

              {route && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {route.shift?.driver?.full_name || "Chofer"}
                  {route.shift?.vehicle?.plate
                    ? ` · ${route.shift.vehicle.plate}`
                    : ""}
                  {validPoints.length > 0
                    ? ` · ${validPoints.length.toLocaleString("es-AR")} puntos GPS`
                    : ""}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip
              title={
                mapFullscreen ? "Salir de pantalla completa" : "Expandir mapa"
              }
            >
              <IconButton
                onClick={() => setMapFullscreen((current) => !current)}
              >
                {mapFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </Tooltip>

            <IconButton onClick={onClose} aria-label="Cerrar">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          p: mapFullscreen ? 0 : { xs: 1.25, md: 2 },
          display: "flex",
          flexDirection: "column",
          gap: mapFullscreen ? 0 : 1.5,
          minHeight: 0,
          overflow: mapFullscreen ? "hidden" : "auto",
        }}
      >
        {loading && (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ flex: 1, minHeight: 420 }}
          >
            <CircularProgress />
            <Typography color="text.secondary">
              Cargando recorrido y auditoría...
            </Typography>
          </Stack>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && route && !hasMapData && (
          <Paper
            variant="outlined"
            sx={{
              p: 4,
              minHeight: 420,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
            }}
          >
            <Stack alignItems="center" spacing={1.5}>
              <LocationOnIcon color="disabled" sx={{ fontSize: 58 }} />
              <Typography variant="h6" fontWeight={800}>
                Sin recorrido disponible
              </Typography>
              <Typography
                color="text.secondary"
                textAlign="center"
                maxWidth={600}
              >
                Esta jornada todavía no posee telemetría GPS, intentos de
                entrega ni incidentes con ubicación.
              </Typography>
            </Stack>
          </Paper>
        )}

        {!loading && !error && route && hasMapData && (
          <>
            <Paper
              variant={mapFullscreen ? undefined : "outlined"}
              elevation={mapFullscreen ? 0 : undefined}
              sx={{
                width: "100%",
                flex: mapFullscreen ? 1 : "0 0 auto",
                height: mapFullscreen ? "100%" : { xs: "68vh", md: "70vh" },
                minHeight: mapFullscreen ? 0 : 520,
                borderRadius: mapFullscreen ? 0 : 3,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {mapContent}

              {/* En pantalla completa los acordeones flotan sobre el mapa. */}
              {mapFullscreen && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 14,
                    right: 14,
                    bottom: 14,
                    zIndex: 1000,
                    maxWidth: 1000,
                    mx: "auto",
                    pointerEvents: "auto",
                  }}
                >
                  {accordions}
                </Box>
              )}
            </Paper>

            {!mapFullscreen && accordions}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
