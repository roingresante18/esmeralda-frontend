import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import api from "../../../api/api";

import { createDriverShift } from "../api/shifts.api";

import { getVehicles } from "../api/vehicles.api";

import type { DriverShift, ShiftDriver } from "../types/shift.types";

import type { Vehicle } from "../types/vehicle.types";

/*
 * =========================================================
 * RESULTADO
 * =========================================================
 *
 * Conservamos esta interfaz por compatibilidad con
 * LogisticsOrders.
 *
 * Con el nuevo backend transaccional:
 *
 * éxito:
 * todos los pedidos fueron asignados.
 *
 * error:
 * no se crea absolutamente nada.
 *
 * Por eso failedOrderIds será [] cuando onSuccess sea
 * ejecutado.
 */

export interface CreateShiftResult {
  requestedOrderIds: number[];

  assignedOrderIds: number[];

  failedOrderIds: number[];
}

/*
 * =========================================================
 * PROPS
 * =========================================================
 */

interface CreateShiftDialogProps {
  open: boolean;

  /*
   * Ahora es operacionalmente obligatorio.
   *
   * Lo mantenemos opcional a nivel TypeScript porque
   * distintas pantallas ya utilizan el componente,
   * pero el formulario no permitirá crear la jornada
   * si no existe al menos un pedido.
   */
  orderIds?: number[];

  onClose: () => void;

  onSuccess: (shift: DriverShift, result: CreateShiftResult) => void;
}

/*
 * =========================================================
 * ERROR DE API
 * =========================================================
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
   * message: "..."
   */

  if (typeof backendMessage === "string") {
    return backendMessage;
  }

  /*
   * message: ["...", "..."]
   */

  if (Array.isArray(backendMessage)) {
    return backendMessage.map((item) => String(item)).join("\n");
  }

  /*
   * message: {
   *   message: "..."
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

  if (typeof response?.data?.error === "string") {
    return response.data.error;
  }

  return fallback;
}

/*
 * =========================================================
 * FECHA LOCAL PARA INPUT DATE
 * =========================================================
 */

