import { useEffect, useState } from "react";
import { Autocomplete, TextField, Button, Stack, Box } from "@mui/material";
import api from "../../api/api";
import type { CartItem } from "../types/types";

interface Props {
  onAdd: (product: CartItem) => void;
}

export default function OrderProductPicker({ onAdd }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  const add = () => {
    if (!selected) return;

    if (quantity <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    onAdd({
      productId: selected.id,
      description: selected.description,

      sale_price: Number(selected.sale_price) || 0,
      quantity,
    });

    setSelected(null);
    setQuantity(1);
  };

  return (
    <Box width="100%">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        {/* Producto */}
        <Autocomplete
          fullWidth
          options={products}
          value={selected}
          onChange={(_, v) => setSelected(v)}
          getOptionLabel={(p) => p.description || p.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          renderInput={(params) => <TextField {...params} label="Producto" />}
          sx={{ flex: 1 }}
        />

        {/* Cantidad */}
        <TextField
          type="number"
          label="Cantidad"
          value={quantity}
          inputProps={{ min: 1 }}
          onChange={(e) => setQuantity(Number(e.target.value))}
          sx={{
            width: { xs: "100%", md: 120 },
          }}
        />

        {/* Botón */}
        <Button
          variant="contained"
          onClick={add}
          disabled={!selected}
          sx={{
            width: { xs: "100%", md: "auto" },
            minWidth: 140,
            height: 56, // 👈 iguala altura con inputs
          }}
        >
          Agregar
        </Button>
      </Stack>
    </Box>
  );
}
