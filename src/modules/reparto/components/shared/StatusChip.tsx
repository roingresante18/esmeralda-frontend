import { Chip } from "@mui/material";
import type { DeliveryStatus } from "../../types/delivery.types";

const statusMap: Record<
  DeliveryStatus,
  { label: string; color: "default" | "success" | "warning" | "error" | "info" }
> = {
  ASSIGNED: { label: "Asignado", color: "default" },
  IN_DELIVERY: { label: "En reparto", color: "info" },
  DELIVERED: { label: "Entregado", color: "success" },
  PARTIAL_DELIVERED: { label: "Entrega parcial", color: "warning" },
  PENDING_DELIVERY: { label: "Pendiente", color: "default" },
  RESCHEDULED: { label: "Reprogramado", color: "warning" },
  NOT_DELIVERED: { label: "No entregado", color: "error" },
};

export const StatusChip = ({ status }: { status: DeliveryStatus }) => {
  const config = statusMap[status];
  return <Chip label={config.label} color={config.color} size="small" />;
};
