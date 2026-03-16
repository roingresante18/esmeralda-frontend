import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PlaceIcon from "@mui/icons-material/Place";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { formatDateOnlyAR, formatDateTimeAR } from "../../utils/date";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// =====================
// Ícono Leaflet
// =====================
const gpsIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// =====================
// Tipos
// =====================
type Product = {
  id: number;
  description: string;
};

type OrderItem = {
  id: number;
  quantity: number;
  total_price: number;
  product: Product;
};

type Client = {
  id: number;
  name: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
};

type CreatedBy = {
  id?: number;
  full_name?: string;
  email?: string;
};

type Order = {
  id: number;
  status: string;
  total_amount: number;
  created_at: string;
  client: Client;
  createdBy?: CreatedBy | null;
  items: OrderItem[];
  delivery_date: string;
  municipality_snapshot: string;
  notes?: string;
};

// =====================
// Estados
// =====================
const STATUS: Record<string, { label: string; color: string }> = {
  QUOTATION: { label: "Cotización", color: "#9e9e9e" },
  CONFIRMED: { label: "Confirmado", color: "#1976d2" },
  PREPARING: { label: "En preparación", color: "#ed6c02" },
  PREPARED: { label: "Preparado", color: "#9c27b0" },
  QUALITY_CHECKED: { label: "Controlado", color: "#00897b" },
  ASSIGNED: { label: "Asignado", color: "#fbc02d" },
  IN_DELIVERY: { label: "En reparto", color: "#66bb6a" },
  DELIVERED: { label: "Entregado", color: "#2e7d32" },
  CANCELLED: { label: "Cancelado", color: "#960202" },
};

const allStatuses = Object.keys(STATUS);
const softBg = (hex: string) => hex + "20";

