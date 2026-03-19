import { Alert } from "@mui/material";

interface Props {
  next12hCount: number;
}

export const DeliveryAlertBanner = ({ next12hCount }: Props) => {
  if (!next12hCount) return null;

  return (
    <Alert severity="warning" sx={{ borderRadius: 3 }}>
      Tenés {next12hCount} pedidos con entrega dentro de las próximas 12 horas.
    </Alert>
  );
};
