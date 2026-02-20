//primer codigo mejorado

// import React, { useEffect, useMemo, useState } from "react";
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
//   Stack,
//   Paper,
//   InputAdornment,
//   MenuItem,
//   Switch,
//   FormControlLabel,
//   Snackbar,
//   Alert,
//   useMediaQuery,
//   Tabs,
//   Tab,
//   Card,
//   CardContent,
//   Divider,
//   Grid,
//   Skeleton,
// } from "@mui/material";
// import { DataGrid, type GridColDef, type GridRowModesModel } from "@mui/x-data-grid";
// import { useTheme } from "@mui/material/styles";
// import { motion } from "framer-motion";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
// import SearchIcon from "@mui/icons-material/Search";
// import AddIcon from "@mui/icons-material/Add";
// import SaveIcon from "@mui/icons-material/Save";
// import CloseIcon from "@mui/icons-material/Close";
// import api from "../../api/api";

// /* ======================= TIPOS ======================= */
// interface Product {
//   id?: number;
//   name: string;
//   description: string;
//   unit_price: number;
//   iva_percent: number;
//   utilidad_percent: number;
//   sale_price: number;
//   proveedor: string;
//   rubro_id: number | "";
//   is_active: boolean;
// }

// interface Rubro {
//   id: number;
//   name: string;
// }

// /* ======================= CONSTANTES ======================= */
// const emptyProduct: Product = {
//   name: "",
//   description: "",
//   unit_price: 0,
//   iva_percent: 21,
//   utilidad_percent: 0,
//   sale_price: 0,
//   proveedor: "",
//   rubro_id: "",
//   is_active: true,
// };

// const ProductsManager = () => {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down("md"));

//   const [products, setProducts] = useState<Product[]>([]);
//   const [rubros, setRubros] = useState<Rubro[]>([]);
//   const [search, setSearch] = useState("");

//   const [openForm, setOpenForm] = useState(false);
//   const [confirmSave, setConfirmSave] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [tab, setTab] = useState(0);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

//   const [snackbar, setSnackbar] = useState<{
//     open: boolean;
//     message: string;
//     severity: "success" | "error";
//   }>({ open: false, message: "", severity: "success" });

//   /* ======================= DATA ======================= */
//   const fetchProducts = async () => {
//     setLoading(true);
//     const res = await api.get("/products");
//     setProducts(res.data);
//     setLoading(false);
//   };

//   const fetchRubros = async () => {
//     const res = await api.get("/rubros");
//     setRubros(res.data);
//   };

//   useEffect(() => {
//     fetchProducts();
//     fetchRubros();
//   }, []);

//   /* ======================= HELPERS ======================= */
//   const calculateSalePrice = (p: Product) => {
//     const iva = p.unit_price * (p.iva_percent / 100);
//     const utilidad = p.unit_price * (p.utilidad_percent / 100);
//     return Number((p.unit_price + iva + utilidad).toFixed(2));
//   };

//   const liveSalePrice = useMemo(() => {
//     if (!editingProduct) return 0;
//     return calculateSalePrice(editingProduct);
//   }, [editingProduct]);

//   const updateField = <K extends keyof Product>(key: K, value: Product[K]) => {
//     setEditingProduct((prev) => (prev ? { ...prev, [key]: value } : prev));
//   };

//   const isValid =
//     editingProduct &&
//     editingProduct.name.trim() !== "" &&
//     editingProduct.unit_price > 0 &&
//     editingProduct.rubro_id !== "";

//   /* ======================= CRUD ======================= */
//   const handleSave = async () => {
//     if (!editingProduct) return;

//     try {
//       setSaving(true);
//       const payload = {
//         ...editingProduct,
//         sale_price: calculateSalePrice(editingProduct),
//       };

//       if (!editingProduct.id) delete (payload as any).id;

//       editingProduct.id
//         ? await api.patch(`/products/${editingProduct.id}`, payload)
//         : await api.post("/products", payload);

//       setSnackbar({
//         open: true,
//         message: editingProduct.id ? "Producto actualizado" : "Producto creado",
//         severity: "success",
//       });

