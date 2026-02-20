import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  value: { lat?: number; lng?: number };
  onChange: (v: { lat: number; lng: number }) => void;
};

export default function ConfirmOrderMap({ value, onChange }: Props) {
  return (
    <MapContainer
      style={{ width: "100%", height: "100%" }}
      zoom={12}
      center={
        value.lat && value.lng
          ? ([value.lat, value.lng] as [number, number])
          : ([-27.45, -58.99] as [number, number])
      }
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {typeof value.lat === "number" && typeof value.lng === "number" && (
        <Marker position={[value.lat, value.lng]} />
      )}

      <MapClickHandler onChange={onChange} />
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
