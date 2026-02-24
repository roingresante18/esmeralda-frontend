import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
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
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TodayIcon from "@mui/icons-material/Today";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import api from "../../api/api";
import { formatDateOnlyAR } from "../../utils/date";

/* ============================================================
   TYPES
============================================================ */

interface Order {
  id: number;
  status: string;
  client: {
    name: string;
  };
  created_at: string;
  delivery_date: string;
  observations?: string;
}

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

  /* ============================================================
     FETCH - Solo QUALITY_CHECKED
  ============================================================ */

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const filtered = res.data.filter(
        (o: Order) => o.status === "QUALITY_CHECKED",
      );

      setOrders(filtered);
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
     HELPERS
  ============================================================ */

  const isWithin12Hours = (deliveryDate: string) => {
    const now = new Date();
    const delivery = new Date(deliveryDate);
    const diff = delivery.getTime() - now.getTime();
    return diff <= 12 * 60 * 60 * 1000 && diff > 0;
  };

  const changeStatus = async (id: number, newStatus: string) => {
    await api.patch(`/orders/${id}/status`, {
      new_status: newStatus,
    });

    fetchOrders();
  };

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredOrders = useMemo(() => {
    if (!filterDate) return orders;

    return orders.filter(
      (o) =>
        new Date(o.delivery_date).toISOString().split("T")[0] === filterDate,
    );
  }, [orders, filterDate]);

  const today = new Date().toISOString().split("T")[0];

  const todayCount = orders.filter(
    (o) => new Date(o.delivery_date).toISOString().split("T")[0] === today,
  ).length;

  /* ============================================================
     COLUMNS
  ============================================================ */

  const columns: GridColDef<Order>[] = useMemo(
    () => [
      { field: "id", headerName: "Pedido", flex: 0.5 },

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
        field: "alert",
        headerName: "Alerta",
        flex: 0.8,
        renderCell: (params) =>
          isWithin12Hours(params.row.delivery_date) ? (
            <Chip
              icon={<WarningAmberIcon />}
              label="Entrega < 12hs"
              color="warning"
              size="small"
            />
          ) : null,
      },

      {
        field: "status",
        headerName: "Estado",
        flex: 0.8,
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
        flex: 1,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="contained"
            color="primary"
            size="small"
            fullWidth={isMobile}
            onClick={() => changeStatus(params.row.id, "ASSIGNED")}
          >
            Asignar a reparto
          </Button>
        ),
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

      {/* PANEL RESUMEN */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TodayIcon color="primary" />
          <Typography fontWeight="bold">
            Pedidos para hoy: {todayCount}
          </Typography>
        </Stack>

        <TextField
          type="date"
          size="small"
          label="Filtrar por fecha"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Paper>

      {/* TABLA */}
      <Box sx={{ width: "100%", height: { xs: "auto", md: 500 } }}>
        <DataGrid
          rows={filteredOrders}
          columns={columns}
          getRowId={(r) => r.id}
          autoHeight={isMobile}
          rowHeight={isMobile ? 80 : 52}
          disableRowSelectionOnClick
        />
      </Box>

      <Divider sx={{ mt: 4 }} />

      {/*<Typography
        variant="caption"
        display="block"
        textAlign="center"
        sx={{ mt: 2 }}
      >
        Los pedidos aparecen automáticamente 12 horas antes de su entrega.
      </Typography>*/}
    </Container>
  );
}
