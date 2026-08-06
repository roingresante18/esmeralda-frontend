import {
  Button,
  Card,
  CardActionArea,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssignmentIcon from "@mui/icons-material/Assignment";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";

import LogisticsNavigation from "../components/LogisticsNavigation";

/*
 * =========================================================
 * HOME LOGÍSTICA
 * =========================================================
 *
 * Punto de entrada al módulo de Logística.
 *
 * Desde acá se organiza:
 *
 * - la creación de jornadas;
 * - el seguimiento de jornadas existentes;
 * - la administración de vehículos.
 */

export default function LogisticsHomePage() {
  const navigate = useNavigate();

  /*
   * =======================================================
   * SECCIONES PRINCIPALES
   * =======================================================
   */

  const sections = [
    {
      title: "Armado de jornadas",

      description:
        "Seleccioná los pedidos que ya pasaron por Control y armá una jornada asignando repartidor, vehículo y fecha de reparto.",

      path: "/logistica/pedidos",

      icon: (
        <AssignmentIcon
          sx={{
            fontSize: 42,
          }}
        />
      ),
    },

    {
      title: "Seguimiento de jornadas",

      description:
        "Consultá las jornadas pendientes, activas, finalizadas o canceladas y revisá chofer, vehículo, pedidos, recorrido y estado operativo.",

      path: "/logistica/jornadas",

      icon: (
        <RouteIcon
          sx={{
            fontSize: 42,
          }}
        />
      ),
    },

    {
      title: "Gestión de vehículos",

      description:
        "Administrá la flota, patente, kilometraje, consumo estimado, límite de velocidad, estado y parámetros utilizados por telemetría.",

      path: "/logistica/vehiculos",

      icon: (
        <DirectionsCarIcon
          sx={{
            fontSize: 42,
          }}
        />
      ),
    },
  ];

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 3,
      }}
    >
      <Stack spacing={3}>
        {/*
         * =================================================
         * NAVEGACIÓN + VOLVER AL PANEL
         * =================================================
         */}

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={1}
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          justifyContent="space-between"
        >
          <LogisticsNavigation />

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin")}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Volver al panel
          </Button>
        </Stack>

        {/*
         * =================================================
         * ENCABEZADO
         * =================================================
         */}

        <Stack spacing={0.5}>
          <Typography variant="h4" fontWeight={900}>
            Logística y reparto
          </Typography>

          <Typography color="text.secondary">
            Planificá las jornadas de reparto, administrá la flota y seguí la
            operación de los repartidores.
          </Typography>
        </Stack>

        {/*
         * =================================================
         * ACCESOS PRINCIPALES
         * =================================================
         */}

        <Grid container spacing={2}>
          {sections.map((section) => (
            <Grid
              key={section.path}
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                }}
              >
                <CardActionArea
                  onClick={() => navigate(section.path)}
                  sx={{
                    height: "100%",
                  }}
                >
                  <CardContent
                    sx={{
                      p: 3,
                    }}
                  >
                    <Stack spacing={2}>
                      {section.icon}

                      <Typography variant="h6" fontWeight={800}>
                        {section.title}
                      </Typography>

                      <Typography
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.6,
                        }}
                      >
                        {section.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}
