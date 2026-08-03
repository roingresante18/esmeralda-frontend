import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";

import type {
  NotificationChannel,
  NotificationEvent,
  NotificationSetting,
  UpdateNotificationSettingPayload,
} from "../types/communications.types";

import {
  notificationEventDescriptions,
  notificationEventLabels,
  notificationEvents,
} from "../utils/communications.utils";

interface Props {
  settings: NotificationSetting[];

  whatsappAvailable: boolean;

  emailAvailable: boolean;

  onSave: (payload: UpdateNotificationSettingPayload) => Promise<unknown>;
}

export default function NotificationSettingsTable({
  settings,
  whatsappAvailable,
  emailAvailable,
  onSave,
}: Props) {
  const findSetting = (
    event: NotificationEvent,
    channel: NotificationChannel,
  ) =>
    settings.find(
      (setting) => setting.event === event && setting.channel === channel,
    );

  const isEnabled = (event: NotificationEvent, channel: NotificationChannel) =>
    Boolean(findSetting(event, channel)?.enabled);

  const handleToggle = async (
    event: NotificationEvent,
    channel: NotificationChannel,
    enabled: boolean,
  ) => {
    const current = findSetting(event, channel);

    await onSave({
      event,

      channel,

      enabled,

      template_name:
        current?.template_name ??
        (channel === "WHATSAPP" ? event.toLowerCase() : null),

      email_subject:
        current?.email_subject ??
        (channel === "EMAIL" ? notificationEventLabels[event] : null),
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography
          component="h2"
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          Automatizaciones
        </Typography>

        <Typography
          component="p"
          variant="body2"
          sx={{
            mt: 0.5,
            color: "text.secondary",
          }}
        >
          Elegí qué cambios del pedido deben notificarse automáticamente al
          cliente.
        </Typography>

        <Divider
          sx={{
            my: 3,
          }}
        />

        <Box
          sx={{
            display: "grid",
            gap: 1,
          }}
        >
          {notificationEvents.map((event) => (
            <Box
              key={event}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(260px, 1fr) 180px 180px",
                },
                gap: 2,
                alignItems: "center",
                py: 2,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box>
                <Typography
                  component="h3"
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {notificationEventLabels[event]}
                </Typography>

                <Typography
                  component="p"
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {notificationEventDescriptions[event]}
                </Typography>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled(event, "WHATSAPP")}
                    disabled={!whatsappAvailable}
                    onChange={(changeEvent) => {
                      void handleToggle(
                        event,
                        "WHATSAPP",
                        changeEvent.target.checked,
                      );
                    }}
                  />
                }
                label="WhatsApp"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={isEnabled(event, "EMAIL")}
                    disabled={!emailAvailable}
                    onChange={(changeEvent) => {
                      void handleToggle(
                        event,
                        "EMAIL",
                        changeEvent.target.checked,
                      );
                    }}
                  />
                }
                label="Email"
              />
            </Box>
          ))}
        </Box>

        {!whatsappAvailable && (
          <Typography
            component="p"
            variant="caption"
            sx={{
              display: "block",
              mt: 2,
              color: "text.secondary",
            }}
          >
            Configurá y activá WhatsApp para habilitar sus automatizaciones.
          </Typography>
        )}

        {!emailAvailable && (
          <Typography
            component="p"
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              color: "text.secondary",
            }}
          >
            Configurá y activá Email para habilitar sus automatizaciones.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
