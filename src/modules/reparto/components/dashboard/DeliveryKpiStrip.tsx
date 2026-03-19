import { Grid, Paper, Stack, Typography } from "@mui/material";
import type { DeliveryDashboardKpis } from "../../types/delivery.types";

const KpiCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.5,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      minHeight: 84,
    }}
  >
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800} fontSize={20} color={color}>
        {value}
      </Typography>
    </Stack>
  </Paper>
);

export const DeliveryKpiStrip = ({ kpis }: { kpis: DeliveryDashboardKpis }) => {
  return (
    <Grid container spacing={1.2}>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <KpiCard label="Asignados" value={kpis.totalAssigned} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <KpiCard label="Pendientes" value={kpis.pending} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <KpiCard
          label="Entregados"
          value={kpis.delivered}
          color="success.main"
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <KpiCard
          label="Parciales"
          value={kpis.partialDelivered}
          color="warning.main"
        />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <KpiCard label="Reprogramados" value={kpis.rescheduled} />
      </Grid>
      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
        <KpiCard
          label="Cobrado hoy"
          value={`$${kpis.totalCollected.toLocaleString("es-AR")}`}
        />
      </Grid>
    </Grid>
  );
};
