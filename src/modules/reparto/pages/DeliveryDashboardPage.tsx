import { useState } from "react";
import {
  Alert,
  Container,
  Drawer,
  Stack,
  CircularProgress,
  Button,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useDeliveryDashboard } from "../hooks/useDeliveryDashboard";
import { DriverFiltersBar } from "../components/dashboard/DriverFiltersBar";
import { DeliveryKpiStrip } from "../components/dashboard/DeliveryKpiStrip";
import { MunicipalityList } from "../components/dashboard/MunicipalityList";
import { DeliveryHeader } from "../components/dashboard/DeliveryHeader";
import { DeliveryAlertBanner } from "../components/dashboard/DeliveryAlertBanner";
import { EmptyState } from "../components/shared/EmptyState";
import type { DeliveryOrder } from "../types/delivery.types";
import { deliveryApi } from "../api/delivery.api";
import { DeliveryOrderDetailPage } from "./DeliveryOrderDetailPage";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { useNavigate } from "react-router-dom";

export default function DeliveryDashboardPage() {
  const {
    municipalityGroups,
    loading,
    error,
    fetchOrders,
    filters,
    setFilters,
    kpis,
    zones,
    municipalities,
    municipalitiesByZone,
    next12hCount,
  } = useDeliveryDashboard();

  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [startingOrderId, setStartingOrderId] = useState<number | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const safeRefresh = async () => {
    setActionError(null);
    try {
      await fetchOrders();
    } catch (e) {
      console.error(e);
      setActionError("No se pudo actualizar el tablero.");
    }
  };

  const handleStartDelivery = async (order: DeliveryOrder) => {
    try {
      setActionError(null);
      setStartingOrderId(order.id);

      await deliveryApi.updateOrderStatus(order.id, "IN_DELIVERY");
      await fetchOrders();
    } catch (e) {
      console.error(e);
      setActionError("No se pudo iniciar el reparto del pedido.");
    } finally {
      setStartingOrderId(null);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 1.25, sm: 1.5, md: 3 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Stack spacing={1.5}>
        <DeliveryHeader
          driverName={loggedUser?.full_name || "Usuario"}
          dateLabel={new Date().toLocaleDateString("es-AR")}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: "100%" }}
        >
          {/* <Button
            variant="outlined"
            startIcon={<AltRouteIcon />}
            onClick={() => navigate("/reparto/municipios")}
            fullWidth
          >
            Ver municipios
          </Button> */}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={safeRefresh}
            fullWidth
          >
            Actualizar
          </Button>

          <Button
            variant="contained"
            startIcon={<FilterAltIcon />}
            onClick={() => setFiltersOpen(true)}
            fullWidth
          >
            Filtros
          </Button>
        </Stack>

        <DeliveryAlertBanner next12hCount={next12hCount} />

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : null}

        {actionError ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {actionError}
          </Alert>
        ) : null}

        <DeliveryKpiStrip kpis={kpis} />

        {!isMobile && (
          <DriverFiltersBar
            filters={filters}
            setFilters={setFilters}
            zones={zones}
            municipalities={municipalities}
            municipalitiesByZone={municipalitiesByZone}
          />
        )}

        {loading ? (
          <Stack alignItems="center" py={5}>
            <CircularProgress />
          </Stack>
        ) : municipalityGroups.length === 0 ? (
          <EmptyState
            title="No hay pedidos para mostrar"
            description="Probá cambiando los filtros o verificá las asignaciones desde logística."
          />
        ) : (
          <Box>
            <MunicipalityList
              groups={municipalityGroups}
              onOpenDetail={setSelectedOrder}
              onStartDelivery={handleStartDelivery}
              startingOrderId={startingOrderId}
            />
          </Box>
        )}
      </Stack>

      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 420,
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            p: 1.2,
          },
        }}
      >
        <DriverFiltersBar
          filters={filters}
          setFilters={setFilters}
          zones={zones}
          municipalities={municipalities}
          municipalitiesByZone={municipalitiesByZone}
          onClose={() => setFiltersOpen(false)}
        />
      </Drawer>

      <Drawer
        anchor="right"
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 520 },
            maxWidth: "100%",
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
