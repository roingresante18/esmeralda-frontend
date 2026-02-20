// import React, { useEffect, useState } from "react";
// import {
//   Container,
//   Typography,
//   Box,
//   TextField,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   IconButton,
//   Paper,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   FormHelperText,
//   CircularProgress,
// } from "@mui/material";
// import { DataGrid, type GridColDef } from "@mui/x-data-grid";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
// import MyLocationIcon from "@mui/icons-material/MyLocation";
// import api from "../../../api/api";
// import ClientForm from "./components/ClientForm";
// import type { ClientFormData } from "./components/ClientForm.types";
// /* =======================
//        TIPOS
//     ======================= */

// // interface Client {
// //   id: number;
// //   name: string;
// //   email: string;
// //   phone: string;
// //   address: string;
// //   municipality_id: number;
// //   latitude?: number;
// //   longitude?: number;
// // }

// // interface CreateClientPayload {
// //   name: string;
// //   email: string;
// //   phone: string;
// //   address: string;
// //   municipality_id: number | "";
// //   latitude?: number;
// //   longitude?: number;
// // }

// interface Municipality {
//   id: number;
//   name: string;
// }
// const emptyClient: ClientFormData = {
//   name: "",
//   email: "",
//   phone: "",
//   address: "",
//   municipality_id: "",
// };

// /* =======================
//        COMPONENTE
//     ======================= */

// const ClientManager = () => {
//   const [clients, setClients] = useState<Client[]>([]);
//   const [filteredClients, setFilteredClients] = useState<Client[]>([]);
//   const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
//   const [search, setSearch] = useState("");
//   // const [loadingGeo, setLoadingGeo] = useState(false);
//   const [newClient, setNewClient] = useState<ClientFormData>(emptyClient);
//   const [loading, setLoading] = useState(false);
//   // const [newClient, setNewClient] = useState<CreateClientPayload>({
//   //   name: "",
//   //   email: "",
//   //   phone: "",
//   //   address: "",
//   //   municipality_id: "",
//   // });

//   // const [errors, setErrors] = useState<Record<string, string>>({});
//   const [selectedClient, setSelectedClient] = useState<Client | null>(null);
//   const [open, setOpen] = useState(false);

//   const [paginationModel, setPaginationModel] = useState({
//     page: 0,
//     pageSize: 10,
//   });

//   /* =======================
//          FETCH DATA
//       ======================= */

//   const fetchClients = async () => {
//     const res = await api.get("/clients");
//     setClients(res.data);
//     setFilteredClients(res.data);
//   };

//   const fetchMunicipalities = async () => {
//     try {
//       const res = await api.get("/logistics/municipalities");
//       setMunicipalities(res.data.municipalities); //✅ SOLO EL ARRAY
//     } catch (err) {
//       console.error("Error cargando municipios", err);
//     }
//   };

//   useEffect(() => {
//     fetchClients();
//     // fetchMunicipalities();
//   }, []);

//   /* =======================
//          BUSCADOR
//       ======================= */

//   useEffect(() => {
//     const lower = search.toLowerCase();
//     setFilteredClients(
//       clients.filter(
//         (c) =>
//           c.name.toLowerCase().includes(lower) ||
//           c.email?.toLowerCase().includes(lower) ||
//           c.phone?.includes(lower),
//       ),
//     );
//   }, [search, clients]);

//   /* =======================
//          VALIDACIONES
//       ======================= */

//   // const validate = (data: CreateClientPayload) => {
//   //   const errs: Record<string, string> = {};

//   //   if (!data.name) errs.name = "El nombre es obligatorio";
//   //   if (!data.address) errs.address = "La dirección es obligatoria";
//   //   if (data.municipality_id === "")
//   //     errs.municipality_id = "Seleccione un municipio";

//   //   if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
//   //     errs.email = "Email inválido";
//   //   }

//   //   setErrors(errs);
//   //   return Object.keys(errs).length === 0;
//   // };

//   /* =======================
//          GEOLOCALIZACIÓN (OPTIMIZADA)
//       ======================= */

//   // const getLocation = () => {
//   //   if (!navigator.geolocation) {
//   //     alert("Geolocalización no soportada");
//   //     return;
//   //   }

//   //   setLoadingGeo(true);

