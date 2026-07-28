import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Drawer,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

import { useDeliveryDashboard } from "../hooks/useDeliveryDashboard";

import { DriverFiltersBar } from "../components/dashboard/DriverFiltersBar";
import { DeliveryKpiStrip } from "../components/dashboard/DeliveryKpiStrip";
import { MunicipalityList } from "../components/dashboard/MunicipalityList";
import { DeliveryHeader } from "../components/dashboard/DeliveryHeader";
import { DeliveryAlertBanner } from "../components/dashboard/DeliveryAlertBanner";
import { EmptyState } from "../components/shared/EmptyState";

import type { DeliveryOrder } from "../types/delivery.types";

import { DeliveryOrderDetailPage } from "./DeliveryOrderDetailPage";

export default function DeliveryDashboardPage() {
  const {
    municipalityGroups,
    loading,
    error,
    summaryError,
    fetchOrders,
    filters,
    setFilters,
    kpis,
    zones,
    municipalities,
    municipalitiesByZone,
    next12hCount,
  } = useDeliveryDashboard();

  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(
    null,
  );

  const [actionError, setActionError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const safeRefresh = async () => {
    setActionError(null);

    try {
      await fetchOrders();
    } catch (requestError) {
      console.error(requestError);

      setActionError("No se pudo actualizar el tablero.");
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: {
          xs: 1.25,
          sm: 1.5,
          md: 3,
        },
        px: {
          xs: 1,
          sm: 2,
        },
      }}
    >
      <Stack spacing={1.5}>
        <DeliveryHeader
          driverName={loggedUser?.full_name || "Usuario"}
          dateLabel={new Date().toLocaleDateString("es-AR")}
        />

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
          sx={{
            width: "100%",
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={safeRefresh}
            disabled={loading}
            fullWidth
          >
            Actualizar
          </Button>

          <Button
            variant="contained"
            startIcon={<FilterAltIcon />}
            onClick={() => setFiltersOpen(true)}
            fullWidth
          >
            Filtros
          </Button>
        </Stack>

        {/*
         * Los KPI permanecen siempre visibles arriba del listado.
         */}
        <DeliveryKpiStrip kpis={kpis} />

        <DeliveryAlertBanner next12hCount={next12hCount} />

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : null}

        {summaryError ? (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            {summaryError}
          </Alert>
        ) : null}

        {actionError ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {actionError}
          </Alert>
        ) : null}

        {!isMobile ? (
          <DriverFiltersBar
            filters={filters}
            setFilters={setFilters}
            zones={zones}
            municipalities={municipalities}
            municipalitiesByZone={municipalitiesByZone}
          />
        ) : null}

        {loading ? (
          <Stack alignItems="center" py={5}>
            <CircularProgress />
          </Stack>
        ) : municipalityGroups.length === 0 ? (
          <EmptyState
            title="No hay pedidos activos para mostrar"
            description="No existen entregas pendientes con los filtros seleccionados."
          />
        ) : (
          <Box>
            <MunicipalityList
              groups={municipalityGroups}
              onOpenDetail={setSelectedOrder}
            />
          </Box>
        )}
      </Stack>

      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : 420,
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            p: 1.2,
          },
        }}
      >
        <DriverFiltersBar
          filters={filters}
          setFilters={setFilters}
          zones={zones}
          municipalities={municipalities}
          municipalitiesByZone={municipalitiesByZone}
          onClose={() => setFiltersOpen(false)}
        />
      </Drawer>

      <Drawer
        anchor="right"
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        PaperProps={{
          sx: {
            width: {
              xs: "100%",
              sm: 520,
            },
            maxWidth: "100%",
          },
        }}
      >
        {selectedOrder ? (
          <DeliveryOrderDetailPage
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onSuccess={() => {
              setSelectedOrder(null);
              void fetchOrders();
            }}
          />
        ) : null}
      </Drawer>
    </Container>
  );
}
