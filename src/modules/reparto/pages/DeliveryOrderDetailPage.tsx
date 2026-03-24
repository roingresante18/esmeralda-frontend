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
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PaidIcon from "@mui/icons-material/Paid";
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
import { GpsComparisonCard } from "../components/detail/GpsComparisonCard";
import { DeliveryAuditTimeline } from "../components/detail/DeliveryAuditTimeline";
import { DeliveryTraceabilitySummary } from "../components/detail/DeliveryTraceabilitySummary";
import { buildOrderTraceability } from "../utils/delivery.traceability";

interface Props {
  order: DeliveryOrder;
  onClose: () => void;
  onSuccess: () => void;
}

const getAlreadyPaid = (order: DeliveryOrder) =>
  Number(order.paymentSummary?.total_paid ?? 0);

const getPendingAmount = (order: DeliveryOrder) =>
  Math.max(0, Number(order.amountToCharge ?? 0) - getAlreadyPaid(order));

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

  const alreadyPaid = useMemo(() => getAlreadyPaid(order), [order]);
  const pendingToCollect = useMemo(() => getPendingAmount(order), [order]);

  const [cashCollected, setCashCollected] = useState<number>(
    order.paymentMethod === "CASH"
      ? pendingToCollect
      : order.paymentMethod === "BOTH"
        ? pendingToCollect / 2
        : 0,
  );

  const [transferCollected, setTransferCollected] = useState<number>(
    order.paymentMethod === "TRANSFER"
      ? pendingToCollect
      : order.paymentMethod === "BOTH"
        ? pendingToCollect / 2
        : 0,
  );

  const [observation, setObservation] = useState(
    order.deliveryObservation ?? "",
  );
  const [saving, setSaving] = useState(false);

  const { gpsPoint, gpsError, loadingGps, captureGps } =
    useGeoLocationCapture();

  const [localAuditEvents, setLocalAuditEvents] = useState(
    order.auditEvents ?? [],
  );

  const pendingProductsAmount = useMemo(
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

  const currentCollected =
    Number(cashCollected || 0) + Number(transferCollected || 0);

  const paymentCollectionError =
    status === "DELIVERED" && currentCollected > pendingToCollect;

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

  const handleCaptureGps = async () => {
    const point = await captureGps();
    if (!point) return;

    setLocalAuditEvents((prev) => [
      {
        id: `local-gps-${Date.now()}`,
        type: "DRIVER_CAPTURED_GPS",
        title: "GPS real capturado",
        description: `Se registró ubicación del dispositivo (${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}).`,
        createdAt: new Date().toISOString(),
        createdBy: "Chofer",
      },
      ...prev,
    ]);
  };

  const handleAutoStatus = () => {
    const derived = getDerivedDeliveryStatus(products);
    if (derived === "PENDING_DELIVERY") return;
    setStatus(derived);
  };

  const handleConfirm = async () => {
    if (paymentCollectionError) {
      alert("El cobro actual no puede superar el saldo pendiente del pedido.");
      return;
    }

    const validationError = validateDeliveryConfirmation(
      Boolean(gpsPoint),
      status,
      products,
    );

    if (validationError) {
      alert(validationError);
      return;
    }

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

  const traceabilityPreview = useMemo(
    () =>
      buildOrderTraceability({
        customerGps: order.customerGps,
        orderGps: order.orderGps,
        deliveredGps: gpsPoint ?? order.deliveredGps,
      }),
    [order.customerGps, order.orderGps, order.deliveredGps, gpsPoint],
  );

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
            icon={<PaidIcon />}
            label={`Total $${Number(order.amountToCharge).toLocaleString("es-AR")}`}
            color="success"
          />
          <Chip label={`Pago: ${paymentMethod}`} variant="outlined" />
          {alreadyPaid > 0 && (
            <Chip
              label={`Adelanto $${alreadyPaid.toLocaleString("es-AR")}`}
              color="secondary"
              variant="outlined"
            />
          )}
          <Chip
            label={`Saldo $${pendingToCollect.toLocaleString("es-AR")}`}
            color={pendingToCollect > 0 ? "warning" : "success"}
            variant={pendingToCollect > 0 ? "filled" : "outlined"}
          />
        </Stack>

        {order.notes && <Alert severity="info">{order.notes}</Alert>}

        {order.payments && order.payments.length > 0 && (
          <Paper
            sx={{
              p: 1.5,
              bgcolor: "#f8fafc",
              borderLeft: "4px solid #7b1fa2",
            }}
          >
            <Typography fontWeight={800} sx={{ mb: 1 }}>
              Pagos ya registrados
            </Typography>

            <Stack spacing={0.75}>
              {order.payments.map((payment) => (
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
          </Paper>
        )}

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

          {pendingProductsAmount > 0 && (
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
          <Typography fontWeight={800}>Cobro en entrega</Typography>

          <Alert severity="info">
            Los pagos ya registrados se muestran solo como referencia. Acá solo
            cargás lo cobrado ahora en la entrega.
          </Alert>

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

          <Paper sx={{ p: 1.5 }}>
            <Typography variant="body2">
              <b>Total pedido:</b> ${Number(order.amountToCharge).toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <b>Pagado previamente:</b> ${alreadyPaid.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <b>Saldo pendiente:</b> ${pendingToCollect.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <b>Cobrado ahora:</b> ${currentCollected.toFixed(2)}
            </Typography>
          </Paper>

          {paymentCollectionError && (
            <Alert severity="error">
              El cobro actual supera el saldo pendiente del pedido.
            </Alert>
          )}
        </Stack>

        <Divider />

        <GpsComparisonCard
          order={{
            ...order,
            deliveredGps: gpsPoint ?? order.deliveredGps,
            traceability: traceabilityPreview,
          }}
        />

        <Stack spacing={1}>
          <Typography fontWeight={800}>Captura GPS real</Typography>

          {gpsError ? <Alert severity="error">{gpsError}</Alert> : null}

          <Button
            variant="outlined"
            startIcon={
              loadingGps ? <CircularProgress size={16} /> : <MyLocationIcon />
            }
            onClick={handleCaptureGps}
            disabled={loadingGps}
            fullWidth
          >
            Capturar GPS real
          </Button>
        </Stack>

        <Divider />

        <DeliveryTraceabilitySummary
          order={{
            ...order,
            traceability: traceabilityPreview,
          }}
        />

        <DeliveryAuditTimeline events={localAuditEvents} />

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
            disabled={saving || loadingGps || paymentCollectionError}
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
