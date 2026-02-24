import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import type { Address } from "./types";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  confirmStep: "FORM" | "SUMMARY";
  setConfirmStep: Dispatch<SetStateAction<"FORM" | "SUMMARY">>;
  address: Address;
  setAddress: Dispatch<SetStateAction<Address>>;
  order: any;
  estimatedTotal: number;
  onConfirm: (paymentData: {
    cash: number;
    transfer: number;
    reference?: string;
  }) => void;
}

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
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const today = new Date().toISOString().split("T")[0];

  /* =======================
     PAGOS PARCIALES
  ======================= */

  const [payment, setPayment] = useState({
    cash: 0,
    transfer: 0,
    reference: "",
  });

  const totalPaid = payment.cash + payment.transfer;
  const remaining = estimatedTotal - totalPaid;
  const paymentError = totalPaid > estimatedTotal;

  /* =======================
     PRECARGAR DATOS CLIENTE
  ======================= */

  useEffect(() => {
    if (!open) return;

    setAddress((prev) => ({
      ...prev,
      delivery_address: prev.delivery_address || order?.clientAddress || "",
    }));
  }, [open]);

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
        {/* ================= FORM ================= */}
        {confirmStep === "FORM" && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1.2fr",
              },
              height: {
                xs: "calc(100vh - 140px)",
                md: 520,
                lg: 600,
              },
            }}
          >
            {/* ===== FORMULARIO ===== */}
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

              <Divider sx={{ my: 1 }} />

              <Typography fontWeight="bold">Pago inicial (opcional)</Typography>

              <TextField
                label="Monto en efectivo"
                type="number"
                value={payment.cash}
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
                value={payment.transfer}
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
                <Typography>Pagado ahora: ${totalPaid.toFixed(2)}</Typography>
                <Typography
                  color={remaining > 0 ? "warning.main" : "success.main"}
                  fontWeight="bold"
                >
                  Saldo pendiente: ${remaining.toFixed(2)}
                </Typography>

                {paymentError && (
                  <Typography color="error">
                    El pago no puede superar el total del pedido
                  </Typography>
                )}
              </Paper>
            </Stack>

            {/* ===== MAPA ===== */}
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
                  lat: address.latitude,
                  lng: address.longitude,
                }}
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

        {/* ================= SUMMARY ================= */}
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
                <b>Pagado:</b> ${totalPaid.toFixed(2)}
              </Typography>
              <Typography>
                <b>Saldo pendiente:</b> ${remaining.toFixed(2)}
              </Typography>
            </Paper>

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
                <Typography>${(i.price * i.quantity).toFixed(2)}</Typography>
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
            disabled={
              !address.delivery_address ||
              !address.delivery_date ||
              paymentError
            }
          >
            Revisar resumen
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={() =>
              onConfirm({
                cash: payment.cash,
                transfer: payment.transfer,
                reference: payment.reference,
              })
            }
          >
            Confirmar pedido
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
