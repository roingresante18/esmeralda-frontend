import { useMemo, useRef, useState } from "react";
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
import { useOrder } from "./hook/useOrder";
import { useConfirmOrder } from "./hook/useConfirmOrder";
import { useClientSearch, type Client } from "./hook/useClientSearch";
import logo from "../../../public/logo.png";
import type { UserRole } from "./types";
import type {
  ClientFormData,
  Municipality,
} from "../../pages/modules/Clients/components/ClientForm.types";

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

  const {
    clientQuery,
    setClientQuery,
    clientsFound,
    selectClient,
    clearResults,
  } = useClientSearch();
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [confirmStep, setConfirmStep] = useState<"FORM" | "SUMMARY">("FORM");

  //prueba de capturar municipalidad del cliente
  interface ClientFormState extends ClientFormData {
    municipality?: Municipality;
  }

  const [clientForm, setClientForm] = useState<ClientFormState>({
    name: "",
    phone: "",
    email: "",
    address: "",
    municipality_id: "",
  });
  // const [clientForm, setClientForm] = useState<ClientFormData>({
  //   name: "",
  //   phone: "",
  //   email: "",
  //   address: "",
  //   municipality_id: "",
  // });

  const navigate = useNavigate();
  const [clientSectionOpen, setClientSectionOpen] = useState(true);

  /* ================= CONFIRM ORDER ================= */
  const {
    open: confirmOpen,
    setOpen: setConfirmOpen,
    address,
    setAddress,
    confirmOrder,
  } = useConfirmOrder(order.orderId, () => {
    setOrder((p) => ({ ...p, status: "CONFIRMED" }));
    clearAll();
  });

  /* ================= LIMPIAR TODO ================= */
  const clearAll = () => {
    setOrder({
      orderId: undefined,
      status: "QUOTATION",
      clientId: undefined,
      clientName: "",
      clientPhone: "",
      items: [],
      notes: "",
      createdAt: new Date().toISOString(),
      deliveryDate: "",
      municipality_snapshot: "",
    });

    setClientQuery("");
    clearResults();
    setClientModalOpen(false);

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
  };

  /* ================= SELECCIÓN DE CLIENTE ================= */
  const handleSelectClient = (client: Client) => {
    applyClientToOrder(client);
    selectClient(client);
  };
  const applyClientToOrder = (client: Client) => {
    setOrder((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      municipality_snapshot: client.municipality_name || "",
    }));
  };
  const clearClient = () =>
    setOrder((p) => ({
      ...p,
      clientId: undefined,
      clientName: "",
      clientPhone: "",
      municipality_snapshot: "",
    }));

  const submitClient = async () => {
    const res = await api.post("/clients", clientForm);
    applyClientToOrder(res.data);
    setClientModalOpen(false);
  };
  /* ================= RECEIPT EXPORT ================= */
  const receiptRef = useRef<HTMLDivElement>(null);

  const exportJPG = async () => {
    if (!receiptRef.current) return;

    const blob = await htmlToImage.toBlob(receiptRef.current, {
      quality: 0.95,
      backgroundColor: "#ffffff",
    });
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedido-${order.orderId || "nuevo"}.jpg`;
    a.click();

    const phone = order.clientPhone?.replace(/\D/g, "");
    if (phone) {
      const text = `Hola ${order.clientName}, te envío el presupuesto del pedido.`;
      window.open(
        `https: wa.me/+54${phone}?text=${encodeURIComponent(text)}`,
        "_blank",
      );
    }
  };

  /* ================= TOTAL VISUAL ================= */
  const estimatedTotal = useMemo(() => {
    return order.items.reduce((sum, item) => {
      const discount = item.discountPercent ?? 0;
      const finalPrice = item.sale_price * (1 - discount / 100);
      return sum + finalPrice * item.quantity;
    }, 0);
  }, [order.items]);

  /* ================= UI ================= */
  return (
    <Stack spacing={2} sx={{ p: { xs: 2, md: 4 } }}>
      {/* Botón volver */}
      <Button
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          borderRadius: 50,
          zIndex: 1300,
        }}
        variant="contained"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </Button>

      {/* Título */}
      <Typography variant="h4" fontWeight="bold" textAlign="center" mb={2}>
        Administrar Pedido
      </Typography>

      {/* Botones Limpiar / Ver pedidos */}
      <Stack direction="row" justifyContent="center" mb={2} spacing={2}>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            if (window.confirm("¿Desea borrar el pedido actual?")) clearAll();
          }}
          sx={{ borderRadius: 3 }}
        >
          🗑️ Nuevo pedido / Limpiar todo
        </Button>
        <Button
          variant="contained"
          color="info"
          onClick={() => navigate("/ordersCompletos")}
          sx={{ borderRadius: 3 }}
        >
          📋 Ver pedidos
        </Button>
      </Stack>

      {/* CLIENTE */}
      <Paper
        sx={{
          display: "flex",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: 4,
        }}
      >
        <Box sx={{ width: 6, bgcolor: "info.main" }} />
        <Box sx={{ flex: 1, p: 2 }}>
          <Stack direction="row" justifyContent="space-between">
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
            <Divider sx={{ my: 1 }} />
            {!order.clientId ? (
              <>
                <TextField
                  label="Buscar cliente"
                  fullWidth
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                />
                <Stack spacing={1} mt={1}>
                  {clientsFound.map((c) => (
                    <Paper
                      key={c.id}
                      sx={{
                        p: 1.5,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#f5f5f5" },
                      }}
                      onClick={() => handleSelectClient(c)}
                    >
                      <Typography fontWeight="bold">{c.name}</Typography>
                      <Typography variant="body2">{c.phone}</Typography>
                      <Typography variant="body2">
                        {c.municipality_name}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>

                <Button
                  sx={{ mt: 1 }}
                  variant="outlined"
                  onClick={() => setClientModalOpen(true)}
                >
                  + Nuevo cliente
                </Button>

                {!order.clientId && (
                  <DraftOrderSearch onSelect={loadDraftOrder} />
                )}
              </>
            ) : (
              <Paper sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 2 }}>
                <Typography fontWeight="bold" variant="h6">
                  {order.clientName}
                </Typography>
                <Typography variant="body2" mb={1}>
                  {order.clientPhone}
                </Typography>
                <Typography variant="body2" mb={1}>
                  {order.municipality_snapshot || "—"}
                </Typography>
                <Button size="small" variant="outlined" onClick={clearClient}>
                  Cambiar cliente
                </Button>
              </Paper>
            )}
          </Collapse>
        </Box>
      </Paper>

      {/* PRODUCTOS */}
      <Paper
        sx={{
          display: "flex",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: 4,
        }}
      >
        <Box sx={{ width: 6, bgcolor: "warning.main" }} />
        <Box sx={{ flex: 1, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <ShoppingCartIcon color="primary" />
            <Typography fontWeight="bold" variant="h6">
              Productos
            </Typography>
          </Stack>

          <OrderProductPicker onAdd={addProduct} />
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
      <Paper
        sx={{
          display: "flex",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: 4,
        }}
      >
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
            minRows={3}
            fullWidth
            value={order.notes || ""}
            onChange={(e) =>
              setOrder((prev) => ({ ...prev, notes: e.target.value }))
            }
            disabled={!canEdit}
            sx={{ mt: 3, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />

          <OrderSummary
            total={estimatedTotal}
            onSave={saveOrder}
            onExport={exportJPG}
            disabled={!canEdit}
          />
          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{ mt: 2, borderRadius: 3 }}
            disabled={!order.orderId || order.status !== "QUOTATION"}
            onClick={() => setConfirmOpen(true)}
          >
            Confirmar pedido
          </Button>
        </Box>
      </Paper>

      {/* RECEIPT */}
      <OrderReceipt
        ref={receiptRef}
        order={order}
        totalAmount={estimatedTotal}
        logoUrl={logo}
      />

      {/* MODAL CLIENTE */}
      <Dialog
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        fullWidth
        maxWidth="sm"
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
        onConfirm={confirmOrder}
      />
    </Stack>
  );
}
