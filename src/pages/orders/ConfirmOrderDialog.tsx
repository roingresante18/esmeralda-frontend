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

interface Props {
  open: boolean;
  onClose: () => void;
  confirmStep: "FORM" | "SUMMARY";
  setConfirmStep: Dispatch<SetStateAction<"FORM" | "SUMMARY">>;
  address: Address;
  setAddress: Dispatch<SetStateAction<Address>>;
  municipalities: { id: number; name: string }[];
  order: any;
  estimatedTotal: number;
  onConfirm: () => void;
}

export default function ConfirmOrderDialog({
  open,
  onClose,
  confirmStep,
  setConfirmStep,
  address,
  setAddress,
  municipalities,
  order,
  estimatedTotal,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg" // ⭐ Más ancho en desktop
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
                xs: "1fr", // 📱 Mobile: una columna
                md: "1fr 1.2fr", // 🖥️ Desktop: mapa más grande
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
                value={address.delivery_address}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    delivery_address: e.target.value,
                  }))
                }
              />

              <FormControl fullWidth>
                <InputLabel>Municipio</InputLabel>
                <Select
                  value={address.municipality_id || ""}
                  label="Municipio"
                  onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      municipality_id: Number(e.target.value),
                    }))
                  }
                >
                  {municipalities.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Fecha de entrega"
                type="date"
                InputLabelProps={{ shrink: true }}
                fullWidth
                value={address.delivery_date}
                onChange={(e) =>
                  setAddress((prev) => ({
                    ...prev,
                    delivery_date: e.target.value,
                  }))
                }
              />

              <FormControl fullWidth>
                <InputLabel>Método de pago</InputLabel>
                <Select
                  value={address.payment_method || ""}
                  label="Método de pago"
                  onChange={(e) =>
                    setAddress((prev) => ({
                      ...prev,
                      payment_method: e.target
                        .value as Address["payment_method"],
                    }))
                  }
                >
                  <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                  <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                  <MenuItem value="AMBOS">Efectivo + Transferencia</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="caption" color="text.secondary">
                📍 Ubicación opcional. Podés marcarla ahora o dejarla para
                logística.
              </Typography>
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
                <b>Pago:</b> {address.payment_method}
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
                <Typography>${i.quantity}</Typography>
              </Stack>
            ))}

            <Divider />

            <Typography fontWeight="bold" textAlign="right" fontSize={20}>
              Total: ${estimatedTotal}
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
              !address.municipality_id ||
              !address.delivery_date ||
              !address.payment_method
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
            onClick={onConfirm}
          >
            Confirmar pedido
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
