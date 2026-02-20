import React, { useEffect, useState } from "react";
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
  Autocomplete,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "../../api/api";

interface StockItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
}

interface Product {
  id: number;
  name: string;
}

const StockManager: React.FC = () => {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  //   📦 Formulario de nuevo registro
  const [form, setForm] = useState({
    product: null as Product | null,
    quantity: "",
  });

  //   📋 Lista de productos para el selector
  const [products, setProducts] = useState<Product[]>([]);

  //   🧩 Obtener productos para el selector
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  };

  //   📦 Obtener el listado de stock
  const fetchStock = async () => {
    try {
      const res = await api.get("/stock");
      setStock(res.data);
      setFilteredStock(res.data);
    } catch (error) {
      console.error("Error al obtener stock:", error);
    }
  };

  useEffect(() => {
    fetchStock();
    fetchProducts();
  }, []);

  //  🔍 Filtro en tiempo real
  useEffect(() => {
    const lower = search.toLowerCase();
    const filtered = stock.filter(
      (item) =>
        item.product_name.toLowerCase().includes(lower) ||
        item.product_id.toString().includes(lower),
    );
    setFilteredStock(filtered);
  }, [search, stock]);

  //  ➕ Crear nuevo registro
  const handleAdd = async () => {
    if (!form.product || !form.quantity) {
      alert("⚠️ Selecciona un producto y cantidad válida");
      return;
    }

    try {
      await api.post("/stock", {
        product_id: form.product.id,
        quantity: Number(form.quantity),
      });
      setForm({ product: null, quantity: "" });
      fetchStock();
      alert("✅ Stock agregado correctamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error al agregar stock");
    }
  };

  //✏️ Editar registro
  const handleEdit = (item: StockItem) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    try {
      await api.patch(`/stock/${selectedItem.id}`, {
        quantity: selectedItem.quantity,
      });
      setOpen(false);
      fetchStock();
      alert("✅ Stock actualizado");
    } catch (error) {
      console.error(error);
      alert("❌ Error al actualizar stock");
    }
  };

  //🗑️ Eliminar registro
  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este registro de stock?")) {
      try {
        await api.delete(`/stock/${id}`);
        fetchStock();
      } catch (error) {
        console.error(error);
        alert("❌ Error al eliminar stock");
      }
    }
  };

  //🧾 Columnas de la tabla
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "product_id", headerName: "ID Producto", width: 120 },
    { field: "product_name", headerName: "Producto", width: 200 },
    { field: "quantity", headerName: "Cantidad", width: 120 },
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
        📦 Gestión de Stock
      </Typography>

      {/* 🔍 Barra de búsqueda y formulario */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <TextField
          label="Buscar producto o ID"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />

        <Autocomplete
          options={products}
          getOptionLabel={(option) => option.name}
          value={form.product}
          onChange={(_, newValue) => setForm({ ...form, product: newValue })}
          renderInput={(params) => (
            <TextField {...params} label="Seleccionar producto" size="small" />
          )}
          sx={{ minWidth: 220 }}
        />

        <TextField
          label="Cantidad"
          type="number"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          size="small"
          sx={{ width: 120 }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Agregar
        </Button>
      </Stack>

      {/* 📋 Tabla de stock */}
      <Box sx={{ height: 480, width: "100%" }}>
        <DataGrid
          rows={filteredStock}
          columns={columns}
          getRowId={(r) => r.id}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[5, 10, 25]}
          disableRowSelectionOnClick
        />
      </Box>

      {/* ✏️ Modal de edición */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Editar Stock</DialogTitle>
        <DialogContent>
          <TextField
            label="Cantidad"
            type="number"
            fullWidth
            margin="dense"
            value={selectedItem?.quantity || ""}
            onChange={(e) =>
              setSelectedItem({
                ...selectedItem!,
                quantity: Number(e.target.value),
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StockManager;
