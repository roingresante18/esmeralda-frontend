import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";

import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

// =====================
// Tipos
// =====================

type Product = {
  id: number;
  description: string;
};

type OrderItem = {
  id: number;
  quantity: number;
  total_price: number;
  product: Product;
};

type Client = {
  id: number;
  name: string;
};

type Order = {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  client: Client;
  items: OrderItem[];
};

// =====================
// Colores por estado
// =====================

const statusColor: Record<string, string> = {
  QUOTATION: "#9e9e9e",
  CONFIRMED: "#1976d2",
  PREPARING: "#ed6c02",
  PREPARED: "#9c27b0",
  QUALITY_CHECKED: "#00897b",
  ASSIGNED: "#fbc02d",
  IN_DELIVERY: "#66bb6a",
  DELIVERED: "#2e7d32",
  CANCELLED: "#960202",
};

const allStatuses = Object.keys(statusColor);

// Color suave de fondo
const softBg = (hex: string) => hex + "20";

// =====================
// COMPONENTE
// =====================

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // 🔐 Usuario seguro desde localStorage
  // ============================

  let user: { role?: string } | null = null;

  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }

  // ============================
  // 🧠 Permisos según backend
  // ============================

  const allowedRoles = ["ADMIN", "VENTAS", "CONTROL", "DEPOSITO", "LOGISTICA"];

  const canChangeStatus = !!user && allowedRoles.includes(user.role ?? "");

  // =====================
  // Filtros
  // =====================

  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // =====================
  // Cargar pedidos
  // =====================

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // =====================
  // Filtrado local
  // =====================

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const byStatus = statusFilter ? o.status === statusFilter : true;

      const byClient = clientFilter
        ? o.client?.name?.toLowerCase().includes(clientFilter.toLowerCase())
        : true;

      const byDate = dateFilter ? o.created_at.startsWith(dateFilter) : true;

      return byStatus && byClient && byDate;
    });
  }, [orders, statusFilter, clientFilter, dateFilter]);

  // =====================
  // Cambiar estado
  // =====================
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    orderId?: number;
    newStatus?: string; // <-- puede ser undefined
  }>({ open: false });

  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    message?: string;
  }>({ open: false });

  const changeStatus = async (id: number, newStatus: string) => {
    // Abrir modal de confirmación
    setConfirmModal({
      open: true,
      orderId: id,
      newStatus,
    });
  };
  const confirmChangeStatus = async () => {
    if (!confirmModal.orderId || !confirmModal.newStatus) return;

    try {
      await api.patch(`/orders/${confirmModal.orderId}/status`, {
        new_status: confirmModal.newStatus,
      });
      if (!confirmModal.orderId || !confirmModal.newStatus) return;

      setOrders((prev) =>
        prev.map((o) =>
          o.id === confirmModal.orderId
            ? { ...o, status: confirmModal.newStatus! } // <--- ! indica que NO es undefined
            : o,
        ),
      );

      setConfirmModal({ open: false });
    } catch (err) {
      console.error("Error cambiando estado:", err);

      setConfirmModal({ open: false });

      setErrorModal({
        open: true,
        message: "No se pudo cambiar el estado del pedido",
      });
    }
  };

  // =====================
  // UI
  // =====================

  if (loading)
    return (
      <Box p={6} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Cargando pedidos...</Typography>
      </Box>
    );

  return (
    <Box p={4} bgcolor="#f4f6f8" minHeight="100vh">
      {/* =====================
          ENCABEZADO
      ===================== */}

      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <AssignmentIcon color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight="bold">
          Gestión de Pedidos
        </Typography>
      </Stack>

      {/* =====================
          FILTROS
      ===================== */}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {allStatuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Cliente"
            fullWidth
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />

          <TextField
            label="Fecha"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Stack>
      </Paper>

      {/* =====================
          LISTADO
      ===================== */}

      <Stack spacing={2}>
        {filteredOrders.map((order) => {
          const color = statusColor[order.status] || "#9e9e9e";

          return (
            <Paper
              key={order.id}
              sx={{
                p: 3,
                borderLeft: `8px solid ${color}`,
                backgroundColor: softBg(color),
              }}
            >
              {/* HEADER */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Stack>
                  <Typography variant="h6" fontWeight="bold">
                    Pedido #{order.id}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon fontSize="small" />
                    <Typography variant="body2">
                      {order.client?.name || "Sin cliente"}
                    </Typography>
                  </Stack>
                </Stack>

                {canChangeStatus ? (
                  <FormControl size="small">
                    <Select
                      value={order.status}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                    >
                      {allStatuses.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Chip
                    label={order.status}
                    sx={{
                      backgroundColor: color,
                      color: "white",
                      fontWeight: "bold",
                    }}
                  />
                )}
              </Stack>

              <Divider sx={{ mb: 2 }} />

              {/* ITEMS */}
              <Stack spacing={1}>
                {order.items?.length ? (
                  order.items.map((item) => (
                    <Stack
                      key={item.id}
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography variant="body2">
                        {item.product?.description} × {item.quantity}
                      </Typography>

                      <Typography fontWeight="medium">
                        ${Number(item.total_price).toLocaleString()}
                      </Typography>
                    </Stack>
                  ))
                ) : (
                  <Typography variant="body2">Sin items</Typography>
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* FOOTER */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography fontWeight="bold" fontSize={18}>
                  Total: ${Number(order.total_amount).toLocaleString()}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarTodayIcon fontSize="small" />
                  <Typography variant="body2">
                    {new Date(order.created_at).toLocaleString()}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          );
        })}

        {!filteredOrders.length && <Typography>No hay pedidos.</Typography>}
      </Stack>

      <Dialog
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
      >
        <DialogTitle>Confirmar cambio de estado</DialogTitle>

        <DialogContent>
          ¿Desea cambiar el estado a <b>{confirmModal.newStatus}</b>?
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmModal({ open: false })}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="warning"
            onClick={confirmChangeStatus}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false })}
      >
        <DialogTitle>Error</DialogTitle>

        <DialogContent>{errorModal.message}</DialogContent>

        <DialogActions>
          <Button
            variant="contained"
            onClick={() => setErrorModal({ open: false })}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
