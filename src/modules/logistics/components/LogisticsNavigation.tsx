import { Button, Paper, Stack } from "@mui/material";

import { useLocation, useNavigate } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

/*
 * =========================================================
 * NAVEGACIÓN INTERNA DE LOGÍSTICA
 * =========================================================
 */

export default function LogisticsNavigation() {
  const navigate = useNavigate();

  const location = useLocation();

  /*
   * =======================================================
   * BOTONES
   * =======================================================
   */

  const items = [
    {
      label: "Resumen",

      path: "/logistica",

      icon: <DashboardIcon />,
    },

    {
      label: "Pedidos",

      path: "/logistica/pedidos",

      icon: <AssignmentIcon />,
    },

    {
      label: "Jornadas",

      path: "/logistica/jornadas",

      icon: <RouteIcon />,
    },

    {
      label: "Vehículos",

      path: "/logistica/vehiculos",

      icon: <DirectionsCarIcon />,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,

        borderRadius: 3,

        border: "1px solid",

        borderColor: "divider",
      }}
    >
      <Stack
        direction={{
          xs: "column",

          sm: "row",
        }}
        spacing={1}
      >
        {items.map((item) => {
          const active =
            item.path === "/logistica"
              ? location.pathname === "/logistica"
              : location.pathname.startsWith(item.path);

          return (
            <Button
              key={item.path}
              variant={active ? "contained" : "text"}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,

                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </Stack>
    </Paper>
  );
}