//       setOpenForm(false);
//       setEditingProduct(null);
//       fetchProducts();
//     } catch {
//       setSnackbar({
//         open: true,
//         message: "Error al guardar producto",
//         severity: "error",
//       });
//     } finally {
//       setSaving(false);
//       setConfirmSave(false);
//     }
//   };

//   /* ======================= GRID INLINE EDIT ======================= */
//   const processRowUpdate = async (row: Product) => {
//     const updated = { ...row, sale_price: calculateSalePrice(row) };
//     await api.patch(`/products/${row.id}`, updated);
//     return updated;
//   };

//   /* ======================= GRID ======================= */
//   const columns: GridColDef[] = [
//     { field: "name", headerName: "Código", editable: true, width: 120 },
//     { field: "description", headerName: "Producto", editable: true, flex: 1 },
//     { field: "sale_price", headerName: "Precio", width: 110 },
//     { field: "proveedor", headerName: "Proveedor", editable: true, width: 130 },
//     {
//       field: "is_active",
//       headerName: "Activo",
//       width: 90,
//       editable: true,
//       type: "boolean",
//     },
//     {
//       field: "actions",
//       headerName: "Acciones",
//       width: 120,
//       renderCell: (params) => (
//         <IconButton onClick={() => setEditingProduct(params.row) || setOpenForm(true)}>
//           <EditIcon />
//         </IconButton>
//       ),
//     },
//   ];

//   /* ======================= RENDER ======================= */
//   return (
//     <Container maxWidth="xl" sx={{ mt: 4 }}>
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//         <Box display="flex" justifyContent="space-between" mb={2}>
//           <Typography variant="h4">Gestión de Productos</Typography>
//           <Button
//             variant="contained"
//             startIcon={<AddIcon />}
//             onClick={() => {
//               setEditingProduct({ ...emptyProduct });
//               setOpenForm(true);
//             }}
//           >
//             Nuevo producto
//           </Button>
//         </Box>

//         <Paper sx={{ p: 2, mb: 2 }}>
//           <TextField
//             fullWidth
//             placeholder="Buscar producto..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon />
//                 </InputAdornment>
//               ),
//             }}
//           />
//         </Paper>

//         <Paper sx={{ height: 520 }}>
//           {loading ? (
//             <Stack spacing={2} p={2}>
//               <Skeleton height={40} />
//               <Skeleton height={40} />
//               <Skeleton height={40} />
//             </Stack>
//           ) : (
//             <DataGrid
//               rows={products.filter((p) =>
//                 `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())
//               )}
//               columns={columns}
//               getRowId={(r) => r.id!}
//               editMode="row"
//               rowModesModel={rowModesModel}
//               onRowModesModelChange={setRowModesModel}
//               processRowUpdate={processRowUpdate}
//             />
//           )}
//         </Paper>

//         {/* ======================= DIALOG ======================= */}
//         <Dialog open={openForm} fullScreen={isMobile} maxWidth="md" fullWidth>
//           <DialogTitle>{editingProduct?.id ? "Editar producto" : "Nuevo producto"}</DialogTitle>

//           <DialogContent>
//             <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
//               <Tab label="Información" />
//               <Tab label="Precios" />
//             </Tabs>

//             {tab === 0 && (
//               <Stack spacing={2}>
//                 <TextField
//                   label="Nombre"
//                   value={editingProduct?.name || ""}
//                   onChange={(e) => updateField("name", e.target.value)}
//                   error={!editingProduct?.name}
//                   helperText={!editingProduct?.name && "Requerido"}
//                 />

//                 <TextField
//                   label="Descripción"
//                   value={editingProduct?.description || ""}
//                   onChange={(e) => updateField("description", e.target.value)}
//                   multiline
//                 />

//                 <TextField
//                   select
//                   label="Rubro"
//                   value={editingProduct?.rubro_id ?? ""}
//                   onChange={(e) => updateField("rubro_id", Number(e.target.value))}
//                   error={!editingProduct?.rubro_id}
//                   helperText={!editingProduct?.rubro_id && "Seleccionar rubro"}
//                 >
//                   {rubros.map((r) => (
//                     <MenuItem key={r.id} value={r.id}>
//                       {r.name}
//                     </MenuItem>
//                   ))}
//                 </TextField>

