import { Grid, Paper, Stack, Typography } from "@mui/material";

import type { DeliveryDashboardKpis } from "../../types/delivery.types";

const formatCurrency = (value: number): string =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

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
      p: {
        xs: 1,
        sm: 1.25,
      },
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      minHeight: {
        xs: 66,
        sm: 78,
      },
      height: "100%",
      display: "flex",
      alignItems: "center",
    }}
  >
    <Stack spacing={0.25}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontSize: {
            xs: 10.5,
            sm: 12,
          },
          lineHeight: 1.1,
        }}
      >
        {label}
      </Typography>

      <Typography
        color={color}
        sx={{
          fontWeight: 900,
          fontSize: {
            xs: 15,
            sm: 20,
          },
          lineHeight: 1.15,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Typography>
    </Stack>
  </Paper>
);

export const DeliveryKpiStrip = ({ kpis }: { kpis: DeliveryDashboardKpis }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1,
          sm: 1.5,
        },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={900}>
          Resumen del día
        </Typography>

        <Grid
          container
          spacing={{
            xs: 0.75,
            sm: 1,
          }}
        >
          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <KpiCard label="Asignados" value={kpis.totalAssigned} />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <KpiCard
              label="Pendientes activos"
              value={kpis.pending}
              color="info.main"
            />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <KpiCard
              label="Entregados"
              value={kpis.delivered}
              color="success.main"
            />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <KpiCard
              label="Parciales"
              value={kpis.partialDelivered}
              color="warning.main"
            />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <KpiCard label="Reprogramados" value={kpis.rescheduled} />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <KpiCard
              label="No entregados"
              value={kpis.notDelivered}
              color="error.main"
            />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 3,
            }}
          >
            <KpiCard
              label="Efectivo cobrado"
              value={formatCurrency(kpis.cashCollected)}
              color="success.main"
            />
          </Grid>

          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 3,
            }}
          >
            <KpiCard
              label="Transferencias"
              value={formatCurrency(kpis.transferCollected)}
              color="primary.main"
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 4,
              md: 6,
            }}
          >
            <KpiCard
              label="Total cobrado"
              value={formatCurrency(kpis.totalCollected)}
              color="success.dark"
            />
          </Grid>
        </Grid>
      </Stack>
    </Paper>
  );
};
