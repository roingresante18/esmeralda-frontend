import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Container,
  Stack,
  Typography,
  CircularProgress,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useDeliveryDashboard } from "../hooks/useDeliveryDashboard";
import { DeliveryHeader } from "../components/dashboard/DeliveryHeader";
import { DriverFiltersBar } from "../components/dashboard/DriverFiltersBar";
import { MunicipalityProgressCard } from "../components/dashboard/MunicipalityProgressCard";
import { EmptyState } from "../components/shared/EmptyState";

export default function MunicipalityRouteListPage() {
  const navigate = useNavigate();

  const {
    municipalityGroups,
    loading,
    error,
    fetchOrders,
    filters,
    setFilters,
    zones,
    municipalities,
    next12hCount,
  } = useDeliveryDashboard();

  const visibleGroups = useMemo(
    () => municipalityGroups.filter((group) => group.count > 0),
    [municipalityGroups],
  );

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 1.5, md: 3 }, px: { xs: 1.2, sm: 2 } }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/reparto")}
            sx={{ alignSelf: "flex-start" }}
          >
            Volver
          </Button>

          <Button variant="outlined" onClick={fetchOrders}>
            Actualizar
          </Button>
        </Stack>

        <DeliveryHeader
          driverName="Carlos Gómez"
          dateLabel={new Date().toLocaleDateString("es-AR")}
        />

        <Typography variant="h6" fontWeight={900}>
          Municipios del recorrido
        </Typography>

        {next12hCount > 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            Tenés pedidos dentro de las próximas 12 horas. Revisá primero los
            municipios con prioridad.
          </Alert>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        ) : null}

        <DriverFiltersBar
          filters={filters}
          setFilters={setFilters}
          zones={zones}
          municipalities={municipalities}
        />

        {loading ? (
          <Stack alignItems="center" py={5}>
            <CircularProgress />
          </Stack>
        ) : visibleGroups.length === 0 ? (
          <EmptyState
            title="No hay municipios con pedidos"
            description="Verificá las asignaciones o cambiá los filtros."
          />
        ) : (
          <Stack spacing={1.2}>
            {visibleGroups.map((group) => (
              <MunicipalityProgressCard
                key={group.municipality}
                group={group}
                onClick={(municipality) =>
                  navigate(
                    `/reparto/municipios/${encodeURIComponent(municipality)}`,
                  )
                }
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
