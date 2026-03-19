import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import type {
  ConfirmDeliveryPayload,
  DeliveryOrder,
  DeliveryProduct,
  PaymentMethod,
} from "../types/delivery.types";
import { useGeoLocationCapture } from "../hooks/useGeoLocationCapture";
import { deliveryApi } from "../api/delivery.api";
import { StatusChip } from "../components/shared/StatusChip";
import {
  getDerivedDeliveryStatus,
  validateDeliveryConfirmation,
} from "../utils/delivery.validation";
import { MobileStickyFooter } from "../components/shared/MobileStickyFooter";

interface Props {
  order: DeliveryOrder;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeliveryOrderDetailPage = ({
  order,
  onClose,
  onSuccess,
}: Props) => {
  const [products, setProducts] = useState<DeliveryProduct[]>(order.products);
  const [status, setStatus] = useState<
    "DELIVERED" | "PARTIAL_DELIVERED" | "RESCHEDULED" | "NOT_DELIVERED"
  >(
    order.products.length
      ? (getDerivedDeliveryStatus(order.products) as
          | "DELIVERED"
          | "PARTIAL_DELIVERED")
      : "DELIVERED",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    order.paymentMethod,
  );
  const [cashCollected, setCashCollected] = useState<number>(
    order.paymentMethod === "CASH"
      ? order.amountToCharge
      : order.paymentMethod === "BOTH"
        ? order.amountToCharge / 2
        : 0,
  );
  const [transferCollected, setTransferCollected] = useState<number>(
    order.paymentMethod === "TRANSFER"
      ? order.amountToCharge
      : order.paymentMethod === "BOTH"
        ? order.amountToCharge / 2
        : 0,
  );
  const [observation, setObservation] = useState(
    order.deliveryObservation ?? "",
  );
  const [saving, setSaving] = useState(false);

  const { gpsPoint, gpsError, loadingGps, captureGps } =
    useGeoLocationCapture();

  const pendingAmount = useMemo(
    () =>
      products.reduce((acc, p) => {
        const undelivered = Math.max(
          p.quantityOrdered - p.quantityDelivered,
          0,
        );
        return acc + undelivered;
      }, 0),
    [products],
  );

  const handleToggleDelivered = (productId: number, checked: boolean) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? {
              ...p,
              delivered: checked,
              quantityDelivered: checked ? p.quantityOrdered : 0,
            }
          : p,
      ),
    );
  };

  const handleQuantityDelivered = (productId: number, value: number) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? {
              ...p,
              quantityDelivered: Math.max(
                0,
                Math.min(p.quantityOrdered, value),
              ),
              delivered: value > 0,
            }
          : p,
      ),
    );
  };

  const handleAutoStatus = () => {
    const derived = getDerivedDeliveryStatus(products);
    if (derived === "PENDING_DELIVERY") return;
    setStatus(derived);
  };

  const handleConfirm = async () => {
    const validationError = validateDeliveryConfirmation(
      Boolean(gpsPoint),
      status,
      products,
    );
    if (validationError) return alert(validationError);

    const payload: ConfirmDeliveryPayload = {
      orderId: order.id,
      deliveryStatus: status,
      deliveredGps: gpsPoint!,
      deliveredAt: new Date().toISOString(),
      paymentMethod,
      amountCollectedCash: Number(cashCollected || 0),
      amountCollectedTransfer: Number(transferCollected || 0),
      products,
      deliveryObservation: observation,
    };

    try {
      setSaving(true);
      await deliveryApi.confirmDelivery(payload);
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("No se pudo confirmar la entrega.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2, pb: 12 }}>
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight={900}>
              Pedido #{order.id}
            </Typography>
            <StatusChip status={order.deliveryStatus} />
          </Stack>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={0.5}>
          <Typography fontWeight={800}>{order.customerName}</Typography>
          <Typography variant="body2">
            {order.phone || "Sin teléfono"}
          </Typography>
          <Typography variant="body2">{order.address}</Typography>
          <Typography variant="body2" color="text.secondary">
            {order.municipality} · {order.zone}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip
            label={`Cobrar: $${order.amountToCharge.toLocaleString("es-AR")}`}
            color="success"
          />
          <Chip label={`Pago: ${paymentMethod}`} variant="outlined" />
        </Stack>

        {order.notes && <Alert severity="info">{order.notes}</Alert>}

        <Divider />

        <Stack spacing={1}>
          <Typography fontWeight={800}>Productos</Typography>

          {products.map((product) => (
            <Box
              key={product.productId}
              sx={{
                p: 1.2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={product.delivered}
                      onChange={(e) =>
                        handleToggleDelivered(
                          product.productId,
                          e.target.checked,
                        )
                      }
                    />
                  }
                  label={`${product.productName} · Pedido: ${product.quantityOrdered}`}
                />

                <TextField
                  type="number"
                  size="small"
                  label="Cantidad entregada"
                  value={product.quantityDelivered}
                  onChange={(e) =>
                    handleQuantityDelivered(
                      product.productId,
                      Number(e.target.value),
                    )
                  }
                  inputProps={{
                    min: 0,
                    max: product.quantityOrdered,
                  }}
                  fullWidth
                />
              </Stack>
            </Box>
          ))}

          <Button variant="text" onClick={handleAutoStatus}>
            Recalcular estado según productos
          </Button>

          {pendingAmount > 0 && (
            <Alert severity="warning">
              Quedan unidades pendientes. Esto habilita entrega parcial o
              reprogramación.
            </Alert>
          )}
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography fontWeight={800}>Estado de entrega</Typography>

          <FormControl>
            <RadioGroup
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as
                    | "DELIVERED"
                    | "PARTIAL_DELIVERED"
                    | "RESCHEDULED"
                    | "NOT_DELIVERED",
                )
              }
            >
              <FormControlLabel
                value="DELIVERED"
                control={<Radio />}
                label="Entregado"
              />
              <FormControlLabel
                value="PARTIAL_DELIVERED"
                control={<Radio />}
                label="Entregado parcial"
              />
              <FormControlLabel
                value="RESCHEDULED"
                control={<Radio />}
                label="Reprogramado"
              />
              <FormControlLabel
                value="NOT_DELIVERED"
                control={<Radio />}
                label="No entregado"
              />
            </RadioGroup>
          </FormControl>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography fontWeight={800}>Cobro</Typography>

          <TextField
            select
            size="small"
            label="Método de pago"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            fullWidth
          >
            <MenuItem value="CASH">Efectivo</MenuItem>
            <MenuItem value="TRANSFER">Transferencia</MenuItem>
            <MenuItem value="BOTH">Ambos</MenuItem>
          </TextField>

          <TextField
            size="small"
            type="number"
            label="Cobrado en efectivo"
            value={cashCollected}
            onChange={(e) => setCashCollected(Number(e.target.value))}
            fullWidth
          />

          <TextField
            size="small"
            type="number"
            label="Cobrado por transferencia"
            value={transferCollected}
            onChange={(e) => setTransferCollected(Number(e.target.value))}
            fullWidth
          />
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography fontWeight={800}>GPS operativo</Typography>

          <Typography variant="body2">
            GPS cliente:{" "}
            {order.customerGps
              ? `${order.customerGps.lat}, ${order.customerGps.lng}`
              : "No disponible"}
          </Typography>

          <Typography variant="body2">
            GPS pedido:{" "}
            {order.orderGps
              ? `${order.orderGps.lat}, ${order.orderGps.lng}`
              : "No disponible"}
          </Typography>

          <Typography variant="body2">
            GPS real entrega:{" "}
            {gpsPoint ? `${gpsPoint.lat}, ${gpsPoint.lng}` : "Aún no capturado"}
          </Typography>

          {gpsError && <Alert severity="error">{gpsError}</Alert>}

          <Button
            variant="outlined"
            startIcon={
              loadingGps ? <CircularProgress size={16} /> : <MyLocationIcon />
            }
            onClick={captureGps}
            disabled={loadingGps}
            fullWidth
          >
            Capturar GPS real
          </Button>
        </Stack>

        <Divider />

        <TextField
          size="small"
          label="Observaciones"
          multiline
          minRows={3}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          fullWidth
        />
      </Stack>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
        }}
      >
        <MobileStickyFooter>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleConfirm}
            disabled={saving || loadingGps}
          >
            {saving ? (
              <CircularProgress size={22} />
            ) : (
              "Confirmar gestión del pedido"
            )}
          </Button>
        </MobileStickyFooter>
      </Box>
    </Box>
  );
};
