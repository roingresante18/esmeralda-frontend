import type {
  NotificationChannel,
  NotificationEvent,
} from "../types/communications.types";

export const notificationEventLabels: Record<NotificationEvent, string> = {
  ORDER_CONFIRMED: "Pedido confirmado",

  ORDER_IN_DELIVERY: "Pedido enviado a reparto",

  ORDER_DELIVERED: "Pedido entregado",

  ORDER_PARTIAL_DELIVERED: "Entrega parcial",

  ORDER_RESCHEDULED: "Entrega reprogramada",

  ORDER_NOT_DELIVERED: "Pedido no entregado",
};

export const notificationEventDescriptions: Record<NotificationEvent, string> =
  {
    ORDER_CONFIRMED: "Se informa al cliente cuando el pedido es confirmado.",

    ORDER_IN_DELIVERY:
      "Se informa cuando el pedido es asignado e ingresa al proceso de reparto.",

    ORDER_DELIVERED: "Se informa cuando la entrega se completa correctamente.",

    ORDER_PARTIAL_DELIVERED:
      "Se informa cuando solamente una parte del pedido pudo ser entregada.",

    ORDER_RESCHEDULED:
      "Se informa cuando la entrega debe realizarse en otra fecha.",

    ORDER_NOT_DELIVERED:
      "Se informa cuando el intento de entrega no pudo completarse.",
  };

export const notificationChannelLabels: Record<NotificationChannel, string> = {
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
};

export const notificationEvents: NotificationEvent[] = [
  "ORDER_CONFIRMED",
  "ORDER_IN_DELIVERY",
  "ORDER_DELIVERED",
  "ORDER_PARTIAL_DELIVERED",
  "ORDER_RESCHEDULED",
  "ORDER_NOT_DELIVERED",
];

export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as {
      response?: {
        data?: {
          message?:
            | string
            | {
                message?: string;
              };
        };
      };
    };

    const message = axiosError.response?.data?.message;

    if (typeof message === "string") {
      return message;
    }

    if (typeof message === "object" && message?.message) {
      return message.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado";
}
