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
  useTheme,
  useMediaQuery,
  Paper,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TodayIcon from "@mui/icons-material/Today";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import PaidIcon from "@mui/icons-material/Paid";
import api from "../../api/api";
import { formatDateOnlyAR } from "../../utils/date";
import { ConfirmDeliveryDataDialog } from "../../modules/reparto/components/logistics/ConfirmDeliveryDataDialog";

/* ============================================================
   TYPES
============================================================ */

type OrderPayment = {
  id: number;
  amount: number;
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
  total_amount?: number;
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
  return new Date(value).toISOString().split("T")[0];
};

const isWithin12Hours = (deliveryDate?: string | null) => {
  if (!deliveryDate) return false;
  const now = new Date();
  const delivery = new Date(deliveryDate);
  const diff = delivery.getTime() - now.getTime();
  return diff <= 12 * 60 * 60 * 1000 && diff > 0;
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

const getPaymentSummary = (order: Order): PaymentSummary => ({
  cash: Number(order.payment_summary?.cash ?? 0),
  transfer: Number(order.payment_summary?.transfer ?? 0),
  card: Number(order.payment_summary?.card ?? 0),
  check: Number(order.payment_summary?.check ?? 0),
  other: Number(order.payment_summary?.other ?? 0),
  total_paid: Number(order.payment_summary?.total_paid ?? 0),
});

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
  const [error, setError] = useState<string | null>(null);

  const isRowSelected = (orderId: GridRowId) => selectionModel.ids.has(orderId);

  /* ============================================================
     FETCH - Solo QUALITY_CHECKED
  ============================================================ */

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);

      const res = await api.get("/orders?lastDays=14");

      const filtered = Array.isArray(res.data)
        ? res.data.filter((o: Order) => o.status === "QUALITY_CHECKED")
        : [];

      setOrders(filtered);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setError("No se pudieron cargar los pedidos de logística.");
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchOrders]);

  /* ============================================================
     ACTIONS
  ============================================================ */

  const changeStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${id}/status`, {
        new_status: newStatus,
      });

      await fetchOrders();
    } catch (err) {
      console.error("Error cambiando estado del pedido:", err);
      setError("No se pudo actualizar el estado del pedido.");
    }
  };

  const assignSelectedToDelivery = async () => {
    if (selectionModel.ids.size === 0) return;

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

      await Promise.all(
        assignableIds.map((id) =>
          api.patch(`/orders/${id}/status`, {
            new_status: "ASSIGNED",
          }),
        ),
      );

      setSelectionModel({
        type: "include",
        ids: new Set<GridRowId>(),
      });

      await fetchOrders();
    } catch (err) {
      console.error("Error asignando pedidos a reparto:", err);
      setError("No se pudieron asignar los pedidos seleccionados a reparto.");
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

  const next12HoursCount = useMemo(
    () => orders.filter((o) => isWithin12Hours(o.delivery_date)).length,
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
        flex: 0.4,
        minWidth: 90,
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
        flex: 0.8,
        minWidth: 120,
        valueGetter: (_value, row) => row.zone_snapshot ?? "Sin zona",
      },
      {
        field: "delivery_date",
        headerName: "Fecha entrega",
        flex: 0.9,
        minWidth: 150,
        valueGetter: (_value, row) =>
          row.delivery_date ? formatDateOnlyAR(row.delivery_date) : "Sin fecha",
      },
      {
        field: "payment_summary",
        headerName: "Adelanto",
        flex: 0.9,
        minWidth: 130,
        sortable: false,
        renderCell: (params) => {
          const totalPaid = getPaymentSummary(params.row).total_paid;

          return (
            <Chip
              icon={<PaidIcon />}
              label={
                totalPaid > 0 ? `$${totalPaid.toFixed(2)}` : "Sin adelanto"
              }
              color={totalPaid > 0 ? "success" : "default"}
              size="small"
              variant={totalPaid > 0 ? "filled" : "outlined"}
            />
          );
        },
      },
      {
        field: "alert",
        headerName: "Alerta",
        flex: 0.7,
        minWidth: 120,
        sortable: false,
        renderCell: (params) =>
          isWithin12Hours(params.row.delivery_date) ? (
            <Chip
              icon={<WarningAmberIcon />}
              label="< 12hs"
              color="warning"
              size="small"
            />
          ) : null,
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
      {
        field: "status",
        headerName: "Estado",
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        renderCell: () => (
          <Chip
            icon={<LocalShippingIcon />}
            label="Controlado"
            color="info"
            size="small"
          />
        ),
      },
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
              disabled={!isConfiguredForDelivery(params.row)}
              onClick={() => changeStatus(params.row.id, "ASSIGNED")}
            >
              Asignar
            </Button>
          </Stack>
        ),
      },
    ],
    [isMobile],
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
                      Entrega:{" "}
                      {new Date(order.delivery_date).toLocaleString("es-AR")}
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

                    {isWithin12Hours(order.delivery_date) ? (
                      <Chip
                        icon={<WarningAmberIcon />}
                        label="< 12hs"
                        color="warning"
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
                      disabled={!configured}
                      onClick={() => changeStatus(order.id, "ASSIGNED")}
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack spacing={2.5}>
        <Stack
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Logística
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Usuario: {loggedUser?.full_name || "Usuario"}
            </Typography>
          </Box>

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
              justifyContent="space-between"
              alignItems={isMobile ? "stretch" : "center"}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TodayIcon color="primary" />
                <Typography fontWeight="bold">
                  Panel operativo de logística
                </Typography>
              </Stack>

              <TextField
                type="date"
                size="small"
                label="Filtrar por fecha"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: isMobile ? "100%" : 220 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Hoy: ${todayCount}`} color="primary" />
              <Chip label={`Próx. 12hs: ${next12HoursCount}`} color="warning" />
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
            </Stack>

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
                  startIcon={<AssignmentTurnedInIcon />}
                  onClick={assignSelectedToDelivery}
                  disabled={
                    assignStatus === "loading" ||
                    !selectionModel.ids.size ||
                    selectedConfiguredCount === 0
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
              rowHeight={64}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10,
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
