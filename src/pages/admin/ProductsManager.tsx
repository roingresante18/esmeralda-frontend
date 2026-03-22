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
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Checkbox,
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
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import DashboardIcon from "@mui/icons-material/Dashboard";
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
  rubro?: Rubro | null;
}

interface Rubro {
  id: number;
  name: string;
}

interface ImportIncomingData {
  description: string;
  unit_price: number;
  iva_percent: number;
  utilidad_percent: number;
  sale_price: number;
  proveedor: string;
  is_active: boolean;
  rubro_id: number | null;
  rubro_name?: string;
}

interface ImportUpdateItem {
  rowNumber: number;
  productId: number;
  code: string;
  current: {
    name: string;
    description: string;
    unit_price: number;
    iva_percent: number;
    utilidad_percent: number;
    sale_price: number;
    proveedor: string;
    is_active: boolean;
    rubro_id: number | null;
    rubro_name: string | null;
  };
  incoming: ImportIncomingData;
  changes: Record<
    string,
    {
      old: unknown;
      new: unknown;
    }
  >;
}

interface ImportMissingItem {
  rowNumber: number;
  code: string;
  description: string;
  incoming: ImportIncomingData;
}

interface ImportErrorItem {
  rowNumber: number;
  code?: string;
  error: string;
}

interface ImportDuplicateFileItem {
  code: string;
  rows: number[];
}

interface ImportDuplicateDbItem {
  code: string;
  productIds: number[];
}

