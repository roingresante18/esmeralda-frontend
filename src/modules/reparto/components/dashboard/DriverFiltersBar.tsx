import {
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import type {
  DriverDashboardFilters,
  DriverDashboardStatusFilter,
} from "../../hooks/useDeliveryDashboard";

interface Props {
  filters: DriverDashboardFilters;

  setFilters: React.Dispatch<React.SetStateAction<DriverDashboardFilters>>;

  zones: string[];
  municipalities: string[];

  municipalitiesByZone: Record<string, string[]>;

  onClose?: () => void;
}

const getLocalDateValue = (): string => {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(now.getMonth() + 1).padStart(2, "0");

  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const statusOptions: Array<{
  value: DriverDashboardStatusFilter;
  label: string;
}> = [
  {
    value: "ACTIVE",
    label: "Todos los activos",
  },
  {
    value: "IN_DELIVERY",
    label: "En reparto",
  },
];

export const DriverFiltersBar = ({
  filters,
  setFilters,
  zones,
  municipalities,
  municipalitiesByZone,
  onClose,
}: Props) => {
  const filteredMunicipalities = filters.zone
    ? (municipalitiesByZone[filters.zone] ?? [])
    : municipalities;

  const handleClearFilters = () => {
    setFilters({
      date: getLocalDateValue(),
      zone: undefined,
      municipality: undefined,
      status: "ACTIVE",

      /*
       * Después de limpiar, se muestran nuevamente
       * todos los pedidos activos.
       */
      onlyToday: false,
      onlyNext12h: false,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="subtitle2" fontWeight={800}>
          Filtros de reparto
        </Typography>

        <TextField
          size="small"
          type="date"
          label="Fecha de entrega"
          InputLabelProps={{
            shrink: true,
          }}
          value={filters.date ?? ""}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              date: event.target.value,

              /*
               * Elegir una fecha activa automáticamente
               * el filtro de fecha.
               */
              onlyToday: Boolean(event.target.value),
            }))
          }
          fullWidth
        />

        <TextField
          size="small"
          select
          label="Zona"
          value={filters.zone ?? ""}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              zone: event.target.value || undefined,
              municipality: undefined,
            }))
          }
          fullWidth
        >
          <MenuItem value="">Todas</MenuItem>

          {zones.map((zone) => (
            <MenuItem key={zone} value={zone}>
              {zone}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          select
          label="Municipio"
          value={filters.municipality ?? ""}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              municipality: event.target.value || undefined,
            }))
          }
          disabled={
            Boolean(filters.zone) && filteredMunicipalities.length === 0
          }
          helperText={
            filters.zone
              ? filteredMunicipalities.length === 0
                ? "No hay municipios para la zona elegida"
                : "Solo municipios de la zona elegida"
              : "Podés elegir cualquier municipio"
          }
          fullWidth
        >
          <MenuItem value="">Todos</MenuItem>

          {filteredMunicipalities.map((municipality) => (
            <MenuItem key={municipality} value={municipality}>
              {municipality}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          select
          label="Estado"
          value={filters.status ?? "ACTIVE"}
          onChange={(event) =>
            setFilters((previous) => ({
              ...previous,
              status: event.target.value as DriverDashboardStatusFilter,
            }))
          }
          fullWidth
        >
          {statusOptions.map((status) => (
            <MenuItem key={status.value} value={status.value}>
              {status.label}
            </MenuItem>
          ))}
        </TextField>

        <Divider sx={{ my: 0.25 }} />

        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              checked={Boolean(filters.onlyToday)}
              onChange={(_, checked) =>
                setFilters((previous) => ({
                  ...previous,
                  onlyToday: checked,

                  ...(checked
                    ? {
                        date: previous.date || getLocalDateValue(),
                      }
                    : {}),
                }))
              }
            />
          }
          label="Filtrar por la fecha elegida"
        />

        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              checked={Boolean(filters.onlyNext12h)}
              onChange={(_, checked) =>
                setFilters((previous) => ({
                  ...previous,
                  onlyNext12h: checked,
                }))
              }
            />
          }
          label="Solo próximas 12 horas"
        />

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" fullWidth onClick={handleClearFilters}>
            Limpiar
          </Button>

          {onClose ? (
            <Button variant="contained" fullWidth onClick={onClose}>
              Aplicar
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Paper>
  );
};
