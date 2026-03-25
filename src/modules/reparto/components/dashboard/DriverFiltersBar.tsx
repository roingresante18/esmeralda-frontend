import {
  Stack,
  TextField,
  MenuItem,
  Paper,
  FormControlLabel,
  Switch,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import type {
  DeliveryFilters,
  DeliveryStatus,
} from "../../types/delivery.types";

interface Props {
  filters: DeliveryFilters;
  setFilters: React.Dispatch<React.SetStateAction<DeliveryFilters>>;
  zones: string[];
  municipalities: string[];
  municipalitiesByZone: Record<string, string[]>;
  onClose?: () => void;
}

const statusOptions: Array<{ value: DeliveryStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "ASSIGNED", label: "Asignado" },
  { value: "IN_DELIVERY", label: "En reparto" },
  { value: "DELIVERED", label: "Entregado" },
  { value: "PARTIAL_DELIVERED", label: "Entrega parcial" },
  { value: "RESCHEDULED", label: "Reprogramado" },
  { value: "NOT_DELIVERED", label: "No entregado" },
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
    setFilters((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
      zone: undefined,
      municipality: undefined,
      status: "ALL",
      onlyToday: true,
      onlyNext12h: false,
    }));
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
          label="Fecha"
          InputLabelProps={{ shrink: true }}
          value={filters.date ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              date: e.target.value,
              onlyToday: false,
            }))
          }
          fullWidth
        />

        <TextField
          size="small"
          select
          label="Zona"
          value={filters.zone ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              zone: e.target.value || undefined,
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
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              municipality: e.target.value || undefined,
            }))
          }
          fullWidth
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
          value={filters.status ?? "ALL"}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              status: e.target.value as DeliveryStatus | "ALL",
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
                setFilters((prev) => ({
                  ...prev,
                  onlyToday: checked,
                  ...(checked
                    ? { date: new Date().toISOString().split("T")[0] }
                    : {}),
                }))
              }
            />
          }
          label="Solo pedidos de hoy"
        />

        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              checked={Boolean(filters.onlyNext12h)}
              onChange={(_, checked) =>
                setFilters((prev) => ({
                  ...prev,
                  onlyNext12h: checked,
                }))
              }
            />
          }
          label="Próximas 12h"
        />

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" fullWidth onClick={handleClearFilters}>
            Limpiar
          </Button>

          {onClose && (
            <Button variant="contained" fullWidth onClick={onClose}>
              Aplicar
            </Button>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
};
