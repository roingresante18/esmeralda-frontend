import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { createVehicle, updateVehicle } from "../api/vehicles.api";

import type {
  CreateVehiclePayload,
  UpdateVehiclePayload,
  Vehicle,
  VehicleStatus,
} from "../types/vehicle.types";

/*
 * =========================================================
 * PROPS
 * =========================================================
 */

interface VehicleFormDialogProps {
  open: boolean;

  vehicle?: Vehicle | null;

  onClose: () => void;

  onSuccess: (vehicle: Vehicle) => void;
}

/*
 * =========================================================
 * ESTADO INTERNO DEL FORMULARIO
 * =========================================================
 *
 * Los valores numéricos se conservan como string mientras
 * el usuario escribe.
 *
 * Esto evita problemas con:
 *
 * - campos vacíos;
 * - decimales;
 * - coma decimal;
 * - TextField type="number".
 */

interface VehicleFormState {
  plate: string;

  brand: string;

  model: string;

  year: string;

  fuel_type: string;

  estimated_consumption_l_100km: string;

  max_allowed_speed_kmh: string;

  current_odometer_km: string;

  status: VehicleStatus;

  notes: string;
}

/*
 * =========================================================
 * FORMULARIO VACÍO
 * =========================================================
 */

const EMPTY_FORM: VehicleFormState = {
  plate: "",

  brand: "",

  model: "",

  year: "",

  fuel_type: "",

  estimated_consumption_l_100km: "",

  max_allowed_speed_kmh: "",

  current_odometer_km: "",

  status: "ACTIVE",

  notes: "",
};

/*
 * =========================================================
 * NORMALIZAR NÚMERO
 * =========================================================
 *
 * Aceptamos:
 *
 * 12
 * 12.5
 * 12,5
 */

function parseOptionalNumber(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return undefined;
  }

  const parsed = Number(normalized);

  return parsed;
}

/*
 * =========================================================
 * NORMALIZAR PATENTE PARA LA INTERFAZ
 * =========================================================
 *
 * El backend también normaliza la patente.
 *
 * Esto simplemente mejora la experiencia visual mientras
 * el usuario escribe.
 */

function normalizePlateInput(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "");
}

/*
 * =========================================================
 * EXTRAER MENSAJE DE ERROR DE API
 * =========================================================
 *
 * El backend puede responder de varias maneras:
 *
 * 1.
 * {
 *   message: "Error"
 * }
 *
 * 2.
 * {
 *   message: ["error 1", "error 2"]
 * }
 *
 * 3.
 * {
 *   message: {
 *     message: "Error real",
 *     error: "Bad Request",
 *     statusCode: 400
 *   }
 * }
 *
 * Nunca enviamos un objeto directamente a React porque
 * produciría:
 *
 * Objects are not valid as a React child
 */

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) {
    return fallback;
  }

  const response = (
    error as {
      response?: {
        data?: {
          message?:
            | string
            | string[]
            | {
                message?: string | string[];
              };

          error?: string;
        };
      };
    }
  ).response;

  const backendMessage = response?.data?.message;

  /*
   * message: "Texto"
   */

  if (typeof backendMessage === "string") {
    return backendMessage;
  }

  /*
   * message: ["Texto 1", "Texto 2"]
   */

  if (Array.isArray(backendMessage)) {
    return backendMessage.map((item) => String(item)).join("\n");
  }

  /*
   * message: {
   *   message: "Texto"
   * }
   */

  if (backendMessage && typeof backendMessage === "object") {
    const nestedMessage = backendMessage.message;

    if (typeof nestedMessage === "string") {
      return nestedMessage;
    }

    if (Array.isArray(nestedMessage)) {
      return nestedMessage.map((item) => String(item)).join("\n");
    }
  }

  /*
   * Fallback secundario:
   *
   * {
   *   error: "Bad Request"
   * }
   */

  if (typeof response?.data?.error === "string") {
    return response.data.error;
  }

  return fallback;
}

