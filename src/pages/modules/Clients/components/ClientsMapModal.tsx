import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ClientFormData, Municipality } from "./ClientForm.types";

interface Client extends ClientFormData {
  id: number;
  municipality?: Municipality | null;
}

interface ClientsMapModalProps {
  open: boolean;
  onClose: () => void;
  clients: Client[];
  municipalityMap: Record<number, string>;
  selectedClient?: Client | null;
}

const defaultPos: [number, number] = [-27.3621, -55.9008];

const mapMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const selectedMarkerIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapController({
  clients,
  selectedClient,
}: {
  clients: Client[];
  selectedClient?: Client | null;
}) {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [map]);

  useEffect(() => {
    if (
      selectedClient &&
      selectedClient.latitude != null &&
      selectedClient.longitude != null
    ) {
      map.setView(
        [Number(selectedClient.latitude), Number(selectedClient.longitude)],
        16,
        { animate: true },
      );
      return;
    }

    if (!clients.length) return;

    const validPoints = clients
      .filter(
        (c) =>
          c.latitude != null &&
          c.longitude != null &&
          !Number.isNaN(Number(c.latitude)) &&
          !Number.isNaN(Number(c.longitude)),
      )
      .map(
        (c) => [Number(c.latitude), Number(c.longitude)] as [number, number],
      );

    if (!validPoints.length) return;

    if (validPoints.length === 1) {
      map.setView(validPoints[0], 14, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(validPoints);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [clients, selectedClient, map]);

  return null;
}

function MarkerWithAutoPopup({
  client,
  municipalityMap,
  isSelected,
}: {
  client: Client;
  municipalityMap: Record<number, string>;
  isSelected: boolean;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      setTimeout(() => {
        markerRef.current?.openPopup();
      }, 250);
    }
  }, [isSelected]);

  const municipalityId =
    client.municipality_id != null
      ? Number(client.municipality_id)
      : client.municipality?.id != null
        ? Number(client.municipality.id)
        : null;

  const municipalityName =
    client.municipality?.name ||
    (municipalityId != null ? municipalityMap[municipalityId] : "") ||
    "";

  return (
    <Marker
      ref={markerRef}
      position={[Number(client.latitude), Number(client.longitude)]}
      icon={isSelected ? selectedMarkerIcon : mapMarkerIcon}
    >
      <Popup>
        <Box>
          <Typography variant="subtitle2">{client.name}</Typography>

          {client.phone && (
            <Typography variant="body2">Teléfono: {client.phone}</Typography>
          )}

          {client.email && (
            <Typography variant="body2">Email: {client.email}</Typography>
          )}

          {client.address && (
            <Typography variant="body2">Dirección: {client.address}</Typography>
          )}

          {municipalityName && (
            <Typography variant="body2">
              Municipio: {municipalityName}
            </Typography>
          )}

          <Typography variant="body2">Lat: {client.latitude}</Typography>
          <Typography variant="body2">Lng: {client.longitude}</Typography>
        </Box>
      </Popup>
    </Marker>
  );
}

export default function ClientsMapModal({
  open,
  onClose,
  clients,
  municipalityMap,
  selectedClient,
}: ClientsMapModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        {selectedClient
          ? `Ubicación de ${selectedClient.name}`
          : "Mapa de clientes georreferenciados"}
      </DialogTitle>

      <DialogContent>
        {clients.length === 0 ? (
          <Typography>No hay clientes con ubicación geográfica.</Typography>
        ) : (
          <Box sx={{ height: 500, width: "100%", mt: 1 }}>
            <MapContainer
              center={defaultPos}
              zoom={11}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapController
                clients={clients}
                selectedClient={selectedClient}
              />

              {clients.map((client) => (
                <MarkerWithAutoPopup
                  key={client.id}
                  client={client}
                  municipalityMap={municipalityMap}
                  isSelected={selectedClient?.id === client.id}
                />
              ))}
            </MapContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
