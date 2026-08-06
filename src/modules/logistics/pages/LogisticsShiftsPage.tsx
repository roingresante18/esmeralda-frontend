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

import { useNavigate } from "react-router-dom";

import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
} from "@mui/x-data-grid";

import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import RouteIcon from "@mui/icons-material/Route";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { getDriverShifts } from "../api/shifts.api";

import LogisticsNavigation from "../components/LogisticsNavigation";

import type { DriverShift, DriverShiftStatus } from "../types/shift.types";

/*
 * =========================================================
 * ESTADO DE JORNADA
 * =========================================================
 */

function getShiftStatusLabel(status: DriverShiftStatus): string {
  switch (status) {
    case "SCHEDULED":
      return "Pendiente";

    case "ACTIVE":
      return "Activa";

    case "FINISHED":
      return "Finalizada";

    case "CANCELLED":
      return "Cancelada";

    default:
      return status;
  }
}

function getShiftStatusColor(
  status: DriverShiftStatus,
): "warning" | "success" | "info" | "default" | "error" {
  switch (status) {
    case "SCHEDULED":
      return "warning";

    case "ACTIVE":
      return "success";

    case "FINISHED":
      return "info";

    case "CANCELLED":
      return "error";

    default:
      return "default";
  }
}

/*
 * =========================================================
 * FECHA
 * =========================================================
 *
 * Evitamos usar directamente new Date("YYYY-MM-DD")
 * porque puede producir diferencias de día por zona horaria.
 */

