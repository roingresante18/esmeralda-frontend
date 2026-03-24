// =====================
// Ítem dentro de un pedido
// =====================

export type OrderItem = CartItem & {
  id: number;
  name: string;
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
  clientAddress?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  items: CartItem[];
  status: OrderStatus;
  createdAt: string;
  deliveryDate: string | null;
  municipality_snapshot: string;
  notes?: string;
  paymentSummary?: PaymentSummary;
  payments?: OrderPaymentItem[];
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
  total_amount?: number;
  payment_confirmed?: boolean;

  client?: {
    id: number;
    name: string;
    phone: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  payment_summary?: PaymentSummary;

  payments?: OrderPaymentItem[];

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
export type OrderPaymentItem = {
  id: number;
  amount: number;
  method: string;
  type: string;
  status: string;
  reference?: string | null;
  external_id?: string | null;
  notes?: string | null;
  created_at: string;
  confirmed_at?: string | null;
};

export type PaymentSummary = {
  cash: number;
  transfer: number;
  card: number;
  check: number;
  other: number;
  total_paid: number;
};