//   //   navigator.geolocation.getCurrentPosition(
//   //     (pos) => {
//   //       setNewClient((prev) => ({
//   //         ...prev,
//   //         latitude: pos.coords.latitude,
//   //         longitude: pos.coords.longitude,
//   //       }));
//   //       setLoadingGeo(false);
//   //     },
//   //     () => {
//   //       alert("No se pudo obtener la ubicación");
//   //       setLoadingGeo(false);
//   //     },
//   //     {
//   //       enableHighAccuracy: true,
//   //       timeout: 10000,
//   //       maximumAge: 60000, //cachea 1 min
//   //     },
//   //   );
//   // };

//   /* =======================
//          CREATE
//       ======================= */

//   const handleCreate = async () => {
//     setLoading(true);
//     try {
//       await api.post("/clients", newClient);
//       setNewClient(emptyClient);
//       alert("✅ Cliente creado");
//     } catch (e) {
//       alert("❌ Error creando cliente");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleCreate = async (e: React.FormEvent) => {
//   //   e.preventDefault();
//   //   if (!validate(newClient)) return;

//   //   try {
//   //     await api.post("/clients", {
//   //       name: newClient.name,
//   //       email: newClient.email || null,
//   //       phone: newClient.phone || null,
//   //       address: newClient.address,
//   //       municipality_id: newClient.municipality_id,
//   //       latitude: newClient.latitude,
//   //       longitude: newClient.longitude,
//   //     });

//   //     setNewClient({
//   //       name: "",
//   //       email: "",
//   //       phone: "",
//   //       address: "",
//   //       municipality_id: "",
//   //     });

//   //     fetchClients();
//   //     alert("✅ Cliente creado correctamente");
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert("❌ Error al crear cliente");
//   //   }
//   // };

//   /* =======================
//          UPDATE
//       ======================= */

//   const handleSave = async () => {
//     if (!selectedClient) return;

//     try {
//       const { id, ...payload } = selectedClient;

//       await api.patch(`/clients/${id}`, payload);

//       setOpen(false);
//       fetchClients();
//       alert("✅ Cliente actualizado");
//     } catch (err) {
//       console.error(err);
//       alert("❌ Error al actualizar cliente");
//     }
//   };

//   /* =======================
//          DELETE
//       ======================= */

//   const handleDelete = async (id: number) => {
//     if (!window.confirm("¿Eliminar cliente?")) return;

//     try {
//       await api.delete(`/clients/${id}`);
//       fetchClients();
//     } catch (err) {
//       console.error(err);
//       alert("❌ Error al eliminar cliente");
//     }
//   };

//   /* =======================
//          TABLA
//       ======================= */

//   const columns: GridColDef[] = [
//     { field: "id", headerName: "ID", width: 80 },
//     { field: "name", headerName: "Nombre", width: 180 },
//     { field: "email", headerName: "Email", width: 220 },
//     { field: "phone", headerName: "Teléfono", width: 140 },
//     { field: "address", headerName: "Dirección", width: 220 },
//     {
//       field: "actions",
//       headerName: "Acciones",
//       width: 130,
//       renderCell: (params) => (
//         <>
//           <IconButton
//             onClick={() => {
//               setSelectedClient(params.row);
//               setOpen(true);
//             }}
//           >
//             <EditIcon />
//           </IconButton>
//           <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
//             <DeleteIcon />
//           </IconButton>
//         </>
//       ),
//     },
//   ];

//   /* =======================
//          RENDER
//       ======================= */

//   return (
//     <Container sx={{ mt: 4 }}>
//       <Typography variant="h5" gutterBottom>
//         Gestión de Clientes
//       </Typography>
//       <Paper sx={{ p: 3 }}>
//         <ClientForm
//           mode="create"
//           value={newClient}
//           onChange={setNewClient}
//           onSubmit={handleCreate}
//           municipalities={municipalities}
//           loading={loading}
//         />
//       </Paper>
//       <TextField
//         label="Buscar..."
//         fullWidth
//         sx={{ mb: 3 }}
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//       />

//       <Paper sx={{ p: 3, mb: 4 }}>
//         <Typography variant="h6">Nuevo Cliente</Typography>

