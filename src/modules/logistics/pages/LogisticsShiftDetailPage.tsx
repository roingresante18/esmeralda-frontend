import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { useNavigate, useParams } from "react-router-dom";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import RouteIcon from "@mui/icons-material/Route";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import SpeedIcon from "@mui/icons-material/Speed";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import MapIcon from "@mui/icons-material/Map";
import {
  getDriverShiftById,
  getShiftOrders,
  removeOrderFromShift,
  cancelDriverShift,
  getDriverShiftHistory,
  updateDriverShift,
  suspendDriverShift,
  resumeDriverShift,
  getDriverShiftEvents,
} from "../api/shifts.api";

import LogisticsNavigation from "../components/LogisticsNavigation";
import ShiftRouteMapDialog from "../components/ShiftRouteMapDialog";

import ShiftAuditTimeline from "../components/ShiftAuditTimeline";

import { getShiftTelemetryEvents } from "../api/telemetry-audit.api";

import { getShiftRoute } from "../api/telemetry.api";

import type { TelemetryAuditEvent } from "../types/telemetry-audit.types";

import type { ShiftRouteDelivery } from "../types/telemetry.types";

import type {
  DriverShift,
  DriverShiftOrder,
  DriverShiftStatus,
  DriverShiftHistory,
  DriverShiftEvent,
} from "../types/shift.types";

/*
 * =========================================================
 * ESTADO DE JORNADA
 * =========================================================
 */

function getShiftStatusLabel(status: DriverShiftStatus): string {
  switch (status) {
    case "SCHEDULED":
      return "Pendiente";

    case "ACTIVE":
      return "Activa";

    case "SUSPENDED":
      return "Suspendida";

    case "FINISHED":
      return "Finalizada";

    case "CANCELLED":
      return "Cancelada";

    default:
      return status;
  }
}

function getShiftStatusColor(
  status: DriverShiftStatus,
): "warning" | "success" | "info" | "error" | "default" {
  switch (status) {
    case "SCHEDULED":
      return "warning";

    case "ACTIVE":
      return "success";

    case "SUSPENDED":
      return "warning";

    case "FINISHED":
      return "info";

    case "CANCELLED":
      return "error";

    default:
      return "default";
  }
}

/*
 * =========================================================
 * ESTADO DE PEDIDO
 * =========================================================
 */

function formatOrderStatus(status: string): string {
  switch (status) {
    case "QUALITY_CHECKED":
      return "Controlado";

    case "ASSIGNED":
      return "Asignado";

    case "IN_DELIVERY":
      return "En reparto";

    case "DELIVERED":
      return "Entregado";

    case "PARTIAL_DELIVERED":
      return "Entrega parcial";

    case "RESCHEDULED":
      return "Reprogramado";

    case "NOT_DELIVERED":
      return "No entregado";

    case "CANCELLED":
      return "Cancelado";

    default:
      return status;
  }
}

/*
 * =========================================================
 * FORMATEADORES
 * =========================================================
 */

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const dateOnly = value.split("T")[0];

  const parts = dateOnly.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
}

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

function formatKm(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return `${parsed.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} km`;
}

function formatNumber(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return parsed.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatMoney(value: string | number | null | undefined): string {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return parsed.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });
}

/*
 * =========================================================
 * TARJETA DE DATO
 * =========================================================
 */

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;

  value: string;

  icon: React.ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        flex: 1,
        minWidth: 180,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 2,
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography variant="caption" color="text.secondary">
            {title}
          </Typography>

          <Typography fontWeight={800}>{value}</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/*
 * =========================================================
 * PÁGINA
 * =========================================================
 */

