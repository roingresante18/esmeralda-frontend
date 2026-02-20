import { useEffect, useState } from "react";
import { Button, Stack, Typography, Alert, Divider } from "@mui/material";

type Props = {
  total: number;
  onSave: () => void | Promise<void>;
  onExport: () => void;
  disabled?: boolean;
};

export default function OrderSummary({
  total,
  onSave,
  onExport,
  disabled,
}: Props) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // 🔄 Si cambia el total, el pedido deja de estar "guardado"
  useEffect(() => {
    setSaved(false);
  }, [total]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
    } catch (err) {
      console.error(err);
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Divider />

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Total: ${total.toLocaleString("en-ES")}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onExport} disabled={!saved}>
            Exportar JPG
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={saving || disabled}
          >
            {saving ? "Guardando..." : "Guardar pedido"}
          </Button>
        </Stack>
      </Stack>

      {saved && (
        <Alert severity="success">
          Pedido guardado con éxito. Ya podés exportarlo o enviarlo al cliente.
        </Alert>
      )}
    </Stack>
  );
}
