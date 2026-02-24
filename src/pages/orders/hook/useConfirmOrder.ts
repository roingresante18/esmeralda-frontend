import { useState, useEffect } from "react";
import api from "../../../api/api";
import type { Address } from "../types";
import type { OrderDraft } from "../types";

export function useConfirmOrder(
  orderId?: number,
  onConfirmed?: () => void,
  order?: OrderDraft, // agregado para acceder al cliente
) {
  const [open, setOpen] = useState(false);

  const [address, setAddress] = useState<Address>({
    delivery_address: "",
    latitude: undefined,
    longitude: undefined,
    delivery_date: "",
  });

  // Si cambia el pedido y tiene municipio, actualizamos automáticamente

  const confirmOrder = async (payment?: {
    cash: number;
    transfer: number;
    reference?: string;
  }) => {
    if (!orderId) return;

    const { delivery_address, latitude, longitude, delivery_date } = address;

    console.log("Confirm payload:", address);
    console.log("Payment payload:", payment);

    // 🔹 Validaciones
    if (!delivery_date) {
      alert("Seleccioná la fecha de entrega");
      return;
    }

    const payload: any = {
      delivery_address: delivery_address?.trim() || null, // opcional
      delivery_date,
    };

    if (latitude != null && longitude != null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    try {
      // 1️⃣ Confirmar orden
      await api.patch(`/orders/${orderId}/confirm`, payload);

      // 2️⃣ Registrar pagos si existen
      if (payment) {
        if (payment.cash > 0) {
          await api.patch(`/orders/${orderId}/payment`, {
            amount: payment.cash,
            method: "CASH",
          });
        }

        if (payment.transfer > 0) {
          await api.patch(`/orders/${orderId}/payment`, {
            amount: payment.transfer,
            method: "TRANSFER",
            reference: payment.reference || null,
          });
        }
      }

      onConfirmed?.();
      setOpen(false);
    } catch (err) {
      console.error("ERROR CONFIRM ORDER", err);
      alert("Error al confirmar el pedido");
    }
  };

  return {
    open,
    setOpen,
    address,
    setAddress,
    confirmOrder,
  };
}
