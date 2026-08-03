import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setEnabled(config.email_enabled);

    setFromName(config.email_from_name ?? "");

    setFromAddress(config.email_from_address ?? "");

    setSmtpHost(config.smtp_host ?? "");

    setSmtpPort(String(config.smtp_port ?? 465));

    setSmtpSecure(config.smtp_secure);

    setSmtpUsername(config.smtp_username ?? "");

    /*
     * La contraseña nunca vuelve desde backend.
     */
    setSmtpPassword("");
  }, [config]);

  const handleSave = async () => {
    const parsedPort = Number(smtpPort);

    const payload: UpdateCompanyCommunicationPayload = {
      email_enabled: enabled,

      email_from_name: fromName.trim(),

      email_from_address: fromAddress.trim(),

      smtp_host: smtpHost.trim(),

      smtp_port: Number.isFinite(parsedPort) ? parsedPort : 465,

      smtp_secure: smtpSecure,

      smtp_username: smtpUsername.trim(),
    };

    /*
     * Solo reemplaza la contraseña si
     * el administrador escribió una nueva.
     */
    if (smtpPassword.trim()) {
      payload.smtp_password = smtpPassword;
    }

    await onSave(payload);

    setSmtpPassword("");
  };

  const isConfigured =
    config.smtp_password_configured &&
    Boolean(config.smtp_host) &&
    Boolean(config.smtp_username);

  return (
    <Card variant="outlined">
      <CardContent>
        {/*
         * =====================================================
         * HEADER
         * =====================================================
         */}

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
              Servidor de correo SMTP de la empresa
            </Typography>
          </Box>

          <ConnectionStatusChip
            configured={isConfigured}
            enabled={config.email_enabled}
          />
        </Box>

        <Divider
          sx={{
            my: 3,
          }}
        />

        {/*
         * =====================================================
         * INTRODUCCIÓN
         * =====================================================
         */}

        <Alert
          severity="info"
          icon={<InfoOutlinedIcon />}
          sx={{
            mb: 3,
          }}
        >
          Para enviar emails automáticos necesitás una cuenta de correo que
          permita envío mediante SMTP. Los datos dependen del proveedor que
          utilices, por ejemplo Gmail, Outlook, Zoho, DonWeb u otro servicio de
          correo.
        </Alert>

        <Box
          sx={{
            mb: 3,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
            }}
          >
            Importante
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              color: "text.secondary",
            }}
          >
            Primero guardá la configuración, después utilizá Probar conexión.
            Recién cuando la prueba funcione correctamente conviene activar el
            canal y las automatizaciones.
          </Typography>
        </Box>

        {/*
         * =====================================================
         * ACTIVACIÓN
         * =====================================================
         */}

        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
          }
          label="Activar notificaciones por email"
        />

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "text.secondary",
          }}
        >
          Activá esta opción solamente después de verificar correctamente el
          servidor SMTP.
        </Typography>

        {/*
         * =====================================================
         * DATOS DEL REMITENTE
         * =====================================================
         */}

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
            placeholder="Esmeralda"
            helperText="Es el nombre que verá el cliente como remitente del mensaje. Ejemplo: Esmeralda."
          />

          <TextField
            label="Email del remitente"
            value={fromAddress}
            onChange={(event) => setFromAddress(event.target.value)}
            fullWidth
            placeholder="pedidos@empresa.com"
            helperText="Dirección desde la que se enviarán los avisos. Ejemplo: pedidos@empresa.com."
          />
        </Box>

        {/*
         * =====================================================
         * SMTP AVANZADO
         * =====================================================
         */}

        <Box
          sx={{
            mt: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box
            onClick={() => setShowAdvanced((current) => !current)}
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                }}
              >
                Configuración SMTP
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Datos técnicos proporcionados por tu proveedor de correo.
              </Typography>
            </Box>

            <IconButton size="small" aria-label="Mostrar configuración SMTP">
              {showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showAdvanced}>
            <Divider />

            <Box
              sx={{
                p: 2,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
                gap: 2,
              }}
            >
              <TextField
                label="SMTP Host"
                value={smtpHost}
                onChange={(event) => setSmtpHost(event.target.value)}
                fullWidth
                placeholder="smtp.ejemplo.com"
                helperText="Dirección del servidor que envía los correos. La proporciona tu proveedor. Ejemplo: smtp.gmail.com."
              />

              <TextField
                label="SMTP Port"
                type="number"
                value={smtpPort}
                onChange={(event) => setSmtpPort(event.target.value)}
                fullWidth
                helperText="Puerto de conexión al servidor. Los valores más comunes son 465 para SSL o 587 para STARTTLS."
              />

              <TextField
                label="Usuario SMTP"
                value={smtpUsername}
                onChange={(event) => setSmtpUsername(event.target.value)}
                fullWidth
                placeholder="pedidos@empresa.com"
                helperText="Usuario utilizado para iniciar sesión en el servidor SMTP. Normalmente es la dirección de email completa."
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
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

                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  Normalmente se activa con puerto 465. Con puerto 587 puede
                  depender de la configuración del proveedor.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                px: 2,
                pb: 2,
              }}
            >
              <TextField
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
                    ? "Ya existe una contraseña guardada. Dejá este campo vacío para conservarla. Escribí una nueva solamente si necesitás reemplazarla."
                    : "Contraseña o clave de aplicación necesaria para enviar correo. El sistema la almacenará cifrada."
                }
              />
            </Box>
          </Collapse>
        </Box>

        {/*
         * =====================================================
         * AYUDA
         * =====================================================
         */}

        <Box
          sx={{
            mt: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Box
            onClick={() => setShowHelp((current) => !current)}
            sx={{
              px: 2,
              py: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                }}
              >
                ¿Dónde consigo los datos SMTP?
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Depende del proveedor que administre tu casilla de correo.
              </Typography>
            </Box>

            <IconButton size="small" aria-label="Mostrar ayuda SMTP">
              {showHelp ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={showHelp}>
            <Divider />

            <Box
              sx={{
                p: 2,
              }}
            >
              <Stack spacing={1.5}>
                <Typography variant="body2">
                  1. Identificá qué proveedor administra tu cuenta de correo.
                </Typography>

                <Typography variant="body2">
                  2. Buscá dentro de ese proveedor la configuración SMTP o
                  correo saliente.
                </Typography>

                <Typography variant="body2">
                  3. Copiá el servidor SMTP, puerto y usuario.
                </Typography>

                <Typography variant="body2">
                  4. Algunos proveedores permiten usar la contraseña normal de
                  la cuenta; otros requieren una contraseña o clave de
                  aplicación especial.
                </Typography>

                <Typography variant="body2">
                  5. Guardá los datos en este formulario.
                </Typography>

                <Typography variant="body2">
                  6. Presioná Probar conexión para comprobar que el sistema
                  puede autenticarse correctamente.
                </Typography>
              </Stack>

              <Alert
                severity="info"
                sx={{
                  mt: 2,
                }}
              >
                Ejemplos habituales de proveedores: Gmail, Microsoft 365 /
                Outlook, Zoho, DonWeb y servidores de correo corporativo. Los
                valores exactos deben consultarse en la documentación de cada
                proveedor.
              </Alert>

              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                }}
              >
                La contraseña SMTP es una credencial privada. Este sistema no la
                muestra una vez guardada y la almacena cifrada.
              </Alert>
            </Box>
          </Collapse>
        </Box>

        {/*
         * =====================================================
         * RESULTADO DE PRUEBA
         * =====================================================
         */}

        {testResult && (
          <Alert
            severity="success"
            sx={{
              mt: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
              }}
            >
              {testResult.message}
            </Typography>

            {testResult.data?.host && (
              <Typography variant="body2">
                Servidor: {testResult.data.host}
                {testResult.data?.port ? `:${testResult.data.port}` : ""}
              </Typography>
            )}

            {testResult.data?.from && (
              <Typography variant="body2">
                Remitente: {testResult.data.from}
              </Typography>
            )}
          </Alert>
        )}

        {/*
         * =====================================================
         * ACCIONES
         * =====================================================
         */}

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

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1.5,
            color: "text.secondary",
          }}
        >
          Guardar almacena la configuración. Probar conexión verifica acceso al
          servidor SMTP. Activar permite que los eventos seleccionados empiecen
          a utilizar email.
        </Typography>
      </CardContent>
    </Card>
  );
}
