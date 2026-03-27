import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import type { GPSPoint } from "../../types/delivery.types";
import ConfirmOrderMap from "../../../../pages/orders/ConfirmOrderMap";

interface Props {
  open: boolean;
  onClose: () => void;
  initialGps?: GPSPoint | null;
  clientReferenceGps?: GPSPoint | null;
  onConfirm: (point: GPSPoint) => void;
}

export default function DeliveryGpsMapDialog({
  open,
  onClose,
  initialGps,
  clientReferenceGps,
  onConfirm,
}: Props) {
  const [selectedPoint, setSelectedPoint] = useState<{
    lat?: number;
    lng?: number;
  }>({
    lat: initialGps?.latitude,
    lng: initialGps?.longitude,
  });

  useEffect(() => {
    if (open) {
      setSelectedPoint({
        lat: initialGps?.latitude,
        lng: initialGps?.longitude,
      });
    }
  }, [open, initialGps]);

  const handleConfirm = () => {
    if (selectedPoint.lat == null || selectedPoint.lng == null) return;

    onConfirm({
      latitude: selectedPoint.lat,
      longitude: selectedPoint.lng,
      source: "ORDER_CONFIRMED",
      capturedAt: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Definir GPS de entrega</DialogTitle>

      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Podés definir el GPS haciendo click en el mapa, buscando una
            dirección o pegando un link de ubicación.
          </Alert>

          {selectedPoint.lat != null && selectedPoint.lng != null ? (
            <Typography variant="body2">
              GPS seleccionado: {selectedPoint.lat.toFixed(6)},{" "}
              {selectedPoint.lng.toFixed(6)}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Todavía no seleccionaste una ubicación.
            </Typography>
          )}

          <Box sx={{ width: "100%", height: 500 }}>
            <ConfirmOrderMap
              value={selectedPoint}
              clientLocation={{
                lat: clientReferenceGps?.latitude,
                lng: clientReferenceGps?.longitude,
              }}
              allowSelection
              onChange={(point) => setSelectedPoint(point)}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={selectedPoint.lat == null || selectedPoint.lng == null}
        >
          Guardar GPS
        </Button>
      </DialogActions>
    </Dialog>
  );
}
