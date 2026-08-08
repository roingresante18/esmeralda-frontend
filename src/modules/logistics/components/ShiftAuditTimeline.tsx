import { useMemo, useState } from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import HistoryIcon from "@mui/icons-material/History";
import GpsOffIcon from "@mui/icons-material/GpsOff";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import EditIcon from "@mui/icons-material/Edit";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import RouteIcon from "@mui/icons-material/Route";
import FlagIcon from "@mui/icons-material/Flag";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import type {
  DriverShift,
  DriverShiftEvent,
  DriverShiftHistory,
} from "../types/shift.types";

import type { ShiftRouteDelivery } from "../types/telemetry.types";

import type {
  TelemetryAuditEvent,
  TelemetryAuditEventType,
} from "../types/telemetry-audit.types";

/*
 * =========================================================
 * EVENTO UNIFICADO
 * =========================================================
 */

type UnifiedAuditCategory = "SHIFT" | "ADMIN" | "TELEMETRY" | "DELIVERY";

type AuditFilter = "ALL" | "INCIDENTS" | UnifiedAuditCategory;

interface UnifiedAuditEvent {
  id: string;

  occurredAt: string;

  category: UnifiedAuditCategory;

  title: string;

  description?: string | null;

  actor?: string | null;

  severity: "default" | "info" | "success" | "warning" | "error";

  icon: React.ReactNode;

  details?: string[];
}

/*
 * =========================================================
 * PROPS
 * =========================================================
 */

interface ShiftAuditTimelineProps {
  shift: DriverShift;

  administrativeHistory: DriverShiftHistory[];

  operationalEvents: DriverShiftEvent[];

  telemetryEvents: TelemetryAuditEvent[];

  deliveries: ShiftRouteDelivery[];

  loading?: boolean;

  telemetryError?: string | null;
}

/*
 * =========================================================
 * FORMATOS
 * =========================================================
 */

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-AR");
}

