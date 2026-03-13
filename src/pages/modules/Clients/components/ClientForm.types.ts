export interface ClientFormData {
  id?: number; // ← IMPORTANTE
  [x: string]: any;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  municipality_id: number | null;
  latitude?: number;
  longitude?: number;
}

export interface Municipality {
  id: number;
  name: string;
}
