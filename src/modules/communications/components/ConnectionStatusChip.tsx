import { Chip } from "@mui/material";

interface Props {
  configured: boolean;

  enabled?: boolean;

  labelConfigured?: string;

  labelNotConfigured?: string;
}

export default function ConnectionStatusChip({
  configured,
  enabled,
  labelConfigured = "Configurado",
  labelNotConfigured = "Sin configurar",
}: Props) {
  if (!configured) {
    return <Chip size="small" label={labelNotConfigured} variant="outlined" />;
  }

  if (enabled === false) {
    return (
      <Chip size="small" label="Configurado · Desactivado" variant="outlined" />
    );
  }

  return <Chip size="small" label={labelConfigured} />;
}
