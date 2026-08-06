import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

/*
 * =========================================================
 * LEAFLET
 * =========================================================
 *
 * Estilos globales necesarios para que los mapas de
 * React Leaflet se visualicen correctamente.
 *
 * Sin este import el mapa puede aparecer sin formato,
 * con controles rotos o con los tiles mal posicionados.
 */

import "leaflet/dist/leaflet.css";

import App from "./App.tsx";

/*
 * =========================================================
 * INICIO DE LA APLICACIÓN
 * =========================================================
 */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
