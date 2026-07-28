import api from "../../../api/api";

import type {
  ConfirmDeliveryPayload,
  ConfirmDeliveryDataPayload,
  DeliveryOrder,
  DriverDailyDeliverySummary,
  DriverDailySettlement,
  DriverExpense,
} from "../types/delivery.types";

import { adaptApiOrderToDeliveryOrder } from "./delivery.adapters";

const USE_MOCK_FALLBACK = false;

export const deliveryApi = {
  async getDriverOrders(): Promise<DeliveryOrder[]> {
    const response = await api.get("/orders/my-deliveries", {
      params: {
        lastDays: 90,
      },
    });

    const orders = Array.isArray(response.data) ? response.data : [];

    return orders.map(adaptApiOrderToDeliveryOrder);
  },

  /**
   * Resumen de toda la actividad realizada por el repartidor
   * durante la fecha seleccionada.
   *
   * Este endpoint todavía debe crearse en el backend.
   */
  async getDriverDailySummary(
    date: string,
  ): Promise<DriverDailyDeliverySummary> {
    const response = await api.get("/orders/my-delivery-summary", {
      params: {
        date,
      },
    });

    return response.data;
  },

  async confirmDelivery(payload: ConfirmDeliveryPayload) {
    const latitude = Number(payload.deliveredGps.latitude);
    const longitude = Number(payload.deliveredGps.longitude);

    const accuracy =
      payload.deliveredGps.accuracy != null
        ? Number(payload.deliveredGps.accuracy)
        : undefined;

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error(
        "No se puede confirmar la entrega: las coordenadas GPS son inválidas.",
      );
    }

    if (accuracy != null && (!Number.isFinite(accuracy) || accuracy < 0)) {
      throw new Error(
        "No se puede confirmar la entrega: la precisión GPS es inválida.",
      );
    }

    const requestBody = {
      new_status: payload.deliveryStatus,
      delivered_at: payload.deliveredAt,

      delivery_latitude: latitude,
      delivery_longitude: longitude,
      delivered_accuracy: accuracy,

      payment_method: payload.paymentMethod,
      amount_collected_cash: Number(payload.amountCollectedCash || 0),
      amount_collected_transfer: Number(payload.amountCollectedTransfer || 0),

      products: payload.products.map((product) => ({
        product_id: product.productId,

        /*
         * Cantidad correspondiente únicamente al intento actual.
         */
        quantity_delivered: Number(product.quantityDelivered || 0),
        delivered: Boolean(product.delivered),
      })),

      delivery_observation: payload.deliveryObservation?.trim() || undefined,
    };

    return api.patch(`/orders/${payload.orderId}/deliver`, requestBody);
  },

  async getSettlement(
    driverId: number,
    date: string,
  ): Promise<DriverDailySettlement> {
    const response = await api.get(`/delivery-settlements/${driverId}`, {
      params: {
        date,
      },
    });

    return response.data;
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
