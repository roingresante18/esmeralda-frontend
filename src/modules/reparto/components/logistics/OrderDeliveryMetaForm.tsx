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
import MyLocationIcon from "@mui/icons-material/MyLocation";
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
  gpsLoading?: boolean;
  gpsError?: string | null;
  onChange: <K extends keyof DeliveryDataFormValues>(
    field: K,
    value: DeliveryDataFormValues[K],
  ) => void;
  onUseCustomerGps: () => void;
  onCaptureOrderGps: () => void;
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Efectivo" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "BOTH", label: "Ambos" },
];

const gpsLabel = (gps?: GPSPoint | null) => {
  if (!gps) return "Sin GPS";
  return `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`;
};

export const OrderDeliveryMetaForm = ({
  values,
  errors,
  loading,
  gpsLoading,
  gpsError,
  onChange,
  onUseCustomerGps,
  onCaptureOrderGps,
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
            label="Dirección"
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
            onChange={(e) => onChange("municipality", e.target.value)}
            error={Boolean(errors.municipality)}
            helperText={errors.municipality}
            fullWidth
            disabled={loading}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Zona"
            size="small"
            value={values.zone}
            onChange={(e) => onChange("zone", e.target.value)}
            error={Boolean(errors.zone)}
            helperText={errors.zone}
            fullWidth
            disabled={loading}
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
        <Typography fontWeight={800}>GPS del cliente</Typography>
        <Typography variant="body2" color="text.secondary">
          {gpsLabel(values.customerGps)}
        </Typography>

        <Button
          variant="outlined"
          startIcon={<RoomIcon />}
          onClick={onUseCustomerGps}
          disabled={!values.customerGps || loading}
          fullWidth
        >
          Usar GPS del cliente como GPS operativo
        </Button>
      </Stack>

      <Stack
        spacing={1}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography fontWeight={800}>GPS operativo del pedido</Typography>
        <Typography variant="body2" color="text.secondary">
          {gpsLabel(values.orderGps)}
        </Typography>

        <Button
          variant="contained"
          startIcon={<MyLocationIcon />}
          onClick={onCaptureOrderGps}
          disabled={loading || gpsLoading}
          fullWidth
        >
          {gpsLoading
            ? "Capturando GPS..."
            : "Capturar / actualizar GPS operativo"}
        </Button>

        {gpsError ? <Alert severity="error">{gpsError}</Alert> : null}
      </Stack>

      {!values.customerGps && !values.orderGps ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Este pedido no tiene GPS precargado. Podés guardarlo ahora para
          mejorar el recorrido.
        </Alert>
      ) : null}
    </Stack>
  );
};
