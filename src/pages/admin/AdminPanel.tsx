import React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import PeopleIcon from "@mui/icons-material/People";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonIcon from "@mui/icons-material/Person";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FactCheckIcon from "@mui/icons-material/FactCheck";

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const theme = useTheme();

  const actions = [
    {
      title: "Productos",
      icon: <Inventory2Icon fontSize="large" />,
      color: theme.palette.success.main,
      path: "/products",
      description: "Agregar, editar o eliminar productos",
    },
    {
      title: "Stock",
      icon: <WarehouseIcon fontSize="large" />,
      color: theme.palette.info.main,
      path: "/stock",
      description: "Controlar el inventario",
    },
    {
      title: "Pedidos",
      icon: <ReceiptLongIcon fontSize="large" />,
      color: theme.palette.secondary.main,
      path: "/orders",
      description: "Ver y administrar pedidos",
    },

    {
      title: "Depósito",
      icon: <Inventory2Icon fontSize="large" />,
      color: theme.palette.success.dark,
      path: "/deposito",
      description: "Gestión de preparación de pedidos",
    },
    {
      title: "Control",
      icon: <FactCheckIcon fontSize="large" />,
      color: theme.palette.info.dark,
      path: "/controlDeposito",
      description: "Control de calidad de pedidos",
    },
    {
      title: "Logística",
      icon: <LocalShippingIcon fontSize="large" />,
      color: theme.palette.secondary.dark,
      path: "/logistica",
      description: "Organización de entregas",
    },
    {
      title: "Reparto",
      icon: <LocalShippingIcon fontSize="large" />,
      color: theme.palette.secondary.dark,
      path: "/reparto",
      description: "Distribucion de Pedidos",
    },
    {
      title: "Clientes",
      icon: <PersonIcon fontSize="large" />,
      color: theme.palette.warning.main,
      path: "/clients",
      description: "Registrar y gestionar clientes",
    },
    {
      title: "Usuarios",
      icon: <PeopleIcon fontSize="large" />,
      color: theme.palette.primary.main,
      path: "/users",
      description: "Gestionar usuarios",
    },
    {
      title: "Perfil",
      icon: <AccountCircleIcon fontSize="large" />,
      color: theme.palette.grey[700],
      path: "/profile",
      description: "Editar tu información personal",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.light, 0.08)}, 
          ${alpha(theme.palette.secondary.light, 0.08)})`,
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        {/* HEADER */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Panel de Administración
          </Typography>

          <Typography variant="subtitle1" color="text.secondary" mt={1}>
            Bienvenido, {user?.full_name} ({user?.email})
          </Typography>
        </Box>

        {/* GRID DASHBOARD */}
        <Grid container spacing={4}>
          {actions.map((action, index) => (
            <Grid key={index}>
              <Paper
                onClick={() => navigate(action.path)}
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  backgroundColor: alpha("#ffffff", 0.7),
                  border: `1px solid ${alpha(action.color, 0.2)}`,
                  transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
                  transform: "translateY(20px)",
                  opacity: 0,
                  animation: `fadeSlide 0.6s ease forwards`,
                  animationDelay: `${index * 0.08}s`,

                  "&:hover": {
                    transform: "translateY(-8px) scale(1.02)",
                    boxShadow: `0 10px 30px ${alpha(action.color, 0.25)}`,
                    borderColor: action.color,
                  },
                }}
              >
                <Stack spacing={3}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `linear-gradient(135deg, ${alpha(
                        action.color,
                        0.2,
                      )}, ${alpha(action.color, 0.05)})`,
                      color: action.color,
                    }}
                  >
                    {action.icon}
                  </Box>

                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {action.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" mt={1}>
                      {action.description}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* LOGOUT */}
        <Stack alignItems="center" sx={{ mt: 8 }}>
          <Button
            variant="outlined"
            color="error"
            size="large"
            onClick={logout}
            sx={{
              borderRadius: 3,
              px: 4,
              transition: "0.3s",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Container>

      {/* Animación global */}
      <style>
        {`
          @keyframes fadeSlide {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};

export default AdminPanel;
