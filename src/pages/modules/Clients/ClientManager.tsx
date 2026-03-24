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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import api from "../../../api/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import ClientForm from "./components/ClientForm";
import ClientsMapModal from "./components/ClientsMapModal";
import { useNavigate } from "react-router-dom";
import type {
  ClientFormData,
  Municipality,
} from "./components/ClientForm.types";

interface Client extends ClientFormData {
  id: number;
  municipality?: Municipality | null;
}

const emptyClient: ClientFormData = {
  id: undefined,
  name: "",
  phone: "",
  email: "",
  address: "",
  municipality_id: null,
  latitude: undefined,
  longitude: undefined,
};

export default function ClientManager() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);

  const [formData, setFormData] = useState<ClientFormData>(emptyClient);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openMap, setOpenMap] = useState(false);
  const [selectedMapClient, setSelectedMapClient] = useState<Client | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState<
    number | null
  >(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openDeleteSuccess, setOpenDeleteSuccess] = useState(false);
  const [openDeleteError, setOpenDeleteError] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const [generalError, setGeneralError] = useState<string | null>(null);

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
      const res = await api.get("/logistics/municipalities");
      setMunicipalities(res.data.municipalities || []);
    } catch {
      setGeneralError("Error al cargar municipios");
    }
  };

  useEffect(() => {
    fetchClients();
    fetchMunicipalities();
  }, []);

  const municipalityMap = useMemo(() => {
    const map: Record<number, string> = {};
    municipalities.forEach((m) => {
      map[m.id] = m.name;
    });
    return map;
  }, [municipalities]);

  const municipalityCountMap = useMemo(() => {
    const map: Record<number, number> = {};

    clients.forEach((client) => {
      const municipalityId =
        client.municipality_id != null
          ? Number(client.municipality_id)
          : client.municipality?.id != null
            ? Number(client.municipality.id)
            : null;

      if (municipalityId != null) {
        map[municipalityId] = (map[municipalityId] || 0) + 1;
      }
    });

    return map;
  }, [clients]);

  const topMunicipalities = useMemo(() => {
    return [...municipalities]
      .map((m) => ({
        ...m,
        count: municipalityCountMap[m.id] || 0,
      }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [municipalities, municipalityCountMap]);

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

      let message = "No se pudo eliminar el cliente";
      if (err?.response?.data?.message) {
        message = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(", ")
          : err.response.data.message;
      }

      setDeleteErrorMessage(message);
      setOpenDeleteError(true);
    }
  };

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();

    return clients.filter((client) => {
      const municipalityId =
        client.municipality_id != null
          ? Number(client.municipality_id)
          : client.municipality?.id != null
            ? Number(client.municipality.id)
            : null;

      const municipalityName = (
        client.municipality?.name ||
        (municipalityId != null ? municipalityMap[municipalityId] : "") ||
        ""
      ).toLowerCase();

      const matchesSearch =
        !term ||
        (client.name || "").toLowerCase().includes(term) ||
        (client.phone || "").includes(term) ||
        municipalityName.includes(term);

      const matchesMunicipality =
        selectedMunicipality === null ||
        municipalityId === selectedMunicipality;

      return matchesSearch && matchesMunicipality;
    });
  }, [clients, search, selectedMunicipality, municipalityMap]);

  const georeferencedClients = useMemo(() => {
    return filteredClients.filter(
      (client) =>
        client.latitude != null &&
        client.longitude != null &&
        !Number.isNaN(Number(client.latitude)) &&
        !Number.isNaN(Number(client.longitude)),
    );
  }, [filteredClients]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 50 },
    { field: "name", headerName: "Nombre", width: 200 },
    { field: "phone", headerName: "Teléfono", width: 100 },
    { field: "email", headerName: "Email", width: 180 },
    { field: "address", headerName: "Dirección", width: 180 },
    {
      field: "municipality",
      headerName: "Municipio",
      width: 150,
      renderCell: (params) => {
        const nestedName = params.row.municipality?.name;
        if (nestedName) {
          return <Chip label={nestedName} size="small" />;
        }

        const id =
          params.row.municipality_id != null
            ? Number(params.row.municipality_id)
            : null;

        const name = id != null ? municipalityMap[id] : null;

        if (!name) return "—";

        return <Chip label={name} size="small" />;
      },
    },
    {
      field: "geo",
      headerName: "Geo",
      width: 90,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params: GridRenderCellParams<Client>) => {
        const hasLocation =
          params.row.latitude != null &&
          params.row.longitude != null &&
          !Number.isNaN(Number(params.row.latitude)) &&
          !Number.isNaN(Number(params.row.longitude));

        if (!hasLocation) return "—";

        return (
          <Tooltip title="Ver ubicación del cliente en el mapa">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedMapClient(params.row);
                setOpenMap(true);
              }}
            >
              <LocationOnIcon color="error" fontSize="small" />
            </IconButton>
          </Tooltip>
        );
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
                id: client.id,
                name: client.name || "",
                phone: client.phone || "",
                email: client.email || "",
                address: client.address || "",
                municipality_id:
                  client.municipality_id != null
                    ? Number(client.municipality_id)
                    : client.municipality?.id != null
                      ? Number(client.municipality.id)
                      : null,
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

  return (
    <Container sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h5">Gestión de Clientes</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setFormData(emptyClient);
            setEditingClientId(null);
            setOpenCreate(true);
          }}
        >
          Nuevo cliente
        </Button>
        <Button
          variant="outlined"
          startIcon={<MapIcon />}
          onClick={() => {
            setSelectedMapClient(null);
            setOpenMap(true);
          }}
          disabled={georeferencedClients.length === 0}
        >
          Ver mapa ({georeferencedClients.length})
        </Button>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          size="small"
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </Box>

      {generalError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {generalError}
        </Typography>
      )}

      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      ></Box>

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
        }}
      >
        <TextField
          fullWidth
          label="Buscar por nombre, teléfono o municipio"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <FormControl fullWidth>
          <InputLabel>Filtrar por municipio</InputLabel>
          <Select
            value={selectedMunicipality ?? ""}
            label="Filtrar por municipio"
            onChange={(e) =>
              setSelectedMunicipality(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          >
            <MenuItem value="">Todos</MenuItem>
            {[...municipalities]
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} ({municipalityCountMap[m.id] || 0})
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mb: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {topMunicipalities.map((m) => (
          <Chip
            key={m.id}
            label={`${m.name} (${m.count})`}
            variant="outlined"
            onClick={() => setSelectedMunicipality(m.id)}
          />
        ))}
        {selectedMunicipality !== null && (
          <Chip
            label="Limpiar filtro"
            color="primary"
            onClick={() => setSelectedMunicipality(null)}
          />
        )}
      </Box>

      <div style={{ height: 450 }}>
        <DataGrid
          rows={filteredClients}
          columns={columns}
          getRowId={(row) => row.id}
        />
      </div>

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
              setFormData(emptyClient);
              setOpenCreate(false);
            }}
          />
        </DialogContent>
      </Dialog>

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
            clientId={editingClientId}
            value={formData}
            onChange={setFormData}
            onSuccess={() => {
              fetchClients();
              setOpenEdit(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <ClientsMapModal
        open={openMap}
        onClose={() => {
          setOpenMap(false);
          setSelectedMapClient(null);
        }}
        clients={georeferencedClients}
        municipalityMap={municipalityMap}
        selectedClient={selectedMapClient}
      />

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
