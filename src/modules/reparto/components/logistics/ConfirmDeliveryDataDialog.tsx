import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { OrderDeliveryMetaForm } from "./OrderDeliveryMetaForm";
import { buildInitialDeliveryDataValues } from "../../utils/delivery.form.helpers";
import {
  hasDeliveryDataErrors,
  validateDeliveryDataForm,
  type DeliveryDataFormErrors,
} from "../../utils/delivery.confirmation.validation";
import type {
  ConfirmDeliveryDataPayload,
  DeliveryDataFormValues,
  GPSPoint,
  PaymentMethod,
} from "../../types/delivery.types";
import { deliveryApi } from "../../api/delivery.api";
import { useGeoLocationCapture } from "../../hooks/useGeoLocationCapture";

interface LogisticsOrderInput {
  id: number;
  notes?: string;
  delivery_date?: string | null;
  payment_method?: PaymentMethod | null;
  address?: string;
  municipality?: string;
  zone?: string;
  orderGps?: GPSPoint | null;
  customerGps?: GPSPoint | null;
  client?: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    municipality?: string;
    zone?: string;
    gps_latitude?: number;
    gps_longitude?: number;
  };
}

interface Props {
  open: boolean;
  order: LogisticsOrderInput | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConfirmDeliveryDataDialog = ({
  open,
  order,
  onClose,
  onSuccess,
}: Props) => {
  const initialValues = useMemo(
    () => (order ? buildInitialDeliveryDataValues(order) : null),
    [order],
  );

  const [values, setValues] = useState<DeliveryDataFormValues>(
    initialValues ?? {
      deliveryDate: "",
      paymentMethod: "",
      address: "",
      municipality: "",
      zone: "",
      customerGps: null,
      orderGps: null,
      notes: "",
    },
  );
  const [errors, setErrors] = useState<DeliveryDataFormErrors>({});
  const [saving, setSaving] = useState(false);

  const { captureGps, gpsError, loadingGps } = useGeoLocationCapture();

  if (!order) return null;

  const handleChange = <K extends keyof DeliveryDataFormValues>(
    field: K,
    value: DeliveryDataFormValues[K],
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUseCustomerGps = () => {
    if (!values.customerGps) return;
    setValues((prev) => ({
      ...prev,
      orderGps: {
        ...values.customerGps!,
        source: "ORDER_CONFIRMED",
        capturedAt: new Date().toISOString(),
      },
    }));
  };

  const handleCaptureOrderGps = async () => {
    const point = await captureGps();
    if (!point) return;

    setValues((prev) => ({
      ...prev,
      orderGps: {
        ...point,
        source: "ORDER_CONFIRMED",
      },
    }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateDeliveryDataForm(values);
    setErrors(nextErrors);

    if (hasDeliveryDataErrors(nextErrors)) return;

    const payload: ConfirmDeliveryDataPayload = {
      orderId: order.id,
      deliveryDate: values.deliveryDate,
      paymentMethod: values.paymentMethod as PaymentMethod,
      address: values.address,
      municipality: values.municipality,
      zone: values.zone,
      customerGps: values.customerGps ?? null,
      orderGps: values.orderGps ?? values.customerGps ?? null,
      notes: values.notes,
    };

    try {
      setSaving(true);
      await deliveryApi.confirmDeliveryData(payload);
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("No se pudieron guardar los datos de entrega.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          minHeight: { xs: "100dvh", sm: "auto" },
          m: { xs: 0, sm: 2 },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack>
            <Typography variant="h6" fontWeight={900}>
              Confirmar datos de reparto
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pedido #{order.id} · {order.client?.name ?? "Cliente"}
            </Typography>
          </Stack>

          <IconButton onClick={onClose} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Al confirmar este pedido se exige fecha de entrega y método de pago.
          </Alert>

          <OrderDeliveryMetaForm
            values={values}
            errors={errors}
            loading={saving}
            gpsLoading={loadingGps}
            gpsError={gpsError}
            onChange={handleChange}
            onUseCustomerGps={handleUseCustomerGps}
            onCaptureOrderGps={handleCaptureOrderGps}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1.5 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : "Guardar y confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
