export interface Product {
  id?: number;
  name: string;
  description: string;
  unit_price: number;
  iva_percent: number;
  utilidad_percent: number;
  sale_price: number;
  proveedor: string;
  rubro_id: number | "";
  is_active: boolean;
  stock?: number;
}

export interface Metric {
  label: string;
  value: number | string;
}