//                 <FormControlLabel
//                   control={
//                     <Switch
//                       checked={editingProduct?.is_active ?? false}
//                       onChange={(e) => updateField("is_active", e.target.checked)}
//                     />
//                   }
//                   label="Activo"
//                 />
//               </Stack>
//             )}

//             {tab === 1 && (
//               <Grid container spacing={2}>
//                 <Grid item xs={4}>
//                   <TextField
//                     label="Precio unitario"
//                     type="number"
//                     value={editingProduct?.unit_price ?? ""}
//                     onChange={(e) => updateField("unit_price", Number(e.target.value))}
//                     error={(editingProduct?.unit_price ?? 0) <= 0}
//                     helperText="Debe ser mayor a 0"
//                   />
//                 </Grid>

//                 <Grid item xs={4}>
//                   <TextField
//                     label="IVA %"
//                     type="number"
//                     value={editingProduct?.iva_percent ?? ""}
//                     onChange={(e) => updateField("iva_percent", Number(e.target.value))}
//                   />
//                 </Grid>

//                 <Grid item xs={4}>
//                   <TextField
//                     label="Utilidad %"
//                     type="number"
//                     value={editingProduct?.utilidad_percent ?? ""}
//                     onChange={(e) =>
//                       updateField("utilidad_percent", Number(e.target.value))
//                     }
//                   />
//                 </Grid>

//                 <Grid item xs={12}>
//                   <Card sx={{ mt: 2 }}>
//                     <CardContent>
//                       <Typography variant="overline">Precio de venta</Typography>
//                       <Typography variant="h4">${liveSalePrice}</Typography>
//                     </CardContent>
//                   </Card>
//                 </Grid>
//               </Grid>
//             )}
//           </DialogContent>

//           <DialogActions>
//             <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
//             <Button
//               variant="contained"
//               startIcon={<SaveIcon />}
//               disabled={!isValid || saving}
//               onClick={() => setConfirmSave(true)}
//             >
//               Guardar
//             </Button>
//           </DialogActions>
//         </Dialog>

//         {/* ======================= CONFIRM ======================= */}
//         <Dialog open={confirmSave}>
//           <DialogTitle>¿Confirmar guardado?</DialogTitle>
//           <DialogActions>
//             <Button onClick={() => setConfirmSave(false)} startIcon={<CloseIcon />}>
//               Cancelar
//             </Button>
//             <Button onClick={handleSave} startIcon={<SaveIcon />} variant="contained">
//               Confirmar
//             </Button>
//           </DialogActions>
//         </Dialog>

//         <Snackbar
//           open={snackbar.open}
//           autoHideDuration={3000}
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//         >
//           <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
//         </Snackbar>
//       </motion.div>
//     </Container>
//   );
// };

// export default ProductsManager;

import { Container, Tabs, Tab, Box, Typography, Button } from "@mui/material";
import { useState, useEffect } from "react";
import ProductsDashboard from "./ProductsDashboard";
import ImportProducts from "./ImportProducts";
import ProductsManager2 from "../../admin/ProductsManager"; // 👈 tu grilla real
import StockManager from "../../admin/StockManager"; // 👈 tu gestor de stock
import { can } from "./permissions";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";

const USER_ROLE = "ADMIN";

function TabPanel({ value, index, children }: any) {
  return value === index ? <Box mt={3}>{children}</Box> : null;
}

export default function ProductsManager() {
  const [tab, setTab] = useState(0);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    api.get("/products/metrics").then((r) => setMetrics(r.data));
  }, []);
  const navigate = useNavigate();
  return (
    <Container maxWidth="xl">
      <Button
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          borderRadius: 50,
          zIndex: 1300,
        }}
        variant="contained"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
      >
        ← Volver
      </Button>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Dashboard" />
        <Tab label="Productos" />
        <Tab label="Stock" />
        {/* <Tab label="Importación" /> */}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <ProductsDashboard metrics={metrics} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <ProductsManager2 />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <StockManager />
      </TabPanel>

      {/* <TabPanel value={tab} index={3}>
        {can(USER_ROLE as any, "IMPORT_PRODUCTS") ? (
          <ImportProducts />
        ) : (
          <Typography color="error">
            No tenés permisos para importar productos
          </Typography>
        )}
      </TabPanel> */}
    </Container>
  );
}
