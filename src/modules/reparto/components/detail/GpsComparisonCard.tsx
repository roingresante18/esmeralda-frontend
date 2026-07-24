import { Alert, Chip, Divider, Stack, Typography } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import RoomPreferencesIcon from "@mui/icons-material/RoomPreferences";
import MyLocationIcon from "@mui/icons-material/MyLocation";

import type {
  DeliveryOrder,
  DeliveryTraceability,
  GPSPoint,
} from "../../types/delivery.types";

import { formatDistanceLabel } from "../../utils/delivery.gps.metrics";
import { SectionCard } from "../shared/SectionCard";

const gpsLabel = (gps?: GPSPoint | null): string => {
  if (!gps) {
    return "No disponible";
  }

  const latitude = Number(gps.latitude);
  const longitude = Number(gps.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return "Coordenadas inválidas";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

const consistencyAlert = (
  status?: DeliveryTraceability["gpsConsistencyStatus"],
): "success" | "warning" | "error" | "info" => {
  switch (status) {
    case "OK":
      return "success";

    case "WARNING":
      return "warning";

    case "CRITICAL":
      return "error";

    case "NO_DATA":
    default:
      return "info";
  }
};

interface Props {
  order: DeliveryOrder;
}

export const GpsComparisonCard = ({ order }: Props) => {
  const traceability = order.traceability;

  return (
    <SectionCard>
      <Stack spacing={1.5}>
        <Typography fontWeight={900}>Trazabilidad GPS</Typography>

        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlaceIcon color="action" />

            <Stack>
              <Typography fontWeight={700}>GPS cliente</Typography>

              <Typography variant="body2" color="text.secondary">
                {gpsLabel(order.customerGps ?? traceability?.customerGps)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <RoomPreferencesIcon color="primary" />

            <Stack>
              <Typography fontWeight={700}>GPS operativo del pedido</Typography>

              <Typography variant="body2" color="text.secondary">
                {gpsLabel(order.orderGps ?? traceability?.orderGps)}
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <MyLocationIcon color="success" />

            <Stack>
              <Typography fontWeight={700}>GPS real de entrega</Typography>

              <Typography variant="body2" color="text.secondary">
                {gpsLabel(order.deliveredGps ?? traceability?.deliveredGps)}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider />

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            size="small"
            label={`Cliente → Pedido: ${formatDistanceLabel(
              traceability?.distanceCustomerToOrderMeters,
            )}`}
            variant="outlined"
          />

          <Chip
            size="small"
            label={`Pedido → Entrega: ${formatDistanceLabel(
              traceability?.distanceOrderToDeliveredMeters,
            )}`}
            variant="outlined"
          />

          <Chip
            size="small"
            label={`Cliente → Entrega: ${formatDistanceLabel(
              traceability?.distanceCustomerToDeliveredMeters,
            )}`}
            variant="outlined"
          />
        </Stack>

        <Alert
          severity={consistencyAlert(traceability?.gpsConsistencyStatus)}
          sx={{ borderRadius: 3 }}
        >
          {traceability?.gpsConsistencyMessage ?? "Sin evaluación GPS."}
        </Alert>
      </Stack>
    </SectionCard>
  );
};
