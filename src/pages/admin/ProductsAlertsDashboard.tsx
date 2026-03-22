import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  Button,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Skeleton,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaidIcon from "@mui/icons-material/Paid";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { motion } from "framer-motion";

import api from "../../api/api";

interface DashboardProductRow {
  id: number;
  name: string;
  description: string;
  unit_price: number;
  iva_percent: number;
  utilidad_percent: number;
  sale_price: number;
  calculated_sale_price?: number;
  proveedor: string;
  is_active: boolean;
  rubro_id: number | null;
  rubro_name: string;
  issues?: string[];
  difference?: number;
}

interface DuplicatedDescriptionRow {
  id: string;
  description: string;
  count: number;
  codes: string;
  ids: string;
  proveedores: string;
  rubros: string;
}

interface DashboardAlertsResponse {
  summary: {
    totalProducts: number;
    lowUtilityCount: number;
    zeroCostCount: number;
    zeroSalePriceCount: number;
    withoutSupplierCount: number;
    withoutRubroCount: number;
    inconsistentSalePriceCount: number;
    duplicatedDescriptionsCount: number;
  };
  lowestUtility: DashboardProductRow[];
  highestUtility: DashboardProductRow[];
  lowestSalePrice: DashboardProductRow[];
  incompleteData: DashboardProductRow[];
  inconsistentSalePrice: DashboardProductRow[];
  duplicatedDescriptions: Array<{
    description: string;
    count: number;
    products: Array<{
      id: number;
      name: string;
      proveedor: string;
      rubro_name: string;
      unit_price: number;
      sale_price: number;
      utilidad_percent: number;
    }>;
  }>;
}

const SummaryCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Box>{icon}</Box>
      </Stack>
    </CardContent>
  </Card>
);

const currency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

