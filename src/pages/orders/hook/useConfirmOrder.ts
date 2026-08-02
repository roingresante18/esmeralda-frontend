// import { useState } from "react";
// import api from "../../../api/api";
// import type { Address } from "../../types/types";

// export function useConfirmOrder(
//   orderId?: number,
//   clientId?: number,
//   onConfirmed?: () => void,
// ) {
//   const [open, setOpen] = useState(false);

//   const [address, setAddress] = useState<Address>({
//     delivery_address: "",
//     latitude: undefined,
//     longitude: undefined,
//     delivery_date: "",
//   });

//   const confirmOrder = async (
//     payment?: {
//       cash: number;
//       transfer: number;
//       reference?: string;
//     },
//     options?: {
//       shouldSaveClientGps?: boolean;
//     },
//   ) => {
//     if (!orderId) return;

//     const { delivery_address, latitude, longitude, delivery_date } = address;

//     if (!delivery_date) {
//       alert("Seleccioná la fecha de entrega");
//       return;
//     }

//     if (
//       options?.shouldSaveClientGps &&
//       (latitude == null || longitude == null)
//     ) {
//       alert("Debe seleccionar una ubicación para guardar en el cliente.");
//       return;
//     }

//     try {
//       if (
//         options?.shouldSaveClientGps &&
//         clientId &&
//         latitude != null &&
//         longitude != null
//       ) {
//         await api.patch(`/clients/${clientId}`, {
//           latitude: Number(latitude),
//           longitude: Number(longitude),
//         });
//       }

//       const payload = {
//         delivery_address: delivery_address?.trim() || null,
//         delivery_date,
//       };

//       await api.patch(`/orders/${orderId}/confirm`, payload);

//       if (payment) {
//         if (payment.cash > 0) {
//           await api.patch(`/orders/${orderId}/payment`, {
//             amount: payment.cash,
//             method: "CASH",
//           });
//         }

//         if (payment.transfer > 0) {
//           await api.patch(`/orders/${orderId}/payment`, {
//             amount: payment.transfer,
//             method: "TRANSFER",
//             reference: payment.reference || null,
//           });
//         }
//       }

//       onConfirmed?.();
//       setOpen(false);
//     } catch (err) {
//       console.error("ERROR CONFIRM ORDER", err);
//       alert("Error al confirmar el pedido");
//     }
//   };

//   return {
//     open,
//     setOpen,
//     address,
//     setAddress,
//     confirmOrder,
//   };
// }

import { useState } from "react";
import api from "../../../api/api";
import type { Address } from "../../types/types";

export type ConfirmOrderResult = {
  trackingUrl: string | null;
};

type PaymentInput = {
  cash: number;
  transfer: number;
  reference?: string;
};

type ConfirmOrderOptions = {
  shouldSaveClientGps?: boolean;
};

type ConfirmOrderApiResponse = {
  tracking_url?: string | null;
};

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
    payment?: PaymentInput,
    options?: ConfirmOrderOptions,
  ): Promise<ConfirmOrderResult | null> => {
    if (!orderId) {
      alert("No se pudo identificar el pedido.");
      return null;
    }

    const { delivery_address, latitude, longitude, delivery_date } = address;

    if (!delivery_date) {
      alert("Seleccioná la fecha de entrega");
      return null;
    }

    if (
      options?.shouldSaveClientGps &&
      (latitude == null || longitude == null)
    ) {
      alert("Debe seleccionar una ubicación para guardar en el cliente.");
      return null;
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

      const confirmResponse = await api.patch<ConfirmOrderApiResponse>(
        `/orders/${orderId}/confirm`,
        payload,
      );

      const trackingUrl =
        typeof confirmResponse.data?.tracking_url === "string" &&
        confirmResponse.data.tracking_url.trim()
          ? confirmResponse.data.tracking_url.trim()
          : null;

      if (payment) {
        if (Number(payment.cash) > 0) {
          await api.patch(`/orders/${orderId}/payment`, {
            amount: Number(payment.cash),
            method: "CASH",
          });
        }

        if (Number(payment.transfer) > 0) {
          await api.patch(`/orders/${orderId}/payment`, {
            amount: Number(payment.transfer),
            method: "TRANSFER",
            reference: payment.reference?.trim() || null,
          });
        }
      }

      onConfirmed?.();
      setOpen(false);

      return {
        trackingUrl,
      };
    } catch (err) {
      console.error("ERROR CONFIRM ORDER", err);
      alert("Error al confirmar el pedido");
      throw err;
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
