import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Drawer,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import type { DeliveryOrder } from "../types/delivery.types";
import { useDeliveryDashboard } from "../hooks/useDeliveryDashboard";
import { useMunicipalityOrders } from "../hooks/useMunicipalityOrders";
import { useGeoLocationCapture } from "../hooks/useGeoLocationCapture";
import { DriverOrderCard } from "../components/dashboard/DriverOrderCard";
import { EmptyState } from "../components/shared/EmptyState";
import { DeliveryOrderDetailPage } from "./DeliveryOrderDetailPage";
import { deliveryApi } from "../api/delivery.api";

export default function MunicipalityOrdersPage() {
  const navigate = useNavigate();
  const params = useParams();
  const municipality = decodeURIComponent(params.municipality ?? "");

  const { orders, loading, error, fetchOrders } = useDeliveryDashboard();
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(
    null,
  );
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    DeliveryOrder["deliveryStatus"] | "ALL"
  >("ALL");

  const { gpsPoint, captureGps, loadingGps, gpsError } =
    useGeoLocationCapture();

  const { municipalityOrders, summary, availableZones } = useMunicipalityOrders(
    {
      orders,
      municipality,
      zone: zoneFilter || undefined,
      status: statusFilter,
      driverLocation: gpsPoint
        ? { lat: gpsPoint.lat, lng: gpsPoint.lng }
        : null,
    },
  );

  const municipalityOrder = useMemo(() => {
    const found = orders.find((o) => o.municipality === municipality);
    return found?.municipalityOrder ?? "-";
  }, [orders, municipality]);

  const handleStartDelivery = async (order: DeliveryOrder) => {
    await deliveryApi.updateOrderStatus(order.id, "IN_DELIVERY");
    fetchOrders();
  };

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 1.5, md: 3 }, px: { xs: 1.2, sm: 2 } }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/reparto/municipios")}
          >
            Volver
          </Button>

          <Button variant="outlined" onClick={fetchOrders}>
            Actualizar
          </Button>
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="h5" fontWeight={900}>
            {municipality}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orden de entrega del municipio: {municipalityOrder}
          </Typography>
        </Stack>

        <Stack
          spacing={1}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography fontWeight={800}>Progreso del municipio</Typography>

          <LinearProgress
            variant="determinate"
            value={summary.progress}
            sx={{ height: 8, borderRadius: 999 }}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Total ${summary.total}`} size="small" />
            <Chip
              label={`Entregados ${summary.delivered}`}
              color="success"
              size="small"
            />
            <Chip
              label={`Pendientes ${summary.pending}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`Reprogramados ${summary.rescheduled}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`No entregados ${summary.notDelivered}`}
              color="error"
              size="small"
              variant="outlined"
            />
          </Stack>
        </Stack>

        <Stack
          spacing={1.2}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography fontWeight={800}>Orden operativo</Typography>

          <Typography variant="body2" color="text.secondary">
            Se ordena por prioridad, luego por ruta y luego por cercanía si hay
            GPS del camión.
          </Typography>

          <Button
            variant="contained"
            startIcon={<MyLocationIcon />}
            onClick={captureGps}
            disabled={loadingGps}
            fullWidth
          >
            {loadingGps
              ? "Capturando ubicación del camión..."
              : "Usar ubicación actual del camión"}
          </Button>

          {gpsPoint ? (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              Ubicación del camión capturada. El orden ahora prioriza cercanía.
            </Alert>
          ) : null}

          {gpsError ? (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {gpsError}
            </Alert>
          ) : null}
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
          <TextField
            select
            size="small"
            label="Zona"
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            fullWidth
          >
            <MenuItem value="">Todas</MenuItem>
            {availableZones.map((zone) => (
              <MenuItem key={zone} value={zone}>
                {zone}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Estado"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as DeliveryOrder["deliveryStatus"] | "ALL",
              )
            }
            fullWidth
          >
            <MenuItem value="ALL">Todos</MenuItem>
            <MenuItem value="ASSIGNED">Asignado</MenuItem>
            <MenuItem value="IN_DELIVERY">En reparto</MenuItem>
            <MenuItem value="DELIVERED">Entregado</MenuItem>
            <MenuItem value="PARTIAL_DELIVERED">Entrega parcial</MenuItem>
            <MenuItem value="RESCHEDULED">Reprogramado</MenuItem>
            <MenuItem value="NOT_DELIVERED">No entregado</MenuItem>
          </TextField>
        </Stack>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Stack alignItems="center" py={5}>
            <CircularProgress />
          </Stack>
        ) : municipalityOrders.length === 0 ? (
          <EmptyState
            title="No hay pedidos en este municipio"
            description="Probá otro filtro o revisá las asignaciones."
          />
        ) : (
          <Stack spacing={1.2}>
            {municipalityOrders.map((order) => (
              <DriverOrderCard
                key={order.id}
                order={order}
                onOpenDetail={setSelectedOrder}
                onStartDelivery={handleStartDelivery}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Drawer
        anchor="right"
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 520 },
          },
        }}
      >
        {selectedOrder ? (
          <DeliveryOrderDetailPage
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onSuccess={() => {
              setSelectedOrder(null);
              fetchOrders();
            }}
          />
        ) : null}
      </Drawer>
    </Container>
  );
}
