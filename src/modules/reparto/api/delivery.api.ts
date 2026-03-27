// import api from "../../../api/api";
// import type {
//   ConfirmDeliveryPayload,
//   DeliveryOrder,
//   DriverDailySettlement,
//   DriverExpense,
//   ConfirmDeliveryDataPayload,
// } from "../types/delivery.types";
// import { adaptApiOrderToDeliveryOrder } from "./delivery.adapters";

// const USE_MOCK_FALLBACK = false;

// export const deliveryApi = {
//   async getDriverOrders(): Promise<DeliveryOrder[]> {
//     const res = await api.get("/orders?status=ASSIGNED&lastDays=14");
//     return (res.data ?? []).map(adaptApiOrderToDeliveryOrder);
//   },

//   async updateOrderStatus(orderId: number, newStatus: string) {
//     return api.patch(`/orders/${orderId}/status`, {
//       new_status: newStatus,
//     });
//   },

//   async confirmDelivery(payload: ConfirmDeliveryPayload) {
//     return api.patch(`/orders/${payload.orderId}/deliver`, {
//       new_status: payload.deliveryStatus,
//       delivered_at: payload.deliveredAt,
//       delivered_latitude: payload.deliveredGps.latitude,
//       delivered_longitude: payload.deliveredGps.longitude,
//       delivered_accuracy: payload.deliveredGps.accuracy,
//       payment_method: payload.paymentMethod,
//       amount_collected_cash: payload.amountCollectedCash,
//       amount_collected_transfer: payload.amountCollectedTransfer,
//       products: payload.products.map((p) => ({
//         product_id: p.productId,
//         quantity_delivered: p.quantityDelivered,
//         delivered: p.delivered,
//       })),
//       delivery_observation: payload.deliveryObservation,
//       delivered_by_user_id: payload.deliveredByUserId,
//     });
//   },

//   async getSettlement(
//     driverId: number,
//     date: string,
//   ): Promise<DriverDailySettlement> {
//     const res = await api.get(`/delivery-settlements/${driverId}?date=${date}`);
//     return res.data;
//   },

//   async saveOpeningCash(driverId: number, date: string, openingCash: number) {
//     return api.post(`/delivery-settlements/${driverId}/opening-cash`, {
//       date,
//       openingCash,
//     });
//   },

//   async createExpense(
//     driverId: number,
//     date: string,
//     expense: Omit<DriverExpense, "id">,
//   ) {
//     return api.post(`/delivery-settlements/${driverId}/expenses`, {
//       date,
//       ...expense,
//     });
//   },

//   async declareClosingBalance(
//     driverId: number,
//     date: string,
//     declaredClosingBalance: number,
//   ) {
//     return api.post(`/delivery-settlements/${driverId}/close`, {
//       date,
//       declaredClosingBalance,
//     });
//   },

//   async confirmDeliveryData(payload: ConfirmDeliveryDataPayload) {
//     try {
//       return await api.patch(
//         `/orders/${payload.orderId}/confirm-delivery-data`,
//         {
//           delivery_date: payload.deliveryDate,
//           payment_method: payload.paymentMethod,
//           address: payload.address,
//           municipality: payload.municipality,
//           zone: payload.zone,
//           customer_gps: payload.customerGps
//             ? {
//                 lat: payload.customerGps.latitude,
//                 lng: payload.customerGps.longitude,
//                 accuracy: payload.customerGps.accuracy,
//                 source: payload.customerGps.source,
//                 captured_at: payload.customerGps.capturedAt,
//               }
//             : null,
//           order_gps: payload.orderGps
//             ? {
//                 lat: payload.orderGps.latitude,
//                 lng: payload.orderGps.longitude,
//                 accuracy: payload.orderGps.accuracy,
//                 source: payload.orderGps.source,
//                 captured_at: payload.orderGps.capturedAt,
//               }
//             : null,
//           notes: payload.notes,
//         },
//       );
//     } catch (error) {
//       if (USE_MOCK_FALLBACK) {
//         return Promise.resolve({
//           data: {
//             ok: true,
//             orderId: payload.orderId,
//             status: "confirmed-for-delivery",
//           },
//         });
//       }

