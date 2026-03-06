// DriverOrders.tsx
import {
  Container,
  Typography,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { useDriverOrders, type Order } from "./hooks/useDriverOrders";
import { KpiSummary } from "./components/KpiSummary";
import { DeliveryConfirmationDialog } from "./components/DeliveryConfirmationDialog";
import { OrderCard } from "./components/OrderCard";

/**
 * DriverOrders
 *
 * Componente orquestador principal.
 * NO contiene lógica de negocio pesada.
 * Solo coordina:
 *  - Hook de datos
 *  - Render de tarjetas
 *  - Apertura de diálogo
 *  - Refresh global
 */
export default function DriverOrders() {
  /**
   * Hook personalizado que contiene:
   * - Fetch
   * - Polling inteligente
   * - KPIs
   * - Toggle de productos
   */
  const { orders, loading, error, fetchOrders, toggleProductDelivered, kpis } =
    useDriverOrders();

  /**
   * Pedido seleccionado para confirmación
   * Tipado fuerte (NO any)
   */
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* =============================
          HEADER
      ============================== */}
      <Typography variant="h4" fontWeight="bold" mb={3}>
        🚚 Reparto del día
      </Typography>

      {/* =============================
          ESTADO DE CARGA
      ============================== */}
      {loading && (
        <Stack alignItems="center" my={4}>
          <CircularProgress />
        </Stack>
      )}

      {/* =============================
          ERROR STATE
      ============================== */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* =============================
          KPIs
      ============================== */}
      <KpiSummary kpis={kpis} />

      {/* =============================
          LISTA DE PEDIDOS
      ============================== */}
      <Stack spacing={2} mt={3}>
        {orders.length === 0 && !loading && (
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
            onStartDelivery={() => {}}
            // onStartDelivery quedó preparado por si querés mover esa lógica al padre
            onRefresh={fetchOrders}
          />
        ))}
      </Stack>

      {/* =============================
          DIALOG CONFIRMAR ENTREGA
      ============================== */}
      {selectedOrder && (
        <DeliveryConfirmationDialog
          open={Boolean(selectedOrder)}
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            /**
             * Importante:
             * - Refrescamos pedidos
             * - Cerramos modal
             * Esto asegura sincronización con backend
             */
            fetchOrders();
            setSelectedOrder(null);
          }}
        />
      )}
    </Container>
  );
}
