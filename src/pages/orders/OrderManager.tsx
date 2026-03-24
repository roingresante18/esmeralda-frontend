import { useEffect, useMemo, useRef, useState } from "react";
import {
  Stack,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Collapse,
  IconButton,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { useNavigate } from "react-router-dom";
import * as htmlToImage from "html-to-image";
import ConfirmOrderDialog from "./ConfirmOrderDialog";
import OrderProductPicker from "./OrderProductPicker";
import OrderCart from "./OrderCart";
import OrderSummary from "./OrderSummary";
import OrderReceipt from "./OrderReceipt";
import DraftOrderSearch from "./DraftOrderSearch";
import ClientForm from "../../pages/modules/Clients/components/ClientForm";
import api from "../../api/api";
import OrderConfirmationReceipt from "./OrderConfirmationReceipt";
import { useOrder } from "./hook/useOrder";
import { useConfirmOrder } from "./hook/useConfirmOrder";
import { useClientSearch, type Client } from "./hook/useClientSearch";
import logo from "../../../public/logo.png";
import type { OrderDraft, DraftOrderApi, UserRole } from "../types/types";
import type {
  ClientFormData,
  Municipality,
} from "../../pages/modules/Clients/components/ClientForm.types";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
type PaymentData = {
  cash: number;
  transfer: number;
  reference?: string;
};

const formatOrderDate = (date?: string) => {
  if (!date) return "Sin fecha";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("es-AR");
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case "CONFIRMED":
      return "Confirmado";
    case "QUOTATION":
      return "Cotización";
    case "CANCELLED":
      return "Cancelado";
    case "PREPARING":
      return "Preparando";
    case "PREPARED":
      return "Preparado";
    case "QUALITY_CHECKED":
      return "Controlado";
    case "ASSIGNED":
      return "Asignado";
    case "IN_DELIVERY":
      return "En reparto";
    case "DELIVERED":
      return "Entregado";
    default:
      return status || "Sin estado";
  }
};

const getStatusColor = (
  status?: string,
): "success" | "warning" | "error" | "info" | "default" => {
  switch (status) {
    case "CONFIRMED":
    case "DELIVERED":
      return "success";
    case "QUOTATION":
    case "PREPARING":
    case "PREPARED":
      return "warning";
    case "CANCELLED":
      return "error";
    case "QUALITY_CHECKED":
    case "ASSIGNED":
    case "IN_DELIVERY":
      return "info";
    default:
      return "default";
  }
};