function getTodayDateInput(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/*
 * =========================================================
 * NORMALIZAR IDS
 * =========================================================
 */

function normalizeOrderIds(orderIds?: number[]): number[] {
  return [
    ...new Set(
      (orderIds ?? [])
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}

/*
 * =========================================================
 * COMPONENTE
 * =========================================================
 */

export default function CreateShiftDialog({
  open,
  orderIds,
  onClose,
  onSuccess,
}: CreateShiftDialogProps) {
  /*
   * =======================================================
   * OPCIONES
   * =======================================================
   */

  const [drivers, setDrivers] = useState<ShiftDriver[]>([]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  /*
   * =======================================================
   * FORMULARIO
   * =======================================================
   */

  const [driverId, setDriverId] = useState<number | "">("");

  const [vehicleId, setVehicleId] = useState<number | "">("");

  const [scheduledDate, setScheduledDate] = useState(getTodayDateInput());

  const [notes, setNotes] = useState("");

  /*
   * =======================================================
   * UI
   * =======================================================
   */

  const [loadingOptions, setLoadingOptions] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * =======================================================
   * PEDIDOS
   * =======================================================
   */

  const normalizedOrderIds = useMemo(
    () => normalizeOrderIds(orderIds),
    [orderIds],
  );

  const hasOrders = normalizedOrderIds.length > 0;

  /*
   * =======================================================
   * CARGAR REPARTIDORES Y VEHÍCULOS
   * =======================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    /*
     * Reiniciamos el formulario en cada apertura.
     */

    setDriverId("");

    setVehicleId("");

    setScheduledDate(getTodayDateInput());

    setNotes("");

    setError(null);

    setSaving(false);

    const loadOptions = async () => {
      try {
        setLoadingOptions(true);

        const [usersResponse, vehicleData] = await Promise.all([
          api.get("/users"),

          getVehicles(),
        ]);

        if (cancelled) {
          return;
        }

        /*
         * =================================================
         * USUARIOS
         * =================================================
         */

        const users: ShiftDriver[] = Array.isArray(usersResponse.data)
          ? usersResponse.data
          : Array.isArray(usersResponse.data?.data)
            ? usersResponse.data.data
            : [];

        const deliveryUsers = users.filter((user) => {
          const role = String(user.role ?? "").toUpperCase();

          /*
           * REPARTIDOR es el rol real actual.
           *
           * Conservamos los alias para compatibilidad.
           */
          return ["REPARTIDOR", "REPARTO", "DELIVERY"].includes(role);
        });

        /*
         * =================================================
         * VEHÍCULOS
         * =================================================
         */

        const activeVehicles = vehicleData.filter(
          (vehicle) => vehicle.status === "ACTIVE",
        );

        setDrivers(deliveryUsers);

        setVehicles(activeVehicles);
      } catch (apiError) {
        if (cancelled) {
          return;
        }

        setError(
          getApiErrorMessage(
            apiError,
            "No se pudieron cargar los repartidores y vehículos.",
          ),
        );
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
   * =======================================================
   * VEHÍCULO SELECCIONADO
   * =======================================================
   */

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null,
    [vehicleId, vehicles],
  );

  /*
   * =======================================================
   * CREAR JORNADA
   * =======================================================
   *
   * AHORA EXISTE UNA SOLA OPERACIÓN HTTP.
   *
   * POST /fleet/shifts
   *
   * El backend crea atómicamente:
   *
   * DriverShift
   * OrderDelivery
   * Order → ASSIGNED
   * OrderStatusHistory
   * DriverShiftOrder
   */

  const handleCreate = async () => {
    /*
     * =====================================================
     * PEDIDOS
     * =====================================================
     */

    if (!hasOrders) {
      setError("Seleccioná al menos un pedido antes de crear una jornada.");

      return;
    }

    /*
     * =====================================================
     * REPARTIDOR
     * =====================================================
     */

    if (!driverId) {
      setError("Seleccioná un repartidor.");

      return;
    }

    /*
     * =====================================================
     * VEHÍCULO
     * =====================================================
     */

    if (!vehicleId) {
      setError("Seleccioná un vehículo.");

      return;
    }

    /*
     * =====================================================
     * FECHA
     * =====================================================
     */

    if (!scheduledDate) {
      setError("Seleccioná la fecha de la jornada.");

      return;
    }

    try {
      setSaving(true);

      setError(null);

      /*
       * ===================================================
       * UNA SOLA PETICIÓN
       * ===================================================
       */

      const shift = await createDriverShift({
        driver_id: driverId,

        vehicle_id: vehicleId,

        scheduled_date: scheduledDate,

        order_ids: normalizedOrderIds,

        ...(notes.trim()
          ? {
              notes: notes.trim(),
            }
          : {}),
      });

      /*
       * ===================================================
       * RESULTADO
       * ===================================================
       *
       * Si llegamos acá la transacción completa terminó.
       *
       * Por lo tanto TODOS los pedidos fueron asignados.
       */

      onSuccess(shift, {
        requestedOrderIds: normalizedOrderIds,

        assignedOrderIds: normalizedOrderIds,

        failedOrderIds: [],
      });
    } catch (apiError) {
      /*
       * Si falla, el backend hizo rollback.
       *
       * No existe una jornada parcialmente armada.
       */

      console.error("[LOGISTICS][CREATE SHIFT]", apiError);

      setError(getApiErrorMessage(apiError, "No se pudo crear la jornada."));
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
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      {/* =================================================
          TÍTULO
          ================================================= */}

      <DialogTitle>Armar jornada de reparto</DialogTitle>

      <DialogContent>
        <Stack
          spacing={2}
          sx={{
            mt: 1,
          }}
        >
          {/* ===============================================
              ERROR
              =============================================== */}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* ===============================================
              SIN PEDIDOS
              =============================================== */}

          {!hasOrders && (
            <Alert severity="warning">
              Para crear una jornada primero tenés que seleccionar al menos un
              pedido desde la pantalla de Pedidos para reparto.
            </Alert>
          )}

          {/* ===============================================
              PEDIDOS SELECCIONADOS
              =============================================== */}

          {hasOrders && (
            <Alert severity="info">
              La jornada se creará con{" "}
              <strong>{normalizedOrderIds.length}</strong>{" "}
              {normalizedOrderIds.length === 1
                ? "pedido seleccionado"
                : "pedidos seleccionados"}
              .
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            Seleccioná el repartidor, vehículo y fecha de salida. El odómetro
            inicial será ingresado obligatoriamente por el chofer al comenzar
            realmente la jornada.
          </Typography>

          {/* ===============================================
              FECHA
              =============================================== */}

          <TextField
            type="date"
            label="Fecha de jornada"
            value={scheduledDate}
            onChange={(event) => {
              setScheduledDate(event.target.value);

              setError(null);
            }}
            InputLabelProps={{
              shrink: true,
            }}
            required
            disabled={saving || !hasOrders}
            fullWidth
          />

          {/* ===============================================
              REPARTIDOR
              =============================================== */}

          <TextField
            select
            label="Repartidor"
            value={driverId}
            onChange={(event) => {
              setDriverId(Number(event.target.value) || "");

              setError(null);
            }}
            required
            disabled={saving || loadingOptions || !hasOrders}
            fullWidth
          >
            <MenuItem value="">Seleccionar repartidor</MenuItem>

            {drivers.map((driver) => (
              <MenuItem key={driver.id} value={driver.id}>
                {driver.full_name ||
                  driver.name ||
                  driver.email ||
                  `Usuario #${driver.id}`}
              </MenuItem>
            ))}
          </TextField>

          {/* ===============================================
              VEHÍCULO
              =============================================== */}

          <TextField
            select
            label="Vehículo"
            value={vehicleId}
            onChange={(event) => {
              setVehicleId(Number(event.target.value) || "");

              setError(null);
            }}
            required
            disabled={saving || loadingOptions || !hasOrders}
            fullWidth
          >
            <MenuItem value="">Seleccionar vehículo</MenuItem>

            {vehicles.map((vehicle) => (
              <MenuItem key={vehicle.id} value={vehicle.id}>
                {vehicle.plate} · {vehicle.brand} {vehicle.model}
              </MenuItem>
            ))}
          </TextField>

          {/* ===============================================
              INFO VEHÍCULO
              =============================================== */}

          {selectedVehicle && (
            <Alert severity="info">
              <strong>{selectedVehicle.plate}</strong>
              {" · "}
              {selectedVehicle.brand} {selectedVehicle.model}
              {selectedVehicle.current_odometer_km != null && (
                <>
                  {" · Último odómetro registrado: "}
                  {Number(selectedVehicle.current_odometer_km).toLocaleString(
                    "es-AR",
                  )}{" "}
                  km
                </>
              )}
            </Alert>
          )}

          {/* ===============================================
              OBSERVACIONES
              =============================================== */}

          <TextField
            label="Observaciones"
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);

              setError(null);
            }}
            placeholder="Opcional..."
            multiline
            minRows={3}
            disabled={saving || !hasOrders}
            fullWidth
          />

          {/* ===============================================
              CARGANDO OPCIONES
              =============================================== */}

          {loadingOptions && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} />

              <Typography variant="body2" color="text.secondary">
                Cargando repartidores y vehículos...
              </Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>

      {/* ===================================================
          ACCIONES
          =================================================== */}

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>

        <Button
          variant="contained"
          onClick={() => void handleCreate()}
          disabled={saving || loadingOptions || !hasOrders}
        >
          {saving
            ? "Armando jornada..."
            : `Crear jornada${
                hasOrders ? ` (${normalizedOrderIds.length})` : ""
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
