import { Box, Typography } from "@mui/material";

export default function CommunicationsHeader() {
  return (
    <Box>
      <Typography
        component="h1"
        variant="h4"
        sx={{
          fontWeight: 700,
        }}
      >
        Comunicaciones
      </Typography>

      <Typography
        component="p"
        variant="body1"
        sx={{
          mt: 1,
          color: "text.secondary",
        }}
      >
        Configurá los canales utilizados para informar automáticamente a tus
        clientes sobre el estado de sus pedidos.
      </Typography>
    </Box>
  );
}
