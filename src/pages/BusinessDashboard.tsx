import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Alert,
  Divider,
  alpha,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentsIcon from "@mui/icons-material/Payments";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import RouteIcon from "@mui/icons-material/Route";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import InsightsIcon from "@mui/icons-material/Insights";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import PlaceIcon from "@mui/icons-material/Place";
import Groups2Icon from "@mui/icons-material/Groups2";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* ============================================================
   TYPES
============================================================ */

type GroupBy = "day" | "week" | "month" | "quarter";

type OverviewResponse = {
  totalOrders: number;
  quotations: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  grossAmount: number;
  averageTicket: number;
  paymentsTotal: number;
  cashTotal: number;
  transferTotal: number;
  confirmationRate: number;
};

type SalesSeriesResponse = {
  groupBy: GroupBy;
  createdSeries: {
    bucket: string;
    ordersCreated: number;
    createdAmount: number;
  }[];
  confirmedSeries: {
    bucket: string;
    ordersConfirmed: number;
  }[];
  deliveredSeries: {
    bucket: string;
    ordersDelivered: number;
    deliveredAmount: number;
  }[];
  paymentSeries: {
    bucket: string;
    paymentsAmount: number;
  }[];
};

type SellerRow = {
  userId: number;
  fullName: string;
  email: string;
  ordersCreated: number;
  quotations: number;
  confirmed: number;
  delivered: number;
  grossAmount: number;
  confirmationRate: number;
};

type PaymentsResponse = {
  overview: {
    total: number;
    cashTotal: number;
    transferTotal: number;
    advanceTotal: number;
    deliveryTotal: number;
  };
  byMethod: {
    method: string;
    amount: number;
    count: number;
  }[];
  byType: {
    type: string;
    amount: number;
    count: number;
  }[];
};

type TopProductRow = {
  productId: number;
  productName: string;
  quantitySold: number;
  revenue: number;
  ordersCount: number;
};

type TerritoryResponse = {
  byMunicipality: {
    municipality: string;
    ordersCount: number;
    amount: number;
    averageTicket: number;
  }[];
  byZone: {
    zone: string;
    ordersCount: number;
    amount: number;
    averageTicket: number;
  }[];
};

type FunnelResponse = {
  created: number;
  confirmed: number;
  preparingOrMore: number;
  preparedOrMore: number;
  checkedOrMore: number;
  assignedOrMore: number;
  inDeliveryOrMore: number;
  delivered: number;
  cancelled: number;
};

type TeamResponse = {
  deposito: {
    userId: number;
    fullName: string;
    email: string;
    startedPreparing: number;
    prepared: number;
  }[];
  control: {
    userId: number;
    fullName: string;
    email: string;
    checkedCount: number;
  }[];
  logistica: {
    userId: number;
    fullName: string;
    email: string;
    assignedCount: number;
  }[];
  reparto: {
    userId: number;
    fullName: string;
    email: string;
    assignedDeliveries: number;
    deliveredCount: number;
  }[];
};

type TopProductsByTerritoryResponse = {
  byMunicipality: {
    territory: string;
    products: {
      productId: number;
      productName: string;
      quantitySold: number;
      revenue: number;
    }[];
  }[];
  byZone: {
    territory: string;
    products: {
      productId: number;
      productName: string;
      quantitySold: number;
      revenue: number;
    }[];
  }[];
};

/* ============================================================
   HELPERS
============================================================ */

const money = (value: number) =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const tooltipMoneyFormatter = (value: unknown) => money(Number(value ?? 0));

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#9333ea",
  "#ef4444",
  "#0891b2",
  "#6d28d9",
  "#0f766e",
];

const surfaceSx = {
  borderRadius: 4,
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
  backgroundImage: "none",
};

const chartPaperSx = {
  ...surfaceSx,
  p: { xs: 2, md: 2.5 },
  height: { xs: 340, md: 380 },
};

