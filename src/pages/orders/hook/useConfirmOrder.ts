import { useState } from "react";
import api from "../../../api/api";
import type { Address } from "../../types/types";

export function useConfirmOrder(
  orderId?: number,
  clientId?: number,
  onConfirmed?: () => void,
) {
  const [open, setOpen] = useState(false);

  const [address, setAddress] = useState<Address>({
    delivery_address: "",
    latitude: undefined,
    longitude: undefined,
    delivery_date: "",
  });

  const confirmOrder = async (
    payment?: {
      cash: number;
      transfer: number;
      reference?: string;
    },
    options?: {
      shouldSaveClientGps?: boolean;
    },
  ) => {
    if (!orderId) return;

    const { delivery_address, latitude, longitude, delivery_date } = address;

    if (!delivery_date) {
      alert("Seleccioná la fecha de entrega");
      return;
    }

    if (
      options?.shouldSaveClientGps &&
      (latitude == null || longitude == null)
    ) {
      alert("Debe seleccionar una ubicación para guardar en el cliente.");
      return;
    }

    try {
      if (
        options?.shouldSaveClientGps &&
        clientId &&
        latitude != null &&
        longitude != null
      ) {
        await api.patch(`/clients/${clientId}`, {
          latitude: Number(latitude),
          longitude: Number(longitude),
        });
      }

      const payload = {
        delivery_address: delivery_address?.trim() || null,
        delivery_date,
      };

      await api.patch(`/orders/${orderId}/confirm`, payload);

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
