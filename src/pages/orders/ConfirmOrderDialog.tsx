import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Divider,
  Button,
  Stack,
  Box,
  useTheme,
  useMediaQuery,
  Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ConfirmOrderMap from "./ConfirmOrderMap";
import type { Address } from "../types/types";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";

type PaymentData = {
  cash: number;
  transfer: number;
  reference?: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  confirmStep: "FORM" | "SUMMARY";
  setConfirmStep: Dispatch<SetStateAction<"FORM" | "SUMMARY">>;
  address: Address;
  setAddress: Dispatch<SetStateAction<Address>>;
  order: any;
  estimatedTotal: number;
  onConfirm: (args: {
    payment: PaymentData;
    shouldSaveClientGps: boolean;
  }) => Promise<void> | void;
  clientLocation?: {
    lat?: number | string;
    lng?: number | string;
    address?: string;
  };
}

const toValidNumber = (value?: number | string) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export default function ConfirmOrderDialog({
  open,
  onClose,
  confirmStep,
  setConfirmStep,
  address,
  setAddress,
  order,
  estimatedTotal,
  onConfirm,
  clientLocation,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const [payment, setPayment] = useState<PaymentData>({
    cash: 0,
    transfer: 0,
    reference: "",
  });

  const clientLat = toValidNumber(clientLocation?.lat);
  const clientLng = toValidNumber(clientLocation?.lng);
  const clientHasGps = clientLat != null && clientLng != null;

  const selectedLat = toValidNumber(address.latitude);
  const selectedLng = toValidNumber(address.longitude);
  const hasSelectedGps = selectedLat != null && selectedLng != null;

  const [useClientGpsAsReference, setUseClientGpsAsReference] = useState(true);

  const previousPaid = Number(order.paymentSummary?.total_paid ?? 0);
  const currentPaid = Number(payment.cash || 0) + Number(payment.transfer || 0);
  const totalPaid = previousPaid + currentPaid;
  const remaining = estimatedTotal - totalPaid;
  const paymentError = totalPaid > estimatedTotal;

  const mustAssignClientGps = !clientHasGps;
  const shouldSaveClientGps = mustAssignClientGps && hasSelectedGps;

  const canContinueToSummary = useMemo(() => {
    if (!address.delivery_address || !address.delivery_date || paymentError) {
      return false;
    }

    if (mustAssignClientGps && !hasSelectedGps) {
      return false;
    }

    return true;
  }, [
    address.delivery_address,
    address.delivery_date,
    paymentError,
    mustAssignClientGps,
    hasSelectedGps,
  ]);

  useEffect(() => {
    if (!open) {
      setPayment({
        cash: 0,
        transfer: 0,
        reference: "",
      });
      setConfirmStep("FORM");
      setUseClientGpsAsReference(true);
    }
  }, [open, setConfirmStep]);

  useEffect(() => {
    if (!open) return;

    setAddress((prev) => ({
      ...prev,
      delivery_address: prev.delivery_address || order?.clientAddress || "",
    }));
  }, [open, order?.clientAddress, setAddress]);

  useEffect(() => {
    if (!open) return;
    setUseClientGpsAsReference(clientHasGps);
  }, [open, clientHasGps]);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm({
      payment,
      shouldSaveClientGps,
    });
    setLoading(false);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={isMobile}
    >
      <DialogTitle fontWeight="bold">
        {confirmStep === "FORM" ? "Confirmar pedido" : "Revisar resumen final"}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {confirmStep === "FORM" && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "0.55fr 1.45fr",
              },
              height: {
                xs: "calc(100vh - 140px)",
                md: 520,
                lg: 600,
              },
            }}
          >
            <Stack
              spacing={2}
              sx={{
                p: 3,
                overflowY: "auto",
                bgcolor: "#fafafa",
              }}
            >
              <TextField
                label="Dirección de entrega"
                fullWidth
                value={address.delivery_address || ""}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    delivery_address: e.target.value,
                  }))
                }
              />

              <TextField
                label="Fecha de entrega"
                type="date"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: today }}
                fullWidth
                value={address.delivery_date || ""}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    delivery_date: e.target.value,
                  }))
                }
              />

              {clientHasGps ? (
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: "#eef7ff",
                    borderLeft: "4px solid #1976d2",
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    📍 El cliente ya tiene una ubicación GPS guardada.
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    ¿Querés usar esa ubicación como referencia para la entrega?
                  </Typography>

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant={
                        useClientGpsAsReference ? "contained" : "outlined"
                      }
                      size="small"
                      onClick={() => setUseClientGpsAsReference(true)}
                    >
                      Sí, usarla
                    </Button>

                    <Button
                      variant={
                        !useClientGpsAsReference ? "contained" : "outlined"
                      }
                      size="small"
                      color="inherit"
                      onClick={() => setUseClientGpsAsReference(false)}
                    >
                      No usarla
                    </Button>
                  </Stack>
                </Paper>
              ) : (
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: "#fff8e1",
                    borderLeft: "4px solid #ed6c02",
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    ⚠️ El cliente no tiene GPS.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Debe asignar una ubicación para la entrega. Esa ubicación se
                    guardará en el cliente al confirmar.
                  </Typography>
                </Paper>
              )}

              {mustAssignClientGps && hasSelectedGps && (
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: "#edf7ed",
                    borderLeft: "4px solid #2e7d32",
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    ✅ Se guardará este GPS en el cliente
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedLat?.toFixed(6)}, {selectedLng?.toFixed(6)}
                  </Typography>
                </Paper>
              )}

              {order.payments && order.payments.length > 0 && (
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
                    {order.payments.map((p: any) => (
                      <Box
                        key={p.id}
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: "#fff",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Typography variant="body2">
                          <b>Monto:</b> ${Number(p.amount).toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          <b>Método:</b> {p.method}
                        </Typography>
                        <Typography variant="body2">
                          <b>Tipo:</b> {p.type}
                        </Typography>
                        <Typography variant="body2">
                          <b>Estado:</b> {p.status}
                        </Typography>
                        {p.reference && (
                          <Typography variant="body2">
                            <b>Referencia:</b> {p.reference}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <b>Total ya pagado:</b> ${previousPaid.toFixed(2)}
                  </Typography>
                </Paper>
              )}

              <Divider sx={{ my: 1 }} />

              <Typography fontWeight="bold">
                Agregar nuevos pagos (opcional)
              </Typography>

              <TextField
                label="Monto en efectivo"
                type="number"
                value={payment.cash || ""}
                inputProps={{ min: 0 }}
                onChange={(e) =>
                  setPayment((prev) => ({
                    ...prev,
                    cash: Number(e.target.value) || 0,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Monto en transferencia"
                type="number"
                value={payment.transfer || ""}
                inputProps={{ min: 0 }}
                onChange={(e) =>
                  setPayment((prev) => ({
                    ...prev,
                    transfer: Number(e.target.value) || 0,
                  }))
                }
                fullWidth
              />

              <TextField
                label="Referencia transferencia (opcional)"
                value={payment.reference}
                onChange={(e) =>
                  setPayment((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                fullWidth
              />

              <Paper sx={{ p: 2, bgcolor: "#fff" }}>
                <Typography>
                  Total pedido: ${estimatedTotal.toFixed(2)}
                </Typography>
                <Typography>
                  Pagado previamente: ${previousPaid.toFixed(2)}
                </Typography>
                <Typography>Pagado ahora: ${currentPaid.toFixed(2)}</Typography>
                <Typography fontWeight="bold">
                  Total acumulado: ${totalPaid.toFixed(2)}
                </Typography>
                <Typography
                  color={remaining > 0 ? "warning.main" : "success.main"}
                  fontWeight="bold"
                >
                  Saldo pendiente: ${remaining.toFixed(2)}
                </Typography>

                {paymentError && (
                  <Typography color="error">
                    El pago acumulado no puede superar el total del pedido
                  </Typography>
                )}
              </Paper>
            </Stack>

            <Box
              sx={{
                position: "relative",
                height: "100%",
                minHeight: 300,
                borderLeft: { md: "1px solid #eee" },
              }}
            >
              <ConfirmOrderMap
                value={{
                  lat: mustAssignClientGps ? address.latitude : undefined,
                  lng: mustAssignClientGps ? address.longitude : undefined,
                }}
                clientLocation={{
                  lat: clientLocation?.lat,
                  lng: clientLocation?.lng,
                }}
                allowSelection={mustAssignClientGps}
                onChange={({ lat, lng }) =>
                  setAddress((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                  }))
                }
              />
            </Box>
          </Box>
        )}

        {confirmStep === "SUMMARY" && (
          <Stack spacing={2} sx={{ p: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography>
                <b>Cliente:</b> {order.clientName}
              </Typography>
              <Typography>
                <b>Dirección:</b> {address.delivery_address}
              </Typography>
              <Typography>
                <b>Fecha:</b> {address.delivery_date}
              </Typography>
              <Typography>
                <b>Pagado previamente:</b> ${previousPaid.toFixed(2)}
              </Typography>
              <Typography>
                <b>Pagado ahora:</b> ${currentPaid.toFixed(2)}
              </Typography>
              <Typography>
                <b>Total pagado:</b> ${totalPaid.toFixed(2)}
              </Typography>
              <Typography>
                <b>Saldo pendiente:</b> ${remaining.toFixed(2)}
              </Typography>

              {clientHasGps ? (
                <Typography>
                  <b>GPS cliente:</b>{" "}
                  {useClientGpsAsReference
                    ? "Se usará la ubicación ya guardada del cliente como referencia."
                    : "No se usará la ubicación GPS del cliente como referencia."}
                </Typography>
              ) : (
                <Typography>
                  <b>GPS cliente:</b>{" "}
                  {hasSelectedGps
                    ? `Se guardará al cliente: ${selectedLat?.toFixed(6)}, ${selectedLng?.toFixed(6)}`
                    : "Falta seleccionar una ubicación para el cliente"}
                </Typography>
              )}
            </Paper>

            {order.payments && order.payments.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  Pagos ya registrados
                </Typography>

                <Stack spacing={0.75}>
                  {order.payments.map((p: any) => (
                    <Typography key={p.id} variant="body2">
                      #{p.id} — {p.method} — ${Number(p.amount).toFixed(2)}
                      {p.reference ? ` — Ref: ${p.reference}` : ""}
                    </Typography>
                  ))}
                </Stack>
              </Paper>
            )}

            <Divider />

            {order.items.map((i: any) => (
              <Stack
                key={i.productId}
                direction="row"
                justifyContent="space-between"
              >
                <Typography>
                  {i.description} x {i.quantity}
                </Typography>
                <Typography>
                  ${(i.sale_price * i.quantity).toFixed(2)}
                </Typography>
              </Stack>
            ))}

            <Divider />

            <Typography fontWeight="bold" textAlign="right" fontSize={20}>
              Total: ${estimatedTotal.toFixed(2)}
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>

        {confirmStep === "FORM" ? (
          <Button
            variant="contained"
            size="large"
            onClick={() => setConfirmStep("SUMMARY")}
            disabled={!canContinueToSummary}
          >
            Revisar resumen
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Confirmando..." : "Confirmar pedido"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