function formatDateOnly(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const dateOnly = value.split("T")[0];

  const [year, month, day] = dateOnly.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

/*
 * =========================================================
 * KILOMETRAJE
 * =========================================================
 */

function formatKm(value: string | number | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${number.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} km`;
}

/*
 * =========================================================
 * COMPONENTE
 * =========================================================
 */

export default function LogisticsShiftsPage() {
  const navigate = useNavigate();

  /*
   * =======================================================
   * ESTADO
   * =======================================================
   */

  const [shifts, setShifts] = useState<DriverShift[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * =======================================================
   * CARGAR JORNADAS
   * =======================================================
   */

  const loadShifts = useCallback(async () => {
    try {
      setLoading(true);

      setError(null);

      const data = await getDriverShifts();

      /*
       * Mostramos primero las jornadas más recientes.
       *
       * Si el backend ya las trae ordenadas no genera
       * ningún inconveniente, pero mantenemos una
       * presentación predecible en frontend.
       */

      const ordered = [...data].sort((a, b) => Number(b.id) - Number(a.id));

      setShifts(ordered);
    } catch (loadError) {
      console.error("[LOGISTICS][SHIFTS] Error cargando jornadas:", loadError);

      setError("No se pudieron cargar las jornadas.");
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * =======================================================
   * CARGA INICIAL
   * =======================================================
   */

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  /*
   * =======================================================
   * NAVEGAR AL DETALLE
   * =======================================================
   */

  const openShiftDetail = useCallback(
    (shiftId: number) => {
      navigate(`/logistica/jornadas/${shiftId}`);
    },
    [navigate],
  );

  /*
   * =======================================================
   * KPI
   * =======================================================
   */

  const scheduledCount = useMemo(
    () => shifts.filter((shift) => shift.status === "SCHEDULED").length,
    [shifts],
  );

  const activeCount = useMemo(
    () => shifts.filter((shift) => shift.status === "ACTIVE").length,
    [shifts],
  );

  const finishedCount = useMemo(
    () => shifts.filter((shift) => shift.status === "FINISHED").length,
    [shifts],
  );

  const cancelledCount = useMemo(
    () => shifts.filter((shift) => shift.status === "CANCELLED").length,
    [shifts],
  );

  /*
   * =======================================================
   * COLUMNAS
   * =======================================================
   */

  const columns = useMemo<GridColDef<DriverShift>[]>(
    () => [
      /*
       * -------------------------------------------------
       * JORNADA
       * -------------------------------------------------
       */

      {
        field: "id",

        headerName: "Jornada",

        width: 100,

        valueGetter: (_value, row) => `#${row.id}`,
      },

      /*
       * -------------------------------------------------
       * FECHA
       * -------------------------------------------------
       */

      {
        field: "scheduled_date",

        headerName: "Fecha",

        minWidth: 130,

        flex: 0.6,

        valueGetter: (_value, row) => formatDateOnly(row.scheduled_date),
      },

      /*
       * -------------------------------------------------
       * REPARTIDOR
       * -------------------------------------------------
       */

      {
        field: "driver",

        headerName: "Repartidor",

        minWidth: 190,

        flex: 1,

        valueGetter: (_value, row) =>
          row.driver?.full_name ||
          row.driver?.email ||
          `Usuario #${row.driver?.id ?? "—"}`,
      },

      /*
       * -------------------------------------------------
       * VEHÍCULO
       * -------------------------------------------------
       */

      {
        field: "vehicle",

        headerName: "Vehículo",

        minWidth: 220,

        flex: 1,

        valueGetter: (_value, row) =>
          row.vehicle
            ? `${row.vehicle.plate} · ${row.vehicle.brand} ${row.vehicle.model}`
            : "—",
      },

      /*
       * -------------------------------------------------
       * ODOMETRO INICIAL
       * -------------------------------------------------
       */

      {
        field: "start_odometer_km",
        headerName: "Km inicial",
        minWidth: 120,
        flex: 0.6,
        valueGetter: (_value, row) => formatKm(row.start_odometer_km),
      },

      /*
       * -------------------------------------------------
       * ODOMETRO FINAL
       * -------------------------------------------------
       */

      {
        field: "end_odometer_km",
        headerName: "Km final",
        minWidth: 120,
        flex: 0.6,
        valueGetter: (_value, row) => formatKm(row.end_odometer_km),
      },

      /*
       * -------------------------------------------------
       * RECORRIDO
       * -------------------------------------------------
       */

      {
        field: "total_distance_km",

        headerName: "Recorrido",

        minWidth: 120,

        flex: 0.6,

        valueGetter: (_value, row) => formatKm(row.total_distance_km),
      },

      /*
       * -------------------------------------------------
       * ESTADO
       * -------------------------------------------------
       */

      {
        field: "status",

        headerName: "Estado",

        minWidth: 130,

        flex: 0.7,

        renderCell: (params) => (
          <Chip
            size="small"
            color={getShiftStatusColor(params.row.status)}
            label={getShiftStatusLabel(params.row.status)}
          />
        ),
      },

      /*
       * -------------------------------------------------
       * ACCIONES
       * -------------------------------------------------
       *
       * Aunque la fila completa admite doble clic,
       * dejamos un botón explícito para que la interfaz
       * sea más fácil de descubrir.
       */

      {
        field: "actions",

        headerName: "Acciones",

        width: 95,

        sortable: false,

        filterable: false,

        disableColumnMenu: true,

        renderCell: (params) => (
          <Tooltip title="Ver detalle de jornada">
            <IconButton
              size="small"
              color="primary"
              onClick={(event) => {
                /*
                 * Evitamos que el clic del botón
                 * se propague a la fila.
                 */

                event.stopPropagation();

                openShiftDetail(params.row.id);
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [openShiftDetail],
  );

  /*
   * =======================================================
   * DOBLE CLIC EN FILA
   * =======================================================
   */

  const handleRowDoubleClick = (params: GridRowParams<DriverShift>) => {
    openShiftDetail(params.row.id);
  };

  /*
   * =======================================================
   * JORNADA CREADA
   * =======================================================
   */

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
        {/* =================================================
            NAVEGACIÓN INTERNA
            ================================================= */}

        <LogisticsNavigation />

        {/* =================================================
            HEADER
            ================================================= */}

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
            <RouteIcon color="primary" fontSize="large" />

            <Box>
              <Typography variant="h4" fontWeight={900}>
                Jornadas de reparto
              </Typography>

              <Typography color="text.secondary">
                Planificación y seguimiento de las salidas de reparto
              </Typography>
            </Box>
          </Stack>

          {/* ACCIONES */}

          <Stack
            direction={{
              xs: "column",

              sm: "row",
            }}
            spacing={1}
          >
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled={loading}
              onClick={() => void loadShifts()}
            >
              Actualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/logistica/pedidos")}
            >
              Armar jornada
            </Button>
          </Stack>
        </Stack>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* =================================================
            KPIs
            ================================================= */}

        <Stack
          direction={{
            xs: "column",

            sm: "row",
          }}
          spacing={1}
          flexWrap="wrap"
          useFlexGap
        >
          <Chip label={`Total: ${shifts.length}`} />

          <Chip label={`Pendientes: ${scheduledCount}`} color="warning" />

          <Chip label={`Activas: ${activeCount}`} color="success" />

          <Chip label={`Finalizadas: ${finishedCount}`} color="info" />

          {cancelledCount > 0 && (
            <Chip
              label={`Canceladas: ${cancelledCount}`}
              color="error"
              variant="outlined"
            />
          )}
        </Stack>

        {/* =================================================
            AYUDA DE USO
            ================================================= */}

        <Typography variant="body2" color="text.secondary">
          Usá el botón de la última columna o hacé doble clic sobre una jornada
          para abrir su detalle.
        </Typography>

        {/* =================================================
            TABLA
            ================================================= */}

        <Paper
          sx={{
            width: "100%",

            borderRadius: 3,

            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: 620,

              width: "100%",
            }}
          >
            <DataGrid
              rows={shifts}
              columns={columns}
              loading={loading}
              getRowId={(row) => row.id}
              disableRowSelectionOnClick
              onRowDoubleClick={handleRowDoubleClick}
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

                /*
                 * Dejamos visualmente claro que
                 * las jornadas se pueden abrir.
                 */

                "& .MuiDataGrid-row": {
                  cursor: "pointer",
                },

                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "action.hover",
                },

                "& .MuiDataGrid-cell": {
                  display: "flex",

                  alignItems: "center",
                },
              }}
            />
          </Box>
        </Paper>
      </Stack>

      {/* ===================================================
          CREAR JORNADA
          =================================================== */}
    </Container>
  );
}
