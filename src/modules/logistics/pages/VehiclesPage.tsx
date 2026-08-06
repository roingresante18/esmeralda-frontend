import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import { useNavigate } from "react-router-dom";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getVehicles } from "../api/vehicles.api";

import VehicleFormDialog from "../components/VehicleFormDialog";

import type { Vehicle, VehicleStatus } from "../types/vehicle.types";

/*
 * =========================================================
 * ESTADO VEHÍCULO
 * =========================================================
 */

function getVehicleStatusLabel(status: VehicleStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Activo";

    case "MAINTENANCE":
      return "Mantenimiento";

    case "INACTIVE":
      return "Inactivo";

    default:
      return status;
  }
}

function getVehicleStatusColor(
  status: VehicleStatus,
): "success" | "warning" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";

    case "MAINTENANCE":
      return "warning";

    default:
      return "default";
  }
}

/*
 * =========================================================
 * PÁGINA
 * =========================================================
 */

export default function VehiclesPage() {
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  /*
   * =======================================================
   * CARGAR
   * =======================================================
   */

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);

      setError(null);

      const data = await getVehicles();

      setVehicles(data);
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;

      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join("\n")
          : backendMessage || "No se pudieron cargar los vehículos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  /*
   * =======================================================
   * NUEVO
   * =======================================================
   */

  const openNewVehicle = () => {
    setSelectedVehicle(null);

    setFormOpen(true);
  };

  /*
   * =======================================================
   * EDITAR
   * =======================================================
   */

  const openEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);

    setFormOpen(true);
  };

  /*
   * =======================================================
   * GUARDADO
   * =======================================================
   */

  const handleVehicleSaved = (savedVehicle: Vehicle) => {
    setFormOpen(false);

    setSelectedVehicle(null);

    setVehicles((current) => {
      const exists = current.some((item) => item.id === savedVehicle.id);

      if (exists) {
        return current.map((item) =>
          item.id === savedVehicle.id ? savedVehicle : item,
        );
      }

      return [savedVehicle, ...current];
    });
  };

  /*
   * =======================================================
   * KPI
   * =======================================================
   */

  const activeCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
    [vehicles],
  );

  const maintenanceCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "MAINTENANCE").length,
    [vehicles],
  );

  const inactiveCount = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === "INACTIVE").length,
    [vehicles],
  );

  /*
   * =======================================================
   * COLUMNAS
   * =======================================================
   */

  const columns = useMemo<GridColDef<Vehicle>[]>(
    () => [
      {
        field: "plate",

        headerName: "Patente",

        minWidth: 130,

        flex: 0.6,

        renderCell: (params) => (
          <Typography fontWeight={900}>{params.row.plate}</Typography>
        ),
      },

      {
        field: "brand",

        headerName: "Marca",

        minWidth: 140,

        flex: 0.8,
      },

      {
        field: "model",

        headerName: "Modelo",

        minWidth: 150,

        flex: 0.9,
      },

      {
        field: "year",

        headerName: "Año",

        width: 90,

        valueGetter: (_value, row) => row.year ?? "—",
      },

      {
        field: "fuel_type",

        headerName: "Combustible",

        minWidth: 130,

        flex: 0.7,

        valueGetter: (_value, row) => row.fuel_type || "—",
      },

      {
        field: "estimated_consumption_l_100km",

        headerName: "Consumo",

        minWidth: 130,

        flex: 0.7,

        valueGetter: (_value, row) =>
          row.estimated_consumption_l_100km != null
            ? `${Number(row.estimated_consumption_l_100km)} L/100 km`
            : "—",
      },

      {
        field: "max_allowed_speed_kmh",

        headerName: "Límite",

        minWidth: 110,

        flex: 0.6,

        valueGetter: (_value, row) =>
          row.max_allowed_speed_kmh != null
            ? `${Number(row.max_allowed_speed_kmh)} km/h`
            : "—",
      },

      {
        field: "current_odometer_km",

        headerName: "Odómetro",

        minWidth: 130,

        flex: 0.7,

        valueGetter: (_value, row) =>
          row.current_odometer_km != null
            ? `${Number(row.current_odometer_km).toLocaleString("es-AR")} km`
            : "—",
      },

      {
        field: "status",

        headerName: "Estado",

        minWidth: 140,

        flex: 0.7,

        renderCell: (params) => (
          <Chip
            size="small"
            label={getVehicleStatusLabel(params.row.status)}
            color={getVehicleStatusColor(params.row.status)}
            variant={params.row.status === "ACTIVE" ? "filled" : "outlined"}
          />
        ),
      },

      {
        field: "actions",

        headerName: "Acciones",

        width: 100,

        sortable: false,

        filterable: false,

        renderCell: (params) => (
          <Tooltip title="Editar vehículo">
            <IconButton onClick={() => openEditVehicle(params.row)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [],
  );

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
      }}
    >
      <Stack spacing={3}>
        {/* HEADER */}

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DirectionsCarIcon color="primary" fontSize="large" />

            <Box>
              <Typography variant="h4" fontWeight={900}>
                Vehículos
              </Typography>

              <Typography color="text.secondary">
                Administración de la flota de reparto
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1}
          >
            <Button variant="outlined" onClick={() => navigate("/logistica")}>
              Volver a Logística
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void loadVehicles()}
              disabled={loading}
            >
              Actualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openNewVehicle}
            >
              Nuevo vehículo
            </Button>
          </Stack>
        </Stack>

        {/* ERROR */}

        {error && <Alert severity="error">{error}</Alert>}

        {/* KPI */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
        >
          <Chip label={`Total: ${vehicles.length}`} />

          <Chip label={`Activos: ${activeCount}`} color="success" />

          <Chip label={`Mantenimiento: ${maintenanceCount}`} color="warning" />

          <Chip label={`Inactivos: ${inactiveCount}`} variant="outlined" />
        </Stack>

        {/* TABLA */}

        <Paper
          sx={{
            width: "100%",

            borderRadius: 3,

            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",

              height: 620,
            }}
          >
            <DataGrid
              rows={vehicles}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    page: 0,

                    pageSize: 25,
                  },
                },
              }}
              sx={{
                border: 0,

                "& .MuiDataGrid-cell": {
                  display: "flex",

                  alignItems: "center",
                },
              }}
            />
          </Box>
        </Paper>
      </Stack>

      {/* FORMULARIO */}

      <VehicleFormDialog
        open={formOpen}
        vehicle={selectedVehicle}
        onClose={() => {
          setFormOpen(false);

          setSelectedVehicle(null);
        }}
        onSuccess={handleVehicleSaved}
      />
    </Container>
  );
}
