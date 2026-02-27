import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import api from "../../../api/api";
import ClientForm from "./components/ClientForm";
import type { ClientFormData } from "./components/ClientForm.types";

/* =======================
   TIPOS
======================= */

interface Client extends ClientFormData {
  id: number;
}

/* =======================
   CONSTANTES
======================= */

const emptyClient: ClientFormData = {
  name: "",
  address: "",
  municipality_id: null,
};

/* =======================
   COMPONENTE
======================= */

export default function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  const [newClient, setNewClient] = useState<ClientFormData>(emptyClient);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [openEdit, setOpenEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  /* =======================
     FETCH CLIENTES
  ======================= */

  const fetchClients = async () => {
    const res = await api.get("/clients");
    setClients(res.data);
    setFilteredClients(res.data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* =======================
     BUSCADOR
  ======================= */

  useEffect(() => {
    const value = search.toLowerCase();

    setFilteredClients(
      clients.filter(
        (c) =>
          c.name.toLowerCase().includes(value) ||
          c.email?.toLowerCase().includes(value) ||
          c.phone?.includes(value),
      ),
    );
  }, [search, clients]);

  /* =======================
     CREATE
  ======================= */

  const handleCreate = async () => {
    setLoading(true);

    try {
      const payload: any = {
        name: newClient.name,
        address: newClient.address,
        municipality_id: newClient.municipality_id,
      };

      // Agregar opcionales solo si tienen valor
      if (newClient.email) payload.email = newClient.email;
      if (newClient.phone) payload.phone = newClient.phone;
      if (newClient.latitude) payload.latitude = newClient.latitude;
      if (newClient.longitude) payload.longitude = newClient.longitude;

      await api.post("/clients", payload);

      setNewClient(emptyClient);
      fetchClients();
      alert("✅ Cliente creado correctamente");
    } catch {
      alert("❌ Error al crear cliente");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     UPDATE
  ======================= */

  const handleUpdate = async () => {
    if (!selectedClient) return;

    try {
      const payload = {
        name: selectedClient.name,
        email: selectedClient.email || null,
        phone: selectedClient.phone || null,
        address: selectedClient.address,
        municipality_id: selectedClient.municipality_id,
        latitude: selectedClient.latitude ?? null,
        longitude: selectedClient.longitude ?? null,
      };

      await api.patch(`/clients/${selectedClient.id}`, payload);

      setOpenEdit(false);
      fetchClients();
      alert("✅ Cliente actualizado");
    } catch (err: any) {
      const message =
        err?.response?.data?.message?.join?.(", ") ||
        "Error al actualizar cliente";

      alert(`❌ ${message}`);
    }
  };

  /* =======================
     DELETE
  ======================= */

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar cliente?")) return;

    try {
      await api.delete(`/clients/${id}`);
      fetchClients();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "No se puede eliminar el cliente porque tiene órdenes asociadas";

      alert(`❌ ${message}`);
    }
  };

  /* =======================
     TABLA
  ======================= */

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "name", headerName: "Nombre", width: 180 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "phone", headerName: "Teléfono", width: 140 },
    { field: "address", headerName: "Dirección", width: 220 },
    {
      field: "actions",
      headerName: "Acciones",
      width: 120,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => {
              setSelectedClient(params.row);
              setOpenEdit(true);
            }}
          >
            <EditIcon />
          </IconButton>

          <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  /* =======================
     RENDER
  ======================= */

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Gestión de Clientes
      </Typography>

      {/* FORM CREAR */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <ClientForm
          mode="create"
          value={newClient}
          onChange={setNewClient}
          onSubmit={handleCreate}
          loading={loading}
        />
      </Paper>

      {/* BUSCADOR */}
      <TextField
        label="Buscar cliente"
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLA */}
      <div style={{ height: 420 }}>
        <DataGrid
          rows={filteredClients}
          columns={columns}
          getRowId={(r) => r.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </div>

      {/* MODAL EDITAR */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          {selectedClient && (
            <ClientForm
              mode="edit"
              value={selectedClient}
              onChange={(data) =>
                setSelectedClient({ ...selectedClient, ...data })
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