//       throw error;
//     }
//   },
// };
import api from "../../../api/api";
import type {
  ConfirmDeliveryPayload,
  DeliveryOrder,
  DriverDailySettlement,
  DriverExpense,
  ConfirmDeliveryDataPayload,
} from "../types/delivery.types";
import { adaptApiOrderToDeliveryOrder } from "./delivery.adapters";

const USE_MOCK_FALLBACK = false;

export const deliveryApi = {
  async getDriverOrders(): Promise<DeliveryOrder[]> {
    const res = await api.get("/orders?status=ASSIGNED&lastDays=14");
    return (res.data ?? []).map(adaptApiOrderToDeliveryOrder);
  },

  async updateOrderStatus(orderId: number, newStatus: string) {
    return api.patch(`/orders/${orderId}/status`, {
      new_status: newStatus,
    });
  },

  async confirmDelivery(payload: ConfirmDeliveryPayload) {
    return api.patch(`/orders/${payload.orderId}/deliver`, {
      new_status: payload.deliveryStatus,
      delivered_at: payload.deliveredAt,
      delivered_latitude: payload.deliveredGps.latitude,
      delivered_longitude: payload.deliveredGps.longitude,
      delivered_accuracy: payload.deliveredGps.accuracy,
      payment_method: payload.paymentMethod,
      amount_collected_cash: payload.amountCollectedCash,
      amount_collected_transfer: payload.amountCollectedTransfer,
      products: payload.products.map((p) => ({
        product_id: p.productId,
        quantity_delivered: p.quantityDelivered,
        delivered: p.delivered,
      })),
      delivery_observation: payload.deliveryObservation,
      delivered_by_user_id: payload.deliveredByUserId,
    });
  },

  async getSettlement(
    driverId: number,
    date: string,
  ): Promise<DriverDailySettlement> {
    const res = await api.get(`/delivery-settlements/${driverId}?date=${date}`);
    return res.data;
  },

  async saveOpeningCash(driverId: number, date: string, openingCash: number) {
    return api.post(`/delivery-settlements/${driverId}/opening-cash`, {
      date,
      openingCash,
    });
  },

  async createExpense(
    driverId: number,
    date: string,
    expense: Omit<DriverExpense, "id">,
  ) {
    return api.post(`/delivery-settlements/${driverId}/expenses`, {
      date,
      ...expense,
    });
  },

  async declareClosingBalance(
    driverId: number,
    date: string,
    declaredClosingBalance: number,
  ) {
    return api.post(`/delivery-settlements/${driverId}/close`, {
      date,
      declaredClosingBalance,
    });
  },

  async confirmDeliveryData(
    orderId: number,
    payload: Omit<ConfirmDeliveryDataPayload, "orderId">,
  ) {
    try {
      return await api.patch(`/orders/${orderId}/confirm-delivery-data`, {
        delivery_date: payload.deliveryDate,
        payment_method: payload.paymentMethod,
        address: payload.address,
        municipality: payload.municipality,
        zone: payload.zone,
        customer_gps: payload.customerGps
          ? {
              lat: payload.customerGps.latitude,
              lng: payload.customerGps.longitude,
              accuracy: payload.customerGps.accuracy,
              source: payload.customerGps.source,
              captured_at: payload.customerGps.capturedAt,
            }
          : null,
        order_gps: payload.orderGps
          ? {
              lat: payload.orderGps.latitude,
              lng: payload.orderGps.longitude,
              accuracy: payload.orderGps.accuracy,
              source: payload.orderGps.source,
              captured_at: payload.orderGps.capturedAt,
            }
          : null,
        notes: payload.notes,
      });
    } catch (error) {
      if (USE_MOCK_FALLBACK) {
        return Promise.resolve({
          data: {
            ok: true,
            orderId,
            status: "confirmed-for-delivery",
          },
        });
      }

      throw error;
    }
  },
};
