import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PaidIcon from "@mui/icons-material/Paid";

import type {
  ConfirmDeliveryPayload,
  DeliveryOrder,
  DeliveryProduct,
  DeliveryResultStatus,
  PaymentMethod,
} from "../types/delivery.types";

import { useGeoLocationCapture } from "../hooks/useGeoLocationCapture";

import { deliveryApi } from "../api/delivery.api";

import { StatusChip } from "../components/shared/StatusChip";
import { MobileStickyFooter } from "../components/shared/MobileStickyFooter";
import { GpsComparisonCard } from "../components/detail/GpsComparisonCard";
import { DeliveryAuditTimeline } from "../components/detail/DeliveryAuditTimeline";
import { DeliveryTraceabilitySummary } from "../components/detail/DeliveryTraceabilitySummary";

import {
  getDerivedDeliveryStatus,
  validateDeliveryConfirmation,
  validateOrderBeforeConfirmation,
} from "../utils/delivery.validation";

import { buildOrderTraceability } from "../utils/delivery.traceability";

interface Props {
  order: DeliveryOrder;
  onClose: () => void;
  onSuccess: () => void;
}

type DeliveryFormStatus = DeliveryResultStatus | "";

const round = (value: number, decimals = 2): number => {
  const multiplier = 10 ** decimals;

  return Math.round((Number(value) + Number.EPSILON) * multiplier) / multiplier;
};

const formatCurrency = (value: number): string =>
  Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatQuantity = (value: number): string =>
  Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const getAlreadyPaid = (order: DeliveryOrder): number =>
  Number(order.paymentSummary?.total_paid ?? 0);

const getPendingAmount = (order: DeliveryOrder): number =>
  round(
    Math.max(Number(order.amountToCharge ?? 0) - getAlreadyPaid(order), 0),
    2,
  );

const initializeProducts = (products: DeliveryProduct[]): DeliveryProduct[] =>
  products.map((product) => ({
    ...product,

    quantityOrdered: Math.max(Number(product.quantityOrdered || 0), 0),

    quantityPreviouslyDelivered: Math.max(
      Number(product.quantityPreviouslyDelivered || 0),
      0,
    ),

    quantityPending: Math.max(Number(product.quantityPending || 0), 0),

    /*
     * La cantidad del intento actual siempre inicia en cero.
     */
    quantityDelivered: 0,
    delivered: false,
  }));

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error !== null) {
    const possibleAxiosError = error as {
      response?: {
        data?: {
          message?: string | string[];
          error?: string;
        };
      };
      message?: string;
    };

    const backendMessage = possibleAxiosError.response?.data?.message;

    if (Array.isArray(backendMessage)) {
      return backendMessage.join(" ");
    }

    if (typeof backendMessage === "string" && backendMessage.trim()) {
      return backendMessage;
    }

    const backendError = possibleAxiosError.response?.data?.error;

    if (typeof backendError === "string" && backendError.trim()) {
      return backendError;
    }

    if (
      typeof possibleAxiosError.message === "string" &&
      possibleAxiosError.message.trim()
    ) {
      return possibleAxiosError.message;
    }
  }

  return "No se pudo confirmar la gestión del pedido.";
};

