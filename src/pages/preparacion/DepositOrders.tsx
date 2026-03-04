import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  type GridColDef,
  type GridRowSelectionModel,
} from "@mui/x-data-grid";
import {
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Chip,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
  Container,
} from "@mui/material";
import {
  formatDateAR,
  isToday,
  isOnOrAfter,
  isOnOrBefore,
} from "../../utils/dateUtils";
import api from "../../api/api";
import OrderDepositPDF from "./OrderDepositPDF";
import { PDFViewer, pdf, Document } from "@react-pdf/renderer";
import MobileOrdersList from "./MobileOrdersList";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

/* ============================================================
   TYPES
============================================================ */

interface Product {
  description: string;
}

interface OrderItem {
  quantity: number;
  product: Product;
}

interface Order {
  id: number;
  status: "CONFIRMED" | "PREPARING" | "PREPARED" | string;
  client: {
    name: string;

    phone: string;
    address: string;
  };
  items: OrderItem[];
  created_at: string;
  delivery_date: string;
  observations?: string;
  municipality_snapshot: string;
}
/* ============================================================
   DATE HELPERS EXTRA
============================================================ */

const isTomorrow = (dateString: string) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const d = new Date(dateString);

  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
};

const isPastDate = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d = new Date(dateString);
  d.setHours(0, 0, 0, 0);

  return d < today;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function DepositOrders() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  // 👤 Usuario logueado
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  /* =======================
     STATE
  ======================= */

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);

  /* ============================================================
     FETCH ORDERS
  ============================================================ */

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders?last_2_weeks=true");

      const newOrders: Order[] = res.data.sort((a: Order, b: Order) => {
        const deliveryDiff =
          new Date(a.delivery_date).getTime() -
          new Date(b.delivery_date).getTime();

        if (deliveryDiff !== 0) return deliveryDiff;

        // Si tienen misma fecha de entrega,
        // el más nuevo arriba
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      // 🔔 Detecta nuevos pedidos
      if (previousOrdersRef.current.length > 0) {
        const previousIds = previousOrdersRef.current.map((o) => o.id);

        const addedOrders = newOrders.filter(
          (o) => !previousIds.includes(o.id),
        );

        if (addedOrders.length > 0 && audioRef.current) {
          audioRef.current.currentTime = 0; // reinicia sonido
          audioRef.current.play().catch(() => {
            console.log("Audio bloqueado por el navegador");
          });
        }
      }

      previousOrdersRef.current = newOrders;
      setOrders(newOrders);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const enableAudio = () => {
      const audio = audioRef.current;
      if (!audio) return;

      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => {});
    };

    window.addEventListener("click", enableAudio, { once: true });

    return () => {
      window.removeEventListener("click", enableAudio);
    };
  }, []);
  /* ============================================================
     FILTER - Solo estados del depósito
  ============================================================ */

  useEffect(() => {
    const allowedStatuses = ["CONFIRMED", "PREPARING", "PREPARED"];

    let filtered = orders.filter((o) => allowedStatuses.includes(o.status));

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }

    if (filterDateFrom) {
      filtered = filtered.filter((o) =>
        isOnOrAfter(o.delivery_date, filterDateFrom),
      );
    }

    if (filterDateTo) {
      filtered = filtered.filter((o) =>
        isOnOrBefore(o.delivery_date, filterDateTo),
      );
    }

    setFilteredOrders(filtered);
  }, [orders, filterStatus, filterDateFrom, filterDateTo]);

  /* ============================================================
     STATUS HANDLERS
  ============================================================ */

  const handleSetPreparing = async (id: number) => {
    await api.patch(`/orders/${id}/status`, {
      new_status: "PREPARING",
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "PREPARING" } : o)),
    );
  };

  const handleMarkPrepared = async (id: number) => {
    await api.patch(`/orders/${id}/status`, {
      new_status: "PREPARED",
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "PREPARED" } : o)),
    );
  };

  /* ============================================================
     GENERAR PDF
  ============================================================ */

  const generatePDF = async () => {
    if (selectionModel.ids.size === 0 || isPrinting) return;

    setIsPrinting(true);

    const ordersToPrint = orders.filter((o) => selectionModel.ids.has(o.id));

    const doc = (
      <Document>
        {ordersToPrint.map((order) => (
          <OrderDepositPDF key={order.id} order={order} />
        ))}
      </Document>
    );

    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const win = window.open(url);
    win?.print();

    // 🔄 Cambio automático a PREPARING
    for (const order of ordersToPrint) {
      if (order.status === "CONFIRMED") {
        await handleSetPreparing(order.id);
      }
    }

    setPdfOpen(false);
    setSelectionModel({ type: "include", ids: new Set() });
    setIsPrinting(false);
  };

  /* ============================================================
     BADGE ESTADO
  ============================================================ */

  const getStatusChip = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Chip label="Confirmado" color="info" size="small" />;
      case "PREPARING":
        return <Chip label="Preparando" color="warning" size="small" />;
      case "PREPARED":
        return <Chip label="Preparado" color="success" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  /* ============================================================
     COLUMNS
  ============================================================ */
  const ARG_TIMEZONE = "America/Argentina/Buenos_Aires";

  const columns: GridColDef<Order>[] = useMemo(
    () => [
      { field: "id", headerName: "Pedido", flex: 0.4 },

      {
        field: "client",
        headerName: "Cliente",
        flex: 1,
        valueGetter: (_v, row) => row.client.name,
      },

      {
        field: "status",
        headerName: "Estado",
        flex: 0.8,
        renderCell: (params) => getStatusChip(params.row.status),
      },

      {
        field: "delivery_date",
        headerName: "Fecha entrega",
        flex: 1.2,
        renderCell: (params) => {
          const rawDate = params.row.delivery_date;
          if (!rawDate) return "Sin fecha";

          // 🔥 CLAVE: parseISO evita el bug de UTC
          const parsedDate = parseISO(rawDate);

          // Convertimos a horario Argentina
          const zonedTarget = toZonedTime(parsedDate, ARG_TIMEZONE);
          const zonedNow = toZonedTime(new Date(), ARG_TIMEZONE);

          // Normalizamos a solo fecha
          const normalize = (d: Date) =>
            new Date(d.getFullYear(), d.getMonth(), d.getDate());

          const today = normalize(zonedNow);
          const target = normalize(zonedTarget);

          const diffTime = target.getTime() - today.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          const isPast = diffDays < 0;
          const isToday = diffDays === 0;
          const isTomorrow = diffDays === 1;
          const isDayAfterTomorrow = diffDays === 2;

          // 🔥 Formato en español
          const formattedDate = format(zonedTarget, "EEEE dd/MM/yyyy", {
            locale: es,
          });

          const finalDate =
            formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

          let color: "inherit" | "error" | "warning" = "inherit";
          let fontWeight: "normal" | "bold" = "normal";

          if (isPast || isToday) {
            color = "error";
            fontWeight = "bold";
          } else if (isTomorrow) {
            color = "error";
          } else if (isDayAfterTomorrow) {
            color = "warning";
          }

          return (
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography fontWeight={fontWeight} color={color}>
                {finalDate}
              </Typography>

              {(isPast || isToday) && (
                <Chip label="VENCIDO" color="error" size="small" />
              )}

              {isTomorrow && <Chip label="MAÑANA" color="error" size="small" />}

              {isDayAfterTomorrow && (
                <Chip label="PASADO MAÑANA" color="warning" size="small" />
              )}
            </Stack>
          );
        },
      },

      {
        field: "actions",
        headerName: "Acciones",
        flex: 1.2,

        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const order = params.row;

          return (
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={1}
              width="100%"
            >
              <Button
                size="small"
                fullWidth={isMobile}
                variant="outlined"
                onClick={() => setSelectedOrder(order)}
              >
                Ver
              </Button>

              {order.status === "CONFIRMED" && (
                <Button
                  size="small"
                  fullWidth={isMobile}
                  variant="contained"
                  disabled={isPrinting}
                  onClick={() => {
                    setSelectionModel({
                      type: "include",
                      ids: new Set([order.id]),
                    });
                    setPdfOpen(true);
                  }}
                >
                  Imprimir
                </Button>
              )}

              {order.status === "PREPARING" && (
                <Button
                  size="small"
                  fullWidth={isMobile}
                  color="success"
                  variant="contained"
                  onClick={() => handleMarkPrepared(order.id)}
                >
                  Marcar preparado
                </Button>
              )}
            </Stack>
          );
        },
      },
    ],
    [isMobile, isPrinting],
  );

  /* ============================================================
     TOTALES
  ============================================================ */

  const totalConfirmed = filteredOrders.filter(
    (o) => o.status === "CONFIRMED",
  ).length;

  const totalPreparing = filteredOrders.filter(
    (o) => o.status === "PREPARING",
  ).length;

  const totalPrepared = filteredOrders.filter(
    (o) => o.status === "PREPARED",
  ).length;

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* HEADER RESPONSIVE */}
      <>
        <Stack
          direction={isMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isMobile ? "flex-start" : "center"}
          spacing={2}
          mb={3}
        >
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Depósito
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Usuario: {loggedUser?.full_name || "Usuario"}
            </Typography>
          </Box>
          {/* 🔙 BOTÓN VOLVER */}
          <Button variant="outlined" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
        </Stack>

        {/* FILTROS */}
        <Stack direction={isMobile ? "column" : "row"} spacing={2} mb={2}>
          <TextField
            select
            size="small"
            fullWidth
            label="Estado"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            SelectProps={{ native: true }}
          >
            <option value="ALL">Todos</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="PREPARING">Preparando</option>
            <option value="PREPARED">Preparado</option>
          </TextField>

          <TextField
            type="date"
            size="small"
            fullWidth
            label="Inicio reparto"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            type="date"
            size="small"
            fullWidth
            label="Fin reparto"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        <Typography mb={1}>
          Confirmados: {totalConfirmed} | Preparando: {totalPreparing} |
          Preparados: {totalPrepared}
        </Typography>

        {/* TABLA */}
        <Box
          sx={{
            width: "100%",
            height: { xs: "auto", md: 500 }, // auto en mobile
          }}
        >
          {isMobile ? (
            <MobileOrdersList
              orders={filteredOrders}
              isPrinting={isPrinting}
              onView={(order) => setSelectedOrder(order)}
              onPrint={(order) => {
                setSelectionModel({
                  type: "include",
                  ids: new Set([order.id]),
                });
                setPdfOpen(true);
              }}
              onMarkPrepared={handleMarkPrepared}
            />
          ) : (
            <DataGrid
              rows={filteredOrders}
              columns={columns}
              getRowId={(r) => r.id}
              pageSizeOptions={[5, 10, 20]}
              disableRowSelectionOnClick
              autoHeight={isMobile} // 🔥 clave para mobile
              rowHeight={isMobile ? 80 : 52} // 🔥 filas más altas en mobile
              columnHeaderHeight={isMobile ? 60 : 56}
              sx={{
                fontSize: { xs: "0.75rem", md: "0.875rem" },

                // 🎨 Colores por estado
                "& .row-confirmed": { backgroundColor: "#e3f2fd" },
                "& .row-preparing": { backgroundColor: "#fff3e0" },
                "& .row-prepared": { backgroundColor: "#e8f5e9" },

                // 🔥 Permitir que el texto haga wrap
                "& .MuiDataGrid-cell": {
                  whiteSpace: "normal",
                  lineHeight: "1.3rem",
                  py: 1,
                },

                // Header más legible
                "& .MuiDataGrid-columnHeaders": {
                  fontWeight: "bold",
                },

                // Mejor padding en mobile
                "& .MuiDataGrid-cellContent": {
                  overflow: "visible",
                  textOverflow: "unset",
                },
              }}
              getRowClassName={(params) =>
                `row-${params.row.status.toLowerCase()}`
              }
            />
          )}
        </Box>

        {/* MODAL VER PEDIDO - RESPONSIVE */}
        <Dialog
          open={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          fullWidth
          maxWidth="sm"
          fullScreen={fullScreen}
        >
          <DialogTitle>Pedido #{selectedOrder?.id}</DialogTitle>

          <DialogContent dividers>
            <Typography fontWeight="bold">
              Cliente: {selectedOrder?.client.name}
            </Typography>

            <Typography mt={2} fontWeight="bold">
              Productos:
            </Typography>

            <Divider sx={{ my: 1 }} />

            <Stack spacing={1}>
              {selectedOrder?.items.map((item, index) => (
                <Box key={index} display="flex" justifyContent="space-between">
                  <Typography>{item.product.description}</Typography>
                  <Typography fontWeight="bold">x{item.quantity}</Typography>
                </Box>
              ))}
            </Stack>
            <Typography mt={2} fontWeight="bold">
              Observaciones: {selectedOrder?.observations}
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setSelectedOrder(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>

        {/* MODAL PDF */}
        <Dialog
          open={pdfOpen}
          onClose={() => setPdfOpen(false)}
          fullWidth
          maxWidth="md"
          fullScreen={fullScreen}
        >
          <DialogTitle>Imprimir pedido</DialogTitle>

          <DialogContent sx={{ height: 500 }}>
            <PDFViewer width="100%" height="100%">
              <Document>
                {orders
                  .filter((o) => selectionModel.ids.has(o.id))
                  .map((order) => (
                    <OrderDepositPDF key={order.id} order={order} />
                  ))}
              </Document>
            </PDFViewer>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setPdfOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              color="success"
              disabled={isPrinting}
              onClick={generatePDF}
            >
              Imprimir y comenzar preparación
            </Button>
          </DialogActions>
        </Dialog>

        <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />

        {/* 🎨 COLORES DE FILAS */}
        <style>
          {`
          .row-confirmed {
            background-color: #e3f2fd;
          }
          .row-preparing {
            background-color: #fff3e0;
          }
          .row-prepared {
            background-color: #e8f5e9;
          }
        `}
        </style>
      </>
      <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />{" "}
    </Container>
  );
}
