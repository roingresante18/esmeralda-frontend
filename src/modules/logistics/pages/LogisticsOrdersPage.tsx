import LogisticsNavigation from "../components/LogisticsNavigation";

import LogisticsOrders from "../../../pages/preparacion/LogisticsOrders";

import { Stack } from "@mui/material";

/*
 * =========================================================
 * PEDIDOS DE LOGÍSTICA
 * =========================================================
 *
 * Reutilizamos temporalmente la pantalla existente.
 *
 * En el próximo paso reemplazaremos su lógica:
 *
 * pedido → repartidor
 *
 * por:
 *
 * pedidos seleccionados → jornada.
 */

export default function LogisticsOrdersPage() {
  return (
    <Stack spacing={1}>
      <Stack
        sx={{
          px: {
            xs: 2,

            md: 3,
          },

          pt: 2,
        }}
      >
        <LogisticsNavigation />
      </Stack>

      <LogisticsOrders />
    </Stack>
  );
}
