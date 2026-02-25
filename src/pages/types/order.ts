export interface Product {
  description: string;
}

export interface OrderItem {
  quantity: number;
  product: Product;
}

export interface Client {
  name: string;
}

export interface Order {
  id: number;
  status: string;
  delivery_date: string;
  client: Client;
  items: OrderItem[];
  created_at: string;
}
