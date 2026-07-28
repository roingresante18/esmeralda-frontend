import type {
  DeliveryOrder,
  DeliveryProduct,
  DeliveryResultStatus,
} from "../types/delivery.types";

/**
 * Verifica que el pedido tenga los datos mínimos necesarios
 * antes de permitir registrar un intento de entrega.
 */
export const validateOrderBeforeConfirmation = (
  order: DeliveryOrder,
): string | null => {
  if (!order.deliveryDate) {
    return "No se puede confirmar el pedido sin fecha de entrega.";
  }

  if (order.deliveryStatus !== "IN_DELIVERY") {
    return "Solo se pueden gestionar pedidos que se encuentren en reparto.";
  }

  if (!order.products.length) {
    return "El pedido no contiene productos para entregar.";
  }

  const hasPendingProducts = order.products.some(
    (product) => Number(product.quantityPending || 0) > 0,
  );

  if (!hasPendingProducts) {
    return "El pedido no contiene cantidades pendientes de entrega.";
  }

  return null;
};

/**
 * Calcula el resultado del intento actual según las cantidades
 * entregadas en este intento.
 *
 * No utiliza quantityOrdered para determinar directamente
 * la entrega total, porque pueden existir entregas anteriores.
 */
export const getDerivedDeliveryStatus = (
  products: DeliveryProduct[],
): "DELIVERED" | "PARTIAL_DELIVERED" | "PENDING_DELIVERY" => {
  if (!products.length) {
    return "PENDING_DELIVERY";
  }

  const totalPendingBeforeAttempt = products.reduce(
    (total, product) => total + Number(product.quantityPending || 0),
    0,
  );

  const totalDeliveredThisAttempt = products.reduce(
    (total, product) => total + Number(product.quantityDelivered || 0),
    0,
  );

  if (totalDeliveredThisAttempt <= 0.0001) {
    return "PENDING_DELIVERY";
  }

  const totalPendingAfterAttempt = products.reduce((total, product) => {
    const pendingBeforeAttempt = Number(product.quantityPending || 0);

    const deliveredThisAttempt = Number(product.quantityDelivered || 0);

    return total + Math.max(pendingBeforeAttempt - deliveredThisAttempt, 0);
  }, 0);

  if (totalPendingBeforeAttempt > 0 && totalPendingAfterAttempt <= 0.0001) {
    return "DELIVERED";
  }

  return "PARTIAL_DELIVERED";
};

/**
 * Valida la coherencia completa del intento antes de enviarlo
 * al backend.
 */
export const validateDeliveryConfirmation = (
  hasGps: boolean,
  status: DeliveryResultStatus,
  products: DeliveryProduct[],
): string | null => {
  if (!hasGps) {
    return "Debés capturar el GPS real antes de confirmar.";
  }

  if (!products.length) {
    return "El pedido no contiene productos para gestionar.";
  }

  for (const product of products) {
    const quantityOrdered = Number(product.quantityOrdered || 0);

    const quantityPreviouslyDelivered = Number(
      product.quantityPreviouslyDelivered || 0,
    );

    const quantityPending = Number(product.quantityPending || 0);

    const quantityDelivered = Number(product.quantityDelivered || 0);

    if (!Number.isFinite(quantityOrdered) || quantityOrdered <= 0) {
      return `La cantidad pedida de ${product.productName} es inválida.`;
    }

    if (
      !Number.isFinite(quantityPreviouslyDelivered) ||
      quantityPreviouslyDelivered < 0 ||
      quantityPreviouslyDelivered > quantityOrdered
    ) {
      return `La cantidad entregada anteriormente de ${product.productName} es inválida.`;
    }

    if (
      !Number.isFinite(quantityPending) ||
      quantityPending < 0 ||
      quantityPending > quantityOrdered
    ) {
      return `La cantidad pendiente de ${product.productName} es inválida.`;
    }

    if (!Number.isFinite(quantityDelivered) || quantityDelivered < 0) {
      return `La cantidad entregada de ${product.productName} es inválida.`;
    }

    if (quantityDelivered > quantityPending + 0.0001) {
      return `La cantidad entregada de ${product.productName} supera la cantidad pendiente (${quantityPending}).`;
    }

    if (product.delivered === false && quantityDelivered > 0) {
      return `${product.productName} está marcado como no entregado, pero tiene una cantidad mayor que cero.`;
    }

    if (product.delivered === true && quantityDelivered <= 0) {
      return `${product.productName} está marcado como entregado, pero su cantidad es cero.`;
    }
  }

  const totalDeliveredThisAttempt = products.reduce(
    (total, product) => total + Number(product.quantityDelivered || 0),
    0,
  );

  const totalPendingAfterAttempt = products.reduce(
    (total, product) =>
      total +
      Math.max(
        Number(product.quantityPending || 0) -
          Number(product.quantityDelivered || 0),
        0,
      ),
    0,
  );

  const noProductsDelivered = totalDeliveredThisAttempt <= 0.0001;

  const allPendingProductsDelivered = totalPendingAfterAttempt <= 0.0001;

  switch (status) {
    case "DELIVERED":
      if (noProductsDelivered) {
        return "Una entrega completa debe registrar al menos una cantidad entregada.";
      }

      if (!allPendingProductsDelivered) {
        return "Para marcar el pedido como entregado deben completarse todas las cantidades pendientes.";
      }

      break;

    case "PARTIAL_DELIVERED":
      if (noProductsDelivered) {
        return "La entrega parcial requiere entregar una cantidad mayor que cero.";
      }

      if (allPendingProductsDelivered) {
        return "No corresponde una entrega parcial porque se completaron todas las cantidades pendientes.";
      }

      break;

    case "RESCHEDULED":
    case "NOT_DELIVERED":
      if (!noProductsDelivered) {
        return `${status} requiere que todas las cantidades del intento estén en cero.`;
      }

      break;

    default:
      return "El resultado seleccionado no es válido.";
  }

  return null;
};
