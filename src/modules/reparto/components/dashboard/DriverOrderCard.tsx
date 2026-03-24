import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import MapIcon from "@mui/icons-material/Map";
import NavigationIcon from "@mui/icons-material/Navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PaidIcon from "@mui/icons-material/Paid";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import type { DeliveryOrder } from "../../types/delivery.types";
import { StatusChip } from "../shared/StatusChip";

interface Props {
  order: DeliveryOrder;
  onOpenDetail: (order: DeliveryOrder) => void;
  onStartDelivery: (order: DeliveryOrder) => void;
  loading?: boolean;
}

const getTargetGps = (order: DeliveryOrder) =>
  order.orderGps ?? order.customerGps;

const getAlreadyPaid = (order: DeliveryOrder) =>
  Number(order.paymentSummary?.total_paid ?? 0);

const getPendingAmount = (order: DeliveryOrder) =>
  Math.max(0, Number(order.amountToCharge ?? 0) - getAlreadyPaid(order));

export const DriverOrderCard = ({
  order,
  onOpenDetail,
  onStartDelivery,
  loading = false,
}: Props) => {
  const gps = getTargetGps(order);
  const alreadyPaid = getAlreadyPaid(order);
  const pendingAmount = getPendingAmount(order);

  const openMaps = () => {
    if (!gps) return;

    window.open(
      `https://www.google.com/maps?q=${gps.lat},${gps.lng}`,
      "_blank",
    );
  };

  const navigateTo = () => {
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
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 1.6, "&:last-child": { pb: 1.6 } }}>
        <Stack spacing={1.2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1}
          >
            <Stack spacing={0.35} minWidth={0}>
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
              icon={<PaidIcon />}
              label={`Total $${Number(order.amountToCharge).toLocaleString("es-AR")}`}
              color="success"
              size="small"
            />

            <Chip label={order.paymentMethod} size="small" variant="outlined" />

            {alreadyPaid > 0 && (
              <Chip
                label={`Adelanto $${alreadyPaid.toLocaleString("es-AR")}`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}

            <Chip
              label={`Saldo $${pendingAmount.toLocaleString("es-AR")}`}
              size="small"
              color={pendingAmount > 0 ? "warning" : "success"}
              variant={pendingAmount > 0 ? "filled" : "outlined"}
            />

            <Chip
              icon={<MyLocationIcon />}
              label={
                order.orderGps
                  ? "GPS operativo"
                  : order.customerGps
                    ? "GPS cliente"
                    : "Sin GPS"
              }
              size="small"
              color={gps ? "info" : "default"}
              variant={gps ? "filled" : "outlined"}
            />

            {order.routeOrder ? (
              <Chip label={`Ruta ${order.routeOrder}`} size="small" />
            ) : null}
          </Stack>

          {(order.notes ?? "").trim() ? (
            <>
              <Divider />
              <Typography variant="body2" color="text.secondary">
                {order.notes}
              </Typography>
            </>
          ) : null}

          <Stack direction="row" spacing={1}>
            {order.phone ? (
              <IconButton color="primary" href={`tel:${order.phone}`}>
                <CallIcon />
              </IconButton>
            ) : (
              <IconButton color="primary" disabled>
                <CallIcon />
              </IconButton>
            )}

            <IconButton color="primary" onClick={openMaps} disabled={!gps}>
              <MapIcon />
            </IconButton>

            <IconButton color="primary" onClick={navigateTo} disabled={!gps}>
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
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : undefined
                }
              >
                {loading ? "Iniciando..." : "Iniciar reparto"}
              </Button>
            )}

            <Button
              variant="outlined"
              fullWidth
              onClick={() => onOpenDetail(order)}
              disabled={loading}
            >
              Ver detalle
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
