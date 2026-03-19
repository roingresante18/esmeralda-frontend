import {
  Stack,
  TextField,
  MenuItem,
  Paper,
  FormControlLabel,
  Switch,
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
}: Props) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 3,
        position: "sticky",
        top: 0,
        zIndex: 5,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
      }}
    >
      <Stack spacing={1.2}>
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
        >
          <MenuItem value="">Todos</MenuItem>
          {municipalities.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
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

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(filters.onlyToday)}
              onChange={(_, checked) =>
                setFilters((prev) => ({ ...prev, onlyToday: checked }))
              }
            />
          }
          label="Solo pedidos de hoy"
        />

        <FormControlLabel
          control={
            <Switch
              checked={Boolean(filters.onlyNext12h)}
              onChange={(_, checked) =>
                setFilters((prev) => ({ ...prev, onlyNext12h: checked }))
              }
            />
          }
          label="Próximas 12h"
        />
      </Stack>
    </Paper>
  );
};
