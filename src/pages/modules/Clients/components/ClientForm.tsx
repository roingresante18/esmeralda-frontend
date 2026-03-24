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
  Paper,
  Typography,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { ClientFormData, Municipality } from "./ClientForm.types";
import api from "../../../../api/api";
import "leaflet/dist/leaflet.css";
import MapPicker from "./MapPicker";

type Mode = "create" | "edit";

interface Props {
  mode: Mode;
  clientId?: number | null;
  value: ClientFormData;
  onChange: (data: ClientFormData) => void;
  onSuccess?: (client: any) => void;
}

export default function ClientForm({
  mode,
  clientId,
  value,
  onChange,
  onSuccess,
}: Props) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [existingClient, setExistingClient] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const serverErrorText =
    typeof serverError === "string" ? serverError.toLowerCase() : "";

  /* ================= CARGAR MUNICIPIOS ================= */
  useEffect(() => {
    api
      .get("/logistics/municipalities")
      .then((res) => setMunicipalities(res.data.municipalities))
      .catch(() => setMunicipalities([]));
  }, []);

  /* ================= LIMPIAR ERROR SI CAMBIA EL FORM ================= */
  useEffect(() => {
    if (serverError) {
      setServerError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    value.name,
    value.phone,
    value.email,
    value.address,
    value.municipality_id,
  ]);

  /* ================= BUSCAR DUPLICADOS ================= */
  useEffect(() => {
    if (mode === "edit" || !value.phone || value.phone.length < 4) {
      setSuggestions([]);
      setExistingClient(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get(`/clients/search?phone=${value.phone}`);

        if (res.data.exact) {
          setExistingClient(res.data.exact);
          setSuggestions([]);
        } else {
          setExistingClient(null);
          setSuggestions(res.data.suggestions || []);
        }
      } catch {
        setExistingClient(null);
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value.phone, mode]);

  /* ================= VALIDACIONES ================= */
  const isNameValid = !!value.name?.trim();
  const isPhoneValid = !!value.phone?.trim() && /^\d{10,13}$/.test(value.phone);

  const isMunicipalityValid =
    value.municipality_id !== null && value.municipality_id !== undefined;

  const isEmailValid =
    !value.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email);

  const isFormValid =
    isNameValid &&
    isPhoneValid &&
    isMunicipalityValid &&
    isEmailValid &&
    !(existingClient && mode === "create") &&
    !searching;

  /* ================= SUBMIT AUTÓNOMO ================= */

  const handleSubmit = async () => {
    if (!isFormValid) return;

    if (mode === "edit" && !clientId) {
      setServerError("No se pudo determinar el cliente a editar.");
      return;
    }

    setServerError(null);
    setLoading(true);

    try {
      const payload = {
        name: value.name,
        phone: value.phone,
        email: value.email?.trim() ? value.email.trim() : null,
        address: value.address?.trim() ? value.address.trim() : null,
        municipality_id:
          value.municipality_id != null ? Number(value.municipality_id) : null,
        latitude:
          value.latitude !== undefined && value.latitude !== null
            ? Number(value.latitude)
            : null,
        longitude:
          value.longitude !== undefined && value.longitude !== null
            ? Number(value.longitude)
            : null,
      };

      let response;

      if (mode === "create") {
        response = await api.post("/clients", payload);
      } else {
        response = await api.patch(`/clients/${clientId}`, payload);
      }

      onSuccess?.(response.data);
    } catch (err: any) {
      let message = "Error al guardar cliente";

      if (err?.response?.data?.message) {
        if (Array.isArray(err.response.data.message)) {
          message = err.response.data.message.join(", ");
        } else if (typeof err.response.data.message === "string") {
          message = err.response.data.message;
        } else {
          message = JSON.stringify(err.response.data.message);
        }
      } else if (err?.response?.data?.error) {
        message = err.response.data.error;
      }

      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 3,
        height: "100%",
      }}
    >
      {/* ================= FORMULARIO ================= */}
      <Box
        sx={{
          flex: 0.3,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          overflowY: "auto",
          maxHeight: "80vh",
        }}
      >
        {serverError && (
          <Paper
            sx={{
              p: 2,
              borderLeft: "5px solid #d32f2f",
              backgroundColor: "#fff5f5",
            }}
          >
            <Typography color="error">{serverError}</Typography>
          </Paper>
        )}

        <TextField
          label="Nombre *"
          required
          value={value.name}
          error={!isNameValid && value.name !== ""}
          helperText={
            !isNameValid && value.name !== "" ? "Nombre obligatorio" : ""
          }
          onChange={(e) =>
            onChange({ ...value, name: e.target.value.toUpperCase() })
          }
        />

        <TextField
          label="Teléfono *"
          required
          value={value.phone || ""}
          error={
            (!isPhoneValid && value.phone !== "") ||
            (existingClient && mode === "create") ||
            serverErrorText.includes("teléfono")
          }
          helperText={
            serverErrorText.includes("teléfono")
              ? serverError
              : existingClient && mode === "create"
                ? `⚠️ Ya existe un cliente: ${existingClient.name}`
                : !isPhoneValid && value.phone !== ""
                  ? "Debe tener entre 10 y 13 dígitos numéricos"
                  : ""
          }
          onChange={(e) =>
            onChange({ ...value, phone: e.target.value.replace(/\D/g, "") })
          }
          InputProps={{
            endAdornment: (searching || loading) && (
              <CircularProgress size={18} />
            ),
          }}
        />

        <FormControl
          required
          error={!isMunicipalityValid && value.municipality_id !== null}
        >
          <InputLabel>Municipio *</InputLabel>

          <Select
            value={value.municipality_id ?? ""}
            label="Municipio *"
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

          <FormHelperText>
            {!isMunicipalityValid && value.municipality_id !== null
              ? "Seleccione municipio"
              : ""}
          </FormHelperText>
        </FormControl>

        {suggestions.length > 0 && (
          <Paper>
            {suggestions.map((client) => (
              <MenuItem
                key={client.id}
                onClick={() =>
                  onChange({
                    ...value,
                    phone: client.phone,
                    name: client.name,
                    address: client.address,
                    municipality_id: Number(client.municipality_id),
                  })
                }
              >
                {client.name} — {client.phone}
              </MenuItem>
            ))}
          </Paper>
        )}

        <TextField
          label="Email"
          value={value.email || ""}
          error={!isEmailValid && value.email !== ""}
          helperText={
            !isEmailValid && value.email !== "" ? "Email inválido" : ""
          }
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />

        <TextField
          label="Dirección"
          value={value.address || ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />

        <Button
          variant="contained"
          size="large"
          disabled={!isFormValid || loading}
          onClick={handleSubmit}
        >
          {mode === "create" ? "Crear cliente" : "Guardar cambios"}
        </Button>

        <Divider />
      </Box>

      {/* ================= MAPA ================= */}

      <Box
        sx={{
          flex: 1,
          minHeight: 400,
          border: "1px solid #ccc",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Typography variant="h6" sx={{ p: 1 }}>
          Ubicación del cliente
        </Typography>

        <MapPicker
          initialPosition={
            value.latitude != null && value.longitude != null
              ? { lat: value.latitude, lng: value.longitude }
              : null
          }
          onSelect={(latlng: any) =>
            onChange({
              ...value,
              latitude: latlng.lat,
              longitude: latlng.lng,
            })
          }
        />
      </Box>
    </Box>
  );
}
