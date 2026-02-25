import { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  TextField,
  Button,
  Stack,
  Box,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import api from "../../api/api";
import type { CartItem } from "../types/types";

interface Props {
  onAdd: (product: CartItem) => void;
}

export default function OrderProductPicker({ onAdd }: Props) {
  const isMobile = useMediaQuery("(max-width:900px)");

  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mobileQuery, setMobileQuery] = useState("");
  const filteredProducts = products.filter((p) =>
    (p.description || p.name || "")
      .toLowerCase()
      .includes(mobileQuery.toLowerCase()),
  );
  // Mobile multi-select
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSelected, setMobileSelected] = useState<any[]>([]);

  // Refs teclado desktop
  const qtyRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const autoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/products").then((res) => setProducts(res.data));
  }, []);

  /* ============================================================
     DESKTOP — AGREGAR
  ============================================================ */

  const addDesktop = () => {
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

    // 🔥 volver al buscador automáticamente
    setTimeout(() => autoRef.current?.focus(), 50);
  };

  /* ============================================================
     MOBILE — AGREGAR MULTIPLE
  ============================================================ */

  const addMobile = () => {
    mobileSelected.forEach((p) => {
      onAdd({
        productId: p.id,
        description: p.description,
        sale_price: Number(p.sale_price) || 0,
        quantity: 1,
      });
    });

    setMobileSelected([]);
    setMobileQuery("");
    setMobileOpen(false);
  };
  /* ============================================================
     DESKTOP UI
  ============================================================ */

  if (!isMobile) {
    return (
      <Box width="100%">
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Producto */}
          <Autocomplete
            fullWidth
            options={products}
            value={selected}
            onChange={(_, v) => {
              setSelected(v);
              setTimeout(() => qtyRef.current?.focus(), 50);
            }}
            getOptionLabel={(p) => p.description || p.name}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Producto"
                inputRef={autoRef}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && selected) {
                    e.preventDefault();
                    qtyRef.current?.focus();
                  }
                }}
              />
            )}
            sx={{ flex: 1 }}
          />

          {/* Cantidad */}
          <TextField
            type="number"
            label="Cantidad"
            value={quantity}
            inputProps={{ min: 1 }}
            inputRef={qtyRef}
            onChange={(e) => setQuantity(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addBtnRef.current?.focus();
              }
            }}
            sx={{ width: 120 }}
          />

          {/* Botón */}
          <Button
            ref={addBtnRef}
            variant="contained"
            onClick={addDesktop}
            disabled={!selected}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDesktop();
              }
            }}
            sx={{ minWidth: 140, height: 56 }}
          >
            Agregar
          </Button>
        </Stack>
      </Box>
    );
  }

  /* ============================================================
     MOBILE UI
  ============================================================ */

  return (
    <>
      <Button variant="contained" fullWidth onClick={() => setMobileOpen(true)}>
        Seleccionar productos
      </Button>

      <Dialog open={mobileOpen} fullScreen>
        <DialogTitle>Seleccionar productos</DialogTitle>

        <DialogContent>
          {/* 🔎 Buscador */}
          <TextField
            fullWidth
            label="Buscar producto"
            value={mobileQuery}
            onChange={(e) => setMobileQuery(e.target.value)}
            sx={{ mb: 2 }}
          />

          <List>
            {filteredProducts.map((p) => {
              const checked = mobileSelected.some((m) => m.id === p.id);

              return (
                <ListItem key={p.id} disablePadding>
                  <ListItemButton
                    selected={checked}
                    onClick={() => {
                      setMobileSelected((prev) =>
                        checked
                          ? prev.filter((x) => x.id !== p.id)
                          : [...prev, p],
                      );
                    }}
                  >
                    <Checkbox checked={checked} />
                    <ListItemText
                      primary={p.description}
                      secondary={`$ ${Number(p.sale_price).toFixed(2)}`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}

            {filteredProducts.length === 0 && (
              <ListItem>
                <ListItemText primary="No se encontraron productos" />
              </ListItem>
            )}
          </List>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setMobileQuery("");
              setMobileOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={addMobile}
            disabled={mobileSelected.length === 0}
          >
            Agregar {mobileSelected.length}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
