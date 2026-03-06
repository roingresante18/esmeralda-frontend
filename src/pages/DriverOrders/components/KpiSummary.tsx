// components/KpiSummary.tsx
import { Paper, Stack, Typography, LinearProgress } from "@mui/material";

/**
 * Componente puro (sin lógica)
 * Fácil de testear
 */
export const KpiSummary = ({ kpis }: any) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Typography fontWeight="bold">
          Progreso: {kpis.progress.toFixed(0)}%
        </Typography>

        <LinearProgress
          variant="determinate"
          value={kpis.progress}
          sx={{ height: 10, borderRadius: 5 }}
        />

        <Typography>
          Total estimado: ${kpis.estimated.toLocaleString("es-AR")}
        </Typography>

        <Typography color="success.main">
          Total entregado: ${kpis.delivered.toLocaleString("es-AR")}
        </Typography>
      </Stack>
    </Paper>
  );
};
