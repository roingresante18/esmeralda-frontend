import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  type GridColDef,
  type GridRowId,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import {
  Alert,
  Button,
  Stack,
  Typography,
  Box,
  Container,
  Chip,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TodayIcon from "@mui/icons-material/Today";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import PaidIcon from "@mui/icons-material/Paid";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "../../api/api";
import { formatDateOnlyAR } from "../../utils/date";
import { ConfirmDeliveryDataDialog } from "../../modules/reparto/components/logistics/ConfirmDeliveryDataDialog";

/* ============================================================
   TYPES
============================================================ */

type OrderPayment = {
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
};

type PaymentSummary = {
  cash: number;
  transfer: number;
  card: number;
  check: number;
  other: number;
  total_paid: number;
};

interface Order {
  id: number;
  status: string;
  created_at: string;
  delivery_date: string | null;
  delivery_address_snapshot?: string | null;
  notes?: string | null;
  municipality_snapshot?: string | null;
  zone_snapshot?: string | null;
  total_amount?: number | string;
  payment_confirmed?: boolean;
  payment_summary?: PaymentSummary;
  payments?: OrderPayment[];
  client: {
    id: number;
    name: string;
    phone: string;
    address?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
  };
}

type DeliveryUser = {
  id: number;
  full_name?: string;
  name?: string;
  email?: string;
  role?: string;
};

type AssignStatus = "idle" | "loading";

/* ============================================================
   HELPERS
============================================================ */

const toValidNumber = (value?: number | string | null) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const getDateOnly = (value?: string | null) => {
  if (!value) return "";

  // delivery_date proviene de una columna DATE. No convertimos a UTC
  // para evitar que el huso horario cambie el día mostrado.
  return value.split("T")[0];
};

const parseDateOnlyAsLocal = (value?: string | null): Date | null => {
  const dateOnly = getDateOnly(value);
  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
};

const getTodayLocal = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

type DeliveryDateCategory =
  | "OVERDUE"
  | "TODAY"
  | "TOMORROW"
  | "FUTURE"
  | "NO_DATE";

const getDeliveryDateCategory = (
  deliveryDate?: string | null,
): DeliveryDateCategory => {
  const delivery = parseDateOnlyAsLocal(deliveryDate);

  if (!delivery) return "NO_DATE";

  const today = getTodayLocal();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (delivery.getTime() < today.getTime()) return "OVERDUE";
  if (delivery.getTime() === today.getTime()) return "TODAY";
  if (delivery.getTime() === tomorrow.getTime()) return "TOMORROW";

  return "FUTURE";
};

const hasClientGps = (order: Order) =>
  toValidNumber(order.client?.latitude) != null &&
  toValidNumber(order.client?.longitude) != null;

const hasDeliveryAddress = (order: Order) =>
  Boolean(
    (order.delivery_address_snapshot ?? "").trim() ||
    (order.client?.address ?? "").trim(),
  );

const isConfiguredForDelivery = (order: Order) =>
  Boolean(order.delivery_date) && hasDeliveryAddress(order);

const getOrderAddress = (order: Order) =>
  order.delivery_address_snapshot ?? order.client?.address ?? "Sin dirección";

const EMPTY_PAYMENT_SUMMARY: PaymentSummary = {
  cash: 0,
  transfer: 0,
  card: 0,
  check: 0,
  other: 0,
  total_paid: 0,
};

/**
 * Construye el resumen desde los movimientos reales del pedido.
 * Incluye adelantos y cobros de entrega confirmados.
 * Los reembolsos confirmados se restan.
 */
const buildPaymentSummaryFromPayments = (
  payments?: OrderPayment[],
): PaymentSummary => {
  const summary: PaymentSummary = { ...EMPTY_PAYMENT_SUMMARY };

  for (const payment of payments ?? []) {
    if (String(payment.status).toUpperCase() !== "CONFIRMED") continue;

    const amount = Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const method = String(payment.method).toUpperCase();
    const type = String(payment.type).toUpperCase();
    const signedAmount = type === "REFUND" ? -amount : amount;

    switch (method) {
      case "CASH":
        summary.cash += signedAmount;
        break;
      case "TRANSFER":
        summary.transfer += signedAmount;
        break;
      case "CARD":
        summary.card += signedAmount;
        break;
      case "CHECK":
        summary.check += signedAmount;
        break;
      default:
        summary.other += signedAmount;
        break;
    }

    summary.total_paid += signedAmount;
  }

  return {
    cash: Math.max(summary.cash, 0),
    transfer: Math.max(summary.transfer, 0),
    card: Math.max(summary.card, 0),
    check: Math.max(summary.check, 0),
    other: Math.max(summary.other, 0),
    total_paid: Math.max(summary.total_paid, 0),
  };
};

/**
 * Usa payment_summary cuando el backend lo envía. En caso contrario,
 * lo calcula desde payments para que los adelantos nunca se pierdan.
 */
const getPaymentSummary = (order: Order): PaymentSummary => {
  if (order.payment_summary) {
    return {
      cash: Number(order.payment_summary.cash ?? 0),
      transfer: Number(order.payment_summary.transfer ?? 0),
      card: Number(order.payment_summary.card ?? 0),
      check: Number(order.payment_summary.check ?? 0),
      other: Number(order.payment_summary.other ?? 0),
      total_paid: Number(order.payment_summary.total_paid ?? 0),
    };
  }

  return buildPaymentSummaryFromPayments(order.payments);
};

const getDeliveryUserLabel = (user: DeliveryUser) =>
  user.full_name?.trim() ||
  user.name?.trim() ||
  user.email?.trim() ||
  `Usuario #${user.id}`;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;

  const response = (
    error as {
      response?: { data?: { message?: string | { message?: string } } };
    }
  ).response;

  const backendMessage = response?.data?.message;

  if (typeof backendMessage === "string") return backendMessage;
  if (typeof backendMessage?.message === "string")
    return backendMessage.message;

  return fallback;
};

