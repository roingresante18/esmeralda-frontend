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
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import api from "../../api/api";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface UserForm {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

interface UpdateUserData {
  full_name: string;
  email: string;
  role: string;
  password?: string;
}

const rolesDisponibles = [
  "ADMIN",
  "VENTAS",
  "DEPOSITO",
  "CONTROL",
  "LOGISTICA",
  "REPARTIDOR",
];

const initialForm: UserForm = {
  full_name: "",
  email: "",
  password: "",
  role: "",
};

const UserManager: React.FC = () => {
  // Usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  // Carga
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Paginación
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  // Creación
  const [form, setForm] = useState<UserForm>(initialForm);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edición
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Obtener usuarios
  const fetchUsers = async () => {
    setLoadingUsers(true);

    try {
      const response = await api.get<User[]>("/users");

      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error: any) {
      console.error("Error al cargar usuarios:", error);

      const message =
        error.response?.data?.message || "No se pudieron cargar los usuarios";

      alert(`❌ ${message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtrar usuarios
  useEffect(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter((user) => {
      return (
        user.full_name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role.toLowerCase().includes(normalizedSearch)
      );
    });

    setFilteredUsers(filtered);

    // Volver a la primera página cuando se realiza una búsqueda
    setPaginationModel((previous) => ({
      ...previous,
      page: 0,
    }));
  }, [search, users]);

  // Crear usuario
  const handleAdd = async () => {
    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const role = form.role;

    if (!fullName || !email || !password || !role) {
      alert("⚠️ Completá todos los campos");
      return;
    }

    if (password.length < 6) {
      alert("⚠️ La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setCreatingUser(true);

    try {
      await api.post("/users", {
        full_name: fullName,
        email,
        password,
        role,
      });

      setForm(initialForm);
      setShowCreatePassword(false);

      await fetchUsers();

      alert("✅ Usuario creado correctamente");
    } catch (error: any) {
      console.error("Error al crear usuario:", error);

      const message =
        error.response?.data?.message || "Error al crear el usuario";

      alert(`❌ ${message}`);
    } finally {
      setCreatingUser(false);
    }
  };

  // Abrir modal de edición
  const handleEdit = (user: User) => {
    setSelectedUser({ ...user });
    setEditPassword("");
    setShowEditPassword(false);
    setOpenEdit(true);
  };

  // Cerrar modal de edición
  const handleCloseEdit = () => {
    if (savingUser) return;

    setOpenEdit(false);
    setSelectedUser(null);
    setEditPassword("");
    setShowEditPassword(false);
  };

  // Guardar usuario editado
  const handleSave = async () => {
    if (!selectedUser) return;

    const fullName = selectedUser.full_name.trim();
    const email = selectedUser.email.trim().toLowerCase();
    const role = selectedUser.role;
    const newPassword = editPassword.trim();

    if (!fullName || !email || !role) {
      alert("⚠️ Nombre, email y rol son obligatorios");
      return;
    }

    if (newPassword && newPassword.length < 6) {
      alert("⚠️ La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    const updateData: UpdateUserData = {
      full_name: fullName,
      email,
      role,
    };

    // La contraseña solo se envía cuando se escribió una nueva.
    if (newPassword) {
      updateData.password = newPassword;
    }

    setSavingUser(true);

    try {
      await api.patch(`/users/${selectedUser.id}`, updateData);

      handleCloseEdit();
      await fetchUsers();

      alert(
        newPassword
          ? "✅ Usuario y contraseña actualizados correctamente"
          : "✅ Usuario actualizado correctamente",
      );
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);

      const message =
        error.response?.data?.message || "Error al actualizar el usuario";

      alert(`❌ ${message}`);
    } finally {
      setSavingUser(false);
    }
  };

  // Eliminar usuario
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "¿Seguro que deseas eliminar este usuario?",
    );

    if (!confirmed) return;

    try {
      await api.delete(`/users/${id}`);

      await fetchUsers();

      alert("✅ Usuario eliminado correctamente");
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);

      const message =
        error.response?.data?.message || "Error al eliminar el usuario";

      alert(`❌ ${message}`);
    }
  };

  // Columnas de la tabla
  const columns: GridColDef<User>[] = [
    {
      field: "id",
      headerName: "ID",
      width: 80,
    },
    {
      field: "full_name",
      headerName: "Nombre",
      minWidth: 180,
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      minWidth: 220,
      flex: 1,
    },
    {
      field: "role",
      headerName: "Rol",
      width: 140,
    },
    {
      field: "is_active",
      headerName: "Activo",
      width: 110,
      renderCell: (params) => (params.row.is_active ? "✅ Sí" : "❌ No"),
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            aria-label={`Editar usuario ${params.row.full_name}`}
            title="Editar usuario"
            onClick={() => handleEdit(params.row)}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            aria-label={`Eliminar usuario ${params.row.full_name}`}
            title="Eliminar usuario"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 5, mb: 5 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        👥 Gestión de Usuarios
      </Typography>

      {/* Búsqueda */}
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
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, email o rol"
          fullWidth
          sx={{ flex: 1 }}
        />
      </Stack>

      {/* Formulario de creación */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 3,
          alignItems: "start",
        }}
      >
        <TextField
          label="Nombre completo"
          value={form.full_name}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              full_name: event.target.value,
            }))
          }
          disabled={creatingUser}
          fullWidth
        />

        <TextField
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              email: event.target.value,
            }))
          }
          autoComplete="email"
          disabled={creatingUser}
          fullWidth
        />

        <TextField
          label="Contraseña"
          type={showCreatePassword ? "text" : "password"}
          value={form.password}
          onChange={(event) =>
            setForm((previous) => ({
              ...previous,
              password: event.target.value,
            }))
          }
          autoComplete="new-password"
          helperText="Mínimo 6 caracteres"
          disabled={creatingUser}
          fullWidth
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    edge="end"
                    disabled={creatingUser}
                    aria-label={
                      showCreatePassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    title={
                      showCreatePassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onClick={() =>
                      setShowCreatePassword((previous) => !previous)
                    }
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    {showCreatePassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Autocomplete
          options={rolesDisponibles}
          value={form.role || null}
          disabled={creatingUser}
          onChange={(_, newValue) =>
            setForm((previous) => ({
              ...previous,
              role: newValue || "",
            }))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Rol"
              placeholder="Seleccionar rol"
              fullWidth
            />
          )}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={
            creatingUser ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <AddIcon />
            )
          }
          onClick={handleAdd}
          disabled={creatingUser}
          sx={{
            minHeight: 56,
          }}
        >
          {creatingUser ? "Agregando..." : "Agregar"}
        </Button>
      </Box>

      {/* Tabla */}
      <Box sx={{ height: 480, width: "100%" }}>
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loadingUsers}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
          localeText={{
            noRowsLabel: "No hay usuarios registrados",
            noResultsOverlayLabel: "No se encontraron usuarios",
          }}
        />
      </Box>

      {/* Modal de edición */}
      <Dialog open={openEdit} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Editar usuario</DialogTitle>

        <DialogContent>
          <TextField
            label="Nombre completo"
            fullWidth
            margin="dense"
            value={selectedUser?.full_name || ""}
            disabled={savingUser}
            onChange={(event) =>
              setSelectedUser((previous) =>
                previous
                  ? {
                      ...previous,
                      full_name: event.target.value,
                    }
                  : previous,
              )
            }
          />

          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="dense"
            value={selectedUser?.email || ""}
            autoComplete="email"
            disabled={savingUser}
            onChange={(event) =>
              setSelectedUser((previous) =>
                previous
                  ? {
                      ...previous,
                      email: event.target.value,
                    }
                  : previous,
              )
            }
          />

          <TextField
            label="Nueva contraseña"
            type={showEditPassword ? "text" : "password"}
            fullWidth
            margin="dense"
            value={editPassword}
            onChange={(event) => setEditPassword(event.target.value)}
            helperText="Dejar vacío para conservar la contraseña actual"
            autoComplete="new-password"
            disabled={savingUser}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="button"
                      edge="end"
                      disabled={savingUser}
                      aria-label={
                        showEditPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      title={
                        showEditPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      onClick={() =>
                        setShowEditPassword((previous) => !previous)
                      }
                      onMouseDown={(event) => event.preventDefault()}
                    >
                      {showEditPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Autocomplete
            options={rolesDisponibles}
            value={selectedUser?.role || null}
            disabled={savingUser}
            onChange={(_, newValue) =>
              setSelectedUser((previous) =>
                previous
                  ? {
                      ...previous,
                      role: newValue || "",
                    }
                  : previous,
              )
            }
            renderInput={(params) => (
              <TextField {...params} label="Rol" margin="dense" fullWidth />
            )}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseEdit} disabled={savingUser}>
            Cancelar
          </Button>

          <Button
            onClick={handleSave}
            variant="contained"
            disabled={savingUser}
            startIcon={
              savingUser ? (
                <CircularProgress size={18} color="inherit" />
              ) : undefined
            }
          >
            {savingUser ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManager;