export default function OrdersDashboard() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // Usuario
  // ============================
  let user: { role?: string } | null = null;

  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {
    user = null;
  }

  const allowedRoles = ["ADMIN", "VENTAS", "CONTROL", "DEPOSITO", "LOGISTICA"];
  const canChangeStatus = !!user && allowedRoles.includes(user.role ?? "");

  // =====================
  // Filtros
  // =====================
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // =====================
  // Pedido expandido
  // =====================
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // =====================
  // Modal GPS
  // =====================
  const [gpsModal, setGpsModal] = useState<{
    open: boolean;
    clientName?: string;
    lat?: number;
    lng?: number;
  }>({ open: false });

  // =====================
  // Cargar pedidos
  // =====================
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const params: Record<string, string | number> = {};

        if (statusFilter) params.status = statusFilter;
        if (municipalityFilter) params.municipality = municipalityFilter;

        // Si se busca por cliente o por buscador global → traer históricos
        if (clientFilter.trim()) {
          params.client = clientFilter.trim();
        } else if (globalSearch.trim()) {
          params.q = globalSearch.trim();
        } else {
          // Por defecto, solo últimos 15 días
          params.lastDays = 15;
        }

        const res = await api.get("/orders", { params });
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOrders, 350);
    return () => clearTimeout(timer);
  }, [statusFilter, clientFilter, globalSearch, municipalityFilter]);

  // =====================
  // Opciones de municipalidad
  // =====================
  const municipalityOptions = useMemo(() => {
    return Array.from(
      new Set(orders.map((o) => o.municipality_snapshot).filter(Boolean)),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [orders]);

  // =====================
  // Filtrado local extra
  // Fecha reparto
  // =====================
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const byDate =
        !dateFilter ||
        (o.delivery_date && o.delivery_date.startsWith(dateFilter));

      return byDate;
    });
  }, [orders, dateFilter]);

  // =====================
  // Métricas
  // =====================
  const summary = useMemo(() => {
    const total = filteredOrders.length;
    const quotations = filteredOrders.filter(
      (o) => o.status === "QUOTATION",
    ).length;
    const confirmed = filteredOrders.filter(
      (o) => o.status === "CONFIRMED",
    ).length;
    const delivered = filteredOrders.filter(
      (o) => o.status === "DELIVERED",
    ).length;
    // const totalAmount = filteredOrders.reduce(
    //   (acc, o) => acc + Number(o.total_amount || 0),
    //   0,
    // );

    return {
      total,
      quotations,
      confirmed,
      delivered,
      //  totalAmount
    };
  }, [filteredOrders]);

  // =====================
  // Cambio de estado
  // =====================
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    orderId?: number;
    newStatus?: string;
  }>({ open: false });

  const [errorModal, setErrorModal] = useState<{
    open: boolean;
    message?: string;
  }>({ open: false });

  const changeStatus = (id: number, newStatus: string) => {
    setConfirmModal({ open: true, orderId: id, newStatus });
  };

  const confirmChangeStatus = async () => {
    if (!confirmModal.orderId || !confirmModal.newStatus) return;

    try {
      await api.patch(`/orders/${confirmModal.orderId}/status`, {
        new_status: confirmModal.newStatus,
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === confirmModal.orderId
            ? { ...o, status: confirmModal.newStatus! }
            : o,
        ),
      );

      setConfirmModal({ open: false });
    } catch (err) {
      console.error(err);

      setConfirmModal({ open: false });

      setErrorModal({
        open: true,
        message: "No se pudo cambiar el estado del pedido",
      });
    }
  };

  // =====================
  // Loading
  // =====================
  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Cargando pedidos...</Typography>
      </Box>
    );
  }

  return (
    <Box p={4} bgcolor="#f4f6f8" minHeight="100vh">
      {/* ENCABEZADO */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <AssignmentIcon color="primary" fontSize="large" />
        <Typography variant="h4" fontWeight="bold">
          Gestión de Pedidos
        </Typography>

        <Button
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            borderRadius: 50,
            zIndex: 1300,
          }}
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </Stack>

      {/* RESUMEN */}
      <Paper sx={{ p: 2.5, mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          useFlexGap
          flexWrap="wrap"
        >
          <Chip label={`Pedidos visibles: ${summary.total}`} color="default" />
          <Chip label={`Cotizaciones: ${summary.quotations}`} color="default" />
          <Chip label={`Confirmados: ${summary.confirmed}`} color="info" />
          <Chip label={`Entregados: ${summary.delivered}`} color="success" />
          {/* <Chip
            label={`Facturación visible: $${summary.totalAmount.toLocaleString()}`}
            color="primary"
          /> */}
          <Chip
            label={
              clientFilter || globalSearch
                ? "Modo búsqueda histórica"
                : "Últimos 15 días"
            }
            variant="outlined"
          />
        </Stack>
      </Paper>

      {/* FILTROS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Buscador general"
            placeholder="Pedido, cliente, teléfono, localidad, observación, usuario"
            fullWidth
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />

          <TextField
            label="Cliente"
            placeholder="Buscar cliente y traer todo su historial"
            fullWidth
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          />

          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {allStatuses.map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS[s].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Municipalidad</InputLabel>
            <Select
              label="Municipalidad"
              value={municipalityFilter}
              onChange={(e) => setMunicipalityFilter(e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {municipalityOptions.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Fecha reparto"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </Stack>

        {/* FILTROS RÁPIDOS */}
        <Stack direction="row" spacing={1} mt={2} useFlexGap flexWrap="wrap">
          <Chip
            label="Todos"
            clickable
            color={!statusFilter ? "primary" : "default"}
            onClick={() => setStatusFilter("")}
          />
          {allStatuses.map((s) => (
            <Chip
              key={s}
              label={STATUS[s].label}
              clickable
              onClick={() => setStatusFilter(s)}
              sx={{
                backgroundColor:
                  statusFilter === s ? STATUS[s].color : undefined,
                color: statusFilter === s ? "white" : undefined,
              }}
            />
          ))}

          <Chip
            label="Limpiar filtros"
            clickable
            variant="outlined"
            onClick={() => {
              setStatusFilter("");
              setClientFilter("");
              setGlobalSearch("");
              setMunicipalityFilter("");
              setDateFilter("");
            }}
          />
        </Stack>
      </Paper>

      {/* LISTADO */}
      <Stack spacing={2}>
        {filteredOrders.map((order) => {
          const color = STATUS[order.status]?.color || "#9e9e9e";
          const hasGps =
            order.client?.latitude != null && order.client?.longitude != null;

          return (
            <Accordion
              key={order.id}
              expanded={expandedId === order.id}
              onChange={() => handleToggle(order.id)}
              sx={{
                borderLeft: `8px solid ${color}`,
                backgroundColor: softBg(color),
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  spacing={2}
                >
                  <Stack spacing={0.6}>
                    <Typography variant="h6" fontWeight="bold">
                      Pedido #{order.id}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">
                        {order.client?.name || "Sin cliente"} /{" "}
                        {order.client?.phone || "Sin celular"} /{" "}
                        {order.municipality_snapshot || "Sin Municipalidad"}
                      </Typography>

                      {hasGps && (
                        <Tooltip title="Ver ubicación del cliente">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGpsModal({
                                open: true,
                                clientName: order.client.name,
                                lat: Number(order.client.latitude),
                                lng: Number(order.client.longitude),
                              });
                            }}
                          >
                            <MyLocationIcon color="success" fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                      Creado por:{" "}
                      {order.createdBy?.full_name ||
                        order.createdBy?.email ||
                        "Sin usuario"}
                    </Typography>
                  </Stack>

                  {canChangeStatus ? (
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={order.status}
                        onChange={(e) => changeStatus(order.id, e.target.value)}
                      >
                        {allStatuses.map((s) => (
                          <MenuItem key={s} value={s}>
                            {STATUS[s].label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Chip
                      label={STATUS[order.status]?.label}
                      sx={{
                        backgroundColor: color,
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  )}
                </Stack>
              </AccordionSummary>

              <AccordionDetails>
                {order.notes?.trim() && (
                  <>
                    <Paper
                      sx={{
                        p: 1.5,
                        mb: 2,
                        backgroundColor: "#fff3e0",
                        borderLeft: "4px solid #ed6c02",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        Observaciones: {order.notes}
                      </Typography>
                    </Paper>
                  </>
                )}

                <Stack spacing={1}>
                  {order.items?.length ? (
                    order.items.map((item) => (
                      <Stack
                        key={item.id}
                        direction="row"
                        justifyContent="space-between"
                      >
                        <Typography variant="body2">
                          {item.product?.description} × {item.quantity}
                        </Typography>

                        <Typography fontWeight="medium">
                          ${Number(item.total_price).toLocaleString()}
                        </Typography>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2">Sin items</Typography>
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", md: "center" }}
                  spacing={1}
                >
                  <Typography fontWeight="bold" fontSize={18}>
                    Total: ${Number(order.total_amount).toLocaleString()}
                  </Typography>

                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarTodayIcon fontSize="small" />
                    <Typography variant="body2">
                      Creación: {formatDateTimeAR(order.created_at)} hs
                      <br />
                      Reparto:{" "}
                      {order.delivery_date
                        ? formatDateOnlyAR(order.delivery_date)
                        : "Sin fecha"}
                    </Typography>
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}

        {!filteredOrders.length && <Typography>No hay pedidos.</Typography>}
      </Stack>

      {/* MODAL GPS */}
      <Dialog
        open={gpsModal.open}
        onClose={() => setGpsModal({ open: false })}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Ubicación del cliente{" "}
          {gpsModal.clientName ? `- ${gpsModal.clientName}` : ""}
        </DialogTitle>

        <DialogContent>
          {gpsModal.lat != null && gpsModal.lng != null && (
            <Box sx={{ height: 450, width: "100%", mt: 1 }}>
              <MapContainer
                center={[gpsModal.lat, gpsModal.lng]}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="© OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                  position={[gpsModal.lat, gpsModal.lng]}
                  icon={gpsIcon}
                />
              </MapContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setGpsModal({ open: false })}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL CONFIRMAR ESTADO */}
      <Dialog
        open={confirmModal.open}
        onClose={() => setConfirmModal({ open: false })}
      >
        <DialogTitle>Confirmar cambio de estado</DialogTitle>
        <DialogContent>
          ¿Desea cambiar el estado a <b>{confirmModal.newStatus}</b>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmModal({ open: false })}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={confirmChangeStatus}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL ERROR */}
      <Dialog
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false })}
      >
        <DialogTitle>Error</DialogTitle>
        <DialogContent>{errorModal.message}</DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => setErrorModal({ open: false })}
          >
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
