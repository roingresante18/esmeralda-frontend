import { useState } from "react";
import {
  Alert,
  Container,
  Drawer,
  Stack,
  CircularProgress,
  Button,
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
    next12hCount,
  } = useDeliveryDashboard();

  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(
    null,
  );

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
        <DeliveryHeader
          driverName="Carlos Gómez"
          dateLabel={new Date().toLocaleDateString("es-AR")}
        />

        <Button variant="outlined" onClick={fetchOrders}>
          Actualizar
        </Button>

        <DeliveryAlertBanner next12hCount={next12hCount} />

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : null}

        <DeliveryKpiStrip kpis={kpis} />

        <DriverFiltersBar
          filters={filters}
          setFilters={setFilters}
          zones={zones}
          municipalities={municipalities}
        />

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
          <MunicipalityList
            groups={municipalityGroups}
            onOpenDetail={setSelectedOrder}
            onStartDelivery={handleStartDelivery}
          />
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
