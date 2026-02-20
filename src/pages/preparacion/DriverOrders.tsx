import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Stack,
  // Box,
  Button,
  // Chip,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
// import LocalShippingIcon from "@mui/icons-material/LocalShipping";
// import PaidIcon from "@mui/icons-material/Paid";
import api from "../../api/api";

/* ============================================================
   TYPES
============================================================ */

interface Order {
  id: number;
  status: string;
  client: {
    name: string;
    phone: string;
    municipality: string;
    zone: string;
  };
  total_amount: number;
  payment_method: "CASH" | "TRANSFER" | "BOTH";
  delivery_date: string;
}

/* ============================================================
   MUNICIPIOS EN ORDEN PREDEFINIDO
============================================================ */

const MUNICIPALITY_ORDER = ["Centro", "Norte", "Sur", "Este", "Oeste"];

/* ============================================================
   COMPONENT
============================================================ */

export default function DriverOrders() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [orders, setOrders] = useState<Order[]>([]);
  const [filterZone, setFilterZone] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");

  const [cashTotal, setCashTotal] = useState(0);
  const [transferTotal, setTransferTotal] = useState(0);

  /* ============================================================
     FETCH - ASSIGNED + IN_DELIVERY
  ============================================================ */

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const filtered = res.data.filter(
        (o: Order) => o.status === "ASSIGNED" || o.status === "IN_DELIVERY",
      );

      setOrders(filtered);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ============================================================
     MUNICIPIOS CON PEDIDOS
  ============================================================ */

  const municipalitiesWithOrders = useMemo(() => {
    const unique = Array.from(
      new Set(orders.map((o) => o.client.municipality)),
    );

    return MUNICIPALITY_ORDER.filter((m) => unique.includes(m));
  }, [orders]);

  /* ============================================================
     FILTROS
  ============================================================ */

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (filterZone) {
      filtered = filtered.filter((o) => o.client.zone === filterZone);
    }

    if (selectedMunicipality) {
      filtered = filtered.filter(
        (o) => o.client.municipality === selectedMunicipality,
      );
    }

    return filtered;
  }, [orders, filterZone, selectedMunicipality]);

  /* ============================================================
     STATUS HANDLER
  ============================================================ */

  const changeStatus = async (order: Order, newStatus: string) => {
    await api.patch(`/orders/${order.id}/status`, {
      new_status: newStatus,
    });

    if (newStatus === "DELIVERED") {
      if (order.payment_method === "CASH") {
        setCashTotal((prev) => prev + order.total_amount);
      } else if (order.payment_method === "TRANSFER") {
        setTransferTotal((prev) => prev + order.total_amount);
      } else {
        setCashTotal((prev) => prev + order.total_amount / 2);
        setTransferTotal((prev) => prev + order.total_amount / 2);
      }
    }

    fetchOrders();
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        🚚 Reparto
      </Typography>

      {/* RESUMEN SUPERIOR */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={3}
          justifyContent="space-between"
        >
          <Typography>Pedidos asignados: {orders.length}</Typography>

          <Typography color="success.main">
            Efectivo: ${cashTotal.toFixed(2)}
          </Typography>

          <Typography color="info.main">
            Transferencia: ${transferTotal.toFixed(2)}
          </Typography>

          <Typography fontWeight="bold">
            Total: ${(cashTotal + transferTotal).toFixed(2)}
          </Typography>
        </Stack>
      </Paper>

      {/* FILTROS */}
      <Stack direction={isMobile ? "column" : "row"} spacing={2} mb={3}>
        <TextField
          select
          label="Zona"
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="Zona 1">Zona 1</MenuItem>
          <MenuItem value="Zona 2">Zona 2</MenuItem>
        </TextField>

        <TextField
          select
          label="Municipio"
          value={selectedMunicipality}
          onChange={(e) => setSelectedMunicipality(e.target.value)}
          fullWidth
        >
          <MenuItem value="">Todos</MenuItem>
          {municipalitiesWithOrders.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* LISTA DE PEDIDOS */}
      <Stack spacing={2}>
        {filteredOrders.map((order) => (
          <Card key={order.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography fontWeight="bold">Pedido #{order.id}</Typography>

                <Typography>Cliente: {order.client.name}</Typography>

                <Typography>Tel: {order.client.phone}</Typography>

                <Typography>Monto: ${order.total_amount}</Typography>

                <Typography>Método: {order.payment_method}</Typography>

                <Stack direction="row" spacing={1}>
                  {order.status === "ASSIGNED" && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() => changeStatus(order, "IN_DELIVERY")}
                    >
                      Salir a repartir
                    </Button>
                  )}

                  {order.status === "IN_DELIVERY" && (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => changeStatus(order, "DELIVERED")}
                    >
                      Entregado
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Button
        variant="outlined"
        startIcon={<MapIcon />}
        onClick={() => navigate("/mapView")}
      >
        Ver mapa de ruta
      </Button>
    </Container>
  );
}
