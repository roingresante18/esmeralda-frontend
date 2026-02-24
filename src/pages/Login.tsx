import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Stack,
  Avatar,
  CircularProgress,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);

      switch (user.role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "VENTAS":
          navigate("/ventas");
          break;
        case "DEPOSITO":
          navigate("/deposito");
          break;
        case "CONTROL":
          navigate("/controlDeposito");
          break;
        case "LOGISTICA":
          navigate("/logistica");
          break;
        case "REPARTIDOR":
          navigate("/repartidor");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (error) {
      alert("❌ Error al iniciar sesión. Verifica tus credenciales.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2fcf27 0%, #075e11 100%)",
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            borderRadius: 4,
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* 🔷 LOGO EMPRESA */}
            <Box
              component="img"
              src="/logo.png"
              alt="Logo Empresa"
              sx={{
                width: 120,
                height: "auto",
                mb: 1,
              }}
            />

            <Typography variant="h6" fontWeight="bold">
              Sistema Esmeralda
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Iniciar sesión
            </Typography>

            <Box component="form" onSubmit={handleSubmit} width="100%">
              <Stack spacing={2}>
                <TextField
                  label="Correo electrónico"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <TextField
                  label="Contraseña"
                  type="password"
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="text"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.4,
                    fontWeight: "bold",
                    borderRadius: 3,
                    color: "green",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Typography
          variant="caption"
          display="block"
          textAlign="center"
          sx={{ mt: 3, color: "white", opacity: 0.8 }}
        >
          © {new Date().getFullYear()} Esmeralda Gestión Interna
        </Typography>
      </Container>
    </Box>
  );
};

export default Login;
