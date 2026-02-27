import { useState } from "react";
import type { OrderDraft, CartItem, OrderStatus } from "../../types/types";
import api from "../../../api/api";
/* ============================================================
   Tipo API de borradores
============================================================ */

export type DraftOrderApi = {
  id: number;
  status: OrderStatus;
  created_at: string;
  delivery_date?: string;
  notes: string;
  municipality_snapshot: string;

  client?: {
    id: number;
    name: string;
    phone: string;
  };

  items: {
    id: number;
    quantity: number;
    discount_percent: number;
    unit_price: number;
    product?: {
      id: number;
      description?: string;
    };
  }[];
};

/* ============================================================
   HOOK PRINCIPAL
============================================================ */

export function useOrder(canEdit: boolean) {
  /* ================= ESTADO ================= */

  const [order, setOrder] = useState<OrderDraft>({
    orderId: undefined,
    clientId: undefined,
    clientName: "",
    clientPhone: "",
    items: [],
    status: "QUOTATION",
    createdAt: new Date().toISOString(),
    deliveryDate: "",
    notes: "",
    municipality_snapshot: "",
  });

  /* ============================================================
     CALCULAR TOTAL (FRONT)
  ============================================================ */

  const calculateTotal = () => {
    return order.items.reduce((acc, item) => {
      const price = Number(item.sale_price) || 0;
      const qty = Number(item.quantity) || 0;
      const discount = Number(item.discountPercent ?? 0);

      const subtotal = price * qty;
      const discounted = subtotal - (subtotal * discount) / 100;

      return acc + discounted;
    }, 0);
  };

  /* ============================================================
     CART
  ============================================================ */

  const addProduct = (product: CartItem) => {
    if (!canEdit) return;

    setOrder((p) => {
      const existing = p.items.find((i) => i.productId === product.productId);

      if (existing) {
        return {
          ...p,
          items: p.items.map((i) =>
            i.productId === product.productId
              ? { ...i, quantity: i.quantity + product.quantity }
              : i,
          ),
        };
      }

      return { ...p, items: [...p.items, product] };
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!canEdit) return;

    setOrder((p) => ({
      ...p,
      items: p.items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, quantity) }
          : i,
      ),
    }));
  };

  const removeProduct = (productId: number) => {
    if (!canEdit) return;

    setOrder((p) => ({
      ...p,
      items: p.items.filter((i) => i.productId !== productId),
    }));
  };

  /* ============================================================
     CARGAR BORRADOR
  ============================================================ */

  const loadDraftOrder = (draft: DraftOrderApi) => {
    const items: CartItem[] = draft.items.map((i) => ({
      id: i.id,
      productId: i.product?.id ?? 0,
      description: i.product?.description ?? "Producto",
      quantity: Number(i.quantity) || 1,
      sale_price: Number(i.unit_price) || 0,
      discountPercent: Number(i.discount_percent) || 0,
    }));

    setOrder({
      orderId: draft.id,
      clientId: draft.client?.id,
      clientName: draft.client?.name ?? "",
      clientPhone: draft.client?.phone ?? "",
      items,
      status: draft.status,
      createdAt: draft.created_at,
      deliveryDate: draft.delivery_date ?? "",
      notes: draft.notes ?? "",
      municipality_snapshot: draft.municipality_snapshot ?? "",
    });
  };

  /* ============================================================
     GUARDAR ORDEN
  ============================================================ */

  const saveOrder = async (payment?: {
    cash: number;
    transfer: number;
    reference?: string;
  }) => {
    if (!canEdit) return;

    if (!order.clientId) throw new Error("CLIENT_REQUIRED");
    if (order.items.length === 0) throw new Error("ITEMS_REQUIRED");

    try {
      let orderId = order.orderId;

      /* ==========================
       CREATE
    ========================== */
      if (!orderId) {
        const payload = {
          clientId: order.clientId,
          notes: order.notes || "",
          items: order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            discountPercent: Number(i.discountPercent ?? 0),
          })),
        };

        const res = await api.post("/orders", payload);
        orderId = res.data.id;

        setOrder((p) => ({
          ...p,
          orderId,
        }));

        alert("✅ Pedido creado con éxito");
      } else {
        /* ==========================
   UPDATE
========================== */
        const payload = {
          clientId: order.clientId, // ⭐ necesario
          notes: order.notes || undefined,
          items: order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            discountPercent: Number(i.discountPercent ?? 0),
          })),
        };

        await api.put(`/orders/${orderId}`, payload);

        alert("✅ Pedido actualizado con éxito");
      }

      /* ==========================
       PAGOS
    ========================== */
      if (payment && orderId) {
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
    } catch (e) {
      console.error("ERROR SAVE ORDER", e);
      alert("❌ Error al guardar pedido");
    }
  };

  /* ============================================================
     EXPORT
  ============================================================ */

  return {
    order,
    setOrder,
    addProduct,
    updateQuantity,
    removeProduct,
    loadDraftOrder,
    saveOrder,
    calculateTotal,
  };
}