const mapOrderToDialogInput = (order: Order) => ({
  id: order.id,
  notes: order.notes ?? "",
  delivery_date: order.delivery_date,
  address: getOrderAddress(order),
  municipality_snapshot: order.municipality_snapshot ?? "Sin municipio",
  zone_snapshot: order.zone_snapshot ?? "Sin zona",
  payment_summary: order.payment_summary,
  payments: order.payments ?? [],
  client: {
    id: order.client.id,
    name: order.client.name,
    phone: order.client.phone,
    address: order.client.address ?? "",
    latitude: toValidNumber(order.client.latitude) ?? undefined,
    longitude: toValidNumber(order.client.longitude) ?? undefined,
  },
});

/* ============================================================
   COMPONENT
============================================================ */

export default function LogisticsOrders() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [orders, setOrders] = useState<Order[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set<GridRowId>(),
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignStatus, setAssignStatus] = useState<AssignStatus>("idle");
  const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([]);
  const [selectedDeliveryUserId, setSelectedDeliveryUserId] = useState<
    number | ""
  >("");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isRowSelected = (orderId: GridRowId) => selectionModel.ids.has(orderId);
  const [openManifestDialog, setOpenManifestDialog] = useState(false);
  const [manifestNotes, setManifestNotes] = useState("");
  const [driverCashExtra, setDriverCashExtra] = useState<number>(0);
  const [printingManifest, setPrintingManifest] = useState(false);

  /* ============================================================
    imprimir PANTALLA
  ============================================================ */

  const handleCreateAndPrintManifest = async () => {
    try {
      setPrintingManifest(true);
      setError(null);

      const selectedIds = orders
        .filter((o) => selectionModel.ids.has(o.id))
        .map((o) => o.id);

      if (!selectedIds.length) {
        setError("Seleccione al menos un pedido.");
        return;
      }

      const createRes = await api.post("/orders/delivery-manifests", {
        orderIds: selectedIds,
        header_notes: manifestNotes,
        driver_cash_extra: Number(driverCashExtra || 0),
      });

      const manifestId = createRes.data.id;

      const printRes = await api.get(
        `/orders/delivery-manifests/${manifestId}/print`,
      );
      const manifest = printRes.data;
      const formatMoney = (value: number) =>
        Number(value || 0).toLocaleString("es-AR", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
      const html = `
      <html>
        <head>
          <title>Planilla de reparto #${manifest.id}</title>
          <style>
            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              padding: 18px;
              color: #111;
              font-size: 14px;
            }

            h1, h2, h3, h4, p {
              margin: 0;
            }

            h1 {
              font-size: 24px;
              margin-bottom: 6px;
            }

            .small {
              font-size: 14px;
              color: #444;
              margin-bottom: 10px;
            }

            .header-box {
              border: 1px solid #ccc;
              border-radius: 8px;
              padding: 8px 10px;
              margin-bottom: 14px;
              font-size: 14px;
              line-height: 1.5;
            }

            .header-row {
              display: flex;
              gap: 18px;
              flex-wrap: wrap;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 14px;
              table-layout: fixed;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              vertical-align: top;
              text-align: left;
              word-break: break-word;
              overflow-wrap: anywhere;
            }

            th {
              background: #eaeaea;
              font-weight: bold;
              font-size: 14px;
            }

            .municipality-row td {
              background: #f5f5f5;
              font-weight: bold;
              font-size: 15px;
              padding: 10px 8px;
            }

            .text-right {
              text-align: right;
            }

            .text-center {
              text-align: center;
            }

            @media print {
              body {
                padding: 10px;
              }

              thead {
                display: table-header-group;
              }

              tr {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <h1>Planilla de reparto</h1>

          <p class="small">
            <strong>Planilla #${manifest.id}</strong>
            · Fecha: ${new Date(manifest.created_at).toLocaleString("es-AR")}
          </p>

          <div class="header-box">
            <div class="header-row">
              <div>
                <strong>Observaciones:</strong> ${manifest.header_notes || "—"}
              </div>
              <div>
                <strong>Monto extra chofer:</strong>
                $${formatMoney(manifest.driver_cash_extra || 0)}
              </div>
            </div>
          </div>

          <table>
            <colgroup>
              <col style="width: 8%" />
              <col style="width: 22%" />
              <col style="width: 14%" />
              <col style="width: 12%" />
              <col style="width: 12%" />
              <col style="width: 12%" />
              <col style="width: 20%" />
            </colgroup>

            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Celular</th>
                <th>Total $</th>
                <th>Transfe.</th>
                <th>Efectivo</th>
                <th>Observaciones</th>
              </tr>
            </thead>

            <tbody>
              ${manifest.groups
                .map(
                  (group: any) => `
                    <tr class="municipality-row">
                      <td colspan="7">${group.municipality}</td>
                    </tr>

                    ${group.items
                      .map(
                        (item: any) => `
                          <tr>
                            <td class="text-center">${item.order_id}</td>
                            <td>${item.client_name}</td>
                            <td>${item.client_phone || ""}</td>
                            <td class="text-right">$${formatMoney(item.total_to_collect || 0)}</td>
                            <td class="text-right">$${formatMoney(item.advance_transfer || 0)}</td>
                            <td class="text-right">$${formatMoney(item.advance_cash || 0)}</td>
                            <td></td>
                          </tr>
                        `,
                      )
                      .join("")}
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

      const win = window.open("", "_blank");
      if (!win) {
        setError("El navegador bloqueó la ventana de impresión.");
        return;
      }

      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();

      setTimeout(() => {
        win.print();
      }, 300);

      setOpenManifestDialog(false);
      setManifestNotes("");
      setDriverCashExtra(0);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar la planilla de reparto.");
    } finally {
      setPrintingManifest(false);
    }
  };
  /* ============================================================
     FETCH
  ============================================================ */

  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      /*
       * No usamos lastDays. Un pedido controlado debe continuar visible
       * hasta que sea asignado, aunque sea antiguo.
       */
      const res = await api.get("/orders", {
        params: { status: "QUALITY_CHECKED" },
      });

      const apiOrders: Order[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      // Defensa adicional por si el backend ignora el filtro de estado.
      setOrders(
        apiOrders.filter((order) => order.status === "QUALITY_CHECKED"),
      );
    } catch (err) {
      console.error("Error cargando pedidos de logística:", err);
      setError(
        getApiErrorMessage(
          err,
          "No se pudieron cargar los pedidos de logística.",
        ),
      );
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchDeliveryUsers = useCallback(async () => {
    try {
      const res = await api.get("/users");

      const users: DeliveryUser[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      const deliveryUsersOnly = users.filter((user) => {
        const role = String(user.role ?? "").toUpperCase();
        return ["REPARTO", "DELIVERY", "REPARTIDOR"].includes(role);
      });

      setDeliveryUsers(deliveryUsersOnly);
    } catch (err) {
      console.error("Error cargando repartidores:", err);
      setError("No se pudieron cargar los usuarios de reparto.");
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    void fetchDeliveryUsers();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchOrders();
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [fetchOrders, fetchDeliveryUsers]);

  /*
   * Elimina selecciones de pedidos que dejaron de estar visibles
   * después de una asignación o una actualización automática.
   */
  useEffect(() => {
    const currentOrderIds = new Set(orders.map((order) => order.id));

    setSelectionModel((previous) => {
      const nextIds = new Set(
        [...previous.ids].filter((id) => currentOrderIds.has(Number(id))),
      );

      if (nextIds.size === previous.ids.size) return previous;

      return {
        ...previous,
        ids: nextIds,
      };
    });
  }, [orders]);

  /* ============================================================
     ACTIONS
  ============================================================ */

  const assignOneToDelivery = useCallback(
    async (orderId: number) => {
      if (!selectedDeliveryUserId) {
        setError("Seleccioná un repartidor antes de asignar el pedido.");
        return;
      }

      try {
        setAssignStatus("loading");
        setError(null);

        await api.patch(`/orders/${orderId}/assign/${selectedDeliveryUserId}`);

        await fetchOrders();
      } catch (err) {
        console.error("Error asignando pedido a reparto:", err);
        setError(
          getApiErrorMessage(err, "No se pudo asignar el pedido a reparto."),
        );
      } finally {
        setAssignStatus("idle");
      }
    },
    [fetchOrders, selectedDeliveryUserId],
  );

  const assignSelectedToDelivery = async () => {
    if (selectionModel.ids.size === 0) return;

    if (!selectedDeliveryUserId) {
      setError("Seleccioná un repartidor antes de asignar los pedidos.");
      return;
    }

    try {
      setAssignStatus("loading");
      setError(null);

      const assignableIds = orders
        .filter(
          (order) => isRowSelected(order.id) && isConfiguredForDelivery(order),
        )
        .map((order) => order.id);

      if (!assignableIds.length) {
        setError(
          "No hay pedidos seleccionados listos para asignar. Primero confirmá la fecha y la dirección de entrega.",
        );
        return;
      }

      /*
       * Promise.allSettled permite informar exactamente qué pedidos fallaron.
       * La solución ideal futura es un endpoint transaccional assign-batch.
       */
      const results = await Promise.allSettled(
        assignableIds.map((orderId) =>
          api.patch(`/orders/${orderId}/assign/${selectedDeliveryUserId}`),
        ),
      );

      const failedOrderIds = results
        .map((result, index) => ({ result, orderId: assignableIds[index] }))
        .filter(({ result }) => result.status === "rejected")
        .map(({ orderId }) => orderId);

      await fetchOrders();

      if (failedOrderIds.length > 0) {
        setError(
          `Se asignaron algunos pedidos, pero fallaron: ${failedOrderIds
            .map((orderId) => `#${orderId}`)
            .join(", ")}.`,
        );
        return;
      }

      setSelectionModel({
        type: "include",
        ids: new Set<GridRowId>(),
      });
      setSelectedDeliveryUserId("");
    } catch (err) {
      console.error("Error asignando pedidos a reparto:", err);
      setError(
        getApiErrorMessage(
          err,
          "No se pudieron asignar los pedidos seleccionados a reparto.",
        ),
      );
    } finally {
      setAssignStatus("idle");
    }
  };

  /* ============================================================
     FILTERS + KPI
  ============================================================ */

  const filteredOrders = useMemo(() => {
    if (!filterDate) return orders;
    return orders.filter((o) => getDateOnly(o.delivery_date) === filterDate);
  }, [orders, filterDate]);

  const today = new Date().toISOString().split("T")[0];

  const todayCount = useMemo(
    () => orders.filter((o) => getDateOnly(o.delivery_date) === today).length,
    [orders, today],
  );

  const overdueCount = useMemo(
    () =>
      orders.filter(
        (order) => getDeliveryDateCategory(order.delivery_date) === "OVERDUE",
      ).length,
    [orders],
  );

  const tomorrowCount = useMemo(
    () =>
      orders.filter(
        (order) => getDeliveryDateCategory(order.delivery_date) === "TOMORROW",
      ).length,
    [orders],
  );

  const configuredCount = useMemo(
    () => orders.filter((o) => isConfiguredForDelivery(o)).length,
    [orders],
  );

  const gpsAvailableCount = useMemo(
    () => orders.filter((o) => hasClientGps(o)).length,
    [orders],
  );

  const paidOrdersCount = useMemo(
    () => orders.filter((o) => getPaymentSummary(o).total_paid > 0).length,
    [orders],
  );

  const selectedOrders = useMemo(
    () => orders.filter((o) => selectionModel.ids.has(o.id)),
    [orders, selectionModel],
  );

  const selectedConfiguredCount = useMemo(
    () => selectedOrders.filter((o) => isConfiguredForDelivery(o)).length,
    [selectedOrders],
  );

  /* ============================================================
     COLUMNS
  ============================================================ */

  const columns: GridColDef<Order>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "Pedido",
        flex: 0.3,
        minWidth: 65,
      },
      {
        field: "client",
        headerName: "Cliente",
        flex: 1.1,
        minWidth: 180,
        valueGetter: (_value, row) => row.client.name,
      },
      {
        field: "municipality_snapshot",
        headerName: "Municipio",
        flex: 0.9,
        minWidth: 150,
        valueGetter: (_value, row) =>
          row.municipality_snapshot ?? "Sin municipio",
      },
      {
        field: "zone_snapshot",
        headerName: "Zona",
        flex: 0.2,
        minWidth: 50,
        valueGetter: (_value, row) => row.zone_snapshot ?? "Sin zona",
      },
      {
        field: "delivery_date",
        headerName: "Fecha entrega",
        flex: 0.9,
        minWidth: 120,
        valueGetter: (_value, row) =>
          row.delivery_date ? formatDateOnlyAR(row.delivery_date) : "Sin fecha",
      },
      {
        field: "payment_summary",
        headerName: "Adelanto",
        flex: 1.15,
        minWidth: 190,
        sortable: false,
        renderCell: (params) => {
          const summary = getPaymentSummary(params.row);

          if (summary.total_paid <= 0) {
            return (
              <Chip
                icon={<PaidIcon />}
                label="Sin adelanto"
                color="default"
                size="small"
                variant="outlined"
              />
            );
          }

          const details: string[] = [];

          if (summary.cash > 0)
            details.push(`Ef. $${summary.cash.toLocaleString("es-AR")}`);
          if (summary.transfer > 0)
            details.push(`Tr. $${summary.transfer.toLocaleString("es-AR")}`);
          if (summary.card > 0)
            details.push(`Tarj. $${summary.card.toLocaleString("es-AR")}`);
          if (summary.check > 0)
            details.push(`Cheq. $${summary.check.toLocaleString("es-AR")}`);
          if (summary.other > 0)
            details.push(`Otro $${summary.other.toLocaleString("es-AR")}`);

          return (
            <Stack spacing={0.25} justifyContent="center">
              <Chip
                icon={<PaidIcon />}
                label={`$${summary.total_paid.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                color="success"
                size="small"
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1.1 }}
              >
                {details.join(" · ")}
              </Typography>
            </Stack>
          );
        },
      },
      {
        field: "alert",
        headerName: "Alerta",
        flex: 0.8,
        minWidth: 130,
        sortable: false,
        renderCell: (params) => {
          const category = getDeliveryDateCategory(params.row.delivery_date);

          switch (category) {
            case "OVERDUE":
              return (
                <Chip
                  icon={<WarningAmberIcon />}
                  label="Vencido"
                  color="error"
                  size="small"
                />
              );
            case "TODAY":
              return (
                <Chip
                  icon={<TodayIcon />}
                  label="Hoy"
                  color="warning"
                  size="small"
                />
              );
            case "TOMORROW":
              return (
                <Chip
                  icon={<EventAvailableIcon />}
                  label="Mañana"
                  color="info"
                  size="small"
                />
              );
            default:
              return null;
          }
        },
      },
      {
        field: "gps",
        headerName: "GPS",
        flex: 0.7,
        minWidth: 120,
        sortable: false,
        renderCell: (params) => (
          <Chip
            icon={<MyLocationIcon />}
            label={hasClientGps(params.row) ? "Disponible" : "Sin GPS"}
            color={hasClientGps(params.row) ? "success" : "default"}
            size="small"
            variant={hasClientGps(params.row) ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "configured",
        headerName: "Reparto",
        flex: 0.9,
        minWidth: 150,
        sortable: false,
        renderCell: (params) => (
          <Chip
            icon={<EventAvailableIcon />}
            label={
              isConfiguredForDelivery(params.row)
                ? "Configurado"
                : "Falta confirmar"
            }
            color={isConfiguredForDelivery(params.row) ? "success" : "warning"}
            size="small"
          />
        ),
      },
      // {
      //   field: "status",
      //   headerName: "Estado",
      //   flex: 0.8,
      //   minWidth: 120,
      //   sortable: false,
      //   renderCell: () => (
      //     <Chip
      //       icon={<LocalShippingIcon />}
      //       label="Controlado"
      //       color="info"
      //       size="small"
      //     />
      //   ),
      // },
      {
        field: "actions",
        headerName: "Acciones",
        flex: 1.4,
        minWidth: 260,
        sortable: false,
        renderCell: (params) => (
          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            sx={{ width: "100%", py: 0.5 }}
          >
            <Button
              variant="outlined"
              size="small"
              fullWidth={isMobile}
              onClick={() => setSelectedOrder(params.row)}
            >
              Confirmar datos
            </Button>

            <Button
              variant="contained"
              color="primary"
              size="small"
              fullWidth={isMobile}
              disabled={
                !isConfiguredForDelivery(params.row) ||
                !selectedDeliveryUserId ||
                assignStatus === "loading"
              }
              onClick={() => void assignOneToDelivery(params.row.id)}
            >
              Asignar
            </Button>
          </Stack>
        ),
      },
    ],
    [assignOneToDelivery, assignStatus, isMobile, selectedDeliveryUserId],
  );

  /* ============================================================
     MOBILE CARDS
  ============================================================ */

  const toggleSelection = (orderId: GridRowId) => {
    setSelectionModel((prev) => {
      const nextIds = new Set(prev.ids);

      if (nextIds.has(orderId)) {
        nextIds.delete(orderId);
      } else {
        nextIds.add(orderId);
      }

      return {
        ...prev,
        ids: nextIds,
      };
    });
  };

  const renderMobileCards = () => {
    if (!filteredOrders.length) {
      return (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No hay pedidos para mostrar.
        </Alert>
      );
    }

    return (
      <Stack spacing={1.5}>
        {filteredOrders.map((order) => {
          const checked = isRowSelected(order.id);
          const configured = isConfiguredForDelivery(order);
          const gpsReady = hasClientGps(order);
          const paymentSummary = getPaymentSummary(order);

          return (
            <Card
              key={order.id}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: checked ? "primary.main" : "divider",
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Stack spacing={1.2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Stack spacing={0.4}>
                      <Typography fontWeight={900}>
                        Pedido #{order.id}
                      </Typography>
                      <Typography fontWeight={700}>
                        {order.client.name}
                      </Typography>
                    </Stack>

                    <Button
                      variant={checked ? "contained" : "outlined"}
                      size="small"
                      onClick={() => toggleSelection(order.id)}
                    >
                      {checked ? "Seleccionado" : "Seleccionar"}
                    </Button>
                  </Stack>

                  <Typography variant="body2" color="text.secondary">
                    {getOrderAddress(order)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {order.municipality_snapshot ?? "Sin municipio"} ·{" "}
                    {order.zone_snapshot ?? "Sin zona"}
                  </Typography>

                  {order.delivery_date ? (
                    <Typography variant="body2" color="text.secondary">
                      Entrega: {formatDateOnlyAR(order.delivery_date)}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="warning.main">
                      Sin fecha de entrega confirmada
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      icon={<LocalShippingIcon />}
                      label={configured ? "Configurado" : "Falta confirmar"}
                      color={configured ? "success" : "warning"}
                      size="small"
                    />

                    <Chip
                      icon={<MyLocationIcon />}
                      label={gpsReady ? "GPS disponible" : "Sin GPS"}
                      color={gpsReady ? "success" : "default"}
                      size="small"
                      variant={gpsReady ? "filled" : "outlined"}
                    />

                    <Chip
                      icon={<PaidIcon />}
                      label={
                        paymentSummary.total_paid > 0
                          ? `Adelanto $${paymentSummary.total_paid.toFixed(2)}`
                          : "Sin adelanto"
                      }
                      color={
                        paymentSummary.total_paid > 0 ? "success" : "default"
                      }
                      size="small"
                      variant={
                        paymentSummary.total_paid > 0 ? "filled" : "outlined"
                      }
                    />

                    {getDeliveryDateCategory(order.delivery_date) ===
                    "OVERDUE" ? (
                      <Chip
                        icon={<WarningAmberIcon />}
                        label="Vencido"
                        color="error"
                        size="small"
                      />
                    ) : getDeliveryDateCategory(order.delivery_date) ===
                      "TODAY" ? (
                      <Chip
                        icon={<TodayIcon />}
                        label="Hoy"
                        color="warning"
                        size="small"
                      />
                    ) : getDeliveryDateCategory(order.delivery_date) ===
                      "TOMORROW" ? (
                      <Chip
                        icon={<EventAvailableIcon />}
                        label="Mañana"
                        color="info"
                        size="small"
                      />
                    ) : null}
                  </Stack>

                  {(order.notes ?? "").trim() ? (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      {order.notes}
                    </Alert>
                  ) : null}

                  <Stack spacing={1}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => setSelectedOrder(order)}
                    >
                      Confirmar datos de reparto
                    </Button>

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={
                        !configured ||
                        !selectedDeliveryUserId ||
                        assignStatus === "loading"
                      }
                      onClick={() => void assignOneToDelivery(order.id)}
                    >
                      Asignar a reparto
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    );
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, md: 0.5 } }}>
      <Stack spacing={0.2}>
        <Stack
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          spacing={1}
        >
          <Typography variant="subtitle1" color="text.secondary">
            Usuario: {loggedUser?.full_name || "Usuario"}
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            Logística
          </Typography>

          <Button variant="outlined" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : null}

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1.2}
              justifyContent="flex-start"
              alignItems={isMobile ? "stretch" : "center"}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TodayIcon color="primary" />
                <Typography fontWeight="bold">
                  Panel operativo de logística
                </Typography>
              </Stack>

              <Chip label={`Hoy: ${todayCount}`} color="primary" />
              <Chip label={`Vencidos: ${overdueCount}`} color="error" />
              <Chip label={`Mañana: ${tomorrowCount}`} color="info" />
              <Chip
                label={`Configurados: ${configuredCount}`}
                color="success"
              />
              <Chip
                label={`Con GPS: ${gpsAvailableCount}`}
                variant="outlined"
              />
              <Chip
                label={`Con adelanto: ${paidOrdersCount}`}
                color="secondary"
              />

              <TextField
                type="date"
                size="small"
                label="Filtrar por fecha"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: isMobile ? "100%" : 220 }}
              />

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => void fetchOrders()}
                disabled={refreshing}
                fullWidth={isMobile}
              >
                {refreshing ? "Actualizando..." : "Actualizar"}
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap"></Stack>

            <Divider />

            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1.2}
              justifyContent="space-between"
              alignItems={isMobile ? "stretch" : "center"}
            >
              <Stack spacing={0.5}>
                <Typography fontWeight={700}>
                  Seleccionados: {selectionModel.ids.size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Listos para asignar: {selectedConfiguredCount}
                </Typography>
              </Stack>

              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={1}
                sx={{ width: isMobile ? "100%" : "auto" }}
              >
                <TextField
                  select
                  size="small"
                  label="Repartidor"
                  value={selectedDeliveryUserId}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedDeliveryUserId(
                      value === "" ? "" : Number(value),
                    );
                  }}
                  sx={{ minWidth: isMobile ? "100%" : 240 }}
                  fullWidth={isMobile}
                  disabled={assignStatus === "loading"}
                >
                  <MenuItem value="">Seleccionar repartidor</MenuItem>

                  {deliveryUsers.map((deliveryUser) => (
                    <MenuItem key={deliveryUser.id} value={deliveryUser.id}>
                      {getDeliveryUserLabel(deliveryUser)}
                    </MenuItem>
                  ))}
                </TextField>

                <Button
                  variant="outlined"
                  startIcon={<PlaylistAddCheckIcon />}
                  onClick={() =>
                    setSelectionModel({
                      type: "include",
                      ids: new Set(filteredOrders.map((o) => o.id)),
                    })
                  }
                  disabled={!filteredOrders.length}
                  fullWidth={isMobile}
                >
                  Seleccionar visibles
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setOpenManifestDialog(true)}
                  disabled={!selectionModel.ids.size}
                  fullWidth={isMobile}
                >
                  Generar planilla
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AssignmentTurnedInIcon />}
                  onClick={assignSelectedToDelivery}
                  disabled={
                    assignStatus === "loading" ||
                    !selectionModel.ids.size ||
                    selectedConfiguredCount === 0 ||
                    !selectedDeliveryUserId
                  }
                  fullWidth={isMobile}
                >
                  {assignStatus === "loading"
                    ? "Asignando..."
                    : "Asignar seleccionados"}
                </Button>
              </Stack>
            </Stack>

            {selectionModel.ids.size > 0 &&
            selectedConfiguredCount !== selectionModel.ids.size ? (
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                Algunos pedidos seleccionados todavía no tienen fecha o
                dirección de entrega confirmadas. Confirmalos antes de enviarlos
                a reparto.
              </Alert>
            ) : null}
          </Stack>
        </Paper>

        {isMobile ? (
          renderMobileCards()
        ) : (
          <Box sx={{ width: "100%", height: 560 }}>
            <DataGrid
              rows={filteredOrders}
              columns={columns}
              getRowId={(r) => r.id}
              checkboxSelection
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={(newSelection) =>
                setSelectionModel(newSelection)
              }
              disableRowSelectionOnClick
              rowHeight={76}
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 50,
                    page: 0,
                  },
                },
              }}
              sx={{
                borderRadius: 3,
                "& .MuiDataGrid-cell": {
                  display: "flex",
                  alignItems: "center",
                },
              }}
            />
          </Box>
        )}
      </Stack>
      <Dialog
        open={openManifestDialog}
        onClose={() => setOpenManifestDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Generar planilla de reparto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Observaciones generales"
              multiline
              minRows={3}
              value={manifestNotes}
              onChange={(e) => setManifestNotes(e.target.value)}
              fullWidth
              placeholder="Ej: pasar a retirar pedido en ..."
            />

            <TextField
              label="Monto extra para chofer"
              type="number"
              value={driverCashExtra}
              onChange={(e) => setDriverCashExtra(Number(e.target.value) || 0)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManifestDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleCreateAndPrintManifest}
            disabled={printingManifest}
          >
            {printingManifest ? "Generando..." : "Generar e imprimir"}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmDeliveryDataDialog
        open={Boolean(selectedOrder)}
        order={selectedOrder ? mapOrderToDialogInput(selectedOrder) : null}
        onClose={() => setSelectedOrder(null)}
        onSuccess={() => {
          setSelectedOrder(null);
          fetchOrders();
        }}
      />
    </Container>
  );
}
