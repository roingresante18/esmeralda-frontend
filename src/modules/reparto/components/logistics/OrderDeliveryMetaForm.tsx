import {
  Alert,
  Button,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import RoomIcon from "@mui/icons-material/Room";
import type {
  DeliveryDataFormValues,
  PaymentMethod,
  GPSPoint,
} from "../../types/delivery.types";
import type { DeliveryDataFormErrors } from "../../utils/delivery.confirmation.validation";

interface Props {
  values: DeliveryDataFormValues;
  errors: DeliveryDataFormErrors;
  loading?: boolean;
  gpsError?: string | null;
  onChange: <K extends keyof DeliveryDataFormValues>(
    field: K,
    value: DeliveryDataFormValues[K],
  ) => void;
  onOpenGpsMap: () => void;
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Efectivo" },
  { value: "TRANSFER", label: "Transferencia" },
];

const gpsLabel = (gps?: GPSPoint | null) => {
  const lat = gps?.latitude;
  const lng = gps?.longitude;

  if (lat == null || lng == null) return "Sin GPS definido";

  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const OrderDeliveryMetaForm = ({
  values,
  errors,
  loading,
  gpsError,
  onChange,
  onOpenGpsMap,
}: Props) => {
  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={900}>
        Datos de entrega
      </Typography>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Fecha de entrega"
            type="datetime-local"
            size="small"
            value={values.deliveryDate}
            onChange={(e) => onChange("deliveryDate", e.target.value)}
            error={Boolean(errors.deliveryDate)}
            helperText={errors.deliveryDate}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            label="Método de pago"
            size="small"
            value={values.paymentMethod}
            onChange={(e) =>
              onChange("paymentMethod", e.target.value as PaymentMethod)
            }
            error={Boolean(errors.paymentMethod)}
            helperText={errors.paymentMethod}
            fullWidth
            disabled={loading}
          >
            {paymentOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Dirección de entrega"
            size="small"
            value={values.address}
            onChange={(e) => onChange("address", e.target.value)}
            error={Boolean(errors.address)}
            helperText={errors.address}
            fullWidth
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Municipio"
            size="small"
            value={values.municipality}
            error={Boolean(errors.municipality)}
            helperText={errors.municipality || "Dato informativo"}
            fullWidth
            InputProps={{ readOnly: true }}
            disabled
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Zona"
            size="small"
            value={values.zone}
            error={Boolean(errors.zone)}
            helperText={errors.zone || "Dato informativo"}
            fullWidth
            InputProps={{ readOnly: true }}
            disabled
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Observaciones"
            size="small"
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={loading}
          />
        </Grid>
      </Grid>

      <Stack
        spacing={1}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography fontWeight={800}>GPS de entrega</Typography>

        <Typography variant="body2" color="text.secondary">
          {gpsLabel(values.customerGps)}
        </Typography>

        <Button
          variant="contained"
          startIcon={<RoomIcon />}
          onClick={onOpenGpsMap}
          disabled={loading}
          fullWidth
        >
          {values.customerGps ? "Modificar GPS" : "Definir GPS"}
        </Button>

        {gpsError ? <Alert severity="error">{gpsError}</Alert> : null}
      </Stack>

      {!values.customerGps ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Definí el GPS del punto de entrega para facilitar el reparto.
        </Alert>
      ) : null}
    </Stack>
  );
};
