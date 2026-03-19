import {
  Alert,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTruckPreparation } from "../hooks/useTruckPreparation";

export default function TruckPreparationPage() {
  const { summary, today, tomorrow } = useTruckPreparation();

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight={900}>
          Preparación y armado de camión
        </Typography>

        {summary.totalNext12h > 0 && (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            Hay {summary.totalNext12h} pedidos dentro de las próximas 12 horas.
          </Alert>
        )}

        <Grid container spacing={1.5}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption">Pedidos de hoy</Typography>
              <Typography variant="h5" fontWeight={900}>
                {summary.totalToday}
              </Typography>
              <Chip label={today} size="small" />
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption">Pedidos de mañana</Typography>
              <Typography variant="h5" fontWeight={900}>
                {summary.totalTomorrow}
              </Typography>
              <Chip label={tomorrow} size="small" />
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 3 }}>
              <Typography variant="caption">Próximas 12h</Typography>
              <Typography variant="h5" fontWeight={900}>
                {summary.totalNext12h}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontWeight={800} mb={1}>
            Agrupado por municipio
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {summary.groupedByMunicipality.map((item) => (
              <Chip
                key={item.municipality}
                label={`${item.municipality}: ${item.count}`}
                color="primary"
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontWeight={800} mb={1}>
            Agrupado por zona
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {summary.groupedByZone.map((item) => (
              <Chip
                key={item.zone}
                label={`${item.zone}: ${item.count}`}
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Typography fontWeight={800} mb={1}>
            Agrupado por chofer
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {summary.groupedByDriver.map((item) => (
              <Chip
                key={item.driverName}
                label={`${item.driverName}: ${item.count}`}
                variant="outlined"
              />
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
