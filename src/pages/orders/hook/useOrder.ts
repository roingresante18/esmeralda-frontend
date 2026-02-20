import { useState } from "react";
import type { OrderDraft, CartItem, OrderStatus } from "../types";
import api from "../../../api/api";

/* ============================================================
   Tipo de respuesta de borradores desde backend
============================================================ */

export type DraftOrderApi = {
  id: number;
  status: OrderStatus;
  created_at: string;
  delivery_date?: string;
  observations: string;

  client?: {
    id: number;
    name: string;
    phone: string;
  };

  items: {
    id: number;
    quantity: number;
    discount_percent: number;
    unit_price(sale_price: any): number;
    product?: {
      id: number;
      description?: string;
    };
  }[];
};

/* ============================================================
   HOOK PRINCIPAL DE PEDIDOS
============================================================ */

export function useOrder(canEdit: boolean) {
  /* ================= ESTADO ================= */

  const [order, setOrder] = useState<OrderDraft>({
    clientId: undefined,
    clientName: "",
    clientPhone: "",
    items: [] as CartItem[],
    status: "QUOTATION",
    createdAt: new Date().toISOString(),
    deliveryDate: "",
    observations: "", // ⭐ NUEVO
  });

  /* ============================================================
     CART
  ============================================================ */

  const addProduct = (product: CartItem) => {
    if (!canEdit) return;

    setOrder((p) => {
      const existing = p.items.find((i) => i.productId === product.productId);

      // 🔹 Si ya existe → sumar cantidad
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
     CARGAR BORRADOR DESDE BACKEND
  ============================================================ */

  const loadDraftOrder = (draft: DraftOrderApi) => {
    const items: CartItem[] = draft.items.map((i) => ({
      id: i.id, // 🔑 ID del order_item
      productId: i.product!.id,

      description: i.product?.description ?? "Producto",

      quantity: Number(i.quantity) || 1,

      // 🔥 ESTE ES EL CAMPO QUE FALTABA
      sale_price: Number(i.unit_price) || 0,

      // 🔹 opcional si tu backend lo guarda
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
      observations: draft.observations ?? "",
    });
  };

  /* ============================================================
     GUARDAR PEDIDO
     🔒 Backend recalcula precios → no enviamos precios
  ============================================================ */

  const saveOrder = async () => {
    if (!canEdit) return;

    if (!order.clientId) throw new Error("CLIENT_REQUIRED");
    if (order.items.length === 0) throw new Error("ITEMS_REQUIRED");

    const payload = {
      clientId: order.clientId,
      observations: order.observations, // ⭐ NUEVO
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        discountPercent: Number(i.discountPercent ?? 0),
      })),
    };

    try {
      if (order.orderId) {
        await api.put(`/orders/${order.orderId}`, payload);

        alert("✅ Pedido actualizado con éxito");
      } else {
        const res = await api.post("/orders", payload);

        setOrder((p) => ({
          ...p,
          orderId: res.data.id,
        }));

        alert("✅ Pedido creado con éxito");
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
  };
}
