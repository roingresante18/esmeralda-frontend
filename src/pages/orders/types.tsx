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
  municipality?: string;
  observations?: string; // ⭐ NUEVO
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

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "AMBOS";

export interface Address {
  delivery_address: string;
  municipality_id: number | "";
  delivery_date: string;
  payment_method: PaymentMethod | "";
  latitude?: number;
  longitude?: number;
}
