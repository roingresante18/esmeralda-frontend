// components/OrderCard.tsx
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import type { Order } from "../hooks/useDriverOrders";
import api from "../../../api/api";
import { useState, useMemo } from "react";

/**
 * Props tipadas correctamente.
 * El componente NO conoce la lógica global.
 * Solo recibe lo necesario.
 */
interface OrderCardProps {
  order: Order;
  onStartDelivery: () => void;
  onConfirmDelivery: () => void;
  onToggleProduct: (orderId: number, productId: number) => void;
  onRefresh: () => void;
}

/**
 * Componente presentacional + acciones controladas.
 * No guarda estado global.
 */
export const OrderCard = ({
  order,
  onConfirmDelivery,
  onToggleProduct,
  onRefresh,
}: OrderCardProps) => {
  const [loading, setLoading] = useState(false);

  /**
   * Memoización para evitar recalcular en cada render.
   */
  const allProductsDelivered = useMemo(() => {
    if (!order.products || order.products.length === 0) return true;
    return order.products.every((p) => p.delivered === true);
  }, [order.products]);

  /**
   * Cambia estado ASSIGNED -> IN_DELIVERY
   * Maneja errores correctamente.
   */
  const handleStartDelivery = async () => {
    try {
      setLoading(true);

      await api.patch(`/orders/${order.id}/status`, {
        new_status: "IN_DELIVERY",
      });

      onRefresh();
    } catch (err) {
      console.error("Error iniciando entrega:", err);
      alert("No se pudo iniciar el reparto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1}>
          {/* =============================
              Información principal
          ============================== */}

          <Typography fontWeight="bold">Pedido #{order.id}</Typography>

          <Typography>Cliente: {order.client.name}</Typography>

          <Typography>Municipio: {order.client.municipality}</Typography>

          <Typography>Zona: {order.client.zone}</Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>Método:</Typography>
            <Chip
              label={order.payment_method}
              size="small"
              color={
                order.payment_method === "CASH"
                  ? "success"
                  : order.payment_method === "TRANSFER"
                    ? "info"
                    : "warning"
              }
            />
          </Stack>

          <Typography fontWeight="bold" fontSize="1.1rem">
            ${Number(order.total_amount).toLocaleString("es-AR")}
          </Typography>

          {/* =============================
              Productos
          ============================== */}

          {order.products?.map((product) => (
            <FormControlLabel
              key={product.id}
              control={
                <Checkbox
                  checked={product.delivered || false}
                  onChange={() => onToggleProduct(order.id, product.id)}
                />
              }
              label={product.name}
            />
          ))}

          {/* =============================
              Acciones por estado
          ============================== */}

          {order.status === "ASSIGNED" && (
            <Button
              variant="contained"
              color="warning"
              onClick={handleStartDelivery}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : "Salir a repartir"}
            </Button>
          )}

          {order.status === "IN_DELIVERY" && (
            <Button
              variant="contained"
              color="success"
              disabled={!allProductsDelivered}
              onClick={onConfirmDelivery}
            >
              Entregado
            </Button>
          )}

          {order.status === "DELIVERED" && (
            <Chip label="Entregado" color="success" variant="outlined" />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
