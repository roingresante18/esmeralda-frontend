import { useEffect, useRef, useState } from "react";
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
import ConfirmOrderDialog from "./ConfirmOrderDialog";
import type { UserRole } from "./types";
import type { ClientFormData } from "../../pages/modules/Clients/components/ClientForm.types";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import OrderProductPicker from "./OrderProductPicker";
import OrderCart from "./OrderCart";
import OrderSummary from "./OrderSummary";
import OrderReceipt from "./OrderReceipt";
import DraftOrderSearch from "./DraftOrderSearch";
import ClientForm from "../../pages/modules/Clients/components/ClientForm";
import * as htmlToImage from "html-to-image";
import { useOrder } from "./hook/useOrder";
import { useConfirmOrder } from "./hook/useConfirmOrder";
import logo from "../../../public/logo.png";

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

  const [clientQuery, setClientQuery] = useState("");
  const [clientsFound, setClientsFound] = useState<any[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [confirmStep, setConfirmStep] = useState<"FORM" | "SUMMARY">("FORM");

  const [municipalities, setMunicipalities] = useState<
    { id: number; name: string }[]
  >([]);

  const [clientForm, setClientForm] = useState<ClientFormData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    municipality_id: "",
  });

  const navigate = useNavigate();

  const [clientSectionOpen, setClientSectionOpen] = useState(true);
  // const [productsSectionOpen, setProductsSectionOpen] = useState(true);
  // const [summarySectionOpen, setSummarySectionOpen] = useState(true);

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
    //Pedido;
    setOrder({
      orderId: undefined,
      status: "QUOTATION",
      clientId: undefined,
      clientName: "",
      clientPhone: "",
      items: [],
      observations: "",
      createdAt: new Date().toISOString(),
      deliveryDate: "",
    });

    //Cliente;
    setClientQuery("");
    setClientsFound([]);
    setClientModalOpen(false);

    //  Dirección;
    setAddress({
      delivery_address: "",
      municipality_id: "",
      latitude: undefined,
      longitude: undefined,
      delivery_date: "",
      payment_method: "",
    });

    // UI;
    setConfirmStep("FORM");
    setConfirmOpen(false);
    setClientSectionOpen(true);
    // setProductsSectionOpen(true);
    // setSummarySectionOpen(true);
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

  /* ================= MUNICIPIOS ================= */

  useEffect(() => {
    api
      .get("/logistics/municipalities")
      .then((res) => setMunicipalities(res.data.municipalities))
      .catch(() => {});
  }, []);

  /* ================= BÚSQUEDA CLIENTE ================= */

  useEffect(() => {
    const t = setTimeout(async () => {
      if (clientQuery.trim().length < 3) {
        setClientsFound([]);
        return;
      }

      try {
        const res = await api.get("/clients/search", {
          params: { q: clientQuery.trim() },
        });
        setClientsFound(res.data);
      } catch {}
    }, 400);

    return () => clearTimeout(t);
  }, [clientQuery]);

  const selectClient = (client: any) => {
    setOrder((p) => ({
      ...p,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
    }));
    setClientsFound([]);
    setClientQuery("");
  };

  const clearClient = () =>
    setOrder((p) => ({
      ...p,
      clientId: undefined,
      clientName: "",
      clientPhone: "",
    }));

  const submitClient = async () => {
    const res = await api.post("/clients", clientForm);

    setOrder((p) => ({
      ...p,
      clientId: res.data.id,
      clientName: res.data.name,
      clientPhone: res.data.phone,
    }));

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

  const estimatedTotal = order.items.reduce((sum, item) => {
    const discount = item.discountPercent ?? 0;
    const finalPrice = item.sale_price * (1 - discount / 100);
    return sum + finalPrice * item.quantity;
  }, 0);

  /* ================= UI ================= */

  return (
    <Stack spacing={2} sx={{ p: { xs: 2, md: 4 } }}>
      {/* Volver */}
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

      {/* Limpiar */}
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
        {/* Barra lateral */}
        <Box sx={{ width: 6, bgcolor: "info.main" }} />

        {/* Contenido */}
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
                      onClick={() => selectClient(c)}
                    >
                      <Typography fontWeight="bold">{c.name}</Typography>
                      <Typography variant="body2">{c.phone}</Typography>
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
        {/* Barra lateral */}
        <Box sx={{ width: 6, bgcolor: "warning.main" }} />

        {/* Contenido */}
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
        {/* Barra lateral */}
        <Box sx={{ width: 6, bgcolor: "success.main" }} />

        {/* Contenido */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <ReceiptIcon color="success" />
            <Typography fontWeight="bold" variant="h6">
              Resumen
            </Typography>
          </Stack>

          {/* 🔵 NUEVO: Observaciones */}
          <TextField
            label="Observaciones"
            placeholder="Agregar detalles adicionales del pedido..."
            multiline
            minRows={3}
            fullWidth
            value={order.observations || ""}
            onChange={(e) =>
              setOrder((prev) => ({
                ...prev,
                observations: e.target.value,
              }))
            }
            disabled={!canEdit}
            sx={{
              mt: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
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
        municipalities={municipalities}
        order={order}
        estimatedTotal={estimatedTotal}
        onConfirm={confirmOrder}
      />
    </Stack>
  );
}
