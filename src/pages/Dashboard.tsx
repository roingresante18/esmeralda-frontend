import { Button, Typography, Container } from "@mui/material";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();


  return (
    <Container sx={{ mt: 8 }}>
      <Typography variant="h4">Bienvenido, {user?.full_name}</Typography>
      <Typography variant="subtitle1">Rol: {user?.role}</Typography>

      <Button
        variant="outlined"
        color="secondary"
        sx={{ mt: 4 }}
        onClick={logout}
      >
        Cerrar sesión
      </Button>

     
    </Container>
  );
};

export default Dashboard;
