export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address: string;
  municipality_id: number | "";
  latitude?: number;
  longitude?: number;
}

export interface Municipality {
  id: number;
  name: string;
}
