// =====================
// Ítem dentro de un pedido
// =====================

export type OrderItem = CartItem & {
  id: number;
};
export type CartItem = {
  id?: number; // 👈 IMPORTANTE
  productId: number;
  description: string;
  quantity: number;
  discountPercent?: number;
  sale_price: number;
};

// =====================
// Pedido (draft / activo)
// =====================
export interface OrderDraft {
  orderId?: number;
  clientId?: number;
  clientName: string;
  clientPhone: string;
  items: CartItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string | null;
  municipality_snapshot: string;
  notes?: string; // ⭐ NUEVO
}

// =====================
// Estados posibles de un pedido
// =====================
export type OrderStatus =
  | "QUOTATION"
  | "CONFIRMED"
  | "PREPARING"
  | "PREPARED"
  | "QUALITY_CHECKED"
  | "ASSIGNED"
  | "IN_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

// =====================
// Roles de usuario
// =====================
export type UserRole =
  | "ADMIN"
  | "VENTAS"
  | "DEPOSITO"
  | "CONTROL"
  | "LOGISTICA";

// =====================
// Usuario
// =====================
export interface User {
  id: number;
  name: string;
  role: UserRole;
}

// export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "AMBOS";

export interface Address {
  delivery_address: string;
  delivery_date: string;
  latitude?: number;
  longitude?: number;
}
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
