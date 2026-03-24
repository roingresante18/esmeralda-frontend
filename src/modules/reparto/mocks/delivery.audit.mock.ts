import type { DeliveryAuditEvent } from "../types/delivery.types";

export const buildMockAuditEvents = (orderId: number): DeliveryAuditEvent[] => [
  {
    id: `evt-${orderId}-1`,
    type: "ORDER_CONFIRMED_FOR_DELIVERY",
    title: "Pedido confirmado para reparto",
    description:
      "Se cargó fecha de entrega, método de pago y GPS operativo del pedido.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    createdBy: "Logística",
  },
  {
    id: `evt-${orderId}-2`,
    type: "ORDER_ASSIGNED_TO_DRIVER",
    title: "Pedido asignado al chofer",
    description: "El pedido quedó disponible en el reparto del día.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    createdBy: "Sistema",
  },
  {
    id: `evt-${orderId}-3`,
    type: "DRIVER_STARTED_ROUTE",
    title: "Chofer inició recorrido",
    description: "El pedido pasó a estado En reparto.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    createdBy: "Chofer",
  },
];