interface ImportPreviewResponse {
  summary: {
    totalRows: number;
    matched: number;
    notFound: number;
    errors: number;
    duplicatedCodesInFile: number;
    duplicatedCodesInDb: number;
  };
  updates: ImportUpdateItem[];
  missing: ImportMissingItem[];
  errors: ImportErrorItem[];
  duplicatedCodesInFile: ImportDuplicateFileItem[];
  duplicatedCodesInDb: ImportDuplicateDbItem[];
}

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
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState(0);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] =
    useState<ImportPreviewResponse | null>(null);
  const [importingPreview, setImportingPreview] = useState(false);
  const [confirmingImport, setConfirmingImport] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(
    null,
  );
  const [createMissing, setCreateMissing] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

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

  const calculateSalePrice = (p: Product) => {
    const unit = Number(p.unit_price) || 0;
    const utilidadPercent = Number(p.utilidad_percent) || 0;
    return Number((unit + unit * (utilidadPercent / 100)).toFixed(2));
  };

  const liveSalePrice = useMemo(() => {
    if (!editingProduct) return 0;
    return calculateSalePrice(editingProduct);
  }, [editingProduct]);

  const updateField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setEditingProduct((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [key]: value };

      if (key === "unit_price" || key === "utilidad_percent") {
        updated.sale_price = calculateSalePrice(updated);
      }

      return updated;
    });
  };

  const isValid =
    !!editingProduct &&
    editingProduct.name.trim() !== "" &&
    editingProduct.unit_price > 0 &&
    editingProduct.rubro_id !== "";

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

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      setSaving(true);

      const calculatedSalePrice = calculateSalePrice(editingProduct);

      const basePayload = {
        name: editingProduct.name,
        description: editingProduct.description,
        unit_price: Number(editingProduct.unit_price),
        iva_percent: Number(editingProduct.iva_percent),
        utilidad_percent: Number(editingProduct.utilidad_percent),
        sale_price: calculatedSalePrice,
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

  const resetImportState = () => {
    setSelectedImportFile(null);
    setImportPreview(null);
    setImportingPreview(false);
    setConfirmingImport(false);
    setCreateMissing(false);
  };

  const openImportDialog = () => {
    resetImportState();
    setImportDialogOpen(true);
  };

  const closeImportDialog = () => {
    if (importingPreview || confirmingImport) return;
    setImportDialogOpen(false);
    resetImportState();
  };

  const handleSelectImportFile = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedImportFile(file);
    setImportPreview(null);
  };

  const handleImportPreview = async () => {
    if (!selectedImportFile) {
      setSnackbar({
        open: true,
        message: "Seleccioná un archivo Excel",
        severity: "error",
      });
      return;
    }

    try {
      setImportingPreview(true);

      const formData = new FormData();
      formData.append("file", selectedImportFile);

      const res = await api.post<ImportPreviewResponse>(
        "/products/import-preview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 220000,
        },
      );

      setImportPreview(res.data);

      setSnackbar({
        open: true,
        message: "Vista previa generada correctamente",
        severity: "success",
      });
    } catch (error: any) {
      setImportPreview(null);

      const responseData = error?.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : Array.isArray(responseData?.message)
            ? responseData.message.join(", ")
            : typeof responseData?.message === "string"
              ? responseData.message
              : typeof responseData?.error === "string"
                ? responseData.error
                : error?.message ||
                  "Error al procesar el archivo de importación";

      setSnackbar({
        open: true,
        message: backendMessage,
        severity: "error",
      });
    } finally {
      setImportingPreview(false);
    }
  };

  const handleConfirmImport = async () => {
    console.log("CONFIRM CLICK");
    console.log("selectedImportFile:", selectedImportFile);
    console.log("createMissing:", createMissing);
    console.log("importPreview:", importPreview);

    if (!selectedImportFile) {
      setSnackbar({
        open: true,
        message: "No hay archivo seleccionado",
        severity: "error",
      });
      return;
    }

    try {
      setConfirmingImport(true);

      const formData = new FormData();
      formData.append("file", selectedImportFile);

      console.log("ENVIANDO IMPORT-CONFIRM...");

      const res = await api.post(
        `/products/import-confirm?createMissing=${createMissing}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 220000,
        },
      );

      console.log("RESPUESTA IMPORT-CONFIRM:", res.data);

      setSnackbar({
        open: true,
        message: `Importación confirmada. Actualizados: ${
          res.data?.updatedCount ?? 0
        } · Creados: ${res.data?.createdCount ?? 0}`,
        severity: "success",
      });

      setImportDialogOpen(false);
      resetImportState();
      fetchProducts();
    } catch (error: any) {
      console.error("ERROR IMPORT-CONFIRM:", error);

      const responseData = error?.response?.data;
      const backendMessage =
        typeof responseData === "string"
          ? responseData
          : Array.isArray(responseData?.message)
            ? responseData.message.join(", ")
            : typeof responseData?.message === "string"
              ? responseData.message
              : typeof responseData?.error === "string"
                ? responseData.error
                : error?.message || "Error al confirmar la importación";

      setSnackbar({
        open: true,
        message: backendMessage,
        severity: "error",
      });
    } finally {
      setConfirmingImport(false);
    }
  };
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
                sale_price:
                  Number(params.row.sale_price) ||
                  calculateSalePrice({
                    ...params.row,
                    unit_price: Number(params.row.unit_price) || 0,
                    utilidad_percent: Number(params.row.utilidad_percent) || 0,
                  }),
                rubro_id: params.row.rubro?.id ?? params.row.rubro_id ?? "",
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

  const importHasUpdatesOrMissing =
    (importPreview?.updates.length ?? 0) > 0 ||
    (createMissing && (importPreview?.missing.length ?? 0) > 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          mb={2}
          flexWrap="wrap"
        >
          <Typography variant="h4">Gestión de Productos</Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<DashboardIcon />}
              onClick={() => navigate("/admin/product-alerts")}
            >
              Dashboard alertas
            </Button>

            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={openImportDialog}
            >
              Importar Excel
            </Button>

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
          </Stack>
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
                `${p.name} ${p.description} ${p.proveedor ?? ""}`
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
                  label="Código"
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
                      <Typography variant="body2" color="text.secondary">
                        Calculado como: precio costo + utilidad
                      </Typography>
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

        <Dialog
          open={importDialogOpen}
          onClose={closeImportDialog}
          fullScreen={isMobile}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Importar productos desde Excel</DialogTitle>

          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Se usará la columna <strong>Código de barras</strong> del Excel
                para buscar coincidencias contra el campo <strong>name</strong>{" "}
                de la tabla <strong>products</strong>.
              </Typography>

              <Typography variant="body2" color="text.secondary">
                El precio de venta no se toma del Excel. Se calcula como:
                <strong> precio costo + % utilidad</strong>.
              </Typography>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={createMissing}
                    onChange={(e) => setCreateMissing(e.target.checked)}
                  />
                }
                label="Crear productos nuevos no encontrados"
              />

              <Stack
                direction={isMobile ? "column" : "row"}
                spacing={2}
                alignItems={isMobile ? "stretch" : "center"}
              >
                <Button variant="outlined" component="label">
                  Seleccionar archivo
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleSelectImportFile}
                  />
                </Button>

                <Typography variant="body2">
                  {selectedImportFile
                    ? selectedImportFile.name
                    : "No hay archivo seleccionado"}
                </Typography>

                <Button
                  variant="contained"
                  onClick={handleImportPreview}
                  disabled={!selectedImportFile || importingPreview}
                  startIcon={
                    importingPreview ? (
                      <CircularProgress size={18} />
                    ) : (
                      <UploadFileIcon />
                    )
                  }
                >
                  {importingPreview ? "Procesando..." : "Generar vista previa"}
                </Button>
              </Stack>

              {importPreview && (
                <>
                  <Divider />

                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={1}
                    flexWrap="wrap"
                  >
                    <Chip
                      label={`Filas totales: ${importPreview.summary.totalRows}`}
                    />
                    <Chip
                      color="success"
                      label={`Para actualizar: ${importPreview.summary.matched}`}
                    />
                    <Chip
                      color="warning"
                      label={`No encontrados: ${importPreview.summary.notFound}`}
                    />
                    <Chip
                      color="error"
                      label={`Errores: ${importPreview.summary.errors}`}
                    />
                    <Chip
                      label={`Duplicados en archivo: ${importPreview.summary.duplicatedCodesInFile}`}
                    />
                    <Chip
                      label={`Duplicados en base: ${importPreview.summary.duplicatedCodesInDb}`}
                    />
                  </Stack>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Productos a actualizar ({importPreview.updates.length})
                    </Typography>

                    {importPreview.updates.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay productos coincidentes para actualizar.
                      </Typography>
                    ) : (
                      <List dense>
                        {importPreview.updates.map((item) => (
                          <ListItem
                            key={`${item.productId}-${item.rowNumber}`}
                            divider
                            alignItems="flex-start"
                          >
                            <ListItemText
                              primary={`Fila ${item.rowNumber} · Código ${item.code} · ID ${item.productId}`}
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2">
                                    <strong>Descripción:</strong>{" "}
                                    {item.incoming.description || "-"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Costo:</strong>{" "}
                                    {item.current.unit_price} →{" "}
                                    {item.incoming.unit_price}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Utilidad %:</strong>{" "}
                                    {item.current.utilidad_percent} →{" "}
                                    {item.incoming.utilidad_percent}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Precio venta:</strong>{" "}
                                    {item.current.sale_price} →{" "}
                                    {item.incoming.sale_price}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Proveedor:</strong>{" "}
                                    {item.current.proveedor || "-"} →{" "}
                                    {item.incoming.proveedor || "-"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Activo:</strong>{" "}
                                    {String(item.current.is_active)} →{" "}
                                    {String(item.incoming.is_active)}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Rubro:</strong>{" "}
                                    {item.current.rubro_name || "-"} →{" "}
                                    {item.incoming.rubro_name || "-"}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      No encontrados ({importPreview.missing.length})
                    </Typography>

                    {importPreview.missing.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay productos faltantes.
                      </Typography>
                    ) : (
                      <List dense>
                        {importPreview.missing.map((item) => (
                          <ListItem
                            key={`${item.code}-${item.rowNumber}`}
                            divider
                          >
                            <ListItemText
                              primary={`Fila ${item.rowNumber} · Código ${item.code}`}
                              secondary={`Descripción: ${
                                item.description || "-"
                              } · Costo: ${item.incoming.unit_price} · Precio venta calculado: ${item.incoming.sale_price}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Errores ({importPreview.errors.length})
                    </Typography>

                    {importPreview.errors.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No hay errores.
                      </Typography>
                    ) : (
                      <List dense>
                        {importPreview.errors.map((item, index) => (
                          <ListItem key={`${item.rowNumber}-${index}`} divider>
                            <ListItemText
                              primary={`Fila ${item.rowNumber}${
                                item.code ? ` · Código ${item.code}` : ""
                              }`}
                              secondary={item.error}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>

                  {!!importPreview.duplicatedCodesInFile.length && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Duplicados en archivo
                      </Typography>

                      <List dense>
                        {importPreview.duplicatedCodesInFile.map((item) => (
                          <ListItem key={item.code} divider>
                            <ListItemText
                              primary={`Código ${item.code}`}
                              secondary={`Filas: ${item.rows.join(", ")}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}

                  {!!importPreview.duplicatedCodesInDb.length && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Duplicados en base de datos
                      </Typography>

                      <List dense>
                        {importPreview.duplicatedCodesInDb.map((item) => (
                          <ListItem key={item.code} divider>
                            <ListItemText
                              primary={`Código ${item.code}`}
                              secondary={`IDs: ${item.productIds.join(", ")}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  )}
                </>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={closeImportDialog}
              disabled={importingPreview || confirmingImport}
            >
              Cerrar
            </Button>

            <Button
              variant="contained"
              onClick={handleConfirmImport}
              disabled={!importHasUpdatesOrMissing || confirmingImport}
              startIcon={
                confirmingImport ? <CircularProgress size={18} /> : <SaveIcon />
              }
            >
              {confirmingImport ? "Importando..." : "Confirmar importación"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </motion.div>
    </Container>
  );
};

export default ProductsManager;