//         <Box
//           component="form"
//           onSubmit={handleCreate}
//           sx={{
//             display: "grid",
//             gap: 2,
//             gridTemplateColumns: "repeat(3, 1fr)",
//           }}
//         >
//           <TextField
//             label="Nombre"
//             error={!!errors.name}
//             helperText={errors.name}
//             value={newClient.name}
//             onChange={(e) =>
//               setNewClient({ ...newClient, name: e.target.value })
//             }
//           />

//           <TextField
//             label="Email"
//             error={!!errors.email}
//             helperText={errors.email}
//             value={newClient.email}
//             onChange={(e) =>
//               setNewClient({ ...newClient, email: e.target.value })
//             }
//           />

//           <TextField
//             label="Teléfono"
//             value={newClient.phone}
//             onChange={(e) =>
//               setNewClient({ ...newClient, phone: e.target.value })
//             }
//           />

//           <TextField
//             label="Dirección"
//             error={!!errors.address}
//             helperText={errors.address}
//             value={newClient.address}
//             onChange={(e) =>
//               setNewClient({ ...newClient, address: e.target.value })
//             }
//           />

//           <FormControl error={!!errors.municipality_id}>
//             <InputLabel>Municipio</InputLabel>
//             <Select
//               label="Municipio"
//               value={newClient.municipality_id}
//               onChange={(e) =>
//                 setNewClient({
//                   ...newClient,
//                   municipality_id: Number(e.target.value),
//                 })
//               }
//             >
//               {municipalities.map((m) => (
//                 <MenuItem key={m.id} value={m.id}>
//                   {m.name}
//                 </MenuItem>
//               ))}
//             </Select>
//             <FormHelperText>{errors.municipality_id}</FormHelperText>
//           </FormControl>

//           <Button
//             startIcon={
//               loadingGeo ? <CircularProgress size={18} /> : <MyLocationIcon />
//             }
//             onClick={getLocation}
//             variant="outlined"
//           >
//             Usar ubicación actual
//           </Button>

//           <Button type="submit" variant="contained">
//             Guardar Cliente
//           </Button>
//         </Box>
//       </Paper>

//       <div style={{ height: 420 }}>
//         <DataGrid
//           rows={filteredClients}
//           columns={columns}
//           getRowId={(r) => r.id}
//           paginationModel={paginationModel}
//           onPaginationModelChange={setPaginationModel}
//           pageSizeOptions={[5, 10, 25]}
//           disableRowSelectionOnClick
//         />
//       </div>

//       <Dialog open={open} onClose={() => setOpen(false)}>
//         <DialogTitle>Editar Cliente</DialogTitle>
//         <DialogContent>
//           <TextField
//             fullWidth
//             margin="dense"
//             label="Nombre"
//             value={selectedClient?.name || ""}
//             onChange={(e) =>
//               setSelectedClient({ ...selectedClient!, name: e.target.value })
//             }
//           />
//           <TextField
//             fullWidth
//             margin="dense"
//             label="Email"
//             value={selectedClient?.email || ""}
//             onChange={(e) =>
//               setSelectedClient({ ...selectedClient!, email: e.target.value })
//             }
//           />
//           <TextField
//             fullWidth
//             margin="dense"
//             label="Teléfono"
//             value={selectedClient?.phone || ""}
//             onChange={(e) =>
//               setSelectedClient({ ...selectedClient!, phone: e.target.value })
//             }
//           />
//           <TextField
//             fullWidth
//             margin="dense"
//             label="Dirección"
//             value={selectedClient?.address || ""}
//             onChange={(e) =>
//               setSelectedClient({ ...selectedClient!, address: e.target.value })
//             }
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpen(false)}>Cancelar</Button>
//           <Button variant="contained" onClick={handleSave}>
//             Guardar
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Container>
//   );
// };

// export default ClientManager;

// // import { Container, Typography, Paper, Button, Dialog, DialogContent, DialogTitle, TextField } from "@mui/material";
// // import { useEffect, useState } from "react";
// // import api from "../../../api/api";
// // import ClientForm from "./components/ClientForm";
// // import type {
// //   ClientFormData,
// //   Municipality,
// // } from "./components/ClientForm.types";
// // import { useNavigate } from "react-router-dom";
// // import { DataGrid } from "@mui/x-data-grid";

// // const emptyClient: ClientFormData = {
// //   name: "",
// //   email: "",
// //   phone: "",
// //   address: "",
// //   municipality_id: "",
// // };

