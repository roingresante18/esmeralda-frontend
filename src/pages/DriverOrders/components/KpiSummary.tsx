import { Paper, Stack, Typography, LinearProgress } from "@mui/material";
import type { DriverKpis } from "../types";

interface KpiSummaryProps {
  kpis: DriverKpis;
}

export const KpiSummary = ({ kpis }: KpiSummaryProps) => {
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

        <Typography variant="body2" color="text.secondary">
          {kpis.deliveredOrders} de {kpis.totalOrders} pedidos entregados
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Cobrado efectivo: ${kpis.cash.toLocaleString("es-AR")} |
          Transferencia: ${kpis.transfer.toLocaleString("es-AR")}
        </Typography>
      </Stack>
    </Paper>
  );
};
