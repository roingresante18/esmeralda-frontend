// components/DeliveryConfirmationDialog.tsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { useState } from "react";
import api from "../../../api/api";

/**
 * Validación Haversine real
 */
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const DeliveryConfirmationDialog = ({
  open,
  order,
  onClose,
  onSuccess,
}: any) => {
  const [loading, setLoading] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const confirmDelivery = async () => {
    if (!paymentConfirmed) return;

    if (!navigator.geolocation) {
      alert("GPS no soportado.");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          // Validación segura (permite 0)
          if (
            order.delivery_latitude !== undefined &&
            order.delivery_longitude !== undefined
          ) {
            const distance = getDistanceInMeters(
              order.delivery_latitude,
              order.delivery_longitude,
              latitude,
              longitude,
            );

            if (distance > 150) {
              alert("Debe estar dentro de 150m.");
              setLoading(false);
              return;
            }
          }

          await api.patch(`/orders/${order.id}/deliver`, {
            new_status: "DELIVERED",
            delivery_latitude: latitude,
            delivery_longitude: longitude,
            delivered_at: new Date().toISOString(),
            payment_confirmed: true,
          });

          onSuccess();
          onClose();
        } catch (err) {
          console.error(err);
          alert("Error confirmando entrega.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        alert("No se pudo obtener ubicación.");
        setLoading(false);
      },
      { enableHighAccuracy: true },
    );
  };

  return (
    <Dialog open={open} fullWidth>
      <DialogTitle>Confirmar entrega</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={paymentConfirmed}
              onChange={(e) => setPaymentConfirmed(e.target.checked)}
            />
          }
          label="Confirmo que el pago fue recibido"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          disabled={!paymentConfirmed || loading}
          onClick={confirmDelivery}
        >
          {loading ? <CircularProgress size={20} /> : "Confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
