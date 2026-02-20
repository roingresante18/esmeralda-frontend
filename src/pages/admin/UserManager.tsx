import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Stack,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Autocomplete,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "../../api/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const rolesDisponibles = [
  "ADMIN",
  "VENTAS",
  "DEPOSITO",
  "CONTROL",
  "LOGISTICA",
  "REPARTIDOR",
];

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "",
  });

  // 📦 Obtener usuarios del backend
  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔍 Filtrado en tiempo real
  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.role.toLowerCase().includes(lower),
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  // ➕ Crear nuevo usuario
  const handleAdd = async () => {
    const { full_name, email, password, role } = form;
    if (!full_name || !email || !password || !role) {
      alert("⚠️ Completa todos los campos");
      return;
    }

    try {
      await api.post("/users", { full_name, email, password, role });
      alert("✅ Usuario creado correctamente");
      setForm({ full_name: "", email: "", password: "", role: "" });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      alert("❌ Error al crear usuario");
    }
  };

  // ✏️ Editar usuario
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpenEdit(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      await api.patch(`/users/${selectedUser.id}`, selectedUser);
      setOpenEdit(false);
      fetchUsers();
      alert("✅ Usuario actualizado correctamente");
    } catch (err) {
      console.error(err);
      alert("❌ Error al actualizar usuario");
    }
  };

  // 🗑️ Eliminar usuario
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
        alert("✅ Usuario eliminado");
      } catch (err) {
        console.error(err);
        alert("❌ Error al eliminar usuario");
      }
    }
  };

  // 🧾 Columnas del DataGrid
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "full_name", headerName: "Nombre", width: 200 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "role", headerName: "Rol", width: 140 },
    {
      field: "is_active",
      headerName: "Activo",
      width: 100,
      renderCell: (params) => (params.row.is_active ? "✅ Sí" : "❌ No"),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        👥 Gestión de Usuarios
      </Typography>

      {/* 🔍 Búsqueda y creación */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <TextField
          label="Buscar usuario"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
      </Stack>

      {/* ➕ Formulario de nuevo usuario */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(5, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <TextField
          label="Nombre completo"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <Autocomplete
          options={rolesDisponibles}
          value={form.role}
          onChange={(_, newValue) => setForm({ ...form, role: newValue || "" })}
          renderInput={(params) => (
            <TextField {...params} label="Rol" placeholder="Seleccionar" />
          )}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Agregar
        </Button>
      </Box>

      {/* 📋 Tabla de usuarios */}
      <Box sx={{ height: 480, width: "100%" }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(r) => r.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* ✏️ Modal de edición */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          <TextField
            label="Nombre completo"
            fullWidth
            margin="dense"
            value={selectedUser?.full_name || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser!, full_name: e.target.value })
            }
          />
          <TextField
            label="Email"
            fullWidth
            margin="dense"
            value={selectedUser?.email || ""}
            onChange={(e) =>
              setSelectedUser({ ...selectedUser!, email: e.target.value })
            }
          />
          <Autocomplete
            options={rolesDisponibles}
            value={selectedUser?.role || ""}
            onChange={(_, newValue) =>
              setSelectedUser({ ...selectedUser!, role: newValue || "" })
            }
            renderInput={(params) => (
              <TextField {...params} label="Rol" margin="dense" fullWidth />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManager;
