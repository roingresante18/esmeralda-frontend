import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Stack,
  Button,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  Box,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import api from "../../api/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
/* ============================================================
   TYPES
============================================================ */

interface Order {
  id: number;
  status: string;
  client: {
    id: number;
    name: string;
    phone: string;
    municipality: string;
    zone: string;
  };
  total_amount: number;
  payment_method: "CASH" | "TRANSFER" | "BOTH";
  delivery_date: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
}

const MUNICIPALITY_ORDER = ["Centro", "Norte", "Sur", "Este", "Oeste"];

/* ============================================================
   COMPONENT
============================================================ */

export default function DriverOrders() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterZone, setFilterZone] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  /* ============================================================
     FETCH - SOLO PEDIDOS DE HOY
  ============================================================ */

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const today = new Date().toISOString().split("T")[0];

      const filtered = res.data.filter((o: Order) => {
        const deliveryDay = new Date(o.delivery_date)
          .toISOString()
          .split("T")[0];

        return (
          deliveryDay === today &&
          (o.status === "ASSIGNED" ||
            o.status === "IN_DELIVERY" ||
            o.status === "DELIVERED")
        );
      });

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
     FILTROS
  ============================================================ */

  const municipalitiesWithOrders = useMemo(() => {
    const unique = Array.from(
      new Set(orders.map((o) => o.client.municipality)),
    );
    return MUNICIPALITY_ORDER.filter((m) => unique.includes(m));
  }, [orders]);

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
     SEPARACIÓN PENDIENTES / ENTREGADOS
  ============================================================ */

  const pendingOrders = filteredOrders.filter(
    (o) => o.status === "ASSIGNED" || o.status === "IN_DELIVERY",
  );

  const deliveredOrders = filteredOrders.filter(
    (o) => o.status === "DELIVERED",
  );

  /* ============================================================
     KPI PROFESIONALES
  ============================================================ */

  const { estimatedTotal, deliveredTotal, cashTotal, transferTotal, progress } =
    useMemo(() => {
      let estimated = 0;
      let delivered = 0;
      let cash = 0;
      let transfer = 0;

      filteredOrders.forEach((order) => {
        const amount = Number(order.total_amount);

        estimated += amount;

        if (order.status === "DELIVERED") {
          delivered += amount;

          if (order.payment_method === "CASH") {
            cash += amount;
          } else if (order.payment_method === "TRANSFER") {
            transfer += amount;
          } else {
            cash += amount / 2;
            transfer += amount / 2;
          }
        }
      });

      const percent =
        filteredOrders.length === 0
          ? 0
          : (deliveredOrders.length / filteredOrders.length) * 100;

      return {
        estimatedTotal: estimated,
        deliveredTotal: delivered,
        cashTotal: cash,
        transferTotal: transfer,
        progress: percent,
      };
    }, [filteredOrders, deliveredOrders]);
  /* ============================================================
     DELIVERY CONFIRMATION
  ============================================================ */

  const openConfirmModal = (order: Order) => {
    setSelectedOrder(order);
    setPaymentConfirmed(false);
    setConfirmModalOpen(true);
  };

  const confirmDelivery = async () => {
    if (!selectedOrder || !paymentConfirmed) return;

    setLoadingDelivery(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const now = new Date().toISOString();

          await api.patch(`/orders/${selectedOrder.id}/deliver`, {
            new_status: "DELIVERED",
            delivery_latitude: position.coords.latitude,
            delivery_longitude: position.coords.longitude,
            gps_updated_by: loggedUser?.id,
            gps_updated_at: now,
            delivered_at: now,
            payment_confirmed: true,
          });

          setConfirmModalOpen(false);
          fetchOrders();
        } catch (err) {
          console.error("Error confirmando entrega", err);
        } finally {
          setLoadingDelivery(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setLoadingDelivery(false);
      },
      { enableHighAccuracy: true },
    );
  };

  /* ============================================================
     STATUS HANDLER
  ============================================================ */

  const changeStatus = async (order: Order, newStatus: string) => {
    await api.patch(`/orders/${order.id}/status`, {
      new_status: newStatus,
    });

    fetchOrders();
  };
  const ordersWithGps = filteredOrders.filter(
    (o) => o.delivery_latitude && o.delivery_longitude,
  );
  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        🚚 Reparto del día
      </Typography>

      {/* KPI SUPERIOR */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography fontWeight="bold">
            Progreso de ruta: {progress.toFixed(0)}%
          </Typography>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 5 }}
          />

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={3}
            justifyContent="space-between"
          >
            <Typography>
              Total estimado: $ {estimatedTotal.toLocaleString("en-ES")}
            </Typography>
            <Typography color="success.main">
              Total entregado: $ {deliveredTotal.toLocaleString("en-ES")}
            </Typography>
            <Typography color="success.main">
              Efectivo: $ {cashTotal.toLocaleString("en-ES")}
            </Typography>
            <Typography color="info.main">
              Transferencia: $ {transferTotal.toLocaleString("en-ES")}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
      {/* MAPA OPENSTREETMAP */}
      {ordersWithGps.length > 0 && (
        <Paper sx={{ mb: 4, borderRadius: 3, overflow: "hidden" }}>
          <Typography p={2} fontWeight="bold">
            📍 Pedidos georreferenciados
          </Typography>

          <MapContainer
            center={[
              ordersWithGps[0].delivery_latitude!,
              ordersWithGps[0].delivery_longitude!,
            ]}
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {ordersWithGps.map((order) => (
              <Marker
                key={order.id}
                position={[order.delivery_latitude!, order.delivery_longitude!]}
              >
                <Popup>
                  <strong>Pedido #{order.id}</strong>
                  <br />
                  Cliente: {order.client.name}
                  <br />
                  Monto: ${order.total_amount}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </Paper>
      )}
      {/* FILTROS */}
      <Stack direction={isMobile ? "column" : "row"} spacing={2} mb={4}>
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

      {/* PENDIENTES */}
      <Typography variant="h6" mb={2}>
        📦 Pendientes ({pendingOrders.length})
      </Typography>

      <Stack spacing={2} mb={4}>
        {pendingOrders.map((order) => (
          <Card key={order.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography fontWeight="bold">Pedido #{order.id}</Typography>
                <Typography>Cliente: {order.client.name}</Typography>
                <Typography component="a" href={`tel:${order.client.phone}`}>
                  Tel: {order.client.phone}
                </Typography>
                <Typography fontWeight="bold" fontSize="1.2rem">
                  ${order.total_amount}
                </Typography>

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
                      onClick={() => openConfirmModal(order)}
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

      {/* ENTREGADOS */}
      <Typography variant="h6" mb={2}>
        ✅ Entregados ({deliveredOrders.length})
      </Typography>

      <Stack spacing={2}>
        {deliveredOrders.map((order) => (
          <Card
            key={order.id}
            sx={{ borderRadius: 3, backgroundColor: "#f5f5f5" }}
          >
            <CardContent>
              <Typography fontWeight="bold">Pedido #{order.id}</Typography>
              <Typography>Cliente: {order.client.name}</Typography>
              <Typography>Monto: ${order.total_amount}</Typography>
              <Typography color="success.main">✔ Entregado</Typography>
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
      {/* MODAL CONFIRMACIÓN */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        fullWidth
      >
        <DialogTitle>Confirmar entrega</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            ¿Confirmás que el pedido fue entregado?
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={paymentConfirmed}
                onChange={(e) => setPaymentConfirmed(e.target.checked)}
              />
            }
            label="Confirmo que el pago fue recibido"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModalOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!paymentConfirmed || loadingDelivery}
            onClick={confirmDelivery}
          >
            {loadingDelivery ? (
              <CircularProgress size={20} />
            ) : (
              "Confirmar entrega"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
