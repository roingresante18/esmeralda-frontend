import React from "react";
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // ✅ Import correcto para MUI 6+
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const VentasPanel: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const actions = [
    {
      title: "🧾 Pedidos",
      color: "primary",
      path: "/orders",
      description: "Ver, crear o actualizar pedidos de clientes",
    },
    {
      title: "👥 Clientes",
      color: "success",
      path: "/clients",
      description: "Registrar y gestionar información de clientes",
    },
    {
      title: "📦 Productos",
      color: "secondary",
      path: "/products",
      description: "Consultar catálogo de productos disponibles",
    },
    {
      title: "📊 Mis Ventas",
      color: "info",
      path: "/sales",
      description: "Ver historial y rendimiento de ventas",
    },
    {
      title: "⚙️ Perfil",
      color: "inherit",
      path: "/profile",
      description: "Ver o actualizar tus datos personales",
    },
  ];

  return (
    <Container sx={{ mt: 8, mb: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          💼 Panel de Ventas
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Bienvenido, {user?.full_name} ({user?.email})
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {actions.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                textAlign: "center",
                borderRadius: 3,
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "scale(1.03)",
                  boxShadow: 8,
                },
              }}
            >
              <Typography variant="h6" gutterBottom>
                {item.title}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2, minHeight: 40 }}
              >
                {item.description}
              </Typography>
              <Button
                variant="contained"
                color={item.color as any}
                fullWidth
                onClick={() => navigate(item.path)}
              >
                Ir a {item.title}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Stack alignItems="center" sx={{ mt: 5 }}>
        <Button variant="outlined" color="error" size="large" onClick={logout}>
          Cerrar sesión
        </Button>
      </Stack>
    </Container>
  );
};

export default VentasPanel;
