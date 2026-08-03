import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useState } from "react";

import type {
  CompanyCommunicationConfig,
  UpdateCompanyCommunicationPayload,
  WhatsAppConnectionResult,
} from "../types/communications.types";

import ConnectionStatusChip from "./ConnectionStatusChip";

interface Props {
  config: CompanyCommunicationConfig;

  saving: boolean;

  testing: boolean;

  testResult: WhatsAppConnectionResult | null;

  onSave: (payload: UpdateCompanyCommunicationPayload) => Promise<unknown>;

  onTest: () => Promise<unknown>;
}

export default function WhatsAppConfigCard({
  config,
  saving,
  testing,
  testResult,
  onSave,
  onTest,
}: Props) {
  const [enabled, setEnabled] = useState(config.whatsapp_enabled);

  const [phone, setPhone] = useState(config.whatsapp_phone ?? "");

  const [phoneNumberId, setPhoneNumberId] = useState(
    config.whatsapp_phone_number_id ?? "",
  );

  const [businessAccountId, setBusinessAccountId] = useState(
    config.whatsapp_business_account_id ?? "",
  );

  const [graphVersion, setGraphVersion] = useState(
    config.whatsapp_graph_version ?? "v23.0",
  );

  const [language, setLanguage] = useState(
    config.whatsapp_template_language ?? "es_AR",
  );

  const [country, setCountry] = useState(config.default_country_iso ?? "AR");

  const [accessToken, setAccessToken] = useState("");

  useEffect(() => {
    setEnabled(config.whatsapp_enabled);

    setPhone(config.whatsapp_phone ?? "");

    setPhoneNumberId(config.whatsapp_phone_number_id ?? "");

    setBusinessAccountId(config.whatsapp_business_account_id ?? "");

    setGraphVersion(config.whatsapp_graph_version ?? "v23.0");

    setLanguage(config.whatsapp_template_language ?? "es_AR");

    setCountry(config.default_country_iso ?? "AR");

    /*
     * Nunca recuperamos el token desde backend.
     */
    setAccessToken("");
  }, [config]);

  const handleSave = async () => {
    const payload: UpdateCompanyCommunicationPayload = {
      whatsapp_enabled: enabled,

      whatsapp_phone: phone,

      whatsapp_phone_number_id: phoneNumberId,

      whatsapp_business_account_id: businessAccountId,

      whatsapp_graph_version: graphVersion,

      whatsapp_template_language: language,

      default_country_iso: country,
    };

    /*
     * Solamente reemplazamos el token
     * si el administrador escribió uno.
     */

    if (accessToken.trim()) {
      payload.whatsapp_access_token = accessToken.trim();
    }

    await onSave(payload);

    setAccessToken("");
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography
              component="h2"
              variant="h6"
              sx={{
                fontWeight: 700,
              }}
            >
              WhatsApp
            </Typography>

            <Typography
              component="p"
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              WhatsApp Business Platform
            </Typography>
          </Box>

          <ConnectionStatusChip
            configured={
              config.whatsapp_token_configured &&
              Boolean(config.whatsapp_phone_number_id)
            }
            enabled={config.whatsapp_enabled}
          />
        </Box>

        <Divider
          sx={{
            my: 3,
          }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
          }
          label="Activar notificaciones por WhatsApp"
        />

        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
          }}
        >
          <TextField
            label="Número de WhatsApp"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            fullWidth
          />

          <TextField
            label="Phone Number ID"
            value={phoneNumberId}
            onChange={(event) => setPhoneNumberId(event.target.value)}
            fullWidth
          />

          <TextField
            label="Business Account ID"
            value={businessAccountId}
            onChange={(event) => setBusinessAccountId(event.target.value)}
            fullWidth
          />

          <TextField
            label="Graph API Version"
            value={graphVersion}
            onChange={(event) => setGraphVersion(event.target.value)}
            fullWidth
          />

          <TextField
            label="País"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            fullWidth
          />

          <TextField
            label="Idioma de plantillas"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            fullWidth
          />
        </Box>

        <TextField
          sx={{
            mt: 2,
          }}
          label={
            config.whatsapp_token_configured
              ? "Nuevo Access Token (opcional)"
              : "Access Token"
          }
          type="password"
          value={accessToken}
          onChange={(event) => setAccessToken(event.target.value)}
          fullWidth
          helperText={
            config.whatsapp_token_configured
              ? "Ya existe un token almacenado. Dejá este campo vacío para conservarlo."
              : "Ingresá el token proporcionado por Meta."
          }
        />

        {testResult && (
          <Alert
            severity="success"
            sx={{
              mt: 2,
            }}
          >
            {testResult.message}

            {testResult.data?.verifiedName
              ? ` · ${testResult.data.verifiedName}`
              : ""}
          </Alert>
        )}

        <Box
          sx={{
            mt: 3,
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            disabled={saving}
            onClick={() => {
              void handleSave();
            }}
          >
            {saving ? "Guardando..." : "Guardar WhatsApp"}
          </Button>

          <Button
            variant="outlined"
            disabled={
              testing ||
              !config.whatsapp_token_configured ||
              !config.whatsapp_phone_number_id
            }
            onClick={() => {
              void onTest();
            }}
          >
            {testing ? "Probando..." : "Probar conexión"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