function formatAccuracy(value?: number | null): string {
  if (value == null || !Number.isFinite(Number(value))) {
    return "—";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 1,
  })} m`;
}

/*
 * =========================================================
 * ACTOR
 * =========================================================
 */

function getActorName(
  user:
    | {
        full_name?: string | null;
        email?: string | null;
      }
    | null
    | undefined,
): string | null {
  return user?.full_name || user?.email || null;
}

/*
 * =========================================================
 * ETIQUETAS
 * =========================================================
 */

function getCategoryLabel(category: UnifiedAuditCategory): string {
  switch (category) {
    case "SHIFT":
      return "Jornada";

    case "ADMIN":
      return "Administración";

    case "TELEMETRY":
      return "Telemetría";

    case "DELIVERY":
      return "Entrega";

    default:
      return category;
  }
}

function getDeliveryStatusLabel(status: string): string {
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
 * EVENTOS DE TELEMETRÍA
 * =========================================================
 */

function telemetryPresentation(
  eventType: TelemetryAuditEventType,
): Pick<UnifiedAuditEvent, "title" | "severity" | "icon"> {
  switch (eventType) {
    case "GPS_DISABLED":
      return {
        title: "GPS desactivado",
        severity: "error",
        icon: <GpsOffIcon />,
      };

    case "GPS_RESTORED":
      return {
        title: "GPS restaurado",
        severity: "success",
        icon: <GpsFixedIcon />,
      };

    case "LOCATION_PERMISSION_REVOKED":
      return {
        title: "Permiso de ubicación revocado",
        severity: "error",
        icon: <GpsOffIcon />,
      };

    case "LOCATION_PERMISSION_RESTORED":
      return {
        title: "Permiso de ubicación restaurado",
        severity: "success",
        icon: <GpsFixedIcon />,
      };

    case "TRACKING_STOPPED_UNEXPECTEDLY":
      return {
        title: "Tracking detenido inesperadamente",
        severity: "error",
        icon: <RouteIcon />,
      };

    case "TRACKING_RESTORED":
      return {
        title: "Tracking restaurado",
        severity: "success",
        icon: <RouteIcon />,
      };

    case "APP_LOCKED":
      return {
        title: "Aplicación bloqueada",
        severity: "warning",
        icon: <LockIcon />,
      };

    case "APP_UNLOCKED":
      return {
        title: "Aplicación desbloqueada",
        severity: "success",
        icon: <LockOpenIcon />,
      };

    case "APP_FOREGROUND":
      return {
        title: "App en primer plano",
        severity: "info",
        icon: <PhoneAndroidIcon />,
      };

    case "APP_BACKGROUND":
      return {
        title: "App en segundo plano",
        severity: "default",
        icon: <PhoneAndroidIcon />,
      };

    case "TELEMETRY_GAP_DETECTED":
      return {
        title: "Hueco de telemetría detectado",
        severity: "warning",
        icon: <WarningAmberIcon />,
      };

    default:
      return {
        title: eventType,
        severity: "default",
        icon: <HistoryIcon />,
      };
  }
}

/*
 * =========================================================
 * CONSTRUIR TIMELINE
 * =========================================================
 */

function buildUnifiedEvents({
  shift,
  administrativeHistory,
  operationalEvents,
  telemetryEvents,
  deliveries,
}: {
  shift: DriverShift;

  administrativeHistory: DriverShiftHistory[];

  operationalEvents: DriverShiftEvent[];

  telemetryEvents: TelemetryAuditEvent[];

  deliveries: ShiftRouteDelivery[];
}): UnifiedAuditEvent[] {
  const events: UnifiedAuditEvent[] = [];

  /*
   * =======================================================
   * CICLO DE VIDA DE JORNADA
   * =======================================================
   */

  if (shift.started_at) {
    events.push({
      id: `shift-start-${shift.id}`,

      occurredAt: shift.started_at,

      category: "SHIFT",

      title: "Jornada iniciada",

      description: `El repartidor inició la jornada con el vehículo ${shift.vehicle.plate}.`,

      actor: shift.driver?.full_name || shift.driver?.email || null,

      severity: "success",

      icon: <PlayCircleOutlineIcon />,

      details: [
        shift.start_odometer_km != null
          ? `Odómetro inicial: ${Number(shift.start_odometer_km).toLocaleString(
              "es-AR",
            )} km`
          : "",
      ].filter(Boolean),
    });
  }

  /*
   * =======================================================
   * HISTORIAL OPERATIVO COMPLETO
   * =======================================================
   *
   * fleet_driver_shift_events conserva TODOS los ciclos.
   *
   * Por ejemplo:
   *
   * 10:00 SUSPENDED
   * 10:20 RESUMED
   * 12:15 SUSPENDED
   * 12:40 RESUMED
   *
   * Si por compatibilidad una jornada antigua no posee
   * eventos, usamos suspended_at / resumed_at como fallback.
   */

  if (operationalEvents.length > 0) {
    for (const operationalEvent of operationalEvents) {
      if (operationalEvent.event_type === "SUSPENDED") {
        events.push({
          id: `shift-event-${operationalEvent.id}`,

          occurredAt: operationalEvent.created_at,

          category: "ADMIN",

          title: "Jornada suspendida",

          description:
            operationalEvent.reason ||
            "La jornada fue suspendida administrativamente.",

          actor: getActorName(operationalEvent.created_by),

          severity: "warning",

          icon: <PauseCircleOutlineIcon />,
        });

        continue;
      }

      if (operationalEvent.event_type === "RESUMED") {
        events.push({
          id: `shift-event-${operationalEvent.id}`,

          occurredAt: operationalEvent.created_at,

          category: "ADMIN",

          title: "Jornada reanudada",

          description:
            operationalEvent.reason ||
            "La jornada fue habilitada nuevamente para continuar el reparto.",

          actor: getActorName(operationalEvent.created_by),

          severity: "success",

          icon: <PlayCircleOutlineIcon />,
        });
      }
    }
  } else {
    /*
     * Fallback para datos históricos anteriores a
     * fleet_driver_shift_events.
     */

    if (shift.suspended_at) {
      events.push({
        id: `shift-suspended-${shift.id}-${shift.suspended_at}`,

        occurredAt: shift.suspended_at,

        category: "ADMIN",

        title: "Jornada suspendida",

        description:
          shift.suspension_reason ||
          "La jornada fue suspendida administrativamente.",

        actor: getActorName(shift.suspended_by),

        severity: "warning",

        icon: <PauseCircleOutlineIcon />,
      });
    }

    if (shift.resumed_at) {
      events.push({
        id: `shift-resumed-${shift.id}-${shift.resumed_at}`,

        occurredAt: shift.resumed_at,

        category: "ADMIN",

        title: "Jornada reanudada",

        description:
          "La jornada fue habilitada nuevamente para continuar el reparto.",

        actor: getActorName(shift.resumed_by),

        severity: "success",

        icon: <PlayCircleOutlineIcon />,
      });
    }
  }

  if (shift.cancelled_at) {
    events.push({
      id: `shift-cancelled-${shift.id}`,

      occurredAt: shift.cancelled_at,

      category: "ADMIN",

      title: "Jornada cancelada",

      description: shift.cancellation_reason || "La jornada fue cancelada.",

      actor: getActorName(shift.cancelled_by),

      severity: "error",

      icon: <WarningAmberIcon />,
    });
  }

  if (shift.ended_at) {
    events.push({
      id: `shift-end-${shift.id}`,

      occurredAt: shift.ended_at,

      category: "SHIFT",

      title: "Jornada finalizada",

      description: "El repartidor finalizó la jornada.",

      actor: shift.driver?.full_name || shift.driver?.email || null,

      severity: "info",

      icon: <FlagIcon />,

      details: [
        shift.end_odometer_km != null
          ? `Odómetro final: ${Number(shift.end_odometer_km).toLocaleString(
              "es-AR",
            )} km`
          : "",

        shift.total_distance_km != null
          ? `Recorrido: ${Number(shift.total_distance_km).toLocaleString(
              "es-AR",
            )} km`
          : "",
      ].filter(Boolean),
    });
  }

  /*
   * =======================================================
   * HISTORIAL ADMINISTRATIVO EXISTENTE
   * =======================================================
   */

  for (const history of administrativeHistory) {
    events.push({
      id: `admin-history-${history.id}`,

      occurredAt: history.created_at,

      category: "ADMIN",

      title:
        history.action === "UPDATED"
          ? "Jornada modificada"
          : String(history.action),

      description: history.comment || "Cambio administrativo registrado.",

      actor: getActorName(history.changed_by),

      severity: "info",

      icon: <EditIcon />,

      details:
        history.previous_scheduled_date !== history.new_scheduled_date
          ? [
              `Fecha: ${
                history.previous_scheduled_date || "—"
              } → ${history.new_scheduled_date || "—"}`,
            ]
          : undefined,
    });
  }

  /*
   * =======================================================
   * AUDITORÍA DE TELEMETRÍA
   * =======================================================
   */

  for (const event of telemetryEvents) {
    const presentation = telemetryPresentation(event.event_type);

    const details: string[] = [];

    if (event.latitude != null && event.longitude != null) {
      details.push(
        `GPS: ${Number(event.latitude).toFixed(6)}, ${Number(
          event.longitude,
        ).toFixed(6)}`,
      );
    }

    if (event.accuracy != null) {
      details.push(`Precisión: ${formatAccuracy(event.accuracy)}`);
    }

    const durationMinutes =
      event.metadata && typeof event.metadata.duration_minutes === "number"
        ? event.metadata.duration_minutes
        : null;

    if (durationMinutes != null) {
      details.push(
        `Duración del hueco: ${Number(durationMinutes).toLocaleString("es-AR", {
          maximumFractionDigits: 2,
        })} min`,
      );
    }

    const orderId =
      event.metadata && typeof event.metadata.order_id === "number"
        ? event.metadata.order_id
        : null;

    if (orderId != null) {
      details.push(`Pedido relacionado: #${orderId}`);
    }

    events.push({
      id: `telemetry-${event.id}`,

      occurredAt: event.recorded_at,

      category: "TELEMETRY",

      title: presentation.title,

      description: event.message || "Evento de auditoría de telemetría.",

      actor: `Repartidor #${event.driver_id}`,

      severity: presentation.severity,

      icon: presentation.icon,

      details,
    });
  }

  /*
   * =======================================================
   * INTENTOS DE ENTREGA
   * =======================================================
   */

  for (const delivery of deliveries) {
    const status = String(delivery.result_status || "");

    const successful = status === "DELIVERED";

    const partial = status === "PARTIAL_DELIVERED";

    const failed = status === "NOT_DELIVERED";

    events.push({
      id: `delivery-${delivery.delivery_id}`,

      occurredAt:
        delivery.location_recorded_at ||
        delivery.attempted_at ||
        delivery.delivered_at ||
        new Date(0).toISOString(),

      category: "DELIVERY",

      title: `${getDeliveryStatusLabel(status)} · Pedido #${delivery.order_id}`,

      description:
        delivery.notes ||
        `Intento #${delivery.attempt_number} registrado para ${delivery.client_name}.`,

      actor: shift.driver?.full_name || shift.driver?.email || null,

      severity: successful
        ? "success"
        : partial
          ? "warning"
          : failed
            ? "error"
            : "info",

      icon: <LocalShippingIcon />,

      details: [
        `Cliente: ${delivery.client_name || "—"}`,
        `Intento: #${delivery.attempt_number}`,
        `GPS: ${Number(delivery.latitude).toFixed(
          6,
        )}, ${Number(delivery.longitude).toFixed(6)}`,
        `Precisión: ${formatAccuracy(delivery.accuracy)}`,
      ],
    });
  }

  /*
   * =======================================================
   * ORDEN CRONOLÓGICO DESCENDENTE
   * =======================================================
   */

  return events
    .filter((event) => {
      const date = new Date(event.occurredAt);

      return !Number.isNaN(date.getTime());
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

/*
 * =========================================================
 * COMPONENTE
 * =========================================================
 */

export default function ShiftAuditTimeline({
  shift,
  administrativeHistory,
  operationalEvents,
  telemetryEvents,
  deliveries,
  loading = false,
  telemetryError = null,
}: ShiftAuditTimelineProps) {
  /*
   * =======================================================
   * ESTADO VISUAL
   * =======================================================
   *
   * La auditoría queda cerrada por defecto para no ocupar
   * demasiado espacio dentro del detalle de la jornada.
   */
  const [expanded, setExpanded] = useState(false);

  const [filter, setFilter] = useState<AuditFilter>("ALL");

  const events = useMemo(
    () =>
      buildUnifiedEvents({
        shift,
        administrativeHistory,
        operationalEvents,
        telemetryEvents,
        deliveries,
      }),
    [
      shift,
      administrativeHistory,
      operationalEvents,
      telemetryEvents,
      deliveries,
    ],
  );

  /*
   * =======================================================
   * CONTADORES
   * =======================================================
   */

  const telemetryIncidentCount = telemetryEvents.filter((event) =>
    [
      "GPS_DISABLED",
      "LOCATION_PERMISSION_REVOKED",
      "TRACKING_STOPPED_UNEXPECTEDLY",
      "APP_LOCKED",
      "TELEMETRY_GAP_DETECTED",
    ].includes(event.event_type),
  ).length;

  const suspensionCount = operationalEvents.filter(
    (event) => event.event_type === "SUSPENDED",
  ).length;

  const criticalEventCount = events.filter(
    (event) => event.severity === "error" || event.severity === "warning",
  ).length;

  /*
   * =======================================================
   * FILTRO VISUAL
   * =======================================================
   */

  const filteredEvents = useMemo(() => {
    if (filter === "ALL") {
      return events;
    }

    if (filter === "INCIDENTS") {
      return events.filter(
        (event) => event.severity === "error" || event.severity === "warning",
      );
    }

    return events.filter((event) => event.category === filter);
  }, [events, filter]);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_event, isExpanded) => {
        setExpanded(isExpanded);
      }}
      disableGutters
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: "12px !important",
        overflow: "hidden",
        boxShadow: "none",

        "&:before": {
          display: "none",
        },
      }}
    >
      {/* ===================================================
          CABECERA COMPACTA
          =================================================== */}

      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="shift-audit-content"
        id="shift-audit-header"
        sx={{
          px: {
            xs: 2,
            md: 3,
          },

          py: 0.75,

          minHeight: 72,

          "& .MuiAccordionSummary-content": {
            my: 1,
          },
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
          spacing={1.5}
          sx={{
            width: "100%",
            pr: 1,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <HistoryIcon color="primary" />

            <Box>
              <Typography variant="h6" fontWeight={900}>
                Auditoría de la jornada
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Cronología de administración, telemetría y entregas
              </Typography>
            </Box>
          </Stack>

          {/*
           * Estos indicadores siguen visibles aunque el
           * acordeón permanezca cerrado.
           */}
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`Eventos: ${events.length}`} />

            <Chip
              size="small"
              color={criticalEventCount > 0 ? "warning" : "success"}
              label={
                criticalEventCount > 0
                  ? `Alertas: ${criticalEventCount}`
                  : "Sin alertas"
              }
            />

            {telemetryIncidentCount > 0 && (
              <Chip
                size="small"
                color="error"
                variant="outlined"
                label={`GPS/telemetría: ${telemetryIncidentCount}`}
              />
            )}

            {suspensionCount > 0 && (
              <Chip
                size="small"
                color="warning"
                variant="outlined"
                label={`Suspensiones: ${suspensionCount}`}
              />
            )}
          </Stack>
        </Stack>
      </AccordionSummary>

      {/* ===================================================
          CONTENIDO DESPLEGABLE
          =================================================== */}

      <AccordionDetails
        id="shift-audit-content"
        sx={{
          px: {
            xs: 2,
            md: 3,
          },

          pb: 3,

          pt: 0,
        }}
      >
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={2.25}>
          {/* ===============================================
              FILTROS
              =============================================== */}

          <Stack
            direction={{
              xs: "column",
              lg: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              lg: "center",
            }}
            spacing={1.25}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={900}>
                Filtrar cronología
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Podés aislar rápidamente incidentes, administración o entregas.
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={filter}
              exclusive
              size="small"
              onChange={(_event, newFilter: AuditFilter | null) => {
                if (newFilter) {
                  setFilter(newFilter);
                }
              }}
              sx={{
                flexWrap: "wrap",
              }}
            >
              <ToggleButton value="ALL">Todos</ToggleButton>

              <ToggleButton value="INCIDENTS">Alertas</ToggleButton>

              <ToggleButton value="ADMIN">Administración</ToggleButton>

              <ToggleButton value="TELEMETRY">Telemetría</ToggleButton>

              <ToggleButton value="DELIVERY">Entregas</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* ===============================================
              RESUMEN SECUNDARIO
              =============================================== */}

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color="info"
              label={`Entregas GPS: ${deliveries.length}`}
            />

            <Chip size="small" label={`Mostrando: ${filteredEvents.length}`} />

            {filter !== "ALL" && (
              <Chip size="small" variant="outlined" label="Filtro activo" />
            )}
          </Stack>

          {telemetryError && <Alert severity="warning">{telemetryError}</Alert>}

          {/* ===============================================
              TIMELINE
              =============================================== */}

          {loading ? (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                py: 2,
              }}
            >
              <CircularProgress size={20} />

              <Typography color="text.secondary">
                Cargando auditoría...
              </Typography>
            </Stack>
          ) : filteredEvents.length === 0 ? (
            <Alert severity="info">
              No hay eventos para el filtro seleccionado.
            </Alert>
          ) : (
            <Stack spacing={0}>
              {filteredEvents.map((event, index) => (
                <Box
                  key={event.id}
                  sx={{
                    display: "grid",

                    gridTemplateColumns: {
                      xs: "36px 1fr",
                      sm: "44px 1fr",
                    },

                    columnGap: 1.5,
                  }}
                >
                  {/* COLUMNA VISUAL */}

                  <Stack
                    alignItems="center"
                    sx={{
                      minHeight: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: 34,

                        height: 34,

                        borderRadius: "50%",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        bgcolor:
                          event.severity === "error"
                            ? "error.light"
                            : event.severity === "warning"
                              ? "warning.light"
                              : event.severity === "success"
                                ? "success.light"
                                : event.severity === "info"
                                  ? "info.light"
                                  : "action.hover",

                        color:
                          event.severity === "error"
                            ? "error.dark"
                            : event.severity === "warning"
                              ? "warning.dark"
                              : event.severity === "success"
                                ? "success.dark"
                                : event.severity === "info"
                                  ? "info.dark"
                                  : "text.secondary",
                      }}
                    >
                      {event.icon}
                    </Box>

                    {index < filteredEvents.length - 1 && (
                      <Box
                        sx={{
                          width: 2,

                          flex: 1,

                          minHeight: 26,

                          bgcolor: "divider",
                        }}
                      />
                    )}
                  </Stack>

                  {/* CONTENIDO */}

                  <Box
                    sx={{
                      pb: index < filteredEvents.length - 1 ? 2 : 0,
                    }}
                  >
                    <Paper
                      variant="outlined"
                      sx={{
                        p: {
                          xs: 1.5,
                          md: 2,
                        },

                        borderRadius: 2,

                        /*
                         * Los incidentes importantes
                         * resaltan ligeramente sin saturar
                         * visualmente toda la pantalla.
                         */
                        borderColor:
                          event.severity === "error"
                            ? "error.light"
                            : event.severity === "warning"
                              ? "warning.light"
                              : "divider",
                      }}
                    >
                      <Stack spacing={1}>
                        <Stack
                          direction={{
                            xs: "column",
                            sm: "row",
                          }}
                          justifyContent="space-between"
                          alignItems={{
                            xs: "flex-start",
                            sm: "center",
                          }}
                          spacing={1}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                          >
                            <Typography fontWeight={900}>
                              {event.title}
                            </Typography>

                            <Chip
                              size="small"
                              variant="outlined"
                              label={getCategoryLabel(event.category)}
                            />
                          </Stack>

                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(event.occurredAt)}
                          </Typography>
                        </Stack>

                        {event.description && (
                          <Typography variant="body2">
                            {event.description}
                          </Typography>
                        )}

                        {event.actor && (
                          <Typography variant="caption" color="text.secondary">
                            Responsable/origen: {event.actor}
                          </Typography>
                        )}

                        {event.details && event.details.length > 0 && (
                          <>
                            <Divider />

                            <Stack spacing={0.35}>
                              {event.details.map((detail) => (
                                <Typography
                                  key={detail}
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {detail}
                                </Typography>
                              ))}
                            </Stack>
                          </>
                        )}
                      </Stack>
                    </Paper>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}

          {/* ===============================================
              ACLARACIÓN DE AUDITORÍA
              =============================================== */}

          <Alert severity="info">
            Los eventos técnicos indican hechos observados por la aplicación o
            por el análisis del servidor. Un hueco de telemetría no demuestra
            por sí solo que el repartidor haya apagado el GPS.
          </Alert>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
