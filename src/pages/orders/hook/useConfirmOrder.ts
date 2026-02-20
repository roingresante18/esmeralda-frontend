import { useState } from "react";
import api from "../../../api/api";
import type { Address } from "../types";

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "AMBOS";

export function useConfirmOrder(orderId?: number, onConfirmed?: () => void) {
  const [open, setOpen] = useState(false);

  const [address, setAddress] = useState<Address>({
    delivery_address: "",
    municipality_id: "", // ⭐ IMPORTANTE

    // 📍 GPS opcional
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,

    // 🔥 Nuevos campos
    delivery_date: "", // YYYY-MM-DD
    payment_method: "",
  });

  const confirmOrder = async () => {
    if (!orderId) return;

    const {
      delivery_address,
      municipality_id,
      latitude,
      longitude,
      delivery_date,
      payment_method,
    } = address;

    console.log("Confirm payload:", address);

    // ✅ Validaciones obligatorias
    if (!delivery_address.trim()) {
      alert("Ingresá la dirección de entrega");
      return;
    }

    if (!municipality_id) {
      alert("Seleccioná un municipio");
      return;
    }

    if (!delivery_date) {
      alert("Seleccioná la fecha de entrega");
      return;
    }

    if (!payment_method) {
      alert("Seleccioná el método de pago");
      return;
    }

    // 📦 Payload limpio (GPS solo si existe)
    const payload: any = {
      delivery_address,
      municipality_id,
      delivery_date,
      payment_method,
    };

    if (latitude != null && longitude != null) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    await api.patch(`/orders/${orderId}/confirm`, payload);

    onConfirmed?.();
    setOpen(false);
  };

  return {
    open,
    setOpen,
    address,
    setAddress,
    confirmOrder,
  };
}
