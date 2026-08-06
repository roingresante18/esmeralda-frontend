/*
 * =========================================================
 * USUARIO DE REPARTO
 * =========================================================
 */

export interface LogisticsDeliveryUser {
  id: number;

  full_name?: string | null;

  name?: string | null;

  email?: string | null;

  role?: string | null;

  is_active?: boolean;
}

/*
 * =========================================================
 * PEDIDO DISPONIBLE PARA LOGÍSTICA
 * =========================================================
 */

export interface LogisticsOrder {
  id: number;

  status: string;

  delivery_date?: string | null;

  delivery_address_snapshot?: string | null;

  municipality_snapshot?: string | null;

  zone_snapshot?: string | null;

  total_amount?: number | string | null;

  client: {
    id: number;

    name: string;

    phone?: string | null;

    address?: string | null;

    latitude?: string | number | null;

    longitude?: string | number | null;
  };
}
