import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";

import api from "../../../api/api";
import ClientForm from "./components/ClientForm";
import type {
  ClientFormData,
  Municipality,
} from "./components/ClientForm.types";

/* ================= TIPOS ================= */

interface Client extends ClientFormData {
  id: number;
}

/* ================= VALOR INICIAL ================= */

const emptyClient: ClientFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  municipality_id: null,
  latitude: undefined,
  longitude: undefined,
};

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  const [formData, setFormData] = useState<ClientFormData>(emptyClient);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  const [search, setSearch] = useState("");

  /* ================= DELETE STATES ================= */

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openDeleteSuccess, setOpenDeleteSuccess] = useState(false);
  const [openDeleteError, setOpenDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const [generalError, setGeneralError] = useState<string | null>(null);

  /* ================= FETCH ================= */

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch {
      setGeneralError("Error al cargar clientes");
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const res = await api.get("/municipalities");
      setMunicipalities(res.data);
    } catch {
      setGeneralError("Error al cargar municipios");
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMunicipalities();
  }, []);

  /* ================= MAP ID → NAME ================= */

  const municipalityMap = useMemo(() => {
    const map: Record<number, string> = {};
    municipalities.forEach((m) => {
      map[m.id] = m.name;
    });
    return map;
  }, [municipalities]);

  /* ================= DELETE ================= */

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setOpenConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await api.delete(`/clients/${deleteId}`);
      setOpenConfirmDelete(false);
      setOpenDeleteSuccess(true);
      fetchClients();
    } catch (err: any) {
      setOpenConfirmDelete(false);

      let message = "No se pudo eliminar el cliente: ";
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      }

      setDeleteErrorMessage(message);
      setOpenDeleteError(true);
    }
  };

  /* ================= FILTRO ================= */

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;

    const term = search.toLowerCase();

    return clients.filter((client) => {
      const municipalityName =
        client.municipality_id && municipalityMap[client.municipality_id]
          ? municipalityMap[client.municipality_id].toLowerCase()
          : "";

      return (
        client.name.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        municipalityName.includes(term)
      );
    });
  }, [clients, search, municipalityMap]);

  /* ================= COLUMNAS ================= */

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "phone", headerName: "Teléfono", width: 150 },
    { field: "email", headerName: "Email", width: 150 },
    { field: "address", headerName: "Direccion", width: 150 },
    {
      field: "municipalityName",
      headerName: "Municipio",
      width: 180,
      renderCell: (params) => {
        const client = params.row as Client;
        const id = client.municipality_id;

        return id && municipalityMap[id] ? municipalityMap[id] : "—";
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<Client>) => (
        <>
          <IconButton
            onClick={() => {
              const client = params.row;

              setFormData({
                name: client.name,
                phone: client.phone,
                email: client.email,
                address: client.address,
                municipality_id: client.municipality_id,
                latitude: client.latitude,
                longitude: client.longitude,
              });

              setEditingClientId(client.id);
              setOpenEdit(true);
            }}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => handleDeleteClick(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  /* ================= RENDER ================= */

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Gestión de Clientes
      </Typography>

      {generalError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {generalError}
        </Typography>
      )}

      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => {
          setFormData(emptyClient);
          setEditingClientId(null);
          setOpenCreate(true);
        }}
      >
        Nuevo cliente
      </Button>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Buscar por nombre, teléfono o municipio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <div style={{ height: 450 }}>
        <DataGrid
          rows={filteredClients}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </div>

      {/* ================= CREAR ================= */}

      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Nuevo Cliente</DialogTitle>
        <DialogContent>
          <ClientForm
            mode="create"
            value={formData}
            onChange={setFormData}
            onSuccess={() => {
              fetchClients();
              setOpenCreate(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ================= EDITAR ================= */}

      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          <ClientForm
            mode="edit"
            value={formData}
            onChange={setFormData}
            onSuccess={async () => {
              try {
                if (editingClientId) {
                  await api.patch(`/clients/${editingClientId}`, formData);
                }
                fetchClients();
                setOpenEdit(false);
              } catch {
                setGeneralError("Error al actualizar cliente");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ================= CONFIRM DELETE ================= */}

      <Dialog
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar este cliente?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDelete(false)}>Cancelar</Button>
          <Button color="error" onClick={confirmDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= DELETE SUCCESS ================= */}

      <Dialog
        open={openDeleteSuccess}
        onClose={() => setOpenDeleteSuccess(false)}
      >
        <DialogTitle>Eliminación exitosa</DialogTitle>
        <DialogContent>El cliente fue eliminado correctamente.</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteSuccess(false)}>Aceptar</Button>
        </DialogActions>
      </Dialog>

      {/* ================= DELETE ERROR ================= */}

      <Dialog open={openDeleteError} onClose={() => setOpenDeleteError(false)}>
        <DialogTitle>Error al eliminar</DialogTitle>
        <DialogContent>{deleteErrorMessage}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteError(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