export const DeliveryOrderDetailPage = ({
  order,
  onClose,
  onSuccess,
}: Props) => {
  /*
   * ============================================================
   * ESTADO GENERAL DEL FORMULARIO
   * ============================================================
   */

  const [products, setProducts] = useState<DeliveryProduct[]>(() =>
    initializeProducts(order.products),
  );

  /*
   * No se selecciona automáticamente un resultado.
   * El repartidor debe indicar explícitamente qué ocurrió.
   */
  const [status, setStatus] = useState<DeliveryFormStatus>("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    order.paymentMethod,
  );

  /*
   * Los cobros del intento actual siempre comienzan en cero.
   */
  const [cashCollected, setCashCollected] = useState<number>(0);

  const [transferCollected, setTransferCollected] = useState<number>(0);

  const [observation, setObservation] = useState(
    order.deliveryObservation ?? "",
  );

  const [saving, setSaving] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);

  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { gpsPoint, gpsError, loadingGps, captureGps } =
    useGeoLocationCapture();

  const [localAuditEvents, setLocalAuditEvents] = useState(
    order.auditEvents ?? [],
  );

  /*
   * ============================================================
   * IMPORTES
   * ============================================================
   */

  const alreadyPaid = useMemo(() => getAlreadyPaid(order), [order]);

  const pendingToCollect = useMemo(() => getPendingAmount(order), [order]);

  const cashCollectedValue = Number(cashCollected || 0);

  const transferCollectedValue = Number(transferCollected || 0);

  const currentCollected = round(
    cashCollectedValue + transferCollectedValue,
    2,
  );

  const isFailedAttempt =
    status === "RESCHEDULED" || status === "NOT_DELIVERED";

  const isSuccessfulAttempt =
    status === "DELIVERED" || status === "PARTIAL_DELIVERED";

  const hasNegativePayment =
    cashCollectedValue < 0 || transferCollectedValue < 0;

  const paymentCollectionError =
    hasNegativePayment || currentCollected > pendingToCollect + 0.01;

  /*
   * ============================================================
   * CANTIDADES
   * ============================================================
   */

  const totalOrderedQuantity = useMemo(
    () =>
      round(
        products.reduce(
          (total, product) => total + Number(product.quantityOrdered || 0),
          0,
        ),
        3,
      ),
    [products],
  );

  const totalPreviouslyDelivered = useMemo(
    () =>
      round(
        products.reduce(
          (total, product) =>
            total + Number(product.quantityPreviouslyDelivered || 0),
          0,
        ),
        3,
      ),
    [products],
  );

  const totalPendingBeforeAttempt = useMemo(
    () =>
      round(
        products.reduce(
          (total, product) => total + Number(product.quantityPending || 0),
          0,
        ),
        3,
      ),
    [products],
  );

  const totalDeliveredThisAttempt = useMemo(
    () =>
      round(
        products.reduce(
          (total, product) => total + Number(product.quantityDelivered || 0),
          0,
        ),
        3,
      ),
    [products],
  );

  const totalPendingAfterAttempt = useMemo(
    () =>
      round(
        products.reduce((total, product) => {
          const pending = Number(product.quantityPending || 0);

          const delivered = Number(product.quantityDelivered || 0);

          return total + Math.max(pending - delivered, 0);
        }, 0),
        3,
      ),
    [products],
  );

  /*
   * ============================================================
   * CAMBIOS DE PRODUCTOS
   * ============================================================
   */

  const resetAttemptProducts = () => {
    setProducts((previousProducts) =>
      previousProducts.map((product) => ({
        ...product,
        quantityDelivered: 0,
        delivered: false,
      })),
    );
  };

  const handleToggleDelivered = (productId: number, checked: boolean) => {
    setFormError(null);
    setFormSuccess(null);

    setProducts((previousProducts) =>
      previousProducts.map((product) => {
        if (product.productId !== productId) {
          return product;
        }

        /*
         * Al marcar el producto se completa toda la cantidad
         * pendiente, no la cantidad original del pedido.
         */
        const quantityDelivered = checked
          ? Number(product.quantityPending || 0)
          : 0;

        return {
          ...product,
          delivered: checked && quantityDelivered > 0,
          quantityDelivered,
        };
      }),
    );
  };

  const handleQuantityDelivered = (productId: number, value: number) => {
    setFormError(null);
    setFormSuccess(null);

    setProducts((previousProducts) =>
      previousProducts.map((product) => {
        if (product.productId !== productId) {
          return product;
        }

        const safeValue = Number.isFinite(value) ? value : 0;

        const maximumQuantity = Number(product.quantityPending || 0);

        const quantityDelivered = round(
          Math.max(0, Math.min(maximumQuantity, safeValue)),
          3,
        );

        return {
          ...product,
          quantityDelivered,
          delivered: quantityDelivered > 0,
        };
      }),
    );
  };

  /*
   * ============================================================
   * CAMBIO DE ESTADO
   * ============================================================
   */

  const handleStatusChange = (newStatus: DeliveryResultStatus) => {
    setFormError(null);
    setFormSuccess(null);
    setStatus(newStatus);

    /*
     * Los intentos fallidos no pueden contener cantidades
     * entregadas ni pagos.
     */
    if (newStatus === "RESCHEDULED" || newStatus === "NOT_DELIVERED") {
      resetAttemptProducts();
      setCashCollected(0);
      setTransferCollected(0);
    }
  };

  const handleAutoStatus = () => {
    setFormError(null);
    setFormSuccess(null);

    const derivedStatus = getDerivedDeliveryStatus(products);

    if (derivedStatus === "PENDING_DELIVERY") {
      setFormError(
        "No se registraron cantidades entregadas. Seleccioná Reprogramado o No entregado si el intento no tuvo entrega.",
      );

      return;
    }

    setStatus(derivedStatus);
  };

  /*
   * ============================================================
   * GPS
   * ============================================================
   */

  const handleCaptureGps = async () => {
    setFormError(null);
    setFormSuccess(null);

    const point = await captureGps();

    if (!point) {
      return;
    }

    setLocalAuditEvents((previousEvents) => [
      {
        id: `local-gps-${Date.now()}`,
        type: "DRIVER_CAPTURED_GPS",
        title: "GPS real capturado",
        description: `Se registró la ubicación del dispositivo (${point.latitude.toFixed(
          6,
        )}, ${point.longitude.toFixed(6)}).`,
        createdAt: new Date().toISOString(),
        createdBy: "Chofer",
      },
      ...previousEvents,
    ]);
  };

  /*
   * ============================================================
   * PAGOS
   * ============================================================
   */

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setFormError(null);
    setFormSuccess(null);

    /*
     * Se limpian importes incompatibles con el método elegido.
     */
    if (method === "CASH") {
      setTransferCollected(0);
    }

    if (method === "TRANSFER") {
      setCashCollected(0);
    }
  };

  const handleCashChange = (value: number) => {
    setFormError(null);
    setFormSuccess(null);

    const safeValue = Number.isFinite(value) ? value : 0;

    setCashCollected(safeValue);
  };

  const handleTransferChange = (value: number) => {
    setFormError(null);
    setFormSuccess(null);

    const safeValue = Number.isFinite(value) ? value : 0;

    setTransferCollected(safeValue);
  };

  /*
   * ============================================================
   * CONFIRMACIÓN
   * ============================================================
   */

  const handleConfirm = async () => {
    setFormError(null);
    setFormSuccess(null);

    const orderValidationError = validateOrderBeforeConfirmation(order);

    if (orderValidationError) {
      setFormError(orderValidationError);

      return;
    }

    if (!status) {
      setFormError("Debés seleccionar el resultado del intento de entrega.");

      return;
    }

    if (paymentCollectionError) {
      setFormError(
        hasNegativePayment
          ? "Los importes cobrados no pueden ser negativos."
          : "El cobro actual no puede superar el saldo pendiente del pedido.",
      );

      return;
    }

    if (isFailedAttempt && currentCollected > 0) {
      setFormError(
        "Una entrega reprogramada o no entregada no puede registrar pagos.",
      );

      return;
    }

    if (currentCollected > 0 && !isSuccessfulAttempt) {
      setFormError("Solo una entrega total o parcial puede registrar pagos.");

      return;
    }

    if (currentCollected > 0) {
      if (
        paymentMethod === "CASH" &&
        (cashCollectedValue <= 0 || transferCollectedValue > 0)
      ) {
        setFormError(
          "Para pago en efectivo, el importe en efectivo debe ser mayor que cero y la transferencia debe quedar en cero.",
        );

        return;
      }

      if (
        paymentMethod === "TRANSFER" &&
        (transferCollectedValue <= 0 || cashCollectedValue > 0)
      ) {
        setFormError(
          "Para pago por transferencia, la transferencia debe ser mayor que cero y el efectivo debe quedar en cero.",
        );

        return;
      }

      if (
        paymentMethod === "BOTH" &&
        (cashCollectedValue <= 0 || transferCollectedValue <= 0)
      ) {
        setFormError(
          "Para pago combinado debe cargarse un importe en efectivo y otro por transferencia.",
        );

        return;
      }
    }

    const validationError = validateDeliveryConfirmation(
      Boolean(gpsPoint),
      status,
      products,
    );

    if (validationError) {
      setFormError(validationError);

      return;
    }

    if (!gpsPoint) {
      setFormError("Debés capturar el GPS real antes de confirmar.");

      return;
    }

    const payload: ConfirmDeliveryPayload = {
      orderId: order.id,
      deliveryStatus: status,
      deliveredGps: gpsPoint,
      deliveredAt: new Date().toISOString(),
      paymentMethod,
      amountCollectedCash: round(cashCollectedValue, 2),
      amountCollectedTransfer: round(transferCollectedValue, 2),

      /*
       * quantityDelivered contiene solamente lo entregado
       * en este intento.
       */
      products: products.map((product) => ({
        ...product,
        quantityDelivered: round(Number(product.quantityDelivered || 0), 3),
        delivered: Number(product.quantityDelivered || 0) > 0,
      })),

      deliveryObservation: observation.trim() || undefined,
    };

    try {
      setSaving(true);

      await deliveryApi.confirmDelivery(payload);

      setFormSuccess("La gestión del pedido se registró correctamente.");

      onSuccess();
    } catch (error) {
      console.error("Error al confirmar la entrega:", error);

      setFormError(extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * TRAZABILIDAD
   * ============================================================
   */

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
    <Box
      sx={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <Box
        sx={{
          flex: 1,
          p: {
            xs: 1.5,
            sm: 2,
          },
          pb: 3,
        }}
      >
        <Stack spacing={2}>
          {/*
           * =====================================================
           * ENCABEZADO
           * =====================================================
           */}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={1}
          >
            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={900}>
                Pedido #{order.id}
              </Typography>

              <StatusChip status={order.deliveryStatus} />
            </Stack>

            <IconButton
              onClick={onClose}
              disabled={saving}
              aria-label="Cerrar detalle"
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          {order.deliveryStatus !== "IN_DELIVERY" ? (
            <Alert severity="error">
              Este pedido no se encuentra actualmente en reparto y no puede ser
              gestionado desde esta pantalla.
            </Alert>
          ) : null}

          {formError ? (
            <Alert severity="error" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          ) : null}

          {formSuccess ? <Alert severity="success">{formSuccess}</Alert> : null}

          {/*
           * =====================================================
           * CLIENTE
           * =====================================================
           */}

          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={0.5}>
              <Typography fontWeight={900}>{order.customerName}</Typography>

              <Typography variant="body2">
                {order.phone || "Sin teléfono"}
              </Typography>

              <Typography variant="body2">{order.address}</Typography>

              <Typography variant="body2" color="text.secondary">
                {order.municipality} · {order.zone}
              </Typography>
            </Stack>
          </Paper>

          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            <Chip
              icon={<PaidIcon />}
              label={`Total $${formatCurrency(order.amountToCharge)}`}
              color="success"
            />

            <Chip
              label={`Pago previsto: ${order.paymentMethod}`}
              variant="outlined"
            />

            {alreadyPaid > 0 ? (
              <Chip
                label={`Pagado $${formatCurrency(alreadyPaid)}`}
                color="secondary"
                variant="outlined"
              />
            ) : null}

            <Chip
              label={`Saldo $${formatCurrency(pendingToCollect)}`}
              color={pendingToCollect > 0 ? "warning" : "success"}
              variant={pendingToCollect > 0 ? "filled" : "outlined"}
            />
          </Stack>

          {order.notes ? <Alert severity="info">{order.notes}</Alert> : null}

          {/*
           * =====================================================
           * PAGOS ANTERIORES
           * =====================================================
           */}

          {order.payments && order.payments.length > 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Typography fontWeight={900} sx={{ mb: 1 }}>
                Pagos ya registrados
              </Typography>

              <Stack spacing={0.75}>
                {order.payments.map((payment) => (
                  <Box
                    key={payment.id}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: "background.default",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="body2">
                      <strong>Monto:</strong> ${formatCurrency(payment.amount)}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Método:</strong> {payment.method}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Tipo:</strong> {payment.type}
                    </Typography>

                    <Typography variant="body2">
                      <strong>Estado:</strong> {payment.status}
                    </Typography>

                    {payment.reference ? (
                      <Typography variant="body2">
                        <strong>Referencia:</strong> {payment.reference}
                      </Typography>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            </Paper>
          ) : null}

          <Divider />

          {/*
           * =====================================================
           * PRODUCTOS
           * =====================================================
           */}

          <Stack spacing={1}>
            <Typography fontWeight={900}>Productos</Typography>

            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                justifyContent="space-between"
              >
                <Typography variant="body2">
                  Pedido original:{" "}
                  <strong>{formatQuantity(totalOrderedQuantity)}</strong>
                </Typography>

                <Typography variant="body2">
                  Entregado anteriormente:{" "}
                  <strong>{formatQuantity(totalPreviouslyDelivered)}</strong>
                </Typography>

                <Typography variant="body2">
                  Pendiente inicial:{" "}
                  <strong>{formatQuantity(totalPendingBeforeAttempt)}</strong>
                </Typography>
              </Stack>
            </Paper>

            {products.map((product) => {
              const pendingAfterAttempt = Math.max(
                Number(product.quantityPending || 0) -
                  Number(product.quantityDelivered || 0),
                0,
              );

              const hasNoPendingQuantity =
                Number(product.quantityPending || 0) <= 0;

              return (
                <Paper
                  key={product.productId}
                  elevation={0}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: product.delivered ? "success.main" : "divider",
                  }}
                >
                  <Stack spacing={1}>
                    <Typography fontWeight={800}>
                      {product.productName}
                    </Typography>

                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={0.75}
                      useFlexGap
                      flexWrap="wrap"
                    >
                      <Chip
                        size="small"
                        label={`Pedido: ${formatQuantity(
                          product.quantityOrdered,
                        )}`}
                        variant="outlined"
                      />

                      <Chip
                        size="small"
                        label={`Anterior: ${formatQuantity(
                          product.quantityPreviouslyDelivered,
                        )}`}
                        variant="outlined"
                        color="secondary"
                      />

                      <Chip
                        size="small"
                        label={`Pendiente: ${formatQuantity(
                          product.quantityPending,
                        )}`}
                        color={
                          product.quantityPending > 0 ? "warning" : "success"
                        }
                        variant="outlined"
                      />

                      <Chip
                        size="small"
                        label={`Quedará: ${formatQuantity(
                          pendingAfterAttempt,
                        )}`}
                        color={pendingAfterAttempt > 0 ? "warning" : "success"}
                      />
                    </Stack>

                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={product.delivered}
                          onChange={(event) =>
                            handleToggleDelivered(
                              product.productId,
                              event.target.checked,
                            )
                          }
                          disabled={
                            isFailedAttempt || hasNoPendingQuantity || saving
                          }
                        />
                      }
                      label="Entregar toda la cantidad pendiente"
                    />

                    <TextField
                      type="number"
                      size="small"
                      label="Cantidad entregada en este intento"
                      value={product.quantityDelivered}
                      onChange={(event) =>
                        handleQuantityDelivered(
                          product.productId,
                          Number(event.target.value),
                        )
                      }
                      inputProps={{
                        min: 0,
                        max: Number(product.quantityPending || 0),
                        step: "0.001",
                      }}
                      helperText={`Máximo disponible: ${formatQuantity(
                        product.quantityPending,
                      )}`}
                      disabled={
                        isFailedAttempt || hasNoPendingQuantity || saving
                      }
                      fullWidth
                    />
                  </Stack>
                </Paper>
              );
            })}

            <Button
              variant="outlined"
              onClick={handleAutoStatus}
              disabled={isFailedAttempt || saving}
            >
              Calcular estado según cantidades
            </Button>

            <Paper
              elevation={0}
              sx={{
                p: 1.25,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  Entregado en este intento:{" "}
                  <strong>{formatQuantity(totalDeliveredThisAttempt)}</strong>
                </Typography>

                <Typography variant="body2">
                  Pendiente después del intento:{" "}
                  <strong>{formatQuantity(totalPendingAfterAttempt)}</strong>
                </Typography>
              </Stack>
            </Paper>

            {totalPendingAfterAttempt > 0 ? (
              <Alert severity="warning">
                Después de este intento quedarán cantidades pendientes.
              </Alert>
            ) : totalDeliveredThisAttempt > 0 ? (
              <Alert severity="success">
                Este intento completa todas las cantidades pendientes.
              </Alert>
            ) : null}
          </Stack>

          <Divider />

          {/*
           * =====================================================
           * RESULTADO
           * =====================================================
           */}

          <Stack spacing={1}>
            <Typography fontWeight={900}>Resultado del intento</Typography>

            <Alert severity="info">
              Seleccioná el resultado real de esta visita. Un resultado parcial,
              reprogramado o no entregado cerrará este intento y requerirá una
              nueva asignación para volver a reparto.
            </Alert>

            <FormControl>
              <RadioGroup
                value={status}
                onChange={(event) =>
                  handleStatusChange(event.target.value as DeliveryResultStatus)
                }
              >
                <FormControlLabel
                  value="DELIVERED"
                  control={<Radio />}
                  label="Entregado completamente"
                  disabled={saving}
                />

                <FormControlLabel
                  value="PARTIAL_DELIVERED"
                  control={<Radio />}
                  label="Entregado parcialmente"
                  disabled={saving}
                />

                <FormControlLabel
                  value="RESCHEDULED"
                  control={<Radio />}
                  label="Reprogramado"
                  disabled={saving}
                />

                <FormControlLabel
                  value="NOT_DELIVERED"
                  control={<Radio />}
                  label="No entregado"
                  disabled={saving}
                />
              </RadioGroup>
            </FormControl>

            {isFailedAttempt ? (
              <Alert severity="warning">
                Las cantidades y los importes cobrados fueron establecidos en
                cero porque este resultado no admite entregas ni pagos.
              </Alert>
            ) : null}
          </Stack>

          <Divider />

          {/*
           * =====================================================
           * COBRANZA
           * =====================================================
           */}

          <Stack spacing={1}>
            <Typography fontWeight={900}>Cobro en la entrega</Typography>

            <Alert severity="info">
              Los pagos anteriores son solo informativos. En esta sección debés
              registrar exclusivamente el dinero recibido durante este intento.
            </Alert>

            <TextField
              select
              size="small"
              label="Método de pago"
              value={paymentMethod}
              onChange={(event) =>
                handlePaymentMethodChange(event.target.value as PaymentMethod)
              }
              disabled={isFailedAttempt || saving}
              fullWidth
            >
              <MenuItem value="CASH">Efectivo</MenuItem>

              <MenuItem value="TRANSFER">Transferencia</MenuItem>

              <MenuItem value="BOTH">Efectivo y transferencia</MenuItem>
            </TextField>

            <TextField
              size="small"
              type="number"
              label="Cobrado en efectivo"
              value={cashCollected}
              onChange={(event) => handleCashChange(Number(event.target.value))}
              inputProps={{
                min: 0,
                step: "0.01",
              }}
              disabled={
                isFailedAttempt || paymentMethod === "TRANSFER" || saving
              }
              fullWidth
            />

            <TextField
              size="small"
              type="number"
              label="Cobrado por transferencia"
              value={transferCollected}
              onChange={(event) =>
                handleTransferChange(Number(event.target.value))
              }
              inputProps={{
                min: 0,
                step: "0.01",
              }}
              disabled={isFailedAttempt || paymentMethod === "CASH" || saving}
              fullWidth
            />

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  <strong>Total del pedido:</strong> $
                  {formatCurrency(order.amountToCharge)}
                </Typography>

                <Typography variant="body2">
                  <strong>Pagado previamente:</strong> $
                  {formatCurrency(alreadyPaid)}
                </Typography>

                <Typography variant="body2">
                  <strong>Saldo pendiente:</strong> $
                  {formatCurrency(pendingToCollect)}
                </Typography>

                <Typography variant="body2">
                  <strong>Cobrado ahora:</strong> $
                  {formatCurrency(currentCollected)}
                </Typography>

                <Typography variant="body2">
                  <strong>Saldo posterior:</strong> $
                  {formatCurrency(
                    Math.max(pendingToCollect - currentCollected, 0),
                  )}
                </Typography>
              </Stack>
            </Paper>

            {paymentCollectionError ? (
              <Alert severity="error">
                {hasNegativePayment
                  ? "Los importes cobrados no pueden ser negativos."
                  : "El cobro actual supera el saldo pendiente del pedido."}
              </Alert>
            ) : null}
          </Stack>

          <Divider />

          {/*
           * =====================================================
           * GPS
           * =====================================================
           */}

          <GpsComparisonCard
            order={{
              ...order,
              deliveredGps: gpsPoint ?? order.deliveredGps,
              traceability: traceabilityPreview,
            }}
          />

          <Stack spacing={1}>
            <Typography fontWeight={900}>Captura GPS real</Typography>

            <Alert severity={gpsPoint ? "success" : "warning"}>
              {gpsPoint
                ? `Ubicación capturada: ${gpsPoint.latitude.toFixed(
                    6,
                  )}, ${gpsPoint.longitude.toFixed(6)}`
                : "Debés capturar la ubicación real antes de confirmar el intento."}
            </Alert>

            {gpsError ? <Alert severity="error">{gpsError}</Alert> : null}

            <Button
              variant="outlined"
              startIcon={
                loadingGps ? <CircularProgress size={16} /> : <MyLocationIcon />
              }
              onClick={handleCaptureGps}
              disabled={loadingGps || saving}
              fullWidth
            >
              {gpsPoint ? "Actualizar GPS real" : "Capturar GPS real"}
            </Button>
          </Stack>

          <Divider />

          {/*
           * =====================================================
           * TRAZABILIDAD Y OBSERVACIÓN
           * =====================================================
           */}

          <DeliveryTraceabilitySummary
            order={{
              ...order,
              deliveredGps: gpsPoint ?? order.deliveredGps,
              traceability: traceabilityPreview,
            }}
          />

          <DeliveryAuditTimeline events={localAuditEvents} />

          <TextField
            size="small"
            label="Observaciones del intento"
            multiline
            minRows={3}
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            helperText={
              isFailedAttempt
                ? "Indicá por qué se reprogramó o no pudo realizarse la entrega."
                : "Podés registrar aclaraciones sobre productos, cobros, cliente o ubicación."
            }
            disabled={saving}
            fullWidth
          />
        </Stack>
      </Box>

      {/*
       * =========================================================
       * ACCIÓN FIJA INFERIOR
       * =========================================================
       */}

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper",
          boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.06)",
        }}
      >
        <MobileStickyFooter>
          <Button
            variant="contained"
            color="success"
            size="large"
            fullWidth
            onClick={handleConfirm}
            disabled={
              saving ||
              loadingGps ||
              paymentCollectionError ||
              !status ||
              order.deliveryStatus !== "IN_DELIVERY"
            }
          >
            {saving ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Confirmar gestión del pedido"
            )}
          </Button>
        </MobileStickyFooter>
      </Box>
    </Box>
  );
};
