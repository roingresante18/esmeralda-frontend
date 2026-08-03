import { Alert, Box, CircularProgress, Container } from "@mui/material";

import CommunicationsHeader from "../components/CommunicationsHeader";

import EmailConfigCard from "../components/EmailConfigCard";

import NotificationSettingsTable from "../components/NotificationSettingsTable";

import WhatsAppConfigCard from "../components/WhatsAppConfigCard";

import { useCommunications } from "../hooks/useCommunications";

/*
 * TEMPORAL:
 *
 * Actualmente Esmeralda utiliza companyId = 1.
 *
 * Cuando terminemos de convertir el frontend
 * completamente a multiempresa, este ID deberá
 * salir del usuario/sesión/contexto.
 */

const CURRENT_COMPANY_ID = 1;

export default function CommunicationsPage() {
  const {
    config,

    settings,

    loading,

    saving,

    testingWhatsApp,

    testingEmail,

    error,

    whatsappTestResult,

    emailTestResult,

    saveConfig,

    saveSetting,

    testWhatsApp,

    testEmail,
  } = useCommunications(CURRENT_COMPANY_ID);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Container
        maxWidth="xl"
        sx={{
          py: 4,
        }}
      >
        <Alert severity="error">
          No se pudo cargar la configuración de comunicaciones.
        </Alert>
      </Container>
    );
  }

  const whatsappAvailable =
    config.whatsapp_enabled &&
    config.whatsapp_token_configured &&
    Boolean(config.whatsapp_phone_number_id);

  const emailAvailable =
    config.email_enabled &&
    config.smtp_password_configured &&
    Boolean(config.smtp_host);

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 4,
      }}
    >
      <CommunicationsHeader />

      {error && (
        <Alert
          severity="error"
          sx={{
            mt: 3,
          }}
        >
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mt: 4,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr 1fr",
          },
          gap: 3,
          alignItems: "start",
        }}
      >
        <WhatsAppConfigCard
          config={config}
          saving={saving}
          testing={testingWhatsApp}
          testResult={whatsappTestResult}
          onSave={saveConfig}
          onTest={testWhatsApp}
        />

        <EmailConfigCard
          config={config}
          saving={saving}
          testing={testingEmail}
          testResult={emailTestResult}
          onSave={saveConfig}
          onTest={testEmail}
        />
      </Box>

      <Box
        sx={{
          mt: 3,
        }}
      >
        <NotificationSettingsTable
          settings={settings}
          whatsappAvailable={whatsappAvailable}
          emailAvailable={emailAvailable}
          onSave={saveSetting}
        />
      </Box>
    </Container>
  );
}
