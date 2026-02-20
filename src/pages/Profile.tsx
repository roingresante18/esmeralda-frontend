import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me");
        setProfile(res.data);
      } catch (err) {
        console.error("Error cargando perfil", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await api.patch(`/users/${profile.id}`, {
        full_name: profile.full_name,
        email: profile.email,
      });
      setMessage("✅ Perfil actualizado correctamente");
    } catch (err) {
      console.error("Error al actualizar", err);
      setMessage("❌ Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Mi perfil
      </Typography>

      {message && (
        <Alert severity={message.startsWith("✅") ? "success" : "error"} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <TextField
        label="Nombre completo"
        fullWidth
        margin="normal"
        value={profile?.full_name || ""}
        onChange={(e) => handleChange("full_name", e.target.value)}
      />

      <TextField
        label="Correo electrónico"
        fullWidth
        margin="normal"
        value={profile?.email || ""}
        onChange={(e) => handleChange("email", e.target.value)}
      />

      <TextField
        label="Rol"
        fullWidth
        margin="normal"
        value={profile?.role || ""}
        disabled
      />

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
        <Button variant="outlined" color="secondary" onClick={logout}>
          Cerrar sesión
        </Button>
      </Box>
    </Container>
  );
};

export default Profile;
