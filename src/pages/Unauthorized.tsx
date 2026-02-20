import { Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <Container sx={{ textAlign: "center", mt: 10 }}>
      <Typography variant="h4" color="error" gutterBottom>
        🚫 Acceso denegado
      </Typography>
      <Typography variant="subtitle1">
        No tienes permisos para acceder a esta sección.
      </Typography>
      <Button sx={{ mt: 3 }} variant="contained" onClick={() => navigate("/")}>
        Volver al inicio
      </Button>
    </Container>
  );
};

export default Unauthorized;
