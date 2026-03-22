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
  Alert,
} from "@mui/material";
import { useMemo, useState } from "react";
import api from "../../../api/api";
import type { Order } from "../types";

interface OrderCardProps {
  order: Order;
  onConfirmDelivery: () => void;
  onToggleProduct: (orderId: number, productId: number) => void;
  onRefresh: () => Promise<void> | void;
}

const getStatusLabel = (status: Order["status"]) => {
  switch (status) {
    case "ASSIGNED":
      return "Asignado";
    case "IN_DELIVERY":
      return "En reparto";
    case "DELIVERED":
      return "Entregado";
    default:
      return status;
  }
};

export const OrderCard = ({
  order,
  onConfirmDelivery,
  onToggleProduct,
  onRefresh,
}: OrderCardProps) => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const allProductsDelivered = useMemo(() => {
    if (!order.products.length) return true;
    return order.products.every((p) => p.delivered);
  }, [order.products]);

  const handleStartDelivery = async () => {
    try {
      setLoading(true);
      setLocalError(null);

      await api.patch(`/orders/${order.id}/status`, {
        new_status: "IN_DELIVERY",
      });

      await onRefresh();
    } catch (err) {
      console.error("Error iniciando entrega:", err);
      setLocalError("No se pudo iniciar el reparto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography fontWeight="bold">Pedido #{order.id}</Typography>

            <Chip
              label={getStatusLabel(order.status)}
              size="small"
              color={
                order.status === "ASSIGNED"
                  ? "warning"
                  : order.status === "IN_DELIVERY"
                    ? "info"
                    : "success"
              }
            />
          </Stack>

          {localError && <Alert severity="error">{localError}</Alert>}

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

          {!!order.products.length && (
            <Stack>
              {order.products.map((product) => (
                <FormControlLabel
                  key={product.id}
                  control={
                    <Checkbox
                      checked={product.delivered}
                      disabled={order.status === "DELIVERED"}
                      onChange={() => onToggleProduct(order.id, product.id)}
                    />
                  }
                  label={product.name}
                />
              ))}
            </Stack>
          )}

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
