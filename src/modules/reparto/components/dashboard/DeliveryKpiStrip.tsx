import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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
      p: { xs: 1, sm: 1.25 },
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      minHeight: { xs: 62, sm: 78 },
      display: "flex",
      alignItems: "center",
    }}
  >
    <Stack spacing={0.25}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontSize: { xs: 11, sm: 12 },
          lineHeight: 1.1,
        }}
      >
        {label}
      </Typography>

      <Typography
        color={color}
        sx={{
          fontWeight: 800,
          fontSize: { xs: 16, sm: 20 },
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Stack>
  </Paper>
);

const KpiGrid = ({ kpis }: { kpis: DeliveryDashboardKpis }) => (
  <Grid container spacing={{ xs: 0.75, sm: 1 }}>
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <KpiCard label="Asignados" value={kpis.totalAssigned} />
    </Grid>
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <KpiCard label="Pendientes" value={kpis.pending} />
    </Grid>
    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
      <KpiCard label="Entregados" value={kpis.delivered} color="success.main" />
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

export const DeliveryKpiStrip = ({ kpis }: { kpis: DeliveryDashboardKpis }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (!isMobile) {
    return <KpiGrid kpis={kpis} />;
  }

  return (
    <Accordion
      disableGutters
      elevation={0}
      defaultExpanded={false}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "background.paper",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 1.25,
          minHeight: 52,
          "& .MuiAccordionSummary-content": {
            my: 1,
            minWidth: 0,
          },
        }}
      >
        <Stack width="100%" spacing={0.5}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            Resumen del día
          </Typography>

          <Stack
            direction="row"
            spacing={1.25}
            useFlexGap
            flexWrap="wrap"
            sx={{ pr: 1 }}
          >
            <Typography variant="caption">
              Pend: <strong>{kpis.pending}</strong>
            </Typography>
            <Typography variant="caption">
              Entr: <strong>{kpis.delivered}</strong>
            </Typography>
            <Typography variant="caption">
              Cob:{" "}
              <strong>${kpis.totalCollected.toLocaleString("es-AR")}</strong>
            </Typography>
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 1 }}>
        <KpiGrid kpis={kpis} />
      </AccordionDetails>
    </Accordion>
  );
};