const ProductsAlertsDashboard = () => {
  const [data, setData] = useState<DashboardAlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const res = await api.get<DashboardAlertsResponse>(
        "/products/dashboard-alerts",
        {
          timeout: 60000,
        },
      );

      setData(res.data);
    } catch (error: any) {
      const responseData = error?.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : Array.isArray(responseData?.message)
            ? responseData.message.join(", ")
            : typeof responseData?.message === "string"
              ? responseData.message
              : typeof responseData?.error === "string"
                ? responseData.error
                : "Error al cargar dashboard de alertas";

      setSnackbar({
        open: true,
        message: backendMessage,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const baseColumns: GridColDef[] = [
    { field: "name", headerName: "Código", width: 130 },
    { field: "description", headerName: "Producto", flex: 1, minWidth: 220 },
    {
      field: "unit_price",
      headerName: "Costo",
      width: 120,
      valueFormatter: (value) => currency(Number(value)),
    },
    {
      field: "sale_price",
      headerName: "Venta",
      width: 120,
      valueFormatter: (value) => currency(Number(value)),
    },
    {
      field: "utilidad_percent",
      headerName: "Utilidad %",
      width: 120,
      valueFormatter: (value) => `${Number(value ?? 0).toFixed(2)}%`,
    },
    {
      field: "proveedor",
      headerName: "Proveedor",
      width: 160,
      valueFormatter: (value) => value || "-",
    },
    {
      field: "rubro_name",
      headerName: "Rubro",
      width: 160,
      valueFormatter: (value) => value || "-",
    },
  ];

  const incompleteColumns: GridColDef[] = [
    ...baseColumns,
    {
      field: "issues",
      headerName: "Problemas",
      width: 320,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {(params.row.issues ?? []).map((issue: string) => (
            <Chip key={issue} label={issue} size="small" color="warning" />
          ))}
        </Stack>
      ),
    },
  ];

  const inconsistentColumns: GridColDef[] = [
    ...baseColumns,
    {
      field: "calculated_sale_price",
      headerName: "Venta calculada",
      width: 150,
      valueFormatter: (value) => currency(Number(value)),
    },
    {
      field: "difference",
      headerName: "Diferencia",
      width: 130,
      valueFormatter: (value) => currency(Number(value)),
    },
  ];

  const duplicatedDescriptionsRows: DuplicatedDescriptionRow[] =
    data?.duplicatedDescriptions.map((item, index) => ({
      id: `${index}-${item.description}`,
      description: item.description,
      count: item.count,
      codes: item.products.map((p) => p.name).join(", "),
      ids: item.products.map((p) => p.id).join(", "),
      proveedores: Array.from(
        new Set(item.products.map((p) => p.proveedor).filter(Boolean)),
      ).join(", "),
      rubros: Array.from(
        new Set(item.products.map((p) => p.rubro_name).filter(Boolean)),
      ).join(", "),
    })) ?? [];

  const duplicatedDescriptionsColumns: GridColDef[] = [
    {
      field: "description",
      headerName: "Descripción",
      flex: 1,
      minWidth: 260,
    },
    {
      field: "count",
      headerName: "Cantidad",
      width: 110,
    },
    {
      field: "codes",
      headerName: "Códigos",
      flex: 1,
      minWidth: 220,
    },
    {
      field: "ids",
      headerName: "IDs",
      flex: 1,
      minWidth: 160,
    },
    {
      field: "proveedores",
      headerName: "Proveedores",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "rubros",
      headerName: "Rubros",
      flex: 1,
      minWidth: 180,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          gap={2}
          flexWrap="wrap"
        >
          <Box>
            <Typography variant="h4">
              Dashboard de alertas de productos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control rápido de precios, utilidad y calidad de datos.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={fetchDashboard}
            disabled={loading}
          >
            Recargar
          </Button>
        </Box>

        {loading ? (
          <Stack spacing={2}>
            <Skeleton height={120} />
            <Skeleton height={320} />
            <Skeleton height={320} />
          </Stack>
        ) : data ? (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Total productos"
                  value={data.summary.totalProducts}
                  icon={<Inventory2Icon />}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Utilidad < 10%"
                  value={data.summary.lowUtilityCount}
                  icon={<TrendingDownIcon />}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Costo en 0"
                  value={data.summary.zeroCostCount}
                  icon={<PaidIcon />}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Venta en 0"
                  value={data.summary.zeroSalePriceCount}
                  icon={<WarningAmberIcon />}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Sin proveedor"
                  value={data.summary.withoutSupplierCount}
                  icon={<LocalShippingIcon />}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Sin rubro"
                  value={data.summary.withoutRubroCount}
                  icon={<CategoryIcon />}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <SummaryCard
                  title="Descripciones repetidas"
                  value={data.summary.duplicatedDescriptionsCount}
                  icon={<WarningAmberIcon />}
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>
                    Menor porcentaje de utilidad
                  </Typography>
                  <DataGrid
                    autoHeight
                    rows={data.lowestUtility}
                    columns={baseColumns}
                    pageSizeOptions={[10, 15]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>
                    Mayor porcentaje de utilidad
                  </Typography>
                  <DataGrid
                    autoHeight
                    rows={data.highestUtility}
                    columns={baseColumns}
                    pageSizeOptions={[10, 15]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>
                    Menor precio de venta
                  </Typography>
                  <DataGrid
                    autoHeight
                    rows={data.lowestSalePrice}
                    columns={baseColumns}
                    pageSizeOptions={[10, 15]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>
                    Productos con datos incompletos
                  </Typography>
                  <DataGrid
                    autoHeight
                    rows={data.incompleteData}
                    columns={incompleteColumns}
                    pageSizeOptions={[10, 20]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>
                    Precio de venta inconsistente con la fórmula
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Detecta productos cuyo precio guardado no coincide con:
                    costo + utilidad.
                  </Typography>
                  <DataGrid
                    autoHeight
                    rows={data.inconsistentSalePrice}
                    columns={inconsistentColumns}
                    pageSizeOptions={[10, 20]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>
                    Productos con descripción repetida
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Agrupa productos que comparten exactamente la misma
                    descripción.
                  </Typography>
                  <DataGrid
                    autoHeight
                    rows={duplicatedDescriptionsRows}
                    columns={duplicatedDescriptionsColumns}
                    pageSizeOptions={[10, 20, 30]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                      },
                    }}
                  />
                </Paper>
              </Grid>
            </Grid>
          </>
        ) : null}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ProductsAlertsDashboard;
