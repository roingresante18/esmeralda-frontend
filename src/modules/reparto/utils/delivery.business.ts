import type { DeliveryOrder, DeliveryProduct } from "../types/delivery.types";

export const validateOrderBeforeConfirmation = (order: DeliveryOrder) => {
  if (!order.deliveryDate)
    return "No se puede confirmar pedido sin fecha de entrega.";
  return null;
};

export const getDerivedDeliveryStatus = (
  products: DeliveryProduct[],
): "DELIVERED" | "PARTIAL_DELIVERED" | "PENDING_DELIVERY" => {
  if (!products.length) return "DELIVERED";

  const deliveredQty = products.reduce(
    (acc, p) => acc + p.quantityDelivered,
    0,
  );
  const orderedQty = products.reduce((acc, p) => acc + p.quantityOrdered, 0);

  if (deliveredQty === 0) return "PENDING_DELIVERY";
  if (deliveredQty < orderedQty) return "PARTIAL_DELIVERED";
  return "DELIVERED";
};

export const validateDeliveryConfirmation = (
  hasGps: boolean,
  status: string,
  products: DeliveryProduct[],
) => {
  if (!hasGps) return "Debés capturar el GPS real antes de confirmar.";

  if (status === "PARTIAL_DELIVERED") {
    const hasPartial = products.some(
      (p) => p.quantityDelivered > 0 && p.quantityDelivered < p.quantityOrdered,
    );
    const hasFullAndMissing =
      products.some((p) => p.quantityDelivered === 0) ||
      products.some((p) => p.quantityDelivered < p.quantityOrdered);

    if (!hasPartial && !hasFullAndMissing) {
      return "La entrega parcial requiere productos entregados y productos pendientes.";
    }
  }

  return null;
};
