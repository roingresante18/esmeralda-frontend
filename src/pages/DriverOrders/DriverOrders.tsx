import {
  Container,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useDriverOrders } from "./hooks/useDriverOrders";
import type { Order } from "./types";
import { KpiSummary } from "./components/KpiSummary";
import { DeliveryConfirmationDialog } from "./components/DeliveryConfirmationDialog";
import { OrderCard } from "./components/OrderCard";

export default function DriverOrders() {
  const { orders, loading, error, fetchOrders, toggleProductDelivered, kpis } =
    useDriverOrders();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={3}>
        🚚 Reparto del día
      </Typography>

      {loading && (
        <Stack alignItems="center" my={4}>
          <CircularProgress />
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <KpiSummary kpis={kpis} />

      <Stack spacing={2} mt={3}>
        {!loading && orders.length === 0 && (
          <Typography color="text.secondary">
            No hay pedidos asignados para hoy.
          </Typography>
        )}

        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onToggleProduct={toggleProductDelivered}
            onConfirmDelivery={() => setSelectedOrder(order)}
            onRefresh={() => fetchOrders(false)}
          />
        ))}
      </Stack>

      {selectedOrder && (
        <DeliveryConfirmationDialog
          open={Boolean(selectedOrder)}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            fetchOrders(false);
            setSelectedOrder(null);
          }}
        />
      )}
    </Container>
  );
}
