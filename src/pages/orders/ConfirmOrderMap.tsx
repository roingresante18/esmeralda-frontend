import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  IconButton,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import SearchIcon from "@mui/icons-material/Search";

const defaultPos: [number, number] = [-27.45, -58.99];
const SEARCH_BBOX = "-56.5,-28.2,-53.5,-25.5";

type Props = {
  value: { lat?: number | string; lng?: number | string };
  clientLocation?: { lat?: number | string; lng?: number | string };
  allowSelection?: boolean;
  onChange: (v: { lat: number; lng: number }) => void;
};

type PhotonFeature = {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    city?: string;
    street?: string;
    housenumber?: string;
  };
};

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const clientIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const toValidNumber = (value?: number | string) => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const samePoint = (
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null,
  tolerance = 0.00001,
) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
    return false;
  }

  return Math.abs(lat1 - lat2) < tolerance && Math.abs(lng1 - lng2) < tolerance;
};

function HoverIconAccordion({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-block",
        mr: 1,
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Tooltip title="Mostrar búsqueda" placement="bottom">
        <IconButton size="small" sx={{ backgroundColor: "#f5f5f5" }}>
          {icon}
        </IconButton>
      </Tooltip>

      {open && (
        <Box
          sx={{
            position: "absolute",
            backgroundColor: "white",
            top: 40,
            left: 0,
            zIndex: 1000,
            width: 280,
            p: 1,
            borderRadius: 1,
            boxShadow: 3,
            pointerEvents: "auto",
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

export default function ConfirmOrderMap({
  value,
  clientLocation,
  allowSelection = true,
  onChange,
}: Props) {
  // console.log("ConfirmOrderMap props", {
  //   value,
  //   clientLocation,
  //   allowSelection,
  // });

  const [link, setLink] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedLat = toValidNumber(value.lat);
  const selectedLng = toValidNumber(value.lng);
  const clientLat = toValidNumber(clientLocation?.lat);
  const clientLng = toValidNumber(clientLocation?.lng);

  // console.log("ConfirmOrderMap coords parseadas", {
  //   selectedLat,
  //   selectedLng,
  //   clientLat,
  //   clientLng,
  //   hasSelectedPoint: selectedLat != null && selectedLng != null,
  //   hasClientPoint: clientLat != null && clientLng != null,
  // });

  const hasSelectedPoint = selectedLat != null && selectedLng != null;
  const hasClientPoint = clientLat != null && clientLng != null;

  const overlap = samePoint(selectedLat, selectedLng, clientLat, clientLng);

  const center: [number, number] = hasSelectedPoint
    ? [selectedLat, selectedLng]
    : hasClientPoint
      ? [clientLat, clientLng]
      : defaultPos;

  useEffect(() => {
    if (!allowSelection) {
      setResults([]);
      return;
    }

    if (search.trim().length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            search,
          )}&bbox=${SEARCH_BBOX}&limit=5`,
        );

        const data = await res.json();
        setResults(Array.isArray(data?.features) ? data.features : []);
      } catch (error) {
        console.error("Error en búsqueda de dirección:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search, allowSelection]);

  const handleLink = () => {
    if (!allowSelection || !link.trim()) return;

    const decodedLink = decodeURIComponent(link);

    const patterns = [
      /(-?\d+\.\d+),\s*(-?\d+\.\d+)/,
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];

    for (const pattern of patterns) {
      const match = decodedLink.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);

        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          onChange({ lat, lng });
          return;
        }
      }
    }

    alert("No se pudieron obtener coordenadas desde el link");
  };

  const handleSelect = (feature: PhotonFeature) => {
    if (!allowSelection) return;

    const [lng, lat] = feature.geometry.coordinates;
    onChange({ lat, lng });

    const label =
      feature.properties.name ||
      feature.properties.street ||
      "Ubicación seleccionada";

    setSearch(label);
    setResults([]);
  };

  return (
    <MapContainer
      style={{ width: "100%", height: "100%" }}
      zoom={15}
      center={center}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <MapReadyFix value={value} clientLocation={clientLocation} />

      {allowSelection && (
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 50,
            zIndex: 1000,
            display: "flex",
          }}
        >
          <HoverIconAccordion icon={<LinkIcon />}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Pegar link de ubicación"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <Button variant="contained" onClick={handleLink}>
                Ir
              </Button>
            </Box>
          </HoverIconAccordion>

          <HoverIconAccordion icon={<SearchIcon />}>
            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Av. Mitre 123"
              InputProps={{
                endAdornment: loading ? <CircularProgress size={18} /> : null,
              }}
            />

            {results.length > 0 && (
              <Paper sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
                <List>
                  {results.map((r, i) => (
                    <ListItemButton key={i} onClick={() => handleSelect(r)}>
                      <ListItemText
                        primary={
                          r.properties.name ||
                          r.properties.street ||
                          "Sin nombre"
                        }
                        secondary={r.properties.city || ""}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </HoverIconAccordion>
        </Box>
      )}

      {hasClientPoint &&
        (() => {
          // console.log("Renderizando marcador del cliente", {
          //   clientLat,
          //   clientLng,
          // });

          return (
            <Marker position={[clientLat, clientLng]} icon={clientIcon}>
              <Popup>Ubicación guardada del cliente</Popup>
            </Marker>
          );
        })()}

      {hasSelectedPoint && (!hasClientPoint || !overlap) && (
        <Marker position={[selectedLat, selectedLng]} icon={selectedIcon}>
          <Popup>Ubicación que se guardará en el cliente</Popup>
        </Marker>
      )}

      {allowSelection && <MapClickHandler onChange={onChange} />}
    </MapContainer>
  );
}

function MapClickHandler({
  onChange,
}: {
  onChange: (v: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

function MapReadyFix({
  value,
  clientLocation,
}: {
  value: { lat?: number | string; lng?: number | string };
  clientLocation?: { lat?: number | string; lng?: number | string };
}) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();

      const selectedLat = toValidNumber(value.lat);
      const selectedLng = toValidNumber(value.lng);
      const clientLat = toValidNumber(clientLocation?.lat);
      const clientLng = toValidNumber(clientLocation?.lng);

      // console.log("MapReadyFix", {
      //   value,
      //   clientLocation,
      //   selectedLat,
      //   selectedLng,
      //   clientLat,
      //   clientLng,
      // });

      if (selectedLat != null && selectedLng != null) {
        map.setView([selectedLat, selectedLng], 16);
        return;
      }

      if (clientLat != null && clientLng != null) {
        map.setView([clientLat, clientLng], 16);
        return;
      }

      map.setView(defaultPos, 15);
    }, 200);

    return () => clearTimeout(timer);
  }, [map, value.lat, value.lng, clientLocation?.lat, clientLocation?.lng]);

  return null;
}
