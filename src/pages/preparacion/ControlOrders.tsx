import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Checkbox,
  Container,
  Chip,
  useTheme,
  useMediaQuery,
  Divider,
  CircularProgress,
} from "@mui/material";
import api from "../../api/api";
import { formatDateOnlyAR } from "../../utils/date";

/* ============================================================
TYPES
============================================================ */

interface Product {
  description: string;
}

interface OrderItem {
  quantity: number;
  product: Product;
}

interface Order {
  id: number;
  status: string;
  client: {
    name: string;
  };
  items: OrderItem[];
  created_at: string;
  delivery_date: string;
  observations?: string;
}

/* ============================================================
COMPONENT
============================================================ */

export default function ControlOrders() {
  const navigate = useNavigate();
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isMobile) {
      navigate("/control-orders/mobile", { replace: true });
    }
  }, [isMobile, navigate]);
  /* ============================================================
FETCH ORDERS
============================================================ */

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const preparedOrders = res.data
        .filter((o: Order) => o.status === "PREPARED")
        .sort(
          (a: Order, b: Order) =>
            new Date(a.delivery_date).getTime() -
            new Date(b.delivery_date).getTime(),
        );

      setOrders(preparedOrders);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    }
  };

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchOrders();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* AUTO REDIRECT MOBILE */

  useEffect(() => {
    if (isMobile) {
      navigate("/control-orders/mobile", { replace: true });
    }
  }, [isMobile, navigate]);
  /* ============================================================
STATUS CHANGE
============================================================ */

  const changeStatus = async (id: number, newStatus: string) => {
    try {
      setLoading(true);

      await api.patch(`/orders/${id}/status`, {
        new_status: newStatus,
      });

      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error("Error cambiando estado", err);
      alert("Error al actualizar el pedido");
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
CHECKLIST
============================================================ */

  const handleCheck = (index: number) => {
    setCheckedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const markAll = () => {
    if (!selectedOrder) return;

    const allIndexes = selectedOrder.items.map((_, i) => i);
    setCheckedItems(allIndexes);
  };

  const allChecked =
    selectedOrder && checkedItems.length === selectedOrder.items.length;

  /* ============================================================
DATE STATUS
============================================================ */

  const getDeliveryStatus = (date: string) => {
    const today = new Date();
    const delivery = new Date(date);

    today.setHours(0, 0, 0, 0);
    delivery.setHours(0, 0, 0, 0);

    if (delivery < today) return "late";
    if (delivery.getTime() === today.getTime()) return "today";
    return "future";
  };

  /* ============================================================
COLUMNS
============================================================ */

  const columns: GridColDef<Order>[] = useMemo(
    () => [
      {
        field: "id",
        headerName: "Pedido",
        flex: 0.4,
      },

      {
        field: "client",
        headerName: "Cliente",
        flex: 1,
        valueGetter: (_v, row) => row.client.name,
      },

      {
        field: "items_count",
        headerName: "Items",
        flex: 0.4,
        valueGetter: (_v, row) => row.items.length,
      },

      {
        field: "delivery_date",
        headerName: "Entrega",
        flex: 1,
        renderCell: (params) => {
          const status = getDeliveryStatus(params.row.delivery_date);

          const color =
            status === "late"
              ? "error"
              : status === "today"
                ? "warning"
                : "success";

          return (
            <Chip
              label={formatDateOnlyAR(params.row.delivery_date)}
              color={color}
              size="small"
            />
          );
        },
      },

      {
        field: "status",
        headerName: "Estado",
        flex: 0.8,
        renderCell: () => (
          <Chip label="Preparado" color="success" size="small" />
        ),
      },

      {
        field: "actions",
        headerName: "Acciones",
        flex: 1.4,
        sortable: false,
        renderCell: (params) => {
          const order = params.row;

          return (
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1}
              width="100%"
            >
              <Button
                size="small"
                fullWidth={isMobile}
                variant="outlined"
                onClick={() => {
                  setCheckedItems([]);
                  setSelectedOrder(order);
                }}
              >
                Controlar
              </Button>

              <Button
                size="small"
                fullWidth={isMobile}
                color="warning"
                variant="contained"
                onClick={() => changeStatus(order.id, "PREPARING")}
              >
                Vuelve Deposito
              </Button>
            </Stack>
          );
        },
      },
    ],
    [isMobile],
  );

  /* ============================================================
RENDER
============================================================ */

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* HEADER */}

      <Stack
        direction={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Control de Pedidos
          </Typography>

          <Typography variant="subtitle1" color="text.secondary">
            Usuario: {loggedUser?.full_name || "Usuario"}
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate(-1)}>
          ← Volver
        </Button>
      </Stack>

      {/* TABLA */}

      <Box sx={{ width: "100%", height: { xs: "auto", md: 520 } }}>
        <DataGrid
          rows={orders}
          columns={columns}
          getRowId={(r) => r.id}
          autoHeight={isMobile}
          rowHeight={isMobile ? 80 : 52}
          disableRowSelectionOnClick
        />
      </Box>

      {/* CHECKLIST */}

      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        fullWidth
        maxWidth="sm"
        fullScreen={fullScreen}
      >
        <DialogTitle>Control Pedido #{selectedOrder?.id}</DialogTitle>

        <DialogContent dividers>
          <Typography fontWeight="bold">
            Cliente: {selectedOrder?.client.name}
          </Typography>

          <Typography variant="caption">
            {checkedItems.length} / {selectedOrder?.items.length} controlados
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Button size="small" onClick={markAll}>
            Marcar todo
          </Button>

          <Stack spacing={1.2} mt={1}>
            {selectedOrder?.items.map((item, index) => {
              const checked = checkedItems.includes(index);

              return (
                <Box
                  key={index}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: checked ? "#e8f5e9" : "transparent",
                  }}
                >
                  <Typography>
                    {item.quantity}x {item.product.description}
                  </Typography>

                  <Checkbox
                    checked={checked}
                    onChange={() => handleCheck(index)}
                  />
                </Box>
              );
            })}
          </Stack>

          <Typography mt={2} fontWeight="bold">
            Observaciones: {selectedOrder?.observations || "—"}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setSelectedOrder(null)}>Cancelar</Button>

          <Button
            variant="contained"
            color="success"
            disabled={!allChecked}
            onClick={() => setConfirmOpen(true)}
          >
            Control OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRMACION */}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirmar Control</DialogTitle>

        <DialogContent>
          <Typography>
            Confirmar control del pedido #{selectedOrder?.id} de{" "}
            <b>{selectedOrder?.client.name}</b>
          </Typography>

          <Typography mt={1}>
            Items controlados: {checkedItems.length}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>

          <Button
            variant="contained"
            color="success"
            disabled={loading}
            onClick={() => {
              if (selectedOrder) {
                changeStatus(selectedOrder.id, "QUALITY_CHECKED");
              }

              setConfirmOpen(false);
            }}
          >
            {loading ? <CircularProgress size={22} /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
