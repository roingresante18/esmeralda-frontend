import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  Divider,
} from "@mui/material";
import type { FC } from "react";
import { formatDateAR } from "../../utils/dateUtils";
import type { Order } from "../types/order";

interface Props {
  orders: Order[];
  isPrinting: boolean;
  onView: (order: Order) => void;
  onPrint: (order: Order) => void;
  onMarkPrepared: (id: number) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "info";
    case "PREPARING":
      return "warning";
    case "PREPARED":
      return "success";
    default:
      return "default";
  }
};

// 🔽 NUEVA FUNCIÓN PARA ALERTA DE ENTREGA
const getDeliveryAlert = (deliveryDate: string) => {
  const today = new Date();
  const delivery = new Date(deliveryDate);

  // Normalizamos horas para comparar solo fecha
  today.setHours(0, 0, 0, 0);
  delivery.setHours(0, 0, 0, 0);

  const diffInDays =
    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (diffInDays === 0) {
    return { label: "Entregar hoy", color: "error" as const };
  }

  if (diffInDays === 1) {
    return { label: "Entregar mañana", color: "warning" as const };
  }

  return null;
};

const MobileOrdersList: FC<Props> = ({
  orders,
  isPrinting,
  onView,
  onPrint,
  onMarkPrepared,
}) => {
  // 🔽 Ordenar por más recientes primero
  const sortedOrders = [...orders].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Box>
      {sortedOrders.map((order) => {
        const deliveryAlert = getDeliveryAlert(order.delivery_date);

        return (
          <Card
            key={order.id}
            sx={{
              mb: 2,
              borderRadius: 3,
              boxShadow: 3,
            }}
          >
            <CardContent>
              {/* HEADER */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography fontWeight="bold" fontSize={18}>
                  Pedido #{order.id}
                </Typography>

                <Chip
                  label={order.status}
                  color={getStatusColor(order.status)}
                  size="small"
                />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {/* ALERTA ENTREGA */}
              {deliveryAlert && (
                <>
                  <Chip
                    label={deliveryAlert.label}
                    color={deliveryAlert.color}
                    sx={{ mb: 1 }}
                  />
                </>
              )}

              {/* INFO */}
              <Stack spacing={0.5}>
                <Typography fontSize={14}>👤 {order.client.name}</Typography>

                <Typography fontSize={14}>
                  📅 {formatDateAR(order.delivery_date)}
                </Typography>
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              {/* BOTONES */}
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => onView(order)}
                >
                  Ver detalle
                </Button>

                {order.status === "CONFIRMED" && (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={isPrinting}
                    onClick={() => onPrint(order)}
                  >
                    Imprimir
                  </Button>
                )}

                {order.status === "PREPARING" && (
                  <Button
                    fullWidth
                    color="success"
                    variant="contained"
                    onClick={() => onMarkPrepared(order.id)}
                  >
                    Marcar preparado
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      {!sortedOrders.length && (
        <Typography textAlign="center" mt={4}>
          No hay pedidos
        </Typography>
      )}
    </Box>
  );
};

export default MobileOrdersList;
