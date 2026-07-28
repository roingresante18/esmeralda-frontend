import {
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
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
}

const formatCurrency = (value: number): string =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDeliveryDate = (value?: string | null): string => {
  if (!value) {
    return "Sin fecha programada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const getTotalPendingProducts = (order: DeliveryOrder): number =>
  order.products.reduce(
    (total, product) => total + Number(product.quantityPending || 0),
    0,
  );

export const DriverOrderCard = ({ order, onOpenDetail }: Props) => {
  const gps = order.orderGps ?? order.customerGps;

  const callHref = order.phone ? `tel:${order.phone}` : null;

  const totalPendingProducts = getTotalPendingProducts(order);

  const openMaps = () => {
    if (!gps) {
      return;
    }

    const url = new URL("https://www.google.com/maps");

    url.searchParams.set("q", `${gps.latitude},${gps.longitude}`);

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const navigateTo = () => {
    if (!gps) {
      return;
    }

    const url = new URL("https://www.google.com/maps/dir/");

    url.searchParams.set("api", "1");

    url.searchParams.set("destination", `${gps.latitude},${gps.longitude}`);

    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1.5px solid",
        borderColor: "info.main",
        backgroundColor: "rgba(25, 118, 210, 0.06)",
      }}
    >
      <CardContent>
        <Stack spacing={1.25}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1}
          >
            <Stack spacing={0.4} minWidth={0}>
              <Typography fontWeight={900} noWrap>
                Pedido #{order.id}
              </Typography>

              <Typography fontWeight={700} noWrap>
                {order.customerName}
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

          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            <Chip
              label={formatCurrency(order.amountToCharge)}
              color="success"
              size="small"
            />

            <Chip
              label={`Pago: ${order.paymentMethod}`}
              size="small"
              variant="outlined"
            />

            <Chip
              label={`Pendiente: ${totalPendingProducts}`}
              size="small"
              color={totalPendingProducts > 0 ? "warning" : "success"}
              variant="outlined"
            />

            {order.routeOrder != null ? (
              <Chip label={`Ruta ${order.routeOrder}`} size="small" />
            ) : null}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            Entrega programada: {formatDeliveryDate(order.deliveryDate)}
          </Typography>

          <Stack direction="row" spacing={0.75}>
            {callHref ? (
              <IconButton
                color="primary"
                component="a"
                href={callHref}
                aria-label={`Llamar a ${order.customerName}`}
              >
                <CallIcon />
              </IconButton>
            ) : (
              <IconButton
                color="primary"
                disabled
                aria-label="Cliente sin teléfono"
              >
                <CallIcon />
              </IconButton>
            )}

            <IconButton
              color="primary"
              onClick={openMaps}
              disabled={!gps}
              aria-label="Ver ubicación en el mapa"
            >
              <MapIcon />
            </IconButton>

            <IconButton
              color="primary"
              onClick={navigateTo}
              disabled={!gps}
              aria-label="Navegar hasta el cliente"
            >
              <NavigationIcon />
            </IconButton>

            <IconButton
              color="primary"
              onClick={() => onOpenDetail(order)}
              aria-label="Ver detalle del pedido"
            >
              <VisibilityIcon />
            </IconButton>
          </Stack>

          {!gps ? (
            <Typography variant="caption" color="warning.main" fontWeight={700}>
              El pedido no tiene coordenadas disponibles.
            </Typography>
          ) : null}

          <Button
            variant="contained"
            fullWidth
            onClick={() => onOpenDetail(order)}
          >
            Gestionar entrega
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
