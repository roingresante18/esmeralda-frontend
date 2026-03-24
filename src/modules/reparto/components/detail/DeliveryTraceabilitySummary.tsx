import { Alert, Chip, Stack, Typography } from "@mui/material";
import type { DeliveryOrder } from "../../types/delivery.types";
import { formatDistanceLabel } from "../../utils/delivery.gps.metrics";
import { SectionCard } from "../shared/SectionCard";

interface Props {
  order: DeliveryOrder;
}

export const DeliveryTraceabilitySummary = ({ order }: Props) => {
  const traceability = order.traceability;

  const severity =
    traceability?.gpsConsistencyStatus === "OK"
      ? "success"
      : traceability?.gpsConsistencyStatus === "WARNING"
        ? "warning"
        : traceability?.gpsConsistencyStatus === "CRITICAL"
          ? "error"
          : "info";

  return (
    <SectionCard>
      <Stack spacing={1.2}>
        <Typography fontWeight={900}>Resumen de control GPS</Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            size="small"
            label={`Cliente/Pedido: ${formatDistanceLabel(
              traceability?.distanceCustomerToOrderMeters,
            )}`}
            variant="outlined"
          />
          <Chip
            size="small"
            label={`Pedido/Entrega: ${formatDistanceLabel(
              traceability?.distanceOrderToDeliveredMeters,
            )}`}
            variant="outlined"
          />
        </Stack>

        <Alert severity={severity} sx={{ borderRadius: 3 }}>
          {traceability?.gpsConsistencyMessage ?? "Sin evaluación disponible."}
        </Alert>
      </Stack>
    </SectionCard>
  );
};
