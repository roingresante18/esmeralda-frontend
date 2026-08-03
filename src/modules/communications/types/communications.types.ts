export type NotificationChannel = "WHATSAPP" | "EMAIL";

export type NotificationEvent =
  | "ORDER_CONFIRMED"
  | "ORDER_IN_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_PARTIAL_DELIVERED"
  | "ORDER_RESCHEDULED"
  | "ORDER_NOT_DELIVERED";

export interface CompanyCommunicationConfig {
  id: number;

  company_id: number;

  /*
   * WhatsApp
   */
  whatsapp_enabled: boolean;

  whatsapp_phone: string | null;

  whatsapp_phone_number_id: string | null;

  whatsapp_business_account_id: string | null;

  whatsapp_graph_version: string | null;

  whatsapp_token_configured: boolean;

  /*
   * Email
   */
  email_enabled: boolean;

  email_from_name: string | null;

  email_from_address: string | null;

  smtp_host: string | null;

  smtp_port: number | null;

  smtp_secure: boolean;

  smtp_username: string | null;

  smtp_password_configured: boolean;

  /*
   * General
   */
  default_country_iso: string | null;

  whatsapp_template_language: string | null;
}

export interface UpdateCompanyCommunicationPayload {
  whatsapp_enabled?: boolean;

  whatsapp_phone?: string;

  whatsapp_phone_number_id?: string;

  whatsapp_business_account_id?: string;

  whatsapp_graph_version?: string;

  /*
   * Solo se envía si el administrador
   * escribe un token nuevo.
   */
  whatsapp_access_token?: string;

  email_enabled?: boolean;

  email_from_name?: string;

  email_from_address?: string;

  smtp_host?: string;

  smtp_port?: number;

  smtp_secure?: boolean;

  smtp_username?: string;

  /*
   * Solo se envía si el administrador
   * escribe una contraseña nueva.
   */
  smtp_password?: string;

  default_country_iso?: string;

  whatsapp_template_language?: string;
}

export interface NotificationSetting {
  id: number;

  company_id: number;

  event: NotificationEvent;

  channel: NotificationChannel;

  enabled: boolean;

  template_name: string | null;

  email_subject: string | null;
}

export interface UpdateNotificationSettingPayload {
  event: NotificationEvent;

  channel: NotificationChannel;

  enabled: boolean;

  template_name?: string | null;

  email_subject?: string | null;
}

export interface WhatsAppConnectionResult {
  success: boolean;

  channel: "WHATSAPP";

  message: string;

  data?: {
    connected: boolean;

    phoneNumberId: string | null;

    displayPhoneNumber: string | null;

    verifiedName: string | null;

    qualityRating: string | null;
  };
}

export interface EmailConnectionResult {
  success: boolean;

  channel: "EMAIL";

  message: string;

  data?: {
    host: string | null;

    port: number | null;

    secure: boolean;

    username: string | null;

    from: string | null;
  };
}
