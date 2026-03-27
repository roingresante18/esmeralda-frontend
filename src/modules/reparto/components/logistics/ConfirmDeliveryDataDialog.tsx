import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  Paper,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { OrderDeliveryMetaForm } from "./OrderDeliveryMetaForm";
import DeliveryGpsMapDialog from "./DeliveryGpsMapDialog";
import { buildInitialDeliveryDataValues } from "../../utils/delivery.form.helpers";
import {
  hasDeliveryDataErrors,
  validateDeliveryDataForm,
  type DeliveryDataFormErrors,
} from "../../utils/delivery.confirmation.validation";
import type {
  DeliveryDataFormValues,
  GPSPoint,
  PaymentMethod,
} from "../../types/delivery.types";
import { deliveryApi } from "../../api/delivery.api";

type PaymentSummary = {
  cash: number;
  transfer: number;
  card: number;
  check: number;
  other: number;
  total_paid: number;
};

type OrderPayment = {
  id: number;
  amount: number;
  method: string;
  type: string;
  status: string;
  reference?: string | null;
  external_id?: string | null;
  notes?: string | null;
  created_at: string;
  confirmed_at?: string | null;
};

interface LogisticsOrderInput {
  id: number;
  notes?: string;
  delivery_date?: string | null;
  payment_method?: PaymentMethod | null;
  address?: string;
  delivery_address_snapshot?: string | null;
  municipality?: string;
  municipality_snapshot?: string | null;
  zone?: string;
  zone_snapshot?: string | null;
  orderGps?: GPSPoint | null;
  customerGps?: GPSPoint | null;
  payment_summary?: PaymentSummary;
  payments?: OrderPayment[];
  client?: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
    municipality?: string;
    zone?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    latitude?: number;
    longitude?: number;
  };
}

interface Props {
  open: boolean;
  order: LogisticsOrderInput | null;
  onClose: () => void;
  onSuccess: () => void;
}

const emptyValues: DeliveryDataFormValues = {
  deliveryDate: "",
  paymentMethod: "",
  address: "",
  municipality: "",
  zone: "",
  customerGps: null,
  orderGps: null,
  notes: "",
};

