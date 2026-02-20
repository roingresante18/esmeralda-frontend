import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Paper,
  InputAdornment,
  MenuItem,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  useMediaQuery,
  Tabs,
  Tab,
  Card,
  CardContent,
  Skeleton,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRowModesModel,
} from "@mui/x-data-grid";
import Grid from "@mui/material/Grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import api from "../../api/api";

/* ======================= TIPOS ======================= */
interface Product {
  id?: number;
  name: string;
  description: string;
  unit_price: number;
  iva_percent: number;
  utilidad_percent: number;
  sale_price: number;
  proveedor: string;
  rubro_id: number | "";
  is_active: boolean;
}

interface Rubro {
  id: number;
  name: string;
}

/* ======================= CONSTANTES ======================= */
const emptyProduct: Product = {
  name: "",
  description: "",
  unit_price: 0,
  iva_percent: 21,
  utilidad_percent: 0,
  sale_price: 0,
  proveedor: "",
  rubro_id: "",
  is_active: true,
};

const ProductsManager = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [products, setProducts] = useState<Product[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState(0);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const handleDelete = async () => {
    if (!deleteProduct?.id) return;

    try {
      await api.delete(`/products/${deleteProduct.id}`);
      setSnackbar({
        open: true,
        message: "Producto eliminado",
        severity: "success",
      });
      fetchProducts();
    } catch {
      setSnackbar({
        open: true,
        message: "Error al eliminar producto",
        severity: "error",
      });
    } finally {
      setDeleteProduct(null);
    }
  };

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  /* ======================= DATA ======================= */
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      setSnackbar({
        open: true,
        message: "Error al cargar productos",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRubros = async () => {
    try {
      const res = await api.get("/rubros");
      setRubros(res.data);
    } catch {
      setSnackbar({
        open: true,
        message: "Error al cargar rubros",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchRubros();
  }, []);

  /* ======================= HELPERS ======================= */
  const calculateSalePrice = (p: Product) => {
    const unit = Number(p.unit_price) || 0;
    const ivaPercent = Number(p.iva_percent) || 0;
    const utilidadPercent = Number(p.utilidad_percent) || 0;

    const iva = unit * (ivaPercent / 100);
    const utilidad = unit * (utilidadPercent / 100);

    return Number((unit + utilidad).toFixed(2));
  };

  const liveSalePrice = useMemo(() => {
    if (!editingProduct) return 0;
    return calculateSalePrice(editingProduct);
  }, [editingProduct]);

  const updateField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setEditingProduct((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const isValid =
    !!editingProduct &&
    editingProduct.name.trim() !== "" &&
    editingProduct.unit_price > 0 &&
    editingProduct.rubro_id !== "";

  /* ======================= CRUD ======================= */
  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      setSaving(true);

      const basePayload = {
        name: editingProduct.name,
        description: editingProduct.description,
        unit_price: Number(editingProduct.unit_price),
        iva_percent: Number(editingProduct.iva_percent),
        utilidad_percent: Number(editingProduct.utilidad_percent),
        sale_price: calculateSalePrice(editingProduct),
        proveedor: editingProduct.proveedor,
        rubro_id: editingProduct.rubro_id,
        is_active: editingProduct.is_active,
      };

      if (editingProduct.id) {
        await api.patch(`/products/${editingProduct.id}`, basePayload);
      } else {
        await api.post("/products", basePayload);
      }

      setSnackbar({
        open: true,
        message: editingProduct.id ? "Producto actualizado" : "Producto creado",
        severity: "success",
      });

      setOpenForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch {
      setSnackbar({
        open: true,
        message: "Error al guardar producto",
        severity: "error",
      });
    } finally {
      setSaving(false);
      setConfirmSave(false);
    }
  };

  /* ======================= GRID ======================= */
  const processRowUpdate = async (row: Product) => {
    const updated = {
      ...row,
      sale_price: calculateSalePrice(row),
    };
    await api.patch(`/products/${row.id}`, updated);
    return updated;
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Código", editable: true, width: 120 },
    {
      field: "description",
      headerName: "Producto",
      editable: true,
      flex: 1,
    },
    { field: "sale_price", headerName: "Precio", width: 110 },
    {
      field: "proveedor",
      headerName: "Proveedor",
      editable: true,
      width: 140,
    },
    {
      field: "is_active",
      headerName: "Activo",
      type: "boolean",
      width: 90,
      editable: true,
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => {
              setEditingProduct({
                ...params.row,
                unit_price: Number(params.row.unit_price) || 0,
                iva_percent: Number(params.row.iva_percent) || 0,
                utilidad_percent: Number(params.row.utilidad_percent) || 0,
              });
              setTab(0);
              setOpenForm(true);
            }}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => setDeleteProduct(params.row)}
          >
            <DeleteIcon />
          </IconButton>
        </>
      ),
    },
  ];

  /* ======================= RENDER ======================= */
  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Typography variant="h4">Gestión de Productos</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingProduct({ ...emptyProduct });
              setOpenForm(true);
            }}
          >
            Nuevo producto
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper sx={{ height: 520 }}>
          {loading ? (
            <Stack spacing={2} p={2}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Stack>
          ) : (
            <DataGrid
              rows={products.filter((p) =>
                `${p.name} ${p.description}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )}
              columns={columns}
              getRowId={(r) => r.id ?? Math.random()}
              editMode="row"
              rowModesModel={rowModesModel}
              onRowModesModelChange={setRowModesModel}
              processRowUpdate={processRowUpdate}
              onProcessRowUpdateError={() =>
                setSnackbar({
                  open: true,
                  message: "Error al actualizar fila",
                  severity: "error",
                })
              }
            />
          )}
        </Paper>

        {/* ======================= FORM ======================= */}
        <Dialog open={openForm} fullScreen={isMobile} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingProduct?.id ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>

          <DialogContent>
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab label="Información" />
              <Tab label="Precios" />
            </Tabs>

            {tab === 0 && (
              <Stack spacing={2}>
                <TextField
                  label="Nombre"
                  value={editingProduct?.name ?? ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  error={!!editingProduct && editingProduct.name.trim() === ""}
                  helperText={editingProduct?.name.trim() === "" && "Requerido"}
                />

                <TextField
                  label="Descripción"
                  value={editingProduct?.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  multiline
                />
                <TextField
                  label="Proveedor"
                  value={editingProduct?.proveedor ?? ""}
                  onChange={(e) => updateField("proveedor", e.target.value)}
                  multiline
                />
                <TextField
                  select
                  label="Rubro"
                  value={editingProduct?.rubro_id ?? ""}
                  onChange={(e) =>
                    updateField(
                      "rubro_id",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  error={editingProduct?.rubro_id === ""}
                  helperText={
                    editingProduct?.rubro_id === "" && "Seleccionar rubro"
                  }
                >
                  {rubros.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </TextField>

                <FormControlLabel
                  control={
                    <Switch
                      checked={editingProduct?.is_active ?? false}
                      onChange={(e) =>
                        updateField("is_active", e.target.checked)
                      }
                    />
                  }
                  label="Activo"
                />
              </Stack>
            )}

            {tab === 1 && (
              <Grid container columns={12} spacing={2}>
                <Grid sx={{ gridColumn: "span 4" }}>
                  <TextField
                    fullWidth
                    label="Precio unitario"
                    type="number"
                    value={editingProduct?.unit_price ?? ""}
                    onChange={(e) =>
                      updateField("unit_price", Number(e.target.value))
                    }
                  />
                </Grid>

                <Grid sx={{ gridColumn: "span 4" }}>
                  <TextField
                    fullWidth
                    label="IVA %"
                    type="number"
                    value={editingProduct?.iva_percent ?? ""}
                    onChange={(e) =>
                      updateField("iva_percent", Number(e.target.value))
                    }
                  />
                </Grid>

                <Grid sx={{ gridColumn: "span 4" }}>
                  <TextField
                    fullWidth
                    label="Utilidad %"
                    type="number"
                    value={editingProduct?.utilidad_percent ?? ""}
                    onChange={(e) =>
                      updateField("utilidad_percent", Number(e.target.value))
                    }
                  />
                </Grid>

                <Grid sx={{ gridColumn: "span 12" }}>
                  <Card>
                    <CardContent>
                      <Typography variant="overline">
                        Precio de venta
                      </Typography>
                      <Typography variant="h4">${liveSalePrice}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancelar</Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!isValid || saving}
              onClick={() => setConfirmSave(true)}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ======================= CONFIRM ======================= */}
        <Dialog open={confirmSave}>
          <DialogTitle>¿Confirmar guardado?</DialogTitle>
          <DialogActions>
            <Button
              onClick={() => setConfirmSave(false)}
              startIcon={<CloseIcon />}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              startIcon={<SaveIcon />}
              variant="contained"
            >
              Confirmar
            </Button>
          </DialogActions>
        </Dialog>

        {/* ======================= DELETE ======================= */}
        <Dialog open={!!deleteProduct}>
          <DialogTitle>¿Eliminar producto?</DialogTitle>
          <DialogContent>
            <Typography>Esta acción no se puede deshacer.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteProduct(null)}>Cancelar</Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              startIcon={<DeleteIcon />}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ProductsManager;
