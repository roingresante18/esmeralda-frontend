// import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
// import type { LeafletMouseEvent } from "leaflet";
// import "leaflet/dist/leaflet.css";

// type Props = {
//   value: { lat?: number; lng?: number };
//   onChange: (v: { lat: number; lng: number }) => void;
// };

// export default function ConfirmOrderMap({ value, onChange }: Props) {
//   return (
//     <MapContainer
//       style={{ width: "100%", height: "100%" }}
//       zoom={12}
//       center={
//         value.lat && value.lng
//           ? ([value.lat, value.lng] as [number, number])
//           : ([-27.45, -58.99] as [number, number])
//       }
//     >
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//       {typeof value.lat === "number" && typeof value.lng === "number" && (
//         <Marker position={[value.lat, value.lng]} />
//       )}

//       <MapClickHandler onChange={onChange} />
//     </MapContainer>
//   );
// }

// function MapClickHandler({
//   onChange,
// }: {
//   onChange: (v: { lat: number; lng: number }) => void;
// }) {
//   useMapEvents({
//     click(e: LeafletMouseEvent) {
//       onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
//     },
//   });
//   return null;
// }

import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  value: { lat?: number; lng?: number };
  clientLocation?: { lat?: number; lng?: number };
  onChange: (v: { lat: number; lng: number }) => void;
};

export default function ConfirmOrderMap({
  value,
  clientLocation,
  onChange,
}: Props) {
  const hasOrderPoint =
    typeof value.lat === "number" && typeof value.lng === "number";

  const hasClientPoint =
    typeof clientLocation?.lat === "number" &&
    typeof clientLocation?.lng === "number";

  const center: [number, number] = hasOrderPoint
    ? [value.lat as number, value.lng as number]
    : hasClientPoint
      ? [clientLocation!.lat as number, clientLocation!.lng as number]
      : [-27.45, -58.99];

  return (
    <MapContainer
      style={{ width: "100%", height: "100%" }}
      zoom={15}
      center={center}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {/* 📍 Punto del cliente guardado como referencia */}
      {hasClientPoint && (
        <CircleMarker
          center={[
            clientLocation!.lat as number,
            clientLocation!.lng as number,
          ]}
          radius={10}
          pathOptions={{
            color: "#1565c0",
            fillColor: "#42a5f5",
            fillOpacity: 0.85,
            weight: 2,
          }}
        >
          <Popup>Ubicación guardada del cliente</Popup>
        </CircleMarker>
      )}

      {/* 📌 Punto operativo del pedido */}
      {hasOrderPoint && (
        <Marker position={[value.lat as number, value.lng as number]}>
          <Popup>Ubicación elegida para esta entrega</Popup>
        </Marker>
      )}

      <MapClickHandler onChange={onChange} />
      <RecenterMap value={value} clientLocation={clientLocation} />
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

function RecenterMap({
  value,
  clientLocation,
}: {
  value: { lat?: number; lng?: number };
  clientLocation?: { lat?: number; lng?: number };
}) {
  const map = useMap();

  useEffect(() => {
    const hasOrderPoint =
      typeof value.lat === "number" && typeof value.lng === "number";

    const hasClientPoint =
      typeof clientLocation?.lat === "number" &&
      typeof clientLocation?.lng === "number";

    if (hasOrderPoint) {
      map.setView([value.lat as number, value.lng as number], 16);
      return;
    }

    if (hasClientPoint) {
      map.setView(
        [clientLocation!.lat as number, clientLocation!.lng as number],
        16,
      );
    }
  }, [map, value.lat, value.lng, clientLocation?.lat, clientLocation?.lng]);

  return null;
}