// // export default function ClientManager() {
// //   const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
// //   const [newClient, setNewClient] = useState<ClientFormData>(emptyClient);
// //   const [loading, setLoading] = useState(false);

// //   useEffect(() => {
// //     api.get("/logistics/municipalities").then((res) => {
// //       setMunicipalities(res.data.municipalities);
// //     });
// //   }, []);

// //   const handleCreate = async () => {
// //     setLoading(true);
// //     try {
// //       await api.post("/clients", newClient);
// //       setNewClient(emptyClient);
// //       alert("✅ Cliente creado");
// //     } catch (e) {
// //       alert("❌ Error creando cliente");
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const navigate = useNavigate();
// //   const columns: GridColDef[] = [
// //         { field: "id", headerName: "ID", width: 80 },
// //         { field: "name", headerName: "Nombre", width: 180 },
// //         { field: "email", headerName: "Email", width: 220 },
// //         { field: "phone", headerName: "Teléfono", width: 140 },
// //         { field: "address", headerName: "Dirección", width: 220 },
// //         {
// //           field: "actions",
// //           headerName: "Acciones",
// //           width: 130,
// //           renderCell: (params) => (
// //             <>
// //               <IconButton
// //                 onClick={() => {
// //                   setSelectedClient(params.row);
// //                   setOpen(true);
// //                 }}
// //               >
// //                 <EditIcon />
// //               </IconButton>
// //               <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
// //                 <DeleteIcon />
// //               </IconButton>
// //             </>
// //           ),
// //         },
// //       ];
// //   return (
// //     <Container sx={{ mt: 4 }}>
// //       <Button
// //         sx={{
// //           position: "fixed",
// //           bottom: 16,
// //           right: 16,
// //           borderRadius: 50,
// //           zIndex: 1300,
// //         }}
// //         variant="contained"
// //         onClick={() => {
// //           if (window.history.length > 1) {
// //             navigate(-1);
// //           } else {
// //             navigate("/");
// //           }
// //         }}
// //       >
// //         ← Volver
// //       </Button>
// //       <Typography variant="h5" gutterBottom>
// //         Nuevo Cliente
// //       </Typography>

// //       <Paper sx={{ p: 3 }}>
// //         <ClientForm
// //           mode="create"
// //           value={newClient}
// //           onChange={setNewClient}
// //           onSubmit={handleCreate}
// //           municipalities={municipalities}
// //           loading={loading}
// //         />
// //       </Paper>

// //       <div style={{ height: 420 }}>
// //           <DataGrid
// //               rows={filteredClients}
// //               columns={columns}
// //               getRowId={(r) => r.id}
// //               paginationModel={paginationModel}
// //               onPaginationModelChange={setPaginationModel}
// //               pageSizeOptions={[5, 10, 25]}
// //               disableRowSelectionOnClick
// //             />
// //           </div>

// //           <Dialog open={open} onClose={() => setOpen(false)}>
// //             <DialogTitle>Editar Cliente</DialogTitle>
// //             <DialogContent>
// //               <TextField
// //                 fullWidth
// //                 margin="dense"
// //                 label="Nombre"
// //                 value={selectedClient?.name || ""}
// //                 onChange={(e) =>
// //                   setSelectedClient({ ...selectedClient!, name: e.target.value })
// //                 }
// //               />
// //               <TextField
// //                 fullWidth
// //                 margin="dense"
// //                 label="Email"
// //                 value={selectedClient?.email || ""}
// //                 onChange={(e) =>
// //                   setSelectedClient({ ...selectedClient!, email: e.target.value })
// //                 }
// //               />
// //               <TextField
// //                 fullWidth
// //                 margin="dense"
// //                 label="Teléfono"
// //                 value={selectedClient?.phone || ""}
// //                 onChange={(e) =>
// //                   setSelectedClient({ ...selectedClient!, phone: e.target.value })
// //                 }
// //               />
// //               <TextField
// //                 fullWidth
// //                 margin="dense"
// //                 label="Dirección"
// //                 value={selectedClient?.address || ""}
// //                 onChange={(e) =>
// //                   setSelectedClient({ ...selectedClient!, address: e.target.value })
// //                 }
// //               />
// //             </DialogContent>
// //     </Container>
// //   );
// // }

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
  email: "",
  phone: "",
  address: "",
  municipality_id: "",
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
      await api.post("/clients", newClient);
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
