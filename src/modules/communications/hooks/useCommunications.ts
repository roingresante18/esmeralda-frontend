import { useCallback, useEffect, useState } from "react";

import {
  getCommunicationConfig,
  getNotificationSettings,
  testEmailConnection,
  testWhatsAppConnection,
  updateCommunicationConfig,
  updateNotificationSetting,
} from "../api/communications.api";

import type {
  CompanyCommunicationConfig,
  EmailConnectionResult,
  NotificationSetting,
  UpdateCompanyCommunicationPayload,
  UpdateNotificationSettingPayload,
  WhatsAppConnectionResult,
} from "../types/communications.types";

import { getErrorMessage } from "../utils/communications.utils";

export function useCommunications(companyId: number) {
  const [config, setConfig] = useState<CompanyCommunicationConfig | null>(null);

  const [settings, setSettings] = useState<NotificationSetting[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  const [testingEmail, setTestingEmail] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [whatsappTestResult, setWhatsappTestResult] =
    useState<WhatsAppConnectionResult | null>(null);

  const [emailTestResult, setEmailTestResult] =
    useState<EmailConnectionResult | null>(null);

  /*
   * ============================
   * CARGAR CONFIGURACIÓN
   * ============================
   */

  const loadData = useCallback(async () => {
    if (!companyId) {
      return;
    }

    setLoading(true);

    setError(null);

    try {
      const [communicationConfig, notificationSettings] = await Promise.all([
        getCommunicationConfig(companyId),

        getNotificationSettings(companyId),
      ]);

      setConfig(communicationConfig);

      setSettings(notificationSettings);
    } catch (err) {
      console.error("ERROR LOAD COMMUNICATIONS", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * ============================
   * GUARDAR CONFIG GENERAL
   * ============================
   */

  const saveConfig = async (payload: UpdateCompanyCommunicationPayload) => {
    setSaving(true);

    setError(null);

    try {
      const updated = await updateCommunicationConfig(companyId, payload);

      setConfig(updated);

      /*
       * Si cambiaron credenciales,
       * invalidamos pruebas anteriores.
       */

      setWhatsappTestResult(null);
      setEmailTestResult(null);

      return updated;
    } catch (err) {
      console.error("ERROR SAVE COMMUNICATION CONFIG", err);

      const message = getErrorMessage(err);

      setError(message);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================
   * ACTUALIZAR AUTOMATIZACIÓN
   * ============================
   */

  const saveSetting = async (payload: UpdateNotificationSettingPayload) => {
    setError(null);

    try {
      const updated = await updateNotificationSetting(companyId, payload);

      setSettings((current) => {
        const exists = current.some(
          (item) =>
            item.event === updated.event && item.channel === updated.channel,
        );

        if (!exists) {
          return [...current, updated];
        }

        return current.map((item) =>
          item.event === updated.event && item.channel === updated.channel
            ? updated
            : item,
        );
      });

      return updated;
    } catch (err) {
      console.error("ERROR SAVE NOTIFICATION SETTING", err);

      setError(getErrorMessage(err));

      throw err;
    }
  };

  /*
   * ============================
   * PROBAR WHATSAPP
   * ============================
   */

  const testWhatsApp = async () => {
    setTestingWhatsApp(true);

    setWhatsappTestResult(null);

    setError(null);

    try {
      const result = await testWhatsAppConnection(companyId);

      setWhatsappTestResult(result);

      return result;
    } catch (err) {
      console.error("ERROR TEST WHATSAPP", err);

      setError(getErrorMessage(err));

      throw err;
    } finally {
      setTestingWhatsApp(false);
    }
  };

  /*
   * ============================
   * PROBAR EMAIL
   * ============================
   */

  const testEmail = async () => {
    setTestingEmail(true);

    setEmailTestResult(null);

    setError(null);

    try {
      const result = await testEmailConnection(companyId);

      setEmailTestResult(result);

      return result;
    } catch (err) {
      console.error("ERROR TEST EMAIL", err);

      setError(getErrorMessage(err));

      throw err;
    } finally {
      setTestingEmail(false);
    }
  };

  return {
    config,

    settings,

    loading,

    saving,

    testingWhatsApp,

    testingEmail,

    error,

    whatsappTestResult,

    emailTestResult,

    reload: loadData,

    saveConfig,

    saveSetting,

    testWhatsApp,

    testEmail,
  };
}
