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

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setEnabled(config.whatsapp_enabled);

    setPhone(config.whatsapp_phone ?? "");

    setPhoneNumberId(config.whatsapp_phone_number_id ?? "");

    setBusinessAccountId(config.whatsapp_business_account_id ?? "");

    setGraphVersion(config.whatsapp_graph_version ?? "v23.0");

    setLanguage(config.whatsapp_template_language ?? "es_AR");

    setCountry(config.default_country_iso ?? "AR");

    /*
     * Nunca recuperamos el token real
     * desde backend.
     */
    setAccessToken("");
  }, [config]);

  const handleSave = async () => {
    const payload: UpdateCompanyCommunicationPayload = {
      whatsapp_enabled: enabled,

      whatsapp_phone: phone.trim(),

      whatsapp_phone_number_id: phoneNumberId.trim(),

      whatsapp_business_account_id: businessAccountId.trim(),

      whatsapp_graph_version: graphVersion.trim(),

      whatsapp_template_language: language.trim(),

      default_country_iso: country.trim().toUpperCase(),
    };

    /*
     * Solamente reemplazamos el token
     * si el administrador escribió uno nuevo.
     */
    if (accessToken.trim()) {
      payload.whatsapp_access_token = accessToken.trim();
    }

    await onSave(payload);

    setAccessToken("");
  };

  const isConfigured =
    config.whatsapp_token_configured &&
    Boolean(config.whatsapp_phone_number_id);

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
            configured={isConfigured}
            enabled={config.whatsapp_enabled}
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
          Para conectar WhatsApp necesitás tener configurada una cuenta de
          WhatsApp Business Platform en Meta. El sistema utiliza esa
          configuración para enviar avisos automáticos a tus clientes.
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
            Guardar la configuración no significa que inmediatamente se enviarán
            mensajes. Primero podés guardar los datos, después probar la
            conexión y finalmente activar el canal y las automatizaciones que
            quieras usar.
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
          label="Activar notificaciones por WhatsApp"
        />

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "text.secondary",
          }}
        >
          Activá esta opción cuando la conexión ya esté configurada y probada
          correctamente.
        </Typography>

        {/*
         * =====================================================
         * NÚMERO COMERCIAL
         * =====================================================
         */}

        <TextField
          sx={{
            mt: 3,
          }}
          label="Número de WhatsApp"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          fullWidth
          placeholder="+54 9 3755 123456"
          helperText="Es el número comercial que tus clientes reconocerán. Ejemplo: +54 9 3755 123456. No es el Phone Number ID."
        />

        {/*
         * =====================================================
         * CONFIGURACIÓN AVANZADA
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
                Configuración avanzada de Meta
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Identificadores técnicos y credenciales necesarias para conectar
                la API.
              </Typography>
            </Box>

            <IconButton
              size="small"
              aria-label="Mostrar configuración avanzada"
            >
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
                label="Phone Number ID"
                value={phoneNumberId}
                onChange={(event) => setPhoneNumberId(event.target.value)}
                fullWidth
                helperText="Identificador técnico que Meta asigna al número de WhatsApp. No es el número telefónico. Se obtiene en Meta for Developers, dentro de WhatsApp > API Setup."
              />

              <TextField
                label="Business Account ID"
                value={businessAccountId}
                onChange={(event) => setBusinessAccountId(event.target.value)}
                fullWidth
                helperText="Identifica tu cuenta de WhatsApp Business dentro de Meta. Agrupa números, plantillas y configuración comercial."
              />

              <TextField
                label="Graph API Version"
                value={graphVersion}
                onChange={(event) => setGraphVersion(event.target.value)}
                fullWidth
                helperText="Versión de la API de Meta que utilizará el sistema. Normalmente podés dejar el valor sugerido."
              />

              <TextField
                label="País"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                fullWidth
                placeholder="AR"
                helperText="Código ISO del país usado para interpretar números locales. Ejemplo: AR para Argentina."
              />

              <TextField
                label="Idioma de plantillas"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                fullWidth
                helperText="Idioma utilizado por las plantillas aprobadas en Meta. Ejemplo: es_AR."
              />
            </Box>

            <Box
              sx={{
                px: 2,
                pb: 2,
              }}
            >
              <TextField
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
                    ? "Ya existe un Access Token guardado. Dejá este campo vacío para conservarlo. Escribí uno nuevo solamente si necesitás reemplazarlo."
                    : "Clave privada que autoriza a este sistema a comunicarse con Meta. Se obtiene desde Meta for Developers y nunca debe compartirse públicamente."
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
                ¿Dónde consigo estos datos?
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                Guía básica para conectar una cuenta de WhatsApp Business.
              </Typography>
            </Box>

            <IconButton size="small" aria-label="Mostrar ayuda de WhatsApp">
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
                  1. Ingresá o creá una cuenta en Meta Business.
                </Typography>

                <Typography variant="body2">
                  2. Ingresá a Meta for Developers y creá una aplicación para tu
                  empresa.
                </Typography>

                <Typography variant="body2">
                  3. Agregá el producto WhatsApp a la aplicación.
                </Typography>

                <Typography variant="body2">
                  4. Vinculá o configurá el número comercial que utilizarás para
                  enviar mensajes.
                </Typography>

                <Typography variant="body2">
                  5. En la sección de configuración de la API podrás obtener el
                  Phone Number ID y el WhatsApp Business Account ID.
                </Typography>

                <Typography variant="body2">
                  6. Generá o configurá el Access Token correspondiente a la
                  aplicación.
                </Typography>

                <Typography variant="body2">
                  7. Copiá esos datos en este formulario y presioná Guardar
                  WhatsApp.
                </Typography>

                <Typography variant="body2">
                  8. Después utilizá Probar conexión para verificar que Meta
                  acepta las credenciales.
                </Typography>
              </Stack>

              <Alert
                severity="warning"
                sx={{
                  mt: 2,
                }}
              >
                El Access Token es una credencial privada. No debe enviarse por
                WhatsApp, email ni compartirse públicamente. Este sistema lo
                almacena cifrado.
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

            {testResult.data?.verifiedName && (
              <Typography variant="body2">
                Cuenta verificada: {testResult.data.verifiedName}
              </Typography>
            )}

            {testResult.data?.displayPhoneNumber && (
              <Typography variant="body2">
                Número: {testResult.data.displayPhoneNumber}
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

        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 1.5,
            color: "text.secondary",
          }}
        >
          Guardar almacena la configuración. Probar conexión verifica que las
          credenciales sean válidas. Activar habilita el uso real del canal para
          las automatizaciones seleccionadas.
        </Typography>
      </CardContent>
    </Card>
  );
}
