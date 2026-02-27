import {
  Box,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import { useEffect, useState } from "react";
import type { ClientFormData, Municipality } from "./ClientForm.types";
import api from "../../../../api/api";

type Mode = "create" | "edit" | "logistics";

interface Props {
  mode: Mode;
  value: ClientFormData;
  onChange: (data: ClientFormData) => void;
  onSubmit: () => void;
  municipalities?: Municipality[];
  loading?: boolean;
}

export default function ClientForm({
  mode,
  value,
  onChange,
  onSubmit,
  loading = false,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [confirmGps, setConfirmGps] = useState(false);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  const readOnly = mode === "logistics";

  /* =======================
     CARGAR MUNICIPIOS
  ======================= */

  useEffect(() => {
    api.get("/logistics/municipalities").then((res) => {
      setMunicipalities(res.data.municipalities);
    });
  }, []);

  /* =======================
     VALIDACIONES
     Obligatorios:
     - name
     - phone
     - municipality_id
  ======================= */

  const validate = () => {
    const errs: Record<string, string> = {};

    if (mode !== "logistics") {
      if (!value.name?.trim()) {
        errs.name = "Nombre obligatorio";
      }

      if (!value.phone?.trim()) {
        errs.phone = "Teléfono obligatorio";
      }

      if (!value.municipality_id) {
        errs.municipality_id = "Seleccione municipio";
      }

      // Email opcional pero validado si existe
      if (value.email && !/^\S+@\S+\.\S+$/.test(value.email)) {
        errs.email = "Email inválido";
      }
    }

    // GPS obligatorio solo para logística
    if (mode === "logistics") {
      if (!value.latitude || !value.longitude) {
        errs.gps = "Debe capturar ubicación";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* =======================
     GEOLOCALIZACIÓN
  ======================= */

  const getLocation = () => {
    if (!navigator.geolocation) return;

    setLoadingGeo(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          ...value,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLoadingGeo(false);
      },
      () => setLoadingGeo(false),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  /* =======================
     SUBMIT
  ======================= */

  const handleSubmit = () => {
    if (!validate()) return;

    if (mode === "logistics") {
      setConfirmGps(true);
      return;
    }

    onSubmit();
  };

  const confirmGpsUpdate = () => {
    setConfirmGps(false);
    onSubmit();
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {/* ================= NOMBRE (obligatorio) ================= */}
        <TextField
          label="Nombre"
          required
          value={value.name}
          disabled={readOnly}
          error={!!errors.name}
          helperText={errors.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />

        {/* ================= EMAIL (opcional) ================= */}
        <TextField
          label="Email"
          value={value.email || ""}
          disabled={readOnly}
          error={!!errors.email}
          helperText={errors.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />

        {/* ================= TELÉFONO (obligatorio) ================= */}
        <TextField
          label="Teléfono"
          required
          value={value.phone || ""}
          disabled={readOnly}
          error={!!errors.phone}
          helperText={errors.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />

        {/* ================= DIRECCIÓN (opcional) ================= */}
        <TextField
          label="Dirección"
          value={value.address || ""}
          disabled={readOnly}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />

        {/* ================= MUNICIPIO (obligatorio) ================= */}
        <FormControl error={!!errors.municipality_id} disabled={readOnly}>
          <InputLabel>Municipio</InputLabel>

          <Select
            label="Municipio"
            required
            value={value.municipality_id ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                municipality_id: Number(e.target.value),
              })
            }
          >
            {municipalities.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </Select>

          <FormHelperText>{errors.municipality_id}</FormHelperText>
        </FormControl>

        {/* ================= BOTÓN GPS ================= */}
        <Button
          variant="outlined"
          startIcon={
            loadingGeo ? <CircularProgress size={18} /> : <MyLocationIcon />
          }
          onClick={getLocation}
        >
          Capturar ubicación
        </Button>

        {/* ================= SUBMIT ================= */}
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {mode === "create" && "Crear cliente"}
          {mode === "edit" && "Guardar cambios"}
          {mode === "logistics" && "Confirmar entrega"}
        </Button>

        {/* Error GPS */}
        {errors.gps && <FormHelperText error>{errors.gps}</FormHelperText>}
      </Box>

      {/* ================= CONFIRMACIÓN GPS ================= */}
      <Dialog open={confirmGps} onClose={() => setConfirmGps(false)}>
        <DialogTitle>
          ¿Autoriza actualizar la ubicación del cliente con el GPS actual?
        </DialogTitle>

        <DialogActions>
          <Button onClick={() => setConfirmGps(false)}>Cancelar</Button>

          <Button variant="contained" onClick={confirmGpsUpdate}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
