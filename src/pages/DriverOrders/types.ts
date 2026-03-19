// types.ts

export type OrderStatus = "ASSIGNED" | "IN_DELIVERY" | "DELIVERED";
export type PaymentMethod = "CASH" | "TRANSFER" | "BOTH";

export interface OrderProduct {
  id: number;
  name: string;
  delivered: boolean;
}

export interface Client {
  id: number;
  name: string;
  municipality: string;
  zone: string;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total_amount: number;
  payment_method: PaymentMethod;
  delivery_date: string | null;
  delivery_latitude?: number;
  delivery_longitude?: number;
  client: Client;
  products: OrderProduct[];
}

export interface DriverKpis {
  estimated: number;
  delivered: number;
  cash: number;
  transfer: number;
  progress: number;
  totalOrders: number;
  deliveredOrders: number;
}
