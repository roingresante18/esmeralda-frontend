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
  EmailConnectionResult,
  UpdateCompanyCommunicationPayload,
} from "../types/communications.types";

import ConnectionStatusChip from "./ConnectionStatusChip";

interface Props {
  config: CompanyCommunicationConfig;

  saving: boolean;

  testing: boolean;

  testResult: EmailConnectionResult | null;

  onSave: (payload: UpdateCompanyCommunicationPayload) => Promise<unknown>;

  onTest: () => Promise<unknown>;
}

export default function EmailConfigCard({
  config,
  saving,
  testing,
  testResult,
  onSave,
  onTest,
}: Props) {
  const [enabled, setEnabled] = useState(config.email_enabled);

  const [fromName, setFromName] = useState(config.email_from_name ?? "");

  const [fromAddress, setFromAddress] = useState(
    config.email_from_address ?? "",
  );

  const [smtpHost, setSmtpHost] = useState(config.smtp_host ?? "");

  const [smtpPort, setSmtpPort] = useState(String(config.smtp_port ?? 465));

  const [smtpSecure, setSmtpSecure] = useState(config.smtp_secure);

  const [smtpUsername, setSmtpUsername] = useState(config.smtp_username ?? "");

  const [smtpPassword, setSmtpPassword] = useState("");

  useEffect(() => {
    setEnabled(config.email_enabled);

    setFromName(config.email_from_name ?? "");

    setFromAddress(config.email_from_address ?? "");

    setSmtpHost(config.smtp_host ?? "");

    setSmtpPort(String(config.smtp_port ?? 465));

    setSmtpSecure(config.smtp_secure);

    setSmtpUsername(config.smtp_username ?? "");

    setSmtpPassword("");
  }, [config]);

  const handleSave = async () => {
    const parsedPort = Number(smtpPort);

    const payload: UpdateCompanyCommunicationPayload = {
      email_enabled: enabled,

      email_from_name: fromName,

      email_from_address: fromAddress,

      smtp_host: smtpHost,

      smtp_port: Number.isFinite(parsedPort) ? parsedPort : 465,

      smtp_secure: smtpSecure,

      smtp_username: smtpUsername,
    };

    if (smtpPassword.trim()) {
      payload.smtp_password = smtpPassword;
    }

    await onSave(payload);

    setSmtpPassword("");
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
              Email
            </Typography>

            <Typography
              component="p"
              variant="body2"
              sx={{
                color: "text.secondary",
              }}
            >
              Servidor SMTP de la empresa
            </Typography>
          </Box>

          <ConnectionStatusChip
            configured={
              config.smtp_password_configured && Boolean(config.smtp_host)
            }
            enabled={config.email_enabled}
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
          label="Activar notificaciones por email"
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
            label="Nombre del remitente"
            value={fromName}
            onChange={(event) => setFromName(event.target.value)}
            fullWidth
          />

          <TextField
            label="Email del remitente"
            value={fromAddress}
            onChange={(event) => setFromAddress(event.target.value)}
            fullWidth
          />

          <TextField
            label="SMTP Host"
            value={smtpHost}
            onChange={(event) => setSmtpHost(event.target.value)}
            fullWidth
          />

          <TextField
            label="SMTP Port"
            type="number"
            value={smtpPort}
            onChange={(event) => setSmtpPort(event.target.value)}
            fullWidth
          />

          <TextField
            label="Usuario SMTP"
            value={smtpUsername}
            onChange={(event) => setSmtpUsername(event.target.value)}
            fullWidth
          />

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={smtpSecure}
                  onChange={(event) => setSmtpSecure(event.target.checked)}
                />
              }
              label="Conexión segura SSL/TLS"
            />
          </Box>
        </Box>

        <TextField
          sx={{
            mt: 2,
          }}
          label={
            config.smtp_password_configured
              ? "Nueva contraseña SMTP (opcional)"
              : "Contraseña SMTP"
          }
          type="password"
          value={smtpPassword}
          onChange={(event) => setSmtpPassword(event.target.value)}
          fullWidth
          helperText={
            config.smtp_password_configured
              ? "Ya existe una contraseña almacenada. Dejá el campo vacío para conservarla."
              : "La contraseña será almacenada cifrada."
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
            {saving ? "Guardando..." : "Guardar Email"}
          </Button>

          <Button
            variant="outlined"
            disabled={
              testing || !config.smtp_password_configured || !config.smtp_host
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
