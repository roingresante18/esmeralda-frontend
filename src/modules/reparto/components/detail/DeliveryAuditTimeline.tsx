import { Box, Stack, Typography } from "@mui/material";
import type { DeliveryAuditEvent } from "../../types/delivery.types";
import { SectionCard } from "../shared/SectionCard";

interface Props {
  events?: DeliveryAuditEvent[];
}

export const DeliveryAuditTimeline = ({ events = [] }: Props) => {
  return (
    <SectionCard>
      <Stack spacing={1.2}>
        <Typography fontWeight={900}>Auditoría del pedido</Typography>

        {events.length === 0 ? (
          <Typography color="text.secondary">
            No hay eventos registrados todavía.
          </Typography>
        ) : (
          events.map((event, index) => (
            <Stack
              key={event.id}
              direction="row"
              spacing={1.2}
              alignItems="flex-start"
            >
              <Stack alignItems="center" sx={{ minWidth: 18 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: "primary.main",
                    mt: "6px",
                  }}
                />
                {index < events.length - 1 ? (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 28,
                      backgroundColor: "divider",
                      mt: 0.5,
                    }}
                  />
                ) : null}
              </Stack>

              <Stack spacing={0.3} pb={1}>
                <Typography fontWeight={800}>{event.title}</Typography>
                {event.description ? (
                  <Typography variant="body2" color="text.secondary">
                    {event.description}
                  </Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary">
                  {new Date(event.createdAt).toLocaleString("es-AR")} ·{" "}
                  {event.createdBy}
                </Typography>
              </Stack>
            </Stack>
          ))
        )}
      </Stack>
    </SectionCard>
  );
};
