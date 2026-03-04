import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import {
  Box,
  TextField,
  Button,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import SearchIcon from "@mui/icons-material/Search";
import "leaflet/dist/leaflet.css";

/* ================= CONFIG ================= */
const defaultPos = [-27.3621, -55.9008]; // Posición inicial del mapa
const MISIONS_BBOX = "-56.5,-28.2,-53.5,-25.5";

/* ================= ICONO DEL MARCADOR ================= */
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* ================= MARCADOR ================= */
function LocationMarker({ position, setPosition }: any) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng); // Actualiza posición al hacer click
    },
  });

  if (!position) return null;

  return (
    <Marker
      position={position}
      draggable
      icon={icon}
      eventHandlers={{
        dragend: (e) => setPosition(e.target.getLatLng()), // Permite mover el marcador
      }}
    />
  );
}

/* ================= CENTRAR ================= */
function Recenter({ position }: any) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, 12); // Centra el mapa en la posición seleccionada
    }
  }, [position, map]);

  return null;
}

/* ================= ACORDEÓN SOLO ICONO ================= */
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
        mr: 5,
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
            width: 250,
            pointerEvents: "auto", // permite interactuar con el input
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

/* ================= COMPONENTE PRINCIPAL ================= */
export default function MapPicker({ onSelect, initialPosition }: any) {
  const [position, setPosition] = useState(initialPosition || null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState("");

  /* ===== ACTUALIZAR POSICIÓN ===== */
  const updatePosition = (latlng: any) => {
    setPosition(latlng);
    onSelect(latlng);
  };

  /* ===== AUTOCOMPLETE DE DIRECCIÓN ===== */
  useEffect(() => {
    if (search.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            search,
          )}&bbox=${MISIONS_BBOX}&limit=5`,
        );
        const data = await res.json();
        setResults(data.features || []);
      } catch (error) {
        console.error("Error en búsqueda de dirección:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (feature: any) => {
    const [lng, lat] = feature.geometry.coordinates;
    updatePosition({ lat, lng });
    setSearch(feature.properties.name || "");
    setResults([]);
  };

  /* ===== BUSCAR POR LINK ===== */
  const handleLink = () => {
    if (!link) return;
    const match = link.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)/);
    if (match) {
      updatePosition({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
    } else {
      alert("No se pudieron obtener coordenadas");
    }
  };

  /* ===== RENDER MAPA ===== */
  return (
    <Box sx={{ height: 420, width: "100%", position: "relative" }}>
      <MapContainer
        center={position || defaultPos}
        zoom={33}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ICONOS DE BÚSQUEDA */}
        <Box
          sx={{
            position: "absolute",
            top: 10,
            left: 50,
            zIndex: 1000,
            display: "flex",
          }}
        >
          {/* BUSCAR POR LINK */}
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

          {/* BUSCAR POR DIRECCIÓN */}
          <HoverIconAccordion icon={<SearchIcon />}>
            <TextField
              size="medium"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej: Av. Mitre 123"
              InputProps={{
                endAdornment: loading && <CircularProgress size={18} />,
              }}
            />
            {results.length > 0 && (
              <Paper sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
                <List>
                  {results.map((r: any, i: number) => (
                    <ListItemButton key={i} onClick={() => handleSelect(r)}>
                      <ListItemText
                        primary={r.properties.name}
                        secondary={r.properties.city}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </HoverIconAccordion>
        </Box>

        {/* MARCADOR Y CENTRAR */}
        <LocationMarker position={position} setPosition={updatePosition} />
        <Recenter position={position} />
      </MapContainer>
    </Box>
  );
}
