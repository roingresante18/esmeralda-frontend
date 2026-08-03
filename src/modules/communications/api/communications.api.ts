import api from "../../../api/api";

import type {
  CompanyCommunicationConfig,
  EmailConnectionResult,
  NotificationSetting,
  UpdateCompanyCommunicationPayload,
  UpdateNotificationSettingPayload,
  WhatsAppConnectionResult,
} from "../types/communications.types";

export async function getCommunicationConfig(
  companyId: number,
): Promise<CompanyCommunicationConfig> {
  const response = await api.get<CompanyCommunicationConfig>(
    `/companies/${companyId}/communications`,
  );

  return response.data;
}

export async function updateCommunicationConfig(
  companyId: number,
  payload: UpdateCompanyCommunicationPayload,
): Promise<CompanyCommunicationConfig> {
  const response = await api.patch<CompanyCommunicationConfig>(
    `/companies/${companyId}/communications`,
    payload,
  );

  return response.data;
}

export async function getNotificationSettings(
  companyId: number,
): Promise<NotificationSetting[]> {
  const response = await api.get<NotificationSetting[]>(
    `/companies/${companyId}/communications/settings`,
  );

  return response.data;
}

export async function updateNotificationSetting(
  companyId: number,
  payload: UpdateNotificationSettingPayload,
): Promise<NotificationSetting> {
  const response = await api.put<NotificationSetting>(
    `/companies/${companyId}/communications/settings`,
    payload,
  );

  return response.data;
}

export async function testWhatsAppConnection(
  companyId: number,
): Promise<WhatsAppConnectionResult> {
  const response = await api.post<WhatsAppConnectionResult>(
    `/companies/${companyId}/communications/test-whatsapp`,
  );

  return response.data;
}

export async function testEmailConnection(
  companyId: number,
): Promise<EmailConnectionResult> {
  const response = await api.post<EmailConnectionResult>(
    `/companies/${companyId}/communications/test-email`,
  );

  return response.data;
}