export default function OrderManager({
  currentUser,
}: {
  currentUser: { role: UserRole };
}) {
  /* ================= PERMISOS ================= */
  const canEdit = currentUser.role === "ADMIN" || currentUser.role === "VENTAS";

  /* ================= ORDER ================= */
  const {
    order,
    setOrder,
    addProduct,
    updateQuantity,
    removeProduct,
    loadDraftOrder,
    saveOrder,
  } = useOrder(canEdit);

  /* ================= CLIENT SEARCH ================= */
  const handleSaveOrder = async () => {
    await saveOrder();
    setHasUnsavedChanges(false);
  };

  const {
    clientQuery,
    setClientQuery,
    clientsFound,
    selectClient,
    clearResults,
  } = useClientSearch();

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [confirmStep, setConfirmStep] = useState<"FORM" | "SUMMARY">("FORM");

  interface ClientFormState extends ClientFormData {
    municipality?: Municipality;
  }

  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedPayment, setConfirmedPayment] = useState<PaymentData>({
    cash: 0,
    transfer: 0,
    reference: "",
  });
  const [confirmedDelivery, setConfirmedDelivery] = useState({
    address: "",
    deliveryDate: "",
  });
  const [clientForm, setClientForm] = useState<ClientFormState>({
    name: "",
    phone: "",
    email: "",
    address: "",
    municipality_id: null,
  });
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDraft | null>(null);
  const confirmationReceiptRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [clientSectionOpen, setClientSectionOpen] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [clientOrders, setClientOrders] = useState<DraftOrderApi[]>([]);
  const [loadingClientOrders, setLoadingClientOrders] = useState(false);

  useEffect(() => {
    if (order.orderId) {
      setHasUnsavedChanges(true);
    }
  }, [order.items]);

  /* ================= CONFIRM ORDER ================= */
  const {
    open: confirmOpen,
    setOpen: setConfirmOpen,
    address,
    setAddress,
    confirmOrder,
  } = useConfirmOrder(order.orderId, order.clientId, () => {
    setOrder((p) => ({ ...p, status: "CONFIRMED" }));
  });
  /* ================= CLIENT ORDERS ================= */
  const fetchClientOrders = async (clientId: number) => {
    try {
      setLoadingClientOrders(true);

      const res = await api.get(`/orders/by-client/${clientId}`);

      const orders: DraftOrderApi[] = Array.isArray(res.data) ? res.data : [];

      const sortedOrders = [...orders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setClientOrders(sortedOrders);
    } catch (error) {
      console.error("Error al cargar pedidos del cliente", error);
      setClientOrders([]);
    } finally {
      setLoadingClientOrders(false);
    }
  };

  const handleLoadClientOrder = (selectedOrder: DraftOrderApi) => {
    loadDraftOrder(selectedOrder);
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    if (order.clientId) {
      fetchClientOrders(order.clientId);
    } else {
      setClientOrders([]);
    }
  }, [order.clientId]);

  /* ================= LIMPIAR TODO ================= */
  const clearAll = () => {
    setOrder({
      orderId: undefined,
      status: "QUOTATION",
      clientId: undefined,
      clientName: "",
      clientPhone: "",
      clientLatitude: undefined,
      clientLongitude: undefined,
      items: [],
      notes: "",
      createdAt: new Date().toISOString(),
      deliveryDate: "",
      municipality_snapshot: "",
    });

    setClientQuery("");
    clearResults();
    setClientModalOpen(false);
    setClientOrders([]);

    setAddress({
      delivery_address: "",
      latitude: undefined,
      longitude: undefined,
      delivery_date: "",
    });

    setConfirmStep("FORM");
    setConfirmOpen(false);
    setClientSectionOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmOpen(false);
    setConfirmStep("FORM");
  };

  /* ================= DESCUENTO VISUAL ================= */
  const updateDiscount = (productId: number, value: number) => {
    setOrder((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId
          ? { ...item, discountPercent: value }
          : item,
      ),
    }));

    setHasUnsavedChanges(true);
  };

  /* ================= SELECCIÓN DE CLIENTE ================= */
  const handleSelectClient = (client: Client) => {
    // console.log(client);
    applyClientToOrder(client);
    selectClient(client);
    fetchClientOrders(client.id);
  };

  const applyClientToOrder = (client: Client) => {
    setOrder((prev: any) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientAddress: client.address ?? "",
      clientLatitude:
        client.latitude != null ? Number(client.latitude) : undefined,
      clientLongitude:
        client.longitude != null ? Number(client.longitude) : undefined,
      municipality_snapshot: client.municipality?.name ?? "Sin municipio",
    }));

    setHasUnsavedChanges(true);
  };

  const clearClient = () => {
    setOrder((p) => ({
      ...p,
      clientId: undefined,
      clientName: "",
      clientPhone: "",
      municipality_snapshot: "",
    }));
    setClientOrders([]);
  };

  const submitClient = async () => {
    const res = await api.post("/clients", clientForm);
    applyClientToOrder(res.data);
    setClientModalOpen(false);
    fetchClientOrders(res.data.id);
  };

  /* ================= RECEIPT COPY + WHATSAPP ================= */
  const receiptRef = useRef<HTMLDivElement>(null);

  const exportToWhatsApp = async () => {
    if (!receiptRef.current) return;

    const blob = await htmlToImage.toBlob(receiptRef.current, {
      quality: 0.95,
      backgroundColor: "#ffffff",
    });

    if (!blob) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch (err) {
      alert("Tu navegador no permite copiar imágenes automáticamente");
      return;
    }

    const phone = order.clientPhone?.replace(/\D/g, "");

    if (phone) {
      const text = `Hola ${order.clientName}, te envío el presupuesto del pedido.`;

      window.open(
        `https://wa.me/54${phone}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    }

    alert("Imagen copiada. Pegá en WhatsApp con Ctrl+V");
  };

  const exportConfirmationToWhatsApp = async () => {
    if (!confirmationReceiptRef.current) return;

    const blob = await htmlToImage.toBlob(confirmationReceiptRef.current, {
      quality: 0.95,
      backgroundColor: "#ffffff",
    });

    if (!blob) return;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
    } catch {
      alert("Tu navegador no permite copiar imágenes automáticamente");
      return;
    }

    const phone = order.clientPhone?.replace(/\D/g, "");

    if (phone) {
      const text = `Hola ${order.clientName}, tu pedido fue confirmado. Te comparto el comprobante con los detalles de entrega.`;

      window.open(
        `https://wa.me/54${phone}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    }

    alert("Imagen copiada. Pegá en WhatsApp con Ctrl+V");
  };

  /* ================= TOTAL VISUAL ================= */
  const estimatedTotal = useMemo(() => {
    return order.items.reduce((sum, item) => {
      const discount = item.discountPercent ?? 0;
      const finalPrice = item.sale_price * (1 - discount / 100);
      return sum + finalPrice * item.quantity;
    }, 0);
  }, [order.items]);

  const panelSx = {
    display: "flex",
    borderRadius: 4,
    overflow: "hidden",
    boxShadow: 3,
    bgcolor: "background.paper",
  };

  const renderClientOrdersList = () => (
    <Box mt={2}>
      <Typography fontWeight="bold" variant="subtitle2" mb={1}>
        Pedidos del cliente
      </Typography>

      {loadingClientOrders ? (
        <Typography variant="body2" color="text.secondary">
          Cargando pedidos...
        </Typography>
      ) : clientOrders.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Este cliente no tiene pedidos registrados.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {clientOrders.map((clientOrder) => (
            <Paper
              key={clientOrder.id}
              onClick={() => handleLoadClientOrder(clientOrder)}
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                cursor: "pointer",
                border: "1px solid",
                borderColor:
                  order.orderId === clientOrder.id ? "primary.main" : "divider",
                bgcolor:
                  order.orderId === clientOrder.id
                    ? "rgba(25, 118, 210, 0.06)"
                    : "#fff",
                transition: "0.2s",
                "&:hover": {
                  bgcolor: "#f8fafc",
                },
              }}
            >
              <Stack spacing={0.5}>
                <Typography fontWeight="bold" variant="body2">
                  Pedido #{clientOrder.id}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Fecha: {formatOrderDate(clientOrder.created_at)}
                </Typography>

                <Box>
                  <Chip
                    size="small"
                    label={getStatusLabel(clientOrder.status)}
                    color={getStatusColor(clientOrder.status)}
                  />
                </Box>

                {clientOrder.payment_summary && (
                  <Box mt={0.5}>
                    <Typography variant="caption" display="block">
                      Adelanto total: $
                      {clientOrder.payment_summary.total_paid.toFixed(2)}
                    </Typography>

                    {clientOrder.payment_summary.cash > 0 && (
                      <Typography variant="caption" display="block">
                        Efectivo: ${clientOrder.payment_summary.cash.toFixed(2)}
                      </Typography>
                    )}

                    {clientOrder.payment_summary.transfer > 0 && (
                      <Typography variant="caption" display="block">
                        Transferencia: $
                        {clientOrder.payment_summary.transfer.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
  // console.log("GPS cliente para confirmación", {
  //   lat: (order as any).clientLatitude,
  //   lng: (order as any).clientLongitude,
  //   order,
  // });
  const confirmClientLocation = {
    lat:
      (order as any).clientLatitude != null
        ? Number((order as any).clientLatitude)
        : undefined,
    lng:
      (order as any).clientLongitude != null
        ? Number((order as any).clientLongitude)
        : undefined,
    address: (order as any).clientAddress ?? "",
  };

  // console.log(
  //   "clientLocation que se envía al ConfirmOrderDialog",
  //   confirmClientLocation,
  // );
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#fbfbfb",
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 0.1 },
          pb: { xs: 2, md: 0.1 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
          mb={1}
          flexWrap="wrap"
        >
          <Typography
            variant="h5"
            fontWeight="bold"
            textAlign="center"
            sx={{ mr: 2 }}
          >
            Panel de Ventas
          </Typography>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              if (window.confirm("¿Desea borrar el pedido actual?")) clearAll();
            }}
            sx={{ borderRadius: 3, minWidth: 220 }}
          >
            🗑️ Nuevo pedido / Limpiar todo
          </Button>

          <Button
            variant="contained"
            color="info"
            onClick={() => navigate("/ordersCompletos")}
            sx={{ borderRadius: 3, minWidth: 180 }}
          >
            📋 Ver pedidos
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 50,
              minWidth: 140,
              bgcolor: "#28b42d",
              "&:hover": {
                bgcolor: "#239927",
              },
            }}
          >
            ← Volver
          </Button>
        </Stack>

        {/* MOBILE / TABLET */}
        <Box sx={{ display: { xs: "block", lg: "none" } }}>
          <Stack spacing={2}>
            {/* CLIENTE */}
            <Paper sx={panelSx}>
              <Box sx={{ width: 6, bgcolor: "info.main" }} />
              <Box sx={{ flex: 1, p: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon color="info" />
                    <Typography fontWeight="bold" variant="h6">
                      Cliente
                    </Typography>
                  </Stack>

                  <IconButton onClick={() => setClientSectionOpen((p) => !p)}>
                    <ExpandMoreIcon
                      sx={{
                        transform: clientSectionOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "0.3s",
                      }}
                    />
                  </IconButton>
                </Stack>

                <Collapse in={clientSectionOpen}>
                  <Divider sx={{ my: 1.5 }} />

                  {!order.clientId ? (
                    <>
                      <TextField
                        label="Buscar cliente"
                        fullWidth
                        value={clientQuery}
                        onChange={(e) => setClientQuery(e.target.value)}
                      />

                      <Stack spacing={1} mt={1.5}>
                        {clientsFound.map((c) => (
                          <Paper
                            key={c.id}
                            sx={{
                              p: 1.5,
                              cursor: "pointer",
                              borderRadius: 2.5,
                              border: "1px solid",
                              borderColor: "divider",
                              boxShadow: 0,
                              "&:hover": { bgcolor: "#f8fafc" },
                            }}
                            onClick={() => handleSelectClient(c)}
                          >
                            <Typography fontWeight="bold">{c.name}</Typography>
                            <Typography variant="body2">{c.phone}</Typography>
                          </Paper>
                        ))}
                      </Stack>

                      <Button
                        sx={{ mt: 1.5 }}
                        variant="outlined"
                        fullWidth
                        onClick={() => setClientModalOpen(true)}
                      >
                        + Nuevo cliente
                      </Button>

                      {!order.clientId && (
                        <Box mt={2}>
                          <DraftOrderSearch onSelect={loadDraftOrder} />
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: "#f8fafc",
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: 0,
                        }}
                      >
                        <Typography fontWeight="bold" variant="h6">
                          {order.clientName}
                        </Typography>
                        <Typography variant="body2" mb={1}>
                          {order.clientPhone}
                        </Typography>
                        <Typography variant="body2" mb={2}>
                          {order.municipality_snapshot || "—"}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={clearClient}
                          fullWidth
                        >
                          Cambiar cliente
                        </Button>
                      </Paper>

                      {renderClientOrdersList()}
                    </>
                  )}
                </Collapse>
              </Box>
            </Paper>

            {/* PRODUCTOS */}
            <Paper sx={panelSx}>
              <Box sx={{ width: 6, bgcolor: "warning.main" }} />
              <Box sx={{ flex: 1, p: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <ShoppingCartIcon color="primary" />
                  <Typography fontWeight="bold" variant="h6">
                    Productos
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 2,
                  }}
                >
                  <OrderProductPicker onAdd={addProduct} />
                </Box>

                <OrderCart
                  items={order.items}
                  onUpdateQuantity={updateQuantity}
                  onUpdateDiscount={updateDiscount}
                  onRemove={removeProduct}
                  readonly={!canEdit}
                />
              </Box>
            </Paper>

            {/* RESUMEN */}
            <Paper sx={panelSx}>
              <Box sx={{ width: 6, bgcolor: "success.main" }} />
              <Box sx={{ flex: 1, p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <ReceiptIcon color="success" />
                  <Typography fontWeight="bold" variant="h6">
                    Resumen
                  </Typography>
                </Stack>

                <TextField
                  label="Observaciones"
                  placeholder="Agregar detalles adicionales del pedido..."
                  multiline
                  minRows={6}
                  fullWidth
                  value={order.notes || ""}
                  onChange={(e) => {
                    setOrder((prev) => ({ ...prev, notes: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!canEdit}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                    },
                  }}
                />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <OrderSummary
                    total={estimatedTotal}
                    onSave={handleSaveOrder}
                    onExport={exportToWhatsApp}
                    disabled={!canEdit}
                  />
                </Box>

                {hasUnsavedChanges && (
                  <Typography color="warning.main" fontSize={13} mt={1.5}>
                    ⚠️ Cambios sin guardar
                  </Typography>
                )}

                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2, borderRadius: 3, py: 1.2 }}
                  disabled={!order.orderId || !canEdit}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setUnsavedDialogOpen(true);
                    } else {
                      setConfirmOpen(true);
                    }
                  }}
                >
                  Guardar / Confirmar
                </Button>
              </Box>
            </Paper>
          </Stack>
        </Box>

        {/* DESKTOP */}
        <Box
          sx={{
            display: { xs: "none", lg: "grid" },
            gridTemplateColumns: "20% 60% 20%",
            gap: 2,
            height: "calc(100vh - 80px)",
            minHeight: 0,
          }}
        >
          {/* CLIENTE */}
          <Paper sx={{ ...panelSx, height: "100%" }}>
            <Box sx={{ width: 6, bgcolor: "info.main", flexShrink: 0 }} />
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                overflowY: "auto",
              }}
            >
              <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PersonIcon color="info" />
                    <Typography fontWeight="bold" variant="h6">
                      Cliente
                    </Typography>
                  </Stack>

                  <IconButton onClick={() => setClientSectionOpen((p) => !p)}>
                    <ExpandMoreIcon
                      sx={{
                        transform: clientSectionOpen
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "0.3s",
                      }}
                    />
                  </IconButton>
                </Stack>
              </Box>

              <Collapse
                in={clientSectionOpen}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <Divider sx={{ mx: 2, mb: 1.5 }} />
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: "auto",
                    px: 2,
                    pb: 2,
                  }}
                >
                  {!order.clientId ? (
                    <>
                      <TextField
                        label="Buscar cliente"
                        fullWidth
                        value={clientQuery}
                        onChange={(e) => setClientQuery(e.target.value)}
                      />

                      <Stack spacing={1} mt={1.5}>
                        {clientsFound.map((c) => (
                          <Paper
                            key={c.id}
                            sx={{
                              p: 1.5,
                              cursor: "pointer",
                              borderRadius: 2.5,
                              border: "1px solid",
                              borderColor: "divider",
                              boxShadow: 0,
                              "&:hover": { bgcolor: "#f8fafc" },
                            }}
                            onClick={() => handleSelectClient(c)}
                          >
                            <Typography fontWeight="bold">{c.name}</Typography>
                            <Typography variant="body2">{c.phone}</Typography>
                          </Paper>
                        ))}
                      </Stack>

                      <Button
                        sx={{ mt: 1.5 }}
                        variant="outlined"
                        fullWidth
                        onClick={() => setClientModalOpen(true)}
                      >
                        + Nuevo cliente
                      </Button>

                      {!order.clientId && (
                        <Box mt={2}>
                          <DraftOrderSearch onSelect={loadDraftOrder} />
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: "#f8fafc",
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: 0,
                        }}
                      >
                        <Typography fontWeight="bold" variant="h6">
                          {order.clientName}
                        </Typography>
                        <Typography variant="body2" mb={1}>
                          {order.clientPhone}
                        </Typography>
                        <Typography variant="body2" mb={2}>
                          {order.municipality_snapshot || "—"}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={clearClient}
                          fullWidth
                        >
                          Cambiar cliente
                        </Button>
                      </Paper>

                      {renderClientOrdersList()}
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          </Paper>

          {/* PRODUCTOS */}
          <Paper sx={{ ...panelSx, height: "100%" }}>
            <Box sx={{ width: 6, bgcolor: "warning.main", flexShrink: 0 }} />
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ px: 2.5, pt: 2.5, pb: 2, flexShrink: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <ShoppingCartIcon color="primary" />
                  <Typography fontWeight="bold" variant="h6">
                    Productos
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    p: 0,
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <OrderProductPicker onAdd={addProduct} />
                </Box>
              </Box>

              <Divider />

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  p: 2.5,
                }}
              >
                <OrderCart
                  items={order.items}
                  onUpdateQuantity={updateQuantity}
                  onUpdateDiscount={updateDiscount}
                  onRemove={removeProduct}
                  readonly={!canEdit}
                />
              </Box>
            </Box>
          </Paper>

          {/* RESUMEN */}
          <Paper sx={{ ...panelSx, height: "100%" }}>
            <Box sx={{ width: 6, bgcolor: "success.main", flexShrink: 0 }} />
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ReceiptIcon color="success" />
                  <Typography fontWeight="bold" variant="h6">
                    Resumen
                  </Typography>
                </Stack>
              </Box>

              <Divider />

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  px: 2,
                  pb: 2,
                }}
              >
                <TextField
                  label="Observaciones"
                  placeholder="Agregar detalles adicionales del pedido..."
                  multiline
                  minRows={5}
                  fullWidth
                  value={order.notes || ""}
                  onChange={(e) => {
                    setOrder((prev) => ({ ...prev, notes: e.target.value }));
                    setHasUnsavedChanges(true);
                  }}
                  disabled={!canEdit}
                  sx={{
                    mt: 1,
                    mb: 1,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      bgcolor: "#fff",
                    },
                  }}
                />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: "#f8fafc",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <OrderSummary
                    total={estimatedTotal}
                    onSave={handleSaveOrder}
                    onExport={exportToWhatsApp}
                    disabled={!canEdit}
                  />
                </Box>

                {hasUnsavedChanges && (
                  <Typography color="warning.main" fontSize={13} mt={1.5}>
                    ⚠️ Cambios sin guardar
                  </Typography>
                )}

                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 1, borderRadius: 3, py: 1.2 }}
                  disabled={!order.orderId || !canEdit}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setUnsavedDialogOpen(true);
                    } else {
                      setConfirmOpen(true);
                    }
                  }}
                >
                  Guardar / Confirmar
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* RECEIPTS ocultos para exportar */}
      {/* <Box sx={{ position: "absolute", left: -9999, top: 0 }}> */}
      <OrderReceipt
        ref={receiptRef}
        order={order}
        totalAmount={estimatedTotal}
        logoUrl={logo}
      />
      {/* </Box> */}

      <Box sx={{ position: "absolute", left: -9999, top: 0 }}>
        <OrderConfirmationReceipt
          ref={confirmationReceiptRef}
          order={confirmedOrder ?? order}
          totalAmount={confirmedTotal}
          logoUrl={logo}
          address={confirmedDelivery.address}
          deliveryDate={confirmedDelivery.deliveryDate}
          cash={confirmedPayment.cash}
          transfer={confirmedPayment.transfer}
          reference={confirmedPayment.reference}
        />
      </Box>

      {/* MODAL CLIENTE */}
      <Dialog
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Nuevo cliente</DialogTitle>
        <DialogContent>
          <ClientForm
            mode="create"
            value={clientForm}
            onChange={setClientForm}
            onSubmit={submitClient}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientModalOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG CAMBIOS SIN GUARDAR */}
      <Dialog
        open={unsavedDialogOpen}
        onClose={() => setUnsavedDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Guardar cambios pendientes
        </DialogTitle>

        <DialogContent>
          <Typography>
            Este pedido tiene cambios sin guardar.
            <br />
            Debe guardarlo antes de confirmar para que los cambios impacten
            correctamente.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUnsavedDialogOpen(false)}>Cancelar</Button>

          <Button
            variant="contained"
            onClick={async () => {
              await saveOrder();
              setHasUnsavedChanges(false);
              setUnsavedDialogOpen(false);
              setConfirmOpen(true);
            }}
          >
            Guardar y confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM DIALOG */}

      <ConfirmOrderDialog
        open={confirmOpen}
        onClose={closeConfirmModal}
        confirmStep={confirmStep}
        setConfirmStep={setConfirmStep}
        address={address}
        setAddress={setAddress}
        order={order}
        estimatedTotal={estimatedTotal}
        // clientLocation={{
        //   lat:
        //     (order as any).clientLatitude != null
        //       ? Number((order as any).clientLatitude)
        //       : undefined,
        //   lng:
        //     (order as any).clientLongitude != null
        //       ? Number((order as any).clientLongitude)
        //       : undefined,
        //   address: (order as any).clientAddress,
        // }}
        clientLocation={confirmClientLocation}
        onConfirm={async ({ payment, shouldSaveClientGps }) => {
          setConfirmedOrder(JSON.parse(JSON.stringify(order)));

          setConfirmedPayment({
            ...payment,
            reference: payment.reference ?? "",
          });

          setConfirmedTotal(estimatedTotal);

          setConfirmedDelivery({
            address: address.delivery_address,
            deliveryDate: address.delivery_date,
          });

          await confirmOrder(payment, {
            shouldSaveClientGps,
          });

          setTimeout(async () => {
            await exportConfirmationToWhatsApp();
            clearAll();
          }, 400);
        }}
      />
    </Box>
  );
}