export default function LogisticsShiftDetailPage() {
  const navigate = useNavigate();

  const { shiftId } = useParams();

  const numericShiftId = Number(shiftId);

  const [shift, setShift] = useState<DriverShift | null>(null);

  const [orders, setOrders] = useState<DriverShiftOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [removingOrderId, setRemovingOrderId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const [selectedOrderToRemove, setSelectedOrderToRemove] = useState<
    number | null
  >(null);

  const [removeReason, setRemoveReason] = useState("");

  const [removeError, setRemoveError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const [cancelReason, setCancelReason] = useState("");

  const [cancellingShift, setCancellingShift] = useState(false);

  const [cancelError, setCancelError] = useState<string | null>(null);
  /*
   * =========================================================
   * EDITAR JORNADA
   * =========================================================
   */

  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editDate, setEditDate] = useState("");

  const [editNotes, setEditNotes] = useState("");

  const [editingShift, setEditingShift] = useState(false);

  const [editError, setEditError] = useState<string | null>(null);
  /*
   * =========================================================
   * SUSPENDER JORNADA
   * =========================================================
   */

  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);

  const [suspendReason, setSuspendReason] = useState("");

  const [suspendingShift, setSuspendingShift] = useState(false);

  const [suspendError, setSuspendError] = useState<string | null>(null);

  /*
   * =========================================================
   * REANUDAR JORNADA
   * =========================================================
   */

  const [resumingShift, setResumingShift] = useState(false);

  const [resumeError, setResumeError] = useState<string | null>(null);

  /*
   * =========================================================
   * MAPA DEL RECORRIDO
   * =========================================================
   */

  const [routeMapOpen, setRouteMapOpen] = useState(false);
  /*
   * =========================================================
   * HISTORIAL
   * =========================================================
   */

  const [shiftHistory, setShiftHistory] = useState<DriverShiftHistory[]>([]);

  /*
   * Historial operativo completo.
   *
   * Cada suspensión/reanudación vive como registro
   * independiente en fleet_driver_shift_events.
   */
  const [shiftEvents, setShiftEvents] = useState<DriverShiftEvent[]>([]);

  const [historyLoading, setHistoryLoading] = useState(false);

  /*
   * =========================================================
   * AUDITORÍA UNIFICADA
   * =========================================================
   */

  const [telemetryAuditEvents, setTelemetryAuditEvents] = useState<
    TelemetryAuditEvent[]
  >([]);

  const [auditDeliveries, setAuditDeliveries] = useState<ShiftRouteDelivery[]>(
    [],
  );

  const [auditLoading, setAuditLoading] = useState(false);

  const [auditError, setAuditError] = useState<string | null>(null);
  const loadDetail = useCallback(async () => {
    if (!Number.isInteger(numericShiftId) || numericShiftId <= 0) {
      setError("Identificador de jornada inválido.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setError(null);

      const [shiftData, orderData] = await Promise.all([
        getDriverShiftById(numericShiftId),

        getShiftOrders(numericShiftId),
      ]);

      setShift(shiftData);

      setOrders(orderData);
    } catch (loadError) {
      console.error("[LOGISTICS][SHIFT DETAIL]", loadError);

      setError("No se pudo cargar el detalle de la jornada.");
    } finally {
      setLoading(false);
    }
  }, [numericShiftId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  /*
   * =======================================================
   * RESUMEN DE PEDIDOS
   * =======================================================
   */

  const deliveredCount = useMemo(
    () => orders.filter((item) => item.order.status === "DELIVERED").length,
    [orders],
  );

  const activeOrderCount = useMemo(
    () =>
      orders.filter((item) =>
        ["ASSIGNED", "IN_DELIVERY"].includes(item.order.status),
      ).length,
    [orders],
  );

  /*
   * =========================================================
   * ABRIR MODAL QUITAR PEDIDO
   * =========================================================
   */

  const openRemoveOrderDialog = (orderId: number) => {
    if (!shift || shift.status !== "SCHEDULED") {
      return;
    }

    setSelectedOrderToRemove(orderId);
    setRemoveReason("");
    setRemoveError(null);
    setRemoveDialogOpen(true);
  };

  /*
   * =========================================================
   * CONFIRMAR QUITAR PEDIDO
   * =========================================================
   */

  const handleRemoveOrder = async () => {
    if (!shift || shift.status !== "SCHEDULED" || !selectedOrderToRemove) {
      return;
    }

    const reason = removeReason.trim();

    if (reason.length < 3) {
      setRemoveError("Ingresá un motivo de al menos 3 caracteres.");
      return;
    }

    try {
      setRemovingOrderId(selectedOrderToRemove);
      setRemoveError(null);

      await removeOrderFromShift(shift.id, selectedOrderToRemove, reason);

      setRemoveDialogOpen(false);
      setSelectedOrderToRemove(null);
      setRemoveReason("");

      await loadDetail();
    } catch (error: any) {
      console.error("[LOGISTICS][REMOVE ORDER]", error);

      const backendMessage = error?.response?.data?.message;

      if (typeof backendMessage === "string") {
        setRemoveError(backendMessage);
      } else if (Array.isArray(backendMessage)) {
        setRemoveError(backendMessage.join("\n"));
      } else {
        setRemoveError("No se pudo quitar el pedido de la jornada.");
      }
    } finally {
      setRemovingOrderId(null);
    }
  };
  const loadHistory = useCallback(async () => {
    if (!Number.isInteger(numericShiftId) || numericShiftId <= 0) {
      return;
    }

    try {
      setHistoryLoading(true);

      const data = await getDriverShiftHistory(numericShiftId);

      setShiftHistory(data);
    } catch (error) {
      console.error("[LOGISTICS][SHIFT HISTORY]", error);

      setShiftHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [numericShiftId]);

  /*
   * =========================================================
   * CARGAR EVENTOS OPERATIVOS COMPLETOS
   * =========================================================
   */

  const loadShiftEvents = useCallback(async () => {
    if (!Number.isInteger(numericShiftId) || numericShiftId <= 0) {
      return;
    }

    try {
      const data = await getDriverShiftEvents(numericShiftId);

      setShiftEvents(data);
    } catch (error) {
      console.error("[LOGISTICS][SHIFT EVENTS]", error);

      setShiftEvents([]);
    }
  }, [numericShiftId]);

  /*
   * Cargamos ambos historiales al abrir el detalle.
   */
  useEffect(() => {
    void loadHistory();

    void loadShiftEvents();
  }, [loadHistory, loadShiftEvents]);

  /*
   * =========================================================
   * CARGAR AUDITORÍA TÉCNICA + ENTREGAS
   * =========================================================
   *
   * Se consultan dos fuentes:
   *
   * - /fleet/telemetry/shifts/:id/events
   * - /fleet/telemetry/shifts/:id/route
   *
   * /route ya contiene los intentos de entrega con GPS real.
   */

  const loadAudit = useCallback(async () => {
    if (!Number.isInteger(numericShiftId) || numericShiftId <= 0) {
      return;
    }

    try {
      setAuditLoading(true);

      setAuditError(null);

      const [telemetryResult, routeResult] = await Promise.allSettled([
        getShiftTelemetryEvents(numericShiftId),

        getShiftRoute(numericShiftId),
      ]);

      if (telemetryResult.status === "fulfilled") {
        setTelemetryAuditEvents(telemetryResult.value);
      } else {
        console.error("[LOGISTICS][AUDIT][TELEMETRY]", telemetryResult.reason);

        setTelemetryAuditEvents([]);

        setAuditError(
          "No se pudieron cargar todos los eventos de telemetría. El resto de la auditoría sigue disponible.",
        );
      }

      if (routeResult.status === "fulfilled") {
        setAuditDeliveries(
          Array.isArray(routeResult.value.deliveries)
            ? routeResult.value.deliveries
            : [],
        );
      } else {
        console.error("[LOGISTICS][AUDIT][ROUTE]", routeResult.reason);

        setAuditDeliveries([]);

        setAuditError(
          (current) =>
            current ||
            "No se pudieron cargar los marcadores de entrega de la jornada.",
        );
      }
    } finally {
      setAuditLoading(false);
    }
  }, [numericShiftId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  /*
   * =======================================================
   * TABLA DE PEDIDOS
   * =======================================================
   */

  const columns = useMemo<GridColDef<DriverShiftOrder>[]>(
    () => [
      {
        field: "order_id",

        headerName: "Pedido",

        width: 100,

        valueGetter: (_value, row) => `#${row.order.id}`,
      },

      {
        field: "client",

        headerName: "Cliente",

        minWidth: 220,

        flex: 1,

        valueGetter: (_value, row) => row.order.client?.name || "Sin cliente",
      },

      {
        field: "municipality",

        headerName: "Municipio",

        minWidth: 150,

        flex: 0.8,

        valueGetter: (_value, row) =>
          row.order.municipality_snapshot ||
          row.order.client?.municipality?.name ||
          "—",
      },

      {
        field: "address",

        headerName: "Dirección",

        minWidth: 180,

        flex: 1,

        valueGetter: (_value, row) =>
          row.order.client?.address ||
          row.order.delivery_address_snapshot ||
          "—",
      },

      {
        field: "amount",

        headerName: "Importe",

        minWidth: 130,

        flex: 0.7,

        valueGetter: (_value, row) => formatMoney(row.order.total_amount),
      },

      {
        field: "status",

        headerName: "Estado",

        minWidth: 150,

        flex: 0.8,

        renderCell: (params) => (
          <Chip
            size="small"
            label={formatOrderStatus(params.row.order.status)}
            color={
              params.row.order.status === "DELIVERED"
                ? "success"
                : params.row.order.status === "IN_DELIVERY"
                  ? "info"
                  : "default"
            }
          />
        ),
      },

      {
        field: "actions",

        headerName: "Acciones",

        width: 130,

        sortable: false,

        filterable: false,

        renderCell: (params) => {
          if (shift?.status !== "SCHEDULED") {
            return null;
          }

          return (
            <Button
              size="small"
              color="error"
              disabled={removingOrderId === params.row.order.id}
              onClick={() => openRemoveOrderDialog(params.row.order.id)}
            >
              Quitar
            </Button>
          );
        },
      },
    ],
    [shift?.status, removingOrderId],
  );
  /*
   * =========================================================
   * CANCELAR JORNADA
   * =========================================================
   */
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);
  const handleCancelShift = async () => {
    if (!shift || shift.status !== "SCHEDULED") {
      return;
    }

    const reason = cancelReason.trim();

    if (reason.length < 3) {
      setCancelError("Ingresá un motivo de al menos 3 caracteres.");

      return;
    }

    try {
      setCancellingShift(true);

      setCancelError(null);

      await cancelDriverShift(shift.id, reason);

      setCancelDialogOpen(false);

      setCancelReason("");

      await Promise.all([
        loadDetail(),
        loadHistory(),
        loadShiftEvents(),
        loadAudit(),
      ]);
    } catch (error: any) {
      console.error("[LOGISTICS][CANCEL SHIFT]", error);

      const backendMessage = error?.response?.data?.message;

      if (typeof backendMessage === "string") {
        setCancelError(backendMessage);

        return;
      }

      if (Array.isArray(backendMessage)) {
        setCancelError(backendMessage.join("\n"));

        return;
      }

      setCancelError("No se pudo cancelar la jornada.");
    } finally {
      setCancellingShift(false);
    }
  };
  /*
   * =========================================================
   * SUSPENDER JORNADA
   * =========================================================
   */

  const handleSuspendShift = async () => {
    if (!shift || shift.status !== "ACTIVE") {
      return;
    }

    const reason = suspendReason.trim();

    if (reason.length < 3) {
      setSuspendError(
        "Ingresá un motivo de suspensión de al menos 3 caracteres.",
      );

      return;
    }

    try {
      setSuspendingShift(true);

      setSuspendError(null);

      await suspendDriverShift(shift.id, reason);

      setSuspendDialogOpen(false);

      setSuspendReason("");

      await Promise.all([
        loadDetail(),
        loadHistory(),
        loadShiftEvents(),
        loadAudit(),
      ]);
    } catch (error: any) {
      console.error("[LOGISTICS][SUSPEND SHIFT]", error);

      const backendMessage = error?.response?.data?.message;

      if (typeof backendMessage === "string") {
        setSuspendError(backendMessage);

        return;
      }

      if (Array.isArray(backendMessage)) {
        setSuspendError(backendMessage.join("\n"));

        return;
      }

      setSuspendError("No se pudo suspender la jornada.");
    } finally {
      setSuspendingShift(false);
    }
  };
  /*
   * =========================================================
   * REANUDAR JORNADA
   * =========================================================
   */

  const handleResumeShift = async () => {
    if (!shift || shift.status !== "SUSPENDED") {
      return;
    }

    try {
      setResumingShift(true);

      setResumeError(null);

      await resumeDriverShift(shift.id);

      await Promise.all([
        loadDetail(),
        loadHistory(),
        loadShiftEvents(),
        loadAudit(),
      ]);
    } catch (error: any) {
      console.error("[LOGISTICS][RESUME SHIFT]", error);

      const backendMessage = error?.response?.data?.message;

      if (typeof backendMessage === "string") {
        setResumeError(backendMessage);

        return;
      }

      if (Array.isArray(backendMessage)) {
        setResumeError(backendMessage.join("\n"));

        return;
      }

      setResumeError("No se pudo reanudar la jornada.");
    } finally {
      setResumingShift(false);
    }
  };
  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading && !shift) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  /*
   * =======================================================
   * ERROR
   * =======================================================
   */

  if (!shift) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 3,
        }}
      >
        <Alert severity="error">{error || "Jornada no disponible."}</Alert>
      </Container>
    );
  }
  const openEditDialog = () => {
    if (!shift || shift.status !== "SCHEDULED") {
      return;
    }

    setEditDate(shift.scheduled_date);

    setEditNotes(shift.notes ?? "");

    setEditError(null);

    setEditDialogOpen(true);
  };
  const handleUpdateShift = async () => {
    if (!shift || shift.status !== "SCHEDULED") {
      return;
    }

    if (!editDate) {
      setEditError("Seleccioná una fecha.");

      return;
    }

    try {
      setEditingShift(true);

      setEditError(null);

      await updateDriverShift(shift.id, {
        scheduled_date: editDate,

        notes: editNotes.trim(),
      });

      setEditDialogOpen(false);

      await Promise.all([
        loadDetail(),
        loadHistory(),
        loadShiftEvents(),
        loadAudit(),
      ]);
    } catch (error: any) {
      console.error("[LOGISTICS][UPDATE SHIFT]", error);

      const backendMessage = error?.response?.data?.message;

      if (typeof backendMessage === "string") {
        setEditError(backendMessage);

        return;
      }

      if (Array.isArray(backendMessage)) {
        setEditError(backendMessage.join("\n"));

        return;
      }

      setEditError("No se pudo modificar la jornada.");
    } finally {
      setEditingShift(false);
    }
  };
  /*
   * =======================================================
   * RENDER
   * =======================================================
   */
  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
      }}
    >
      <Stack spacing={3}>
        <LogisticsNavigation />

        {/* HEADER */}

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <RouteIcon color="primary" fontSize="large" />

            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
              >
                <Typography variant="h4" fontWeight={900}>
                  Jornada #{shift.id}
                </Typography>

                <Chip
                  label={getShiftStatusLabel(shift.status)}
                  color={getShiftStatusColor(shift.status)}
                />
              </Stack>

              <Typography color="text.secondary">
                {formatDate(shift.scheduled_date)}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/logistica/jornadas")}
            >
              Volver
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() =>
                void Promise.all([
                  loadDetail(),
                  loadHistory(),
                  loadShiftEvents(),
                  loadAudit(),
                ])
              }
              disabled={loading}
            >
              Actualizar
            </Button>
            {/* =====================================================
    JORNADA ACTIVA
    ===================================================== */}

            {shift.status === "ACTIVE" && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<PauseCircleOutlineIcon />}
                onClick={() => {
                  setSuspendReason("");

                  setSuspendError(null);

                  setSuspendDialogOpen(true);
                }}
              >
                Suspender jornada
              </Button>
            )}

            {/* =====================================================
    JORNADA SUSPENDIDA
    ===================================================== */}

            {shift.status === "SUSPENDED" && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayCircleOutlineIcon />}
                disabled={resumingShift}
                onClick={() => void handleResumeShift()}
              >
                {resumingShift ? "Reanudando..." : "Reanudar jornada"}
              </Button>
            )}
            {shift.status === "SCHEDULED" && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={openEditDialog}
              >
                Editar jornada
              </Button>
            )}
            {shift.status === "SCHEDULED" && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setCancelReason("");

                  setCancelError(null);

                  setCancelDialogOpen(true);
                }}
              >
                Cancelar jornada
              </Button>
            )}
          </Stack>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {resumeError && <Alert severity="error">{resumeError}</Alert>}

        {shift.status === "CANCELLED" && (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            <Stack spacing={0.5}>
              <Typography fontWeight={800}>Jornada cancelada</Typography>

              <Typography variant="body2">
                Motivo: {shift.cancellation_reason || "Sin motivo registrado"}
              </Typography>

              <Typography variant="body2">
                Cancelada por:{" "}
                {shift.cancelled_by?.full_name ||
                  shift.cancelled_by?.email ||
                  "—"}
              </Typography>

              <Typography variant="body2">
                Fecha: {formatDateTime(shift.cancelled_at)}
              </Typography>
            </Stack>
          </Alert>
        )}

        {/* =====================================================
    JORNADA SUSPENDIDA
    ===================================================== */}

        {shift.status === "SUSPENDED" && (
          <Alert
            severity="warning"
            sx={{
              borderRadius: 3,
            }}
          >
            <Stack spacing={0.75}>
              <Typography fontWeight={900}>
                Jornada suspendida temporalmente
              </Typography>

              <Typography variant="body2">
                El reparto está detenido, pero la jornada, el chofer, el
                vehículo y los pedidos continúan vinculados.
              </Typography>

              <Divider />

              <Typography variant="body2">
                <strong>Motivo:</strong>{" "}
                {shift.suspension_reason || "Sin motivo registrado"}
              </Typography>

              <Typography variant="body2">
                <strong>Suspendida:</strong>{" "}
                {formatDateTime(shift.suspended_at)}
              </Typography>

              <Typography variant="body2">
                <strong>Por:</strong>{" "}
                {shift.suspended_by?.full_name ||
                  shift.suspended_by?.email ||
                  "—"}
              </Typography>

              <Typography variant="body2">
                El teléfono del repartidor pausará el registro GPS al detectar
                este estado.
              </Typography>
            </Stack>
          </Alert>
        )}
        {/* DATOS GENERALES */}

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >
          <MetricCard
            title="Repartidor"
            value={shift.driver?.full_name || shift.driver?.email || "—"}
            icon={<PersonIcon />}
          />

          <MetricCard
            title="Vehículo"
            value={`${shift.vehicle.plate} · ${shift.vehicle.brand} ${shift.vehicle.model}`}
            icon={<DirectionsCarIcon />}
          />

          <MetricCard
            title="Pedidos"
            value={`${orders.length}`}
            icon={<LocalShippingIcon />}
          />
        </Stack>

        {/* EJECUCIÓN */}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" fontWeight={800} mb={2}>
            Ejecución de jornada
          </Typography>
          {shift.suspended_at && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Última suspensión
              </Typography>

              <Typography fontWeight={700}>
                {formatDateTime(shift.suspended_at)}
              </Typography>
            </Box>
          )}

          {shift.resumed_at && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Última reanudación
              </Typography>

              <Typography fontWeight={700}>
                {formatDateTime(shift.resumed_at)}
              </Typography>
            </Box>
          )}
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={3}
            flexWrap="wrap"
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Inicio
              </Typography>

              <Typography fontWeight={700}>
                {formatDateTime(shift.started_at)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Fin
              </Typography>

              <Typography fontWeight={700}>
                {formatDateTime(shift.ended_at)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Odómetro inicial
              </Typography>

              <Typography fontWeight={700}>
                {formatKm(shift.start_odometer_km)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Odómetro final
              </Typography>

              <Typography fontWeight={700}>
                {formatKm(shift.end_odometer_km)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Recorrido
              </Typography>

              <Typography fontWeight={700}>
                {formatKm(shift.total_distance_km)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Combustible estimado
              </Typography>

              <Typography fontWeight={700}>
                {shift.estimated_fuel_liters != null
                  ? `${formatNumber(shift.estimated_fuel_liters)} L`
                  : "—"}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* TELEMETRÍA */}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            spacing={2}
            mb={2}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <SpeedIcon color="primary" />

              <Typography variant="h6" fontWeight={800}>
                Telemetría
              </Typography>
            </Stack>

            <Button
              variant="outlined"
              startIcon={<MapIcon />}
              onClick={() => setRouteMapOpen(true)}
            >
              Ver recorrido en mapa
            </Button>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={3}
            flexWrap="wrap"
          >
            <Box>
              <Typography variant="caption" color="text.secondary">
                Velocidad promedio
              </Typography>

              <Typography fontWeight={700}>
                {shift.average_speed_kmh != null
                  ? `${formatNumber(shift.average_speed_kmh)} km/h`
                  : "—"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Velocidad máxima
              </Typography>

              <Typography fontWeight={700}>
                {shift.max_speed_kmh != null
                  ? `${formatNumber(shift.max_speed_kmh)} km/h`
                  : "—"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Tiempo en exceso
              </Typography>

              <Typography fontWeight={700}>
                {shift.speeding_seconds ?? 0} s
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Distancia en exceso
              </Typography>

              <Typography fontWeight={700}>
                {formatKm(shift.speeding_distance_km)}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                % del recorrido en exceso
              </Typography>

              <Typography fontWeight={700}>
                {formatNumber(shift.speeding_distance_percentage)}%
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary">
                Última sincronización
              </Typography>

              <Typography fontWeight={700}>
                {formatDateTime(shift.last_sync_at)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
        {/* =====================================================
            AUDITORÍA UNIFICADA
            ===================================================== */}

        <ShiftAuditTimeline
          shift={shift}
          administrativeHistory={shiftHistory}
          operationalEvents={shiftEvents}
          telemetryEvents={telemetryAuditEvents}
          deliveries={auditDeliveries}
          loading={historyLoading || auditLoading}
          telemetryError={auditError}
        />

        {/* RESUMEN PEDIDOS */}

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" fontWeight={800}>
            Pedidos
          </Typography>

          <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
            <Chip label={`Total: ${orders.length}`} />

            <Chip color="success" label={`Entregados: ${deliveredCount}`} />

            <Chip color="info" label={`En curso: ${activeOrderCount}`} />
          </Stack>
        </Paper>

        <Divider />

        {/* TABLA */}

        <Paper
          sx={{
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: 520,
              width: "100%",
            }}
          >
            <DataGrid
              rows={orders}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: {
                    page: 0,
                    pageSize: 25,
                  },
                },
              }}
              sx={{
                border: 0,
              }}
            />
          </Box>
        </Paper>
      </Stack>
      <Dialog
        open={removeDialogOpen}
        onClose={() => {
          if (removingOrderId != null) {
            return;
          }

          setRemoveDialogOpen(false);
          setSelectedOrderToRemove(null);
          setRemoveReason("");
          setRemoveError(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Quitar pedido de la jornada</DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              mt: 1,
            }}
          >
            <Alert severity="warning">
              {selectedOrderToRemove
                ? `El pedido #${selectedOrderToRemove} será retirado de esta jornada y volverá automáticamente al estado que tenía antes de ser asignado.`
                : "El pedido será retirado de la jornada."}
            </Alert>

            <Typography variant="body2" color="text.secondary">
              La asignación no se elimina del historial. Quedará registrada como
              cancelada junto con el usuario, fecha y motivo.
            </Typography>

            {removeError && <Alert severity="error">{removeError}</Alert>}

            <TextField
              label="Motivo"
              value={removeReason}
              onChange={(event) => {
                setRemoveReason(event.target.value);
                setRemoveError(null);
              }}
              multiline
              minRows={3}
              placeholder="Ej.: cliente solicita cambio de fecha, error de planificación..."
              disabled={removingOrderId != null}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={removingOrderId != null}
            onClick={() => {
              setRemoveDialogOpen(false);
              setSelectedOrderToRemove(null);
              setRemoveReason("");
              setRemoveError(null);
            }}
          >
            Volver
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={removingOrderId != null || removeReason.trim().length < 3}
            onClick={() => void handleRemoveOrder()}
          >
            {removingOrderId != null ? "Quitando..." : "Quitar pedido"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={cancelDialogOpen}
        onClose={() => {
          if (cancellingShift) {
            return;
          }

          setCancelDialogOpen(false);

          setCancelReason("");

          setCancelError(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancelar jornada</DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              mt: 1,
            }}
          >
            <Alert severity="warning">
              Esta acción cancelará la jornada y restaurará cada pedido al
              estado que tenía antes de ser asignado.
            </Alert>

            <Typography variant="body2" color="text.secondary">
              La jornada y las asignaciones no se eliminarán. Quedará registrado
              quién canceló la jornada, cuándo y por qué.
            </Typography>

            {cancelError && <Alert severity="error">{cancelError}</Alert>}

            <TextField
              label="Motivo de cancelación"
              value={cancelReason}
              onChange={(event) => {
                setCancelReason(event.target.value);

                setCancelError(null);
              }}
              multiline
              minRows={3}
              placeholder="Ej.: chofer ausente, cambio de planificación, vehículo fuera de servicio..."
              disabled={cancellingShift}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={cancellingShift}
            onClick={() => {
              setCancelDialogOpen(false);

              setCancelReason("");

              setCancelError(null);
            }}
          >
            Volver
          </Button>

          <Button
            variant="contained"
            color="error"
            disabled={cancellingShift || cancelReason.trim().length < 3}
            onClick={() => void handleCancelShift()}
          >
            {cancellingShift ? "Cancelando..." : "Cancelar jornada"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          if (editingShift) {
            return;
          }

          setEditDialogOpen(false);

          setEditError(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar jornada</DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              mt: 1,
            }}
          >
            <Alert severity="info">
              Podés modificar la fecha y las observaciones mientras la jornada
              siga pendiente. El repartidor y el vehículo no pueden cambiarse.
            </Alert>

            {editError && <Alert severity="error">{editError}</Alert>}

            <TextField
              type="date"
              label="Fecha de jornada"
              value={editDate}
              onChange={(event) => {
                setEditDate(event.target.value);

                setEditError(null);
              }}
              InputLabelProps={{
                shrink: true,
              }}
              disabled={editingShift}
              required
              fullWidth
            />

            <TextField
              label="Repartidor"
              value={
                shift.driver?.full_name ||
                shift.driver?.email ||
                `Usuario #${shift.driver?.id}`
              }
              disabled
              fullWidth
              helperText="Para cambiar repartidor, cancelá esta jornada y creá una nueva."
            />

            <TextField
              label="Vehículo"
              value={`${shift.vehicle.plate} · ${shift.vehicle.brand} ${shift.vehicle.model}`}
              disabled
              fullWidth
              helperText="Para cambiar vehículo, cancelá esta jornada y creá una nueva."
            />

            <TextField
              label="Observaciones"
              value={editNotes}
              onChange={(event) => {
                setEditNotes(event.target.value);

                setEditError(null);
              }}
              multiline
              minRows={3}
              disabled={editingShift}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={editingShift}
            onClick={() => setEditDialogOpen(false)}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            disabled={editingShift || !editDate}
            onClick={() => void handleUpdateShift()}
          >
            {editingShift ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* =======================================================
    MODAL SUSPENDER JORNADA
    ======================================================= */}

      <Dialog
        open={suspendDialogOpen}
        onClose={() => {
          if (suspendingShift) {
            return;
          }

          setSuspendDialogOpen(false);

          setSuspendReason("");

          setSuspendError(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Suspender jornada</DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              mt: 1,
            }}
          >
            <Alert severity="warning">
              La jornada se pausará temporalmente. Los pedidos seguirán en
              reparto y permanecerán asignados al mismo chofer y vehículo.
            </Alert>

            <Typography variant="body2" color="text.secondary">
              El repartidor no podrá registrar entregas ni finalizar la jornada
              hasta que Logística la reanude.
            </Typography>

            <Typography variant="body2" color="text.secondary">
              La app del repartidor detendrá temporalmente el seguimiento GPS
              cuando detecte la suspensión.
            </Typography>

            {suspendError && <Alert severity="error">{suspendError}</Alert>}

            <TextField
              label="Motivo de suspensión"
              value={suspendReason}
              onChange={(event) => {
                setSuspendReason(event.target.value);

                setSuspendError(null);
              }}
              multiline
              minRows={3}
              placeholder="Ej.: falla mecánica, corte de ruta, condiciones climáticas..."
              disabled={suspendingShift}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={suspendingShift}
            onClick={() => {
              setSuspendDialogOpen(false);

              setSuspendReason("");

              setSuspendError(null);
            }}
          >
            Volver
          </Button>

          <Button
            variant="contained"
            color="warning"
            startIcon={<PauseCircleOutlineIcon />}
            disabled={suspendingShift || suspendReason.trim().length < 3}
            onClick={() => void handleSuspendShift()}
          >
            {suspendingShift ? "Suspendiendo..." : "Suspender jornada"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =======================================================
          MAPA DEL RECORRIDO
          ======================================================= */}

      <ShiftRouteMapDialog
        open={routeMapOpen}
        shiftId={shift.id}
        onClose={() => setRouteMapOpen(false)}
      />
    </Container>
  );
}