const toValidNumber = (value?: number | string | null) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toIsoStringOrNull = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const ConfirmDeliveryDataDialog = ({
  open,
  order,
  onClose,
  onSuccess,
}: Props) => {
  const normalizedOrder = useMemo(() => {
    if (!order) return null;

    const clientLat =
      toValidNumber(order.client?.gps_latitude) ??
      toValidNumber(order.client?.latitude);

    const clientLng =
      toValidNumber(order.client?.gps_longitude) ??
      toValidNumber(order.client?.longitude);

    return {
      ...order,
      address:
        order.delivery_address_snapshot ??
        order.address ??
        order.client?.address ??
        "",
      municipality:
        order.municipality_snapshot ??
        order.municipality ??
        order.client?.municipality ??
        "",
      zone: order.zone_snapshot ?? order.zone ?? order.client?.zone ?? "",
      customerGps:
        order.customerGps ??
        (clientLat != null && clientLng != null
          ? {
              latitude: clientLat,
              longitude: clientLng,
              source: "CUSTOMER_PROFILE",
            }
          : null),
      payments: order.payments ?? [],
      payment_summary: order.payment_summary ?? {
        cash: 0,
        transfer: 0,
        card: 0,
        check: 0,
        other: 0,
        total_paid: 0,
      },
    };
  }, [order]);

  const initialValues = useMemo(
    () =>
      normalizedOrder
        ? buildInitialDeliveryDataValues(normalizedOrder)
        : emptyValues,
    [normalizedOrder],
  );

  const [values, setValues] = useState<DeliveryDataFormValues>(initialValues);
  const [errors, setErrors] = useState<DeliveryDataFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [gpsError] = useState<string | null>(null);
  const [openGpsMap, setOpenGpsMap] = useState(false);

  useEffect(() => {
    setValues(initialValues);
    setErrors({});
    setSubmitError(null);
    setOpenGpsMap(false);
  }, [initialValues, open]);

  if (!normalizedOrder) return null;

  const handleChange = <K extends keyof DeliveryDataFormValues>(
    field: K,
    value: DeliveryDataFormValues[K],
  ) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof DeliveryDataFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleConfirmGpsFromMap = (point: GPSPoint) => {
    setValues((prev) => ({
      ...prev,
      customerGps: point,
      orderGps: point,
    }));

    setOpenGpsMap(false);
  };

  const handleSubmit = async () => {
    const nextErrors = validateDeliveryDataForm(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (hasDeliveryDataErrors(nextErrors)) return;

    if (values.paymentMethod === "BOTH") {
      setSubmitError(
        'La opción "Ambos" no está disponible para confirmar datos de reparto.',
      );
      return;
    }

    const isoDeliveryDate = toIsoStringOrNull(values.deliveryDate);

    if (!isoDeliveryDate) {
      setSubmitError("La fecha de entrega no es válida.");
      return;
    }

    const payload = {
      deliveryDate: isoDeliveryDate,
      paymentMethod: values.paymentMethod as PaymentMethod,
      address: values.address,
      municipality: values.municipality,
      zone: values.zone,
      customerGps: values.customerGps
        ? {
            latitude: values.customerGps.latitude,
            longitude: values.customerGps.longitude,
            accuracy: values.customerGps.accuracy,
            source: values.customerGps.source,
            capturedAt: values.customerGps.capturedAt,
          }
        : null,
      orderGps: values.customerGps
        ? {
            latitude: values.customerGps.latitude,
            longitude: values.customerGps.longitude,
            accuracy: values.customerGps.accuracy,
            source: values.customerGps.source,
            capturedAt: values.customerGps.capturedAt,
          }
        : null,
      notes: values.notes,
    };

    try {
      setSaving(true);
      console.log("Payload confirmDeliveryData:", payload);
      console.log("Order ID:", normalizedOrder.id);

      await deliveryApi.confirmDeliveryData(normalizedOrder.id, payload);
      onSuccess();
    } catch (error: any) {
      console.error("Error confirmando datos de entrega:", error);

      const backendMessage =
        error?.response?.data?.message?.message ??
        error?.response?.data?.message ??
        error?.response?.data;

      console.log("Detalle backend:", backendMessage);

      setSubmitError(
        Array.isArray(backendMessage)
          ? backendMessage.join(" | ")
          : typeof backendMessage === "string"
            ? backendMessage
            : "No se pudieron guardar los datos de entrega.",
      );
    } finally {
      setSaving(false);
    }
  };

  const paymentSummary = normalizedOrder.payment_summary ?? {
    cash: 0,
    transfer: 0,
    card: 0,
    check: 0,
    other: 0,
    total_paid: 0,
  };

  const payments = normalizedOrder.payments ?? [];

  return (
    <>
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
            <Stack spacing={0.3}>
              <Typography variant="h6" fontWeight={900}>
                Confirmar datos de reparto
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pedido #{normalizedOrder.id} ·{" "}
                {normalizedOrder.client?.name ?? "Cliente"}
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
              Para pasar este pedido a reparto debe tener fecha de entrega,
              dirección confirmada, método de pago definido y GPS de entrega.
            </Alert>

            {payments.length > 0 && (
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: "#f8fafc",
                  borderLeft: "4px solid #7b1fa2",
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  💰 Pagos ya registrados
                </Typography>

                <Stack spacing={0.75}>
                  {payments.map((payment) => (
                    <Box
                      key={payment.id}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: "#fff",
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="body2">
                        <b>Monto:</b> ${Number(payment.amount).toFixed(2)}
                      </Typography>
                      <Typography variant="body2">
                        <b>Método:</b> {payment.method}
                      </Typography>
                      <Typography variant="body2">
                        <b>Tipo:</b> {payment.type}
                      </Typography>
                      <Typography variant="body2">
                        <b>Estado:</b> {payment.status}
                      </Typography>
                      {payment.reference && (
                        <Typography variant="body2">
                          <b>Referencia:</b> {payment.reference}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>

                <Typography variant="body2" sx={{ mt: 1 }}>
                  <b>Total pagado:</b> $
                  {Number(paymentSummary.total_paid ?? 0).toFixed(2)}
                </Typography>

                {Number(paymentSummary.cash ?? 0) > 0 && (
                  <Typography variant="body2">
                    <b>Efectivo:</b> ${Number(paymentSummary.cash).toFixed(2)}
                  </Typography>
                )}

                {Number(paymentSummary.transfer ?? 0) > 0 && (
                  <Typography variant="body2">
                    <b>Transferencia:</b> $
                    {Number(paymentSummary.transfer).toFixed(2)}
                  </Typography>
                )}
              </Paper>
            )}

            {submitError ? (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {submitError}
              </Alert>
            ) : null}

            <OrderDeliveryMetaForm
              values={values}
              errors={errors}
              loading={saving}
              gpsError={gpsError}
              onChange={handleChange}
              onOpenGpsMap={() => setOpenGpsMap(true)}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            pt: 1.5,
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            disabled={saving}
            fullWidth={false}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ width: { xs: "100%", sm: "auto" }, minHeight: 44 }}
          >
            {saving ? <CircularProgress size={20} /> : "Guardar y confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      <DeliveryGpsMapDialog
        open={openGpsMap}
        onClose={() => setOpenGpsMap(false)}
        initialGps={values.customerGps ?? values.orderGps ?? null}
        clientReferenceGps={normalizedOrder.customerGps ?? null}
        onConfirm={handleConfirmGpsFromMap}
      />
    </>
  );
};