/*
 * =========================================================
 * COMPONENTE
 * =========================================================
 */

export default function VehicleFormDialog({
  open,
  vehicle,
  onClose,
  onSuccess,
}: VehicleFormDialogProps) {
  const [form, setForm] = useState<VehicleFormState>(EMPTY_FORM);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(vehicle?.id);

  /*
   * =======================================================
   * CARGAR DATOS
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    /*
     * Cada apertura comienza sin errores anteriores.
     */

    setError(null);

    setSaving(false);

    /*
     * =====================================================
     * ALTA
     * =====================================================
     */

    if (!vehicle) {
      setForm({
        ...EMPTY_FORM,
      });

      return;
    }

    /*
     * =====================================================
     * EDICIÓN
     * =====================================================
     */

    setForm({
      plate: vehicle.plate ?? "",

      brand: vehicle.brand ?? "",

      model: vehicle.model ?? "",

      year: vehicle.year != null ? String(vehicle.year) : "",

      fuel_type: vehicle.fuel_type ?? "",

      estimated_consumption_l_100km:
        vehicle.estimated_consumption_l_100km != null
          ? String(vehicle.estimated_consumption_l_100km)
          : "",

      max_allowed_speed_kmh:
        vehicle.max_allowed_speed_kmh != null
          ? String(vehicle.max_allowed_speed_kmh)
          : "",

      current_odometer_km:
        vehicle.current_odometer_km != null
          ? String(vehicle.current_odometer_km)
          : "",

      status: vehicle.status,

      notes: vehicle.notes ?? "",
    });
  }, [open, vehicle]);

  /*
   * =======================================================
   * ACTUALIZAR CAMPO
   * =======================================================
   */

  const updateField = (field: keyof VehicleFormState, value: string) => {
    /*
     * Limpiamos el error cuando el usuario empieza
     * a corregir el formulario.
     */

    if (error) {
      setError(null);
    }

    let nextValue = value;

    /*
     * La patente se muestra normalizada desde el frontend.
     */

    if (field === "plate") {
      nextValue = normalizePlateInput(value);
    }

    setForm((current) => ({
      ...current,

      [field]: nextValue,
    }));
  };

  /*
   * =======================================================
   * VALIDACIONES
   * =======================================================
   */

  const validate = (): string | null => {
    /*
     * ===================================================
     * IDENTIFICACIÓN
     * ===================================================
     */

    if (!form.plate.trim()) {
      return "La patente es obligatoria.";
    }

    if (!form.brand.trim()) {
      return "La marca es obligatoria.";
    }

    if (!form.model.trim()) {
      return "El modelo es obligatorio.";
    }

    /*
     * ===================================================
     * AÑO
     * ===================================================
     */

    if (form.year.trim()) {
      const year = Number(form.year);

      if (!Number.isInteger(year) || year < 1900 || year > 2200) {
        return "El año del vehículo no es válido.";
      }
    }

    /*
     * ===================================================
     * CONSUMO
     * ===================================================
     */

    if (form.estimated_consumption_l_100km.trim()) {
      const consumption = parseOptionalNumber(
        form.estimated_consumption_l_100km,
      );

      if (
        consumption == null ||
        !Number.isFinite(consumption) ||
        consumption < 0
      ) {
        return "El consumo estimado no es válido.";
      }
    }

    /*
     * ===================================================
     * VELOCIDAD
     * ===================================================
     */

    if (form.max_allowed_speed_kmh.trim()) {
      const speed = parseOptionalNumber(form.max_allowed_speed_kmh);

      if (
        speed == null ||
        !Number.isFinite(speed) ||
        speed < 1 ||
        speed > 300
      ) {
        return "La velocidad máxima debe estar entre 1 y 300 km/h.";
      }
    }

    /*
     * ===================================================
     * ODOMETRO
     * ===================================================
     */

    if (form.current_odometer_km.trim()) {
      const odometer = parseOptionalNumber(form.current_odometer_km);

      if (odometer == null || !Number.isFinite(odometer) || odometer < 0) {
        return "El odómetro no es válido.";
      }

      /*
       * Validación frontend adicional.
       *
       * El backend sigue siendo la autoridad final,
       * pero evitamos una petición innecesaria.
       */

      if (isEditing && vehicle?.current_odometer_km != null) {
        const previousOdometer = Number(vehicle.current_odometer_km);

        if (Number.isFinite(previousOdometer) && odometer < previousOdometer) {
          return `El kilometraje actual no puede ser menor al registrado (${previousOdometer.toLocaleString(
            "es-AR",
          )} km).`;
        }
      }
    }

    return null;
  };

  /*
   * =======================================================
   * PAYLOAD DE CREACIÓN
   * =======================================================
   */

  const buildCreatePayload = (): CreateVehiclePayload => {
    const payload: CreateVehiclePayload = {
      plate: normalizePlateInput(form.plate),

      brand: form.brand.trim(),

      model: form.model.trim(),
    };

    /*
     * ===================================================
     * OPCIONALES
     * ===================================================
     */

    const year = parseOptionalNumber(form.year);

    if (year !== undefined) {
      payload.year = year;
    }

    if (form.fuel_type.trim()) {
      payload.fuel_type = form.fuel_type.trim();
    }

    const consumption = parseOptionalNumber(form.estimated_consumption_l_100km);

    if (consumption !== undefined) {
      payload.estimated_consumption_l_100km = consumption;
    }

    const maxSpeed = parseOptionalNumber(form.max_allowed_speed_kmh);

    if (maxSpeed !== undefined) {
      payload.max_allowed_speed_kmh = maxSpeed;
    }

    const odometer = parseOptionalNumber(form.current_odometer_km);

    if (odometer !== undefined) {
      payload.current_odometer_km = odometer;
    }

    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }

    return payload;
  };

  /*
   * =======================================================
   * PAYLOAD DE EDICIÓN
   * =======================================================
   */

  const buildUpdatePayload = (): UpdateVehiclePayload => {
    const createPayload = buildCreatePayload();

    return {
      ...createPayload,

      status: form.status,
    };
  };

  /*
   * =======================================================
   * CERRAR MODAL
   * =======================================================
   */

  const handleClose = () => {
    if (saving) {
      return;
    }

    setError(null);

    onClose();
  };

  /*
   * =======================================================
   * GUARDAR
   * =======================================================
   */

  const handleSave = async () => {
    /*
     * ===================================================
     * VALIDACIÓN LOCAL
     * ===================================================
     */

    const validationError = validate();

    if (validationError) {
      setError(validationError);

      return;
    }

    try {
      setSaving(true);

      setError(null);

      let savedVehicle: Vehicle;

      /*
       * =================================================
       * EDICIÓN
       * =================================================
       */

      if (isEditing && vehicle) {
        savedVehicle = await updateVehicle(
          vehicle.id,

          buildUpdatePayload(),
        );
      } else {
        /*
         * ===============================================
         * CREACIÓN
         * ===============================================
         */

        savedVehicle = await createVehicle(buildCreatePayload());
      }

      /*
       * =================================================
       * ÉXITO
       * =================================================
       */

      onSuccess(savedVehicle);
    } catch (apiError: unknown) {
      /*
       * =================================================
       * ERROR DEL BACKEND
       * =================================================
       *
       * Nunca intentamos renderizar directamente
       * response.data.message.
       *
       * Puede venir como string, array u objeto.
       */

      const message = getApiErrorMessage(
        apiError,
        "No se pudo guardar el vehículo.",
      );

      console.error("[VEHICLES] Error guardando vehículo:", apiError);

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      {/* =================================================
          TÍTULO
          ================================================= */}

      <DialogTitle>
        {isEditing ? "Editar vehículo" : "Nuevo vehículo"}
      </DialogTitle>

      {/* =================================================
          CONTENIDO
          ================================================= */}

      <DialogContent>
        <Stack
          spacing={2}
          sx={{
            mt: 1,
          }}
        >
          {/* ERROR */}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* =================================================
              IDENTIFICACIÓN
              ================================================= */}

          <Typography variant="subtitle2" color="text.secondary">
            Identificación
          </Typography>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <TextField
              label="Patente"
              value={form.plate}
              onChange={(event) => updateField("plate", event.target.value)}
              fullWidth
              required
              disabled={saving}
              inputProps={{
                maxLength: 20,
              }}
              helperText="Se guardará sin espacios y en mayúsculas"
            />

            <TextField
              label="Marca"
              value={form.brand}
              onChange={(event) => updateField("brand", event.target.value)}
              fullWidth
              required
              disabled={saving}
            />

            <TextField
              label="Modelo"
              value={form.model}
              onChange={(event) => updateField("model", event.target.value)}
              fullWidth
              required
              disabled={saving}
            />
          </Stack>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <TextField
              label="Año"
              type="number"
              value={form.year}
              onChange={(event) => updateField("year", event.target.value)}
              fullWidth
              disabled={saving}
              inputProps={{
                min: 1900,
                max: 2200,
              }}
            />

            <TextField
              label="Combustible"
              value={form.fuel_type}
              onChange={(event) => updateField("fuel_type", event.target.value)}
              placeholder="Ej: Nafta, Diesel, GNC"
              fullWidth
              disabled={saving}
            />
          </Stack>

          {/* =================================================
              PARÁMETROS OPERATIVOS
              ================================================= */}

          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{
              mt: 1,
            }}
          >
            Parámetros operativos
          </Typography>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <TextField
              label="Consumo estimado"
              value={form.estimated_consumption_l_100km}
              onChange={(event) =>
                updateField("estimated_consumption_l_100km", event.target.value)
              }
              helperText="Litros cada 100 km"
              fullWidth
              disabled={saving}
              inputProps={{
                inputMode: "decimal",
              }}
            />

            <TextField
              label="Velocidad máxima"
              value={form.max_allowed_speed_kmh}
              onChange={(event) =>
                updateField("max_allowed_speed_kmh", event.target.value)
              }
              helperText="Límite utilizado por telemetría"
              fullWidth
              disabled={saving}
              inputProps={{
                inputMode: "decimal",
              }}
            />

            <TextField
              label="Odómetro actual"
              value={form.current_odometer_km}
              onChange={(event) =>
                updateField("current_odometer_km", event.target.value)
              }
              helperText={
                isEditing && vehicle?.current_odometer_km != null
                  ? `Último registrado: ${Number(
                      vehicle.current_odometer_km,
                    ).toLocaleString("es-AR")} km. No puede disminuir.`
                  : "Kilometraje actual conocido del vehículo"
              }
              fullWidth
              disabled={saving}
              inputProps={{
                inputMode: "decimal",
              }}
            />
          </Stack>

          {/* =================================================
              ESTADO
              ================================================= */}

          {isEditing && (
            <TextField
              select
              label="Estado"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              fullWidth
              disabled={saving}
            >
              <MenuItem value="ACTIVE">Activo</MenuItem>

              <MenuItem value="MAINTENANCE">En mantenimiento</MenuItem>

              <MenuItem value="INACTIVE">Inactivo</MenuItem>
            </TextField>
          )}

          {/* =================================================
              OBSERVACIONES
              ================================================= */}

          <TextField
            label="Observaciones"
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={saving}
            placeholder="Mantenimiento, particularidades del vehículo, información operativa..."
          />
        </Stack>
      </DialogContent>

      {/* ===================================================
          ACCIONES
          =================================================== */}

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={() => void handleSave()}
          disabled={saving}
        >
          {saving
            ? "Guardando..."
            : isEditing
              ? "Guardar cambios"
              : "Crear vehículo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
