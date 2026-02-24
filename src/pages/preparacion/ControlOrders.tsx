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

  /* ============================================================
     FETCH - Solo PREPARED
  ============================================================ */

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const preparedOrders = res.data.filter(
        (o: Order) => o.status === "PREPARED",
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

  /* ============================================================
     STATUS HANDLERS
  ============================================================ */

  const changeStatus = async (id: number, newStatus: string) => {
    await api.patch(`/orders/${id}/status`, {
      new_status: newStatus,
    });

    fetchOrders();
    setSelectedOrder(null);
  };

  /* ============================================================
     CHECKLIST
  ============================================================ */

  const handleCheck = (index: number) => {
    setCheckedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const allChecked =
    selectedOrder && checkedItems.length === selectedOrder.items.length;

  /* ============================================================
     COLUMNS
  ============================================================ */

  const columns: GridColDef<Order>[] = useMemo(
    () => [
      { field: "id", headerName: "Pedido", flex: 0.4 },

      {
        field: "client",
        headerName: "Cliente",
        flex: 1,
        valueGetter: (_v, row) => row.client.name,
      },

      {
        field: "delivery_date",
        headerName: "Fecha entrega",
        flex: 1,
        valueGetter: (_v, row) =>
          row.delivery_date ? formatDateOnlyAR(row.delivery_date) : "",
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
        flex: 1.2,
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
                Ver
              </Button>

              <Button
                size="small"
                fullWidth={isMobile}
                color="warning"
                variant="contained"
                onClick={() => changeStatus(order.id, "PREPARING")}
              >
                Volver a preparar
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
      <Box sx={{ width: "100%", height: { xs: "auto", md: 500 } }}>
        <DataGrid
          rows={orders}
          columns={columns}
          getRowId={(r) => r.id}
          autoHeight={isMobile}
          rowHeight={isMobile ? 80 : 52}
          disableRowSelectionOnClick
        />
      </Box>

      {/* MODAL CHECKLIST */}
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

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            {selectedOrder?.items.map((item, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography>{item.product.description}</Typography>
                  <Typography variant="caption">
                    Cantidad: {item.quantity}
                  </Typography>
                </Box>

                <Checkbox
                  checked={checkedItems.includes(index)}
                  onChange={() => handleCheck(index)}
                />
              </Box>
            ))}
          </Stack>
          <Typography mt={2} fontWeight="bold">
            Observaciones: {selectedOrder?.observations}
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
            ¿Confirma que el pedido fue controlado con éxito?
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>

          <Button
            variant="contained"
            color="success"
            onClick={() => {
              if (selectedOrder) {
                changeStatus(selectedOrder.id, "QUALITY_CHECKED");
              }
              setConfirmOpen(false);
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
