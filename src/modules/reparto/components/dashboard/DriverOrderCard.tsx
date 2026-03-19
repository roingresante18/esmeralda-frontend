import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
  IconButton,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import MapIcon from "@mui/icons-material/Map";
import NavigationIcon from "@mui/icons-material/Navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { DeliveryOrder } from "../../types/delivery.types";
import { StatusChip } from "../shared/StatusChip";

interface Props {
  order: DeliveryOrder;
  onOpenDetail: (order: DeliveryOrder) => void;
  onStartDelivery: (order: DeliveryOrder) => void;
}

export const DriverOrderCard = ({
  order,
  onOpenDetail,
  onStartDelivery,
}: Props) => {
  const openMaps = () => {
    const gps = order.orderGps ?? order.customerGps;
    if (!gps) return;
    window.open(
      `https://www.google.com/maps?q=${gps.lat},${gps.lng}`,
      "_blank",
    );
  };

  const navigateTo = () => {
    const gps = order.orderGps ?? order.customerGps;
    if (!gps) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${gps.lat},${gps.lng}`,
      "_blank",
    );
  };

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <CardContent>
        <Stack spacing={1.2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack spacing={0.4}>
              <Typography fontWeight={800}>
                #{order.id} · {order.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.municipality} · {order.zone}
              </Typography>
            </Stack>
            <StatusChip status={order.deliveryStatus} />
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={`$${order.amountToCharge.toLocaleString("es-AR")}`}
              color="success"
              size="small"
            />
            <Chip label={order.paymentMethod} size="small" variant="outlined" />
            {order.routeOrder ? (
              <Chip label={`Ruta ${order.routeOrder}`} size="small" />
            ) : null}
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton
              color="primary"
              href={order.phone ? `tel:${order.phone}` : undefined}
            >
              <CallIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={openMaps}
              disabled={!order.orderGps && !order.customerGps}
            >
              <MapIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={navigateTo}
              disabled={!order.orderGps && !order.customerGps}
            >
              <NavigationIcon />
            </IconButton>
            <IconButton color="primary" onClick={() => onOpenDetail(order)}>
              <VisibilityIcon />
            </IconButton>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {order.deliveryStatus === "ASSIGNED" && (
              <Button
                variant="contained"
                color="warning"
                fullWidth
                onClick={() => onStartDelivery(order)}
              >
                Iniciar reparto
              </Button>
            )}

            <Button
              variant="outlined"
              fullWidth
              onClick={() => onOpenDetail(order)}
            >
              Ver detalle
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