const listCardSx = {
  p: 1.5,
  borderRadius: 3,
  bgcolor: "#fff",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/* ============================================================
   REUSABLE UI
============================================================ */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="center"
      mb={2}
      sx={{ minWidth: 0 }}
    >
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          bgcolor: alpha("#2563eb", 0.08),
          color: "#2563eb",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={800} sx={{ lineHeight: 1.2 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  color = "#2563eb",
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Paper
      sx={{
        ...surfaceSx,
        p: 2.2,
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: `linear-gradient(90deg, ${color} 0%, ${alpha(
            color,
            0.4,
          )} 100%)`,
        }}
      />

      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="start"
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600 }}
          >
            {title}
          </Typography>

          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(color, 0.1),
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>

        <Typography
          sx={{
            fontSize: { xs: 24, md: 28 },
            fontWeight: 800,
            lineHeight: 1.1,
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}

function ChartContainer({
  title,
  subtitle,
  icon,
  children,
  height = "88%",
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  height?: string | number;
}) {
  return (
    <Paper sx={chartPaperSx}>
      <SectionHeader icon={icon} title={title} subtitle={subtitle} />
      <Box sx={{ height }}>{children}</Box>
    </Paper>
  );
}

function EmptyState({ text = "Sin datos." }: { text?: string }) {
  return (
    <Typography color="text.secondary" sx={{ py: 1 }}>
      {text}
    </Typography>
  );
}

function PersonMetricCard({
  name,
  email,
  chips,
}: {
  name: string;
  email?: string;
  chips: React.ReactNode;
}) {
  return (
    <Box sx={listCardSx}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Stack direction="row" spacing={1.2} alignItems="center" minWidth={0}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: alpha("#2563eb", 0.1),
              color: "#2563eb",
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {getInitials(name || email || "U")}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>
              {name}
            </Typography>
            {email && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {email}
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {chips}
        </Stack>
      </Stack>
    </Box>
  );
}

function TerritoryGroupCard({
  territory,
  color,
  products,
}: {
  territory: string;
  color: "primary" | "secondary";
  products: {
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#fff",
      }}
    >
      <Typography fontWeight={800} color={`${color}.main`} mb={1.5}>
        {territory}
      </Typography>

      <Stack spacing={1}>
        {products.map((product) => (
          <Box
            key={product.productId}
            sx={{
              px: 1.25,
              py: 1.1,
              borderRadius: 2.5,
              bgcolor: "#f8fafc",
              border: "1px solid",
              borderColor: "#e5e7eb",
            }}
          >
            <Typography fontWeight={600}>{product.productName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Cantidad: {product.quantitySold} · Facturación:{" "}
              {money(product.revenue)}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

/* ============================================================
   COMPONENT
============================================================ */

export default function BusinessDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FILTROS ================= */
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("month");
  const [municipality, setMunicipality] = useState("");
  const [zone, setZone] = useState("");
  const [sellerId, setSellerId] = useState("");

  /* ================= DATA ================= */
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [salesSeries, setSalesSeries] = useState<SalesSeriesResponse | null>(
    null,
  );
  const [bySeller, setBySeller] = useState<SellerRow[]>([]);
  const [payments, setPayments] = useState<PaymentsResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductRow[]>([]);
  const [territory, setTerritory] = useState<TerritoryResponse | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [teamData, setTeamData] = useState<TeamResponse | null>(null);
  const [topProductsByTerritory, setTopProductsByTerritory] =
    useState<TopProductsByTerritoryResponse | null>(null);

  /* ============================================================
     FETCH
  ============================================================ */

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, string> = {};

      if (from) params.from = from;
      if (to) params.to = to;
      if (groupBy) params.groupBy = groupBy;
      if (municipality.trim()) params.municipality = municipality.trim();
      if (zone.trim()) params.zone = zone.trim();
      if (sellerId) params.sellerId = sellerId;

      const [
        overviewRes,
        salesSeriesRes,
        bySellerRes,
        paymentsRes,
        topProductsRes,
        territoryRes,
        funnelRes,
        teamRes,
        topProductsByTerritoryRes,
      ] = await Promise.all([
        api.get("/analytics/overview", { params }),
        api.get("/analytics/sales-series", { params }),
        api.get("/analytics/by-seller", { params }),
        api.get("/analytics/payments", { params }),
        api.get("/analytics/top-products", { params }),
        api.get("/analytics/by-territory", { params }),
        api.get("/analytics/funnel", { params }),
        api.get("/analytics/by-team", { params }),
        api.get("/analytics/top-products-by-territory", { params }),
      ]);

      setOverview(overviewRes.data);
      setSalesSeries(salesSeriesRes.data);
      setBySeller(bySellerRes.data);
      setPayments(paymentsRes.data);
      setTopProducts(topProductsRes.data);
      setTerritory(territoryRes.data);
      setFunnel(funnelRes.data);
      setTeamData(teamRes.data);
      setTopProductsByTerritory(topProductsByTerritoryRes.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las métricas del negocio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  /* ============================================================
     EXPORTS
  ============================================================ */

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    if (overview) {
      const wsOverview = XLSX.utils.json_to_sheet([overview]);
      XLSX.utils.book_append_sheet(wb, wsOverview, "Resumen");
    }

    if (bySeller.length > 0) {
      const wsSellers = XLSX.utils.json_to_sheet(bySeller);
      XLSX.utils.book_append_sheet(wb, wsSellers, "Vendedores");
    }

    if (topProducts.length > 0) {
      const wsProducts = XLSX.utils.json_to_sheet(topProducts);
      XLSX.utils.book_append_sheet(wb, wsProducts, "Top_Productos");
    }

    if (territory?.byMunicipality?.length) {
      const wsMunicipality = XLSX.utils.json_to_sheet(territory.byMunicipality);
      XLSX.utils.book_append_sheet(wb, wsMunicipality, "Municipios");
    }

    if (territory?.byZone?.length) {
      const wsZone = XLSX.utils.json_to_sheet(territory.byZone);
      XLSX.utils.book_append_sheet(wb, wsZone, "Zonas");
    }

    if (teamData?.deposito?.length) {
      const wsDeposito = XLSX.utils.json_to_sheet(teamData.deposito);
      XLSX.utils.book_append_sheet(wb, wsDeposito, "Deposito");
    }

    if (teamData?.control?.length) {
      const wsControl = XLSX.utils.json_to_sheet(teamData.control);
      XLSX.utils.book_append_sheet(wb, wsControl, "Control");
    }

    if (teamData?.logistica?.length) {
      const wsLogistica = XLSX.utils.json_to_sheet(teamData.logistica);
      XLSX.utils.book_append_sheet(wb, wsLogistica, "Logistica");
    }

    if (teamData?.reparto?.length) {
      const wsReparto = XLSX.utils.json_to_sheet(teamData.reparto);
      XLSX.utils.book_append_sheet(wb, wsReparto, "Reparto");
    }

    if (topProductsByTerritory?.byMunicipality?.length) {
      const flatMunicipality = topProductsByTerritory.byMunicipality.flatMap(
        (group) =>
          group.products.map((product) => ({
            territory: group.territory,
            ...product,
          })),
      );
      const ws = XLSX.utils.json_to_sheet(flatMunicipality);
      XLSX.utils.book_append_sheet(wb, ws, "Prod_x_Municipio");
    }

    if (topProductsByTerritory?.byZone?.length) {
      const flatZone = topProductsByTerritory.byZone.flatMap((group) =>
        group.products.map((product) => ({
          territory: group.territory,
          ...product,
        })),
      );
      const ws = XLSX.utils.json_to_sheet(flatZone);
      XLSX.utils.book_append_sheet(wb, ws, "Prod_x_Zona");
    }

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(
      blob,
      `dashboard_negocio_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const exportToPdf = async () => {
    const element = document.getElementById("business-dashboard-export");
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#f5f7fb",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 5;

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`dashboard_negocio_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  /* ============================================================
     DATA ADAPTADA PARA CHARTS
  ============================================================ */

  const mergedSeries = useMemo(() => {
    if (!salesSeries) return [];

    const map = new Map<
      string,
      {
        bucket: string;
        ordersCreated: number;
        ordersConfirmed: number;
        ordersDelivered: number;
        createdAmount: number;
        deliveredAmount: number;
        paymentsAmount: number;
      }
    >();

    for (const row of salesSeries.createdSeries) {
      map.set(row.bucket, {
        bucket: row.bucket,
        ordersCreated: row.ordersCreated,
        ordersConfirmed: 0,
        ordersDelivered: 0,
        createdAmount: row.createdAmount,
        deliveredAmount: 0,
        paymentsAmount: 0,
      });
    }

    for (const row of salesSeries.confirmedSeries) {
      const current = map.get(row.bucket) || {
        bucket: row.bucket,
        ordersCreated: 0,
        ordersConfirmed: 0,
        ordersDelivered: 0,
        createdAmount: 0,
        deliveredAmount: 0,
        paymentsAmount: 0,
      };
      current.ordersConfirmed = row.ordersConfirmed;
      map.set(row.bucket, current);
    }

    for (const row of salesSeries.deliveredSeries) {
      const current = map.get(row.bucket) || {
        bucket: row.bucket,
        ordersCreated: 0,
        ordersConfirmed: 0,
        ordersDelivered: 0,
        createdAmount: 0,
        deliveredAmount: 0,
        paymentsAmount: 0,
      };
      current.ordersDelivered = row.ordersDelivered;
      current.deliveredAmount = row.deliveredAmount;
      map.set(row.bucket, current);
    }

    for (const row of salesSeries.paymentSeries) {
      const current = map.get(row.bucket) || {
        bucket: row.bucket,
        ordersCreated: 0,
        ordersConfirmed: 0,
        ordersDelivered: 0,
        createdAmount: 0,
        deliveredAmount: 0,
        paymentsAmount: 0,
      };
      current.paymentsAmount = row.paymentsAmount;
      map.set(row.bucket, current);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.bucket.localeCompare(b.bucket),
    );
  }, [salesSeries]);

  const paymentMethodChart = useMemo(() => {
    return payments?.byMethod || [];
  }, [payments]);

  const sellerChart = useMemo(() => {
    return bySeller.slice(0, 10).map((row) => ({
      name: row.fullName || row.email,
      facturacion: row.grossAmount,
      confirmados: row.confirmed,
      entregados: row.delivered,
    }));
  }, [bySeller]);

  const topProductsChart = useMemo(() => {
    return topProducts.map((row) => ({
      name:
        row.productName.length > 22
          ? row.productName.slice(0, 22) + "..."
          : row.productName,
      quantity: row.quantitySold,
      revenue: row.revenue,
    }));
  }, [topProducts]);

  const municipalityChart = useMemo(() => {
    return territory?.byMunicipality.slice(0, 10) || [];
  }, [territory]);

  const funnelChart = useMemo(() => {
    if (!funnel) return [];

    return [
      { name: "Creados", value: funnel.created },
      { name: "Confirmados", value: funnel.confirmed },
      { name: "En preparación o más", value: funnel.preparingOrMore },
      { name: "Preparados o más", value: funnel.preparedOrMore },
      { name: "Controlados o más", value: funnel.checkedOrMore },
      { name: "Asignados o más", value: funnel.assignedOrMore },
      { name: "En reparto o más", value: funnel.inDeliveryOrMore },
      { name: "Entregados", value: funnel.delivered },
      { name: "Cancelados", value: funnel.cancelled },
    ];
  }, [funnel]);

  /* ============================================================
     UI
  ============================================================ */

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f5f7fb",
          p: 3,
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">
            Cargando dashboard de negocio...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      id="business-dashboard-export"
      sx={{
        minHeight: "100vh",
        bgcolor:
          "linear-gradient(180deg, #f8fbff 0%, #f5f7fb 35%, #f8fafc 100%)",
        backgroundColor: "#f5f7fb",
        px: { xs: 1.5, sm: 2, md: 3, lg: 4 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ maxWidth: 1600, mx: "auto" }}>
        {/* HEADER */}
        <Paper
          sx={{
            ...surfaceSx,
            p: { xs: 2, md: 2.5 },
            mb: 3,
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(255,255,255,1) 45%, rgba(22,163,74,0.05) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", lg: "center" }}
            spacing={2}
          >
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <Box
                sx={{
                  width: { xs: 52, md: 60 },
                  height: { xs: 52, md: 60 },
                  borderRadius: 3,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#2563eb",
                  color: "#fff",
                  boxShadow: "0 10px 24px rgba(37, 99, 235, 0.28)",
                  flexShrink: 0,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 30 }} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: { xs: 24, md: 32 },
                    fontWeight: 900,
                    lineHeight: 1.1,
                  }}
                >
                  Dashboard de Negocio
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Resumen comercial, operativo y financiero con foco en ventas,
                  cobros, territorio y operación.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ width: { xs: "100%", lg: "auto" } }}
            >
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={exportToExcel}
                sx={{ borderRadius: 3 }}
                fullWidth={false}
              >
                Exportar Excel
              </Button>

              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                onClick={exportToPdf}
                sx={{ borderRadius: 3 }}
              >
                Exportar PDF
              </Button>

              <Button
                variant="contained"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                sx={{ borderRadius: 3, boxShadow: "none" }}
              >
                Volver
              </Button>
            </Stack>
          </Stack>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {error}
          </Alert>
        )}

        {/* FILTROS */}
        <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, mb: 3 }}>
          <SectionHeader
            icon={<FilterAltIcon />}
            title="Filtros globales"
            subtitle="Aplicá filtros de período, agrupación y territorio sin afectar la lógica actual."
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                InputLabelProps={{ shrink: true }}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Agrupar por</InputLabel>
                <Select
                  value={groupBy}
                  label="Agrupar por"
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                >
                  <MenuItem value="day">Día</MenuItem>
                  <MenuItem value="week">Semana</MenuItem>
                  <MenuItem value="month">Mes</MenuItem>
                  <MenuItem value="quarter">Trimestre</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                label="Municipio"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                label="Zona"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <TextField
                fullWidth
                label="ID vendedor"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
              />
            </Grid>
          </Grid>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            mt={2}
            sx={{ width: "100%" }}
          >
            <Button
              variant="contained"
              onClick={fetchAll}
              sx={{ borderRadius: 3, boxShadow: "none" }}
            >
              Aplicar filtros
            </Button>

            <Button
              variant="outlined"
              sx={{ borderRadius: 3 }}
              onClick={() => {
                setFrom("");
                setTo("");
                setGroupBy("month");
                setMunicipality("");
                setZone("");
                setSellerId("");
              }}
            >
              Limpiar
            </Button>
          </Stack>
        </Paper>

        {/* KPI */}
        <Grid container columnSpacing={2} rowSpacing={6} mb={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <KpiCard
              title="Pedidos"
              value={overview?.totalOrders ?? 0}
              subtitle="Total del período"
              color="#2563eb"
              icon={<ShoppingCartIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <KpiCard
              title="Confirmados"
              value={overview?.confirmed ?? 0}
              subtitle={`Conversión ${overview?.confirmationRate ?? 0}%`}
              color="#16a34a"
              icon={<CheckCircleIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <KpiCard
              title="Cancelados"
              value={overview?.cancelled ?? 0}
              subtitle="Pedidos cancelados"
              color="#ef4444"
              icon={<CancelIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <KpiCard
              title="Facturación"
              value={money(overview?.grossAmount ?? 0)}
              subtitle="Monto bruto"
              color="#7c3aed"
              icon={<StorefrontIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <KpiCard
              title="Cobrado"
              value={money(overview?.paymentsTotal ?? 0)}
              subtitle="Ingresos registrados"
              color="#0f766e"
              icon={<PaymentsIcon />}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
            <KpiCard
              title="Ticket promedio"
              value={money(overview?.averageTicket ?? 0)}
              subtitle="Promedio por pedido"
              color="#f59e0b"
              icon={<LocalShippingIcon />}
            />
          </Grid>
        </Grid>

        {/* CHARTS 1 */}
        <Grid container spacing={2} marginTop={6} mb={3}>
          <Grid size={{ xs: 12, xl: 8 }}>
            <ChartContainer
              icon={<InsightsIcon />}
              title="Evolución del negocio"
              subtitle="Pedidos creados, confirmados y entregados en el período seleccionado."
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mergedSeries}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="bucket" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ordersCreated"
                    name="Pedidos creados"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ordersConfirmed"
                    name="Confirmados"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ordersDelivered"
                    name="Entregados"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Grid>

          <Grid size={{ xs: 12, xl: 4 }}>
            <ChartContainer
              icon={<PaymentsIcon />}
              title="Cobros por método"
              subtitle="Distribución de ingresos por método de pago."
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodChart}
                    dataKey="amount"
                    nameKey="method"
                    outerRadius={110}
                    innerRadius={55}
                    paddingAngle={3}
                    label
                  >
                    {paymentMethodChart.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Grid>
        </Grid>

        {/* CHARTS 2 */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, xl: 6 }}>
            <ChartContainer
              icon={<WorkspacePremiumIcon />}
              title="Ventas por vendedor"
              subtitle="Top vendedores por facturación."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sellerChart}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Legend />
                  <Bar
                    dataKey="facturacion"
                    fill="#2563eb"
                    name="Facturación"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Grid>

          <Grid size={{ xs: 12, xl: 6 }}>
            <ChartContainer
              icon={<TrendingUpIcon />}
              title="Embudo de pedidos"
              subtitle="Evolución del flujo operativo de pedidos."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelChart}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Grid>
        </Grid>

        {/* CHARTS 3 */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, xl: 6 }}>
            <ChartContainer
              icon={<StorefrontIcon />}
              title="Top productos por facturación"
              subtitle="Productos con mayor aporte a la facturación."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topProductsChart}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    fill="#16a34a"
                    name="Facturación"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Grid>

          <Grid size={{ xs: 12, xl: 6 }}>
            <ChartContainer
              icon={<PlaceIcon />}
              title="Municipios con más ventas"
              subtitle="Top municipios por facturación."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={municipalityChart}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="municipality" hide />
                  <YAxis />
                  <Tooltip formatter={tooltipMoneyFormatter} />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    fill="#f59e0b"
                    name="Facturación"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Grid>
        </Grid>

        {/* EQUIPO OPERATIVO */}
        <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 5.5 }, mb: 3 }}>
          <SectionHeader
            icon={<Groups2Icon />}
            title="Equipo operativo"
            subtitle="Rendimiento del equipo por área operativa."
          />

          <Grid container spacing={5}>
            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <Paper sx={{ ...surfaceSx, p: 2, height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <InventoryIcon color="warning" />
                  <Typography fontWeight={800}>Depósito</Typography>
                </Stack>

                <Stack spacing={1.2}>
                  {teamData?.deposito?.length ? (
                    teamData.deposito.map((row) => (
                      <PersonMetricCard
                        key={row.userId}
                        name={row.fullName}
                        email={row.email}
                        chips={
                          <>
                            <Chip label={`Inició: ${row.startedPreparing}`} />
                            <Chip
                              label={`Preparó: ${row.prepared}`}
                              color="warning"
                            />
                          </>
                        }
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <Paper sx={{ ...surfaceSx, p: 2, height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <FactCheckIcon color="info" />
                  <Typography fontWeight={800}>Control</Typography>
                </Stack>

                <Stack spacing={1.2}>
                  {teamData?.control?.length ? (
                    teamData.control.map((row) => (
                      <PersonMetricCard
                        key={row.userId}
                        name={row.fullName}
                        email={row.email}
                        chips={
                          <Chip
                            label={`Controló: ${row.checkedCount}`}
                            color="info"
                          />
                        }
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <Paper sx={{ ...surfaceSx, p: 2, height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <RouteIcon color="secondary" />
                  <Typography fontWeight={800}>Logística</Typography>
                </Stack>

                <Stack spacing={1.2}>
                  {teamData?.logistica?.length ? (
                    teamData.logistica.map((row) => (
                      <PersonMetricCard
                        key={row.userId}
                        name={row.fullName}
                        email={row.email}
                        chips={
                          <Chip
                            label={`Asignó: ${row.assignedCount}`}
                            color="secondary"
                          />
                        }
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6, xl: 3 }}>
              <Paper sx={{ ...surfaceSx, p: 2, height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  <DeliveryDiningIcon color="success" />
                  <Typography fontWeight={800}>Reparto</Typography>
                </Stack>

                <Stack spacing={1.2}>
                  {teamData?.reparto?.length ? (
                    teamData.reparto.map((row) => (
                      <PersonMetricCard
                        key={row.userId}
                        name={row.fullName}
                        email={row.email}
                        chips={
                          <>
                            <Chip
                              label={`Asignados: ${row.assignedDeliveries}`}
                            />
                            <Chip
                              label={`Entregados: ${row.deliveredCount}`}
                              color="success"
                            />
                          </>
                        }
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>

        {/* RANKINGS */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, xl: 6 }}>
            <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, height: "100%" }}>
              <SectionHeader
                icon={<WorkspacePremiumIcon />}
                title="Ranking de vendedores"
                subtitle="Ordenados según desempeño comercial."
              />

              <Stack spacing={1.2}>
                {bySeller.length === 0 && (
                  <EmptyState text="No hay datos para mostrar." />
                )}

                {bySeller.map((seller, index) => (
                  <PersonMetricCard
                    key={seller.userId}
                    name={`#${index + 1} ${seller.fullName || seller.email}`}
                    email={seller.email}
                    chips={
                      <>
                        <Chip label={`Pedidos: ${seller.ordersCreated}`} />
                        <Chip
                          label={`Confirmados: ${seller.confirmed}`}
                          color="success"
                        />
                        <Chip
                          label={`Entregados: ${seller.delivered}`}
                          color="info"
                        />
                        <Chip
                          label={money(seller.grossAmount)}
                          color="primary"
                        />
                      </>
                    }
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, xl: 6 }}>
            <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, height: "100%" }}>
              <SectionHeader
                icon={<StorefrontIcon />}
                title="Top productos"
                subtitle="Productos con mayor rotación y facturación."
              />

              <Stack spacing={1.2}>
                {topProducts.length === 0 && (
                  <EmptyState text="No hay datos para mostrar." />
                )}

                {topProducts.map((product, index) => (
                  <Box key={product.productId} sx={listCardSx}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={1.5}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800}>
                          #{index + 1} {product.productName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pedidos con este producto: {product.ordersCount}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip label={`Cantidad: ${product.quantitySold}`} />
                        <Chip label={money(product.revenue)} color="primary" />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* TOP PRODUCTOS POR TERRITORIO */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, xl: 6 }}>
            <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, height: "100%" }}>
              <SectionHeader
                icon={<PlaceIcon />}
                title="Top productos por municipio"
                subtitle="Mejores productos dentro de cada territorio."
              />

              <Stack spacing={2}>
                {topProductsByTerritory?.byMunicipality?.length ? (
                  topProductsByTerritory.byMunicipality
                    .slice(0, 5)
                    .map((group) => (
                      <TerritoryGroupCard
                        key={group.territory}
                        territory={group.territory}
                        color="primary"
                        products={group.products}
                      />
                    ))
                ) : (
                  <EmptyState />
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, xl: 6 }}>
            <Paper sx={{ ...surfaceSx, p: { xs: 2, md: 2.5 }, height: "100%" }}>
              <SectionHeader
                icon={<RouteIcon />}
                title="Top productos por zona"
                subtitle="Comparativa de productos destacados por zona."
              />

              <Stack spacing={2}>
                {topProductsByTerritory?.byZone?.length ? (
                  topProductsByTerritory.byZone
                    .slice(0, 5)
                    .map((group) => (
                      <TerritoryGroupCard
                        key={group.territory}
                        territory={group.territory}
                        color="secondary"
                        products={group.products}
                      />
                    ))
                ) : (
                  <EmptyState />
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* FOOTER */}
        <Paper sx={{ ...surfaceSx, p: 2 }}>
          <Stack spacing={1}>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              Este dashboard resume métricas comerciales, operativas y
              financieras del negocio.
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
