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
  Typography,
  Paper,
  InputAdornment,
  Chip,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ClearIcon from "@mui/icons-material/Clear";
import api from "../../api/api";
import type { CartItem } from "../types/types";

interface Props {
  onAdd: (product: CartItem) => void;
}

export default function OrderProductPicker({ onAdd }: Props) {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [inputValue, setInputValue] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mobileQuery, setMobileQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSelected, setMobileSelected] = useState<any[]>([]);

  const qtyRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const autoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get("/products?active=true").then((res) => setProducts(res.data));
  }, []);

  const getFilteredProducts = (query: string, options: any[]) => {
    const q = query.toLowerCase().trim();

    if (!q) return options;

    const exactNameMatches = options.filter(
      (p) => String(p.name || "").toLowerCase() === q,
    );

    const startsWithNameMatches = options.filter(
      (p) =>
        String(p.name || "")
          .toLowerCase()
          .startsWith(q) && String(p.name || "").toLowerCase() !== q,
    );

    const partialNameMatches = options.filter(
      (p) =>
        String(p.name || "")
          .toLowerCase()
          .includes(q) &&
        !String(p.name || "")
          .toLowerCase()
          .startsWith(q),
    );

    const descriptionMatches = options.filter((p) =>
      String(p.description || "")
        .toLowerCase()
        .includes(q),
    );

    const merged = [
      ...exactNameMatches,
      ...startsWithNameMatches,
      ...partialNameMatches,
      ...descriptionMatches,
    ];

    return merged.filter(
      (item, index, self) => index === self.findIndex((x) => x.id === item.id),
    );
  };

  const filteredProducts = getFilteredProducts(mobileQuery, products);

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

    setTimeout(() => autoRef.current?.focus(), 50);
  };

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

  const clearSearch = () => {
    setSelected(null);
    setInputValue("");
    setTimeout(() => autoRef.current?.focus(), 50);
  };

  if (!isMobile) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "#fcfcfc",
        }}
      >
        <Stack spacing={0.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          ></Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Autocomplete
              fullWidth
              options={products}
              value={selected}
              inputValue={inputValue}
              onInputChange={(_, newValue) => setInputValue(newValue)}
              onChange={(_, v) => {
                if (!v) return;
                setSelected(v);
              }}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              getOptionLabel={(p) => {
                const code = p.name || "";
                const desc = p.description || "";
                return desc ? `${code} - ${desc}` : code;
              }}
              filterOptions={(options, state) => {
                return getFilteredProducts(state.inputValue, options);
              }}
              renderOption={(props, p) => (
                <li {...props}>
                  <Box sx={{ width: "100%", py: 0.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={2}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={200} lineHeight={1.2}>
                          {p.name || "Sin código"} {" - "} {p.description}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        color="success"
                        label={`$ ${Number(p.sale_price).toFixed(2)}`}
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar producto"
                  placeholder="Código o descripción"
                  inputRef={autoRef}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();

                      let productToUse = selected;

                      if (!productToUse) {
                        const filtered = getFilteredProducts(
                          inputValue,
                          products,
                        );
                        const firstMatch = filtered[0];

                        if (firstMatch) {
                          productToUse = firstMatch;
                          setSelected(firstMatch);
                        }
                      }

                      if (productToUse) {
                        qtyRef.current?.focus();
                      }
                    }
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                    endAdornment: (
                      <>
                        {inputValue && (
                          <InputAdornment position="end">
                            <Button
                              size="small"
                              onClick={clearSearch}
                              sx={{ minWidth: 32, p: 0.5 }}
                            >
                              <ClearIcon fontSize="small" />
                            </Button>
                          </InputAdornment>
                        )}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ flex: 1 }}
            />

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
              sx={{
                width: { xs: "100%", md: 70 },
              }}
            />

            <Button
              ref={addBtnRef}
              variant="contained"
              // startIcon={<AddShoppingCartIcon />}
              onClick={() => {
                addDesktop();
                clearSearch();
                autoRef.current?.focus();
              }}
              disabled={!selected}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addDesktop();
                  clearSearch();
                  autoRef.current?.focus();
                }
              }}
              sx={{
                minWidth: { xs: "100%", md: 50 },
                height: 56,
                borderRadius: 2.5,
                fontWeight: 500,
              }}
            >
              +
            </Button>
          </Stack>

          {selected && (
            <Paper
              variant="outlined"
              sx={{
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: "rgba(25, 118, 210, 0.03)",
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                Seleccionado: {selected.name || "Sin código"}
              </Typography>
              {selected.description && (
                <Typography variant="body2" color="text.secondary" mt={0.3}>
                  {selected.description}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Precio: $ {Number(selected.sale_price).toFixed(2)}
              </Typography>
            </Paper>
          )}
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "#fcfcfc",
        }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Inventory2OutlinedIcon color="primary" fontSize="small" />
              <Typography fontWeight={700}>Agregar productos</Typography>
            </Stack>

            <Chip
              size="small"
              label={`${products.length} disponibles`}
              variant="outlined"
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Buscá por código en nombre o por descripción y marcá varios
            productos.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            startIcon={<SearchIcon />}
            onClick={() => setMobileOpen(true)}
            sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700 }}
          >
            Seleccionar productos
          </Button>
        </Stack>
      </Paper>

      <Dialog open={mobileOpen} fullScreen>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight={700}>
              Seleccionar productos
            </Typography>
            <TextField
              fullWidth
              label="Buscar producto"
              placeholder="Código o descripción"
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={1.5}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="body2" color="text.secondary">
                {filteredProducts.length} resultados
              </Typography>

              <Chip
                size="small"
                color="primary"
                label={`${mobileSelected.length} seleccionados`}
              />
            </Stack>

            <Divider />

            <List sx={{ pt: 0 }}>
              {filteredProducts.map((p) => {
                const checked = mobileSelected.some((m) => m.id === p.id);

                return (
                  <ListItem key={p.id} disablePadding sx={{ mb: 1 }}>
                    <Paper
                      variant="outlined"
                      sx={{
                        width: "100%",
                        borderRadius: 2.5,
                        overflow: "hidden",
                        bgcolor: checked ? "rgba(25, 118, 210, 0.04)" : "#fff",
                        borderColor: checked ? "primary.main" : "divider",
                      }}
                    >
                      <ListItemButton
                        selected={checked}
                        onClick={() => {
                          setMobileSelected((prev) =>
                            checked
                              ? prev.filter((x) => x.id !== p.id)
                              : [...prev, p],
                          );
                        }}
                        sx={{ py: 1.2 }}
                      >
                        <Checkbox checked={checked} />
                        <ListItemText
                          primary={
                            <Typography fontWeight={600}>
                              {p.name || "Sin código"}
                            </Typography>
                          }
                          secondary={
                            <Stack spacing={0.3} mt={0.3}>
                              {p.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {p.description}
                                </Typography>
                              )}
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                color="success.main"
                              >
                                $ {Number(p.sale_price).toFixed(2)}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    </Paper>
                  </ListItem>
                );
              })}

              {filteredProducts.length === 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderRadius: 3,
                    bgcolor: "#fafafa",
                  }}
                >
                  <Typography fontWeight={600}>
                    No se encontraron productos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    Probá con otro código o descripción.
                  </Typography>
                </Paper>
              )}
            </List>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
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
            startIcon={<AddShoppingCartIcon />}
            sx={{ borderRadius: 2.5, px: 2 }}
          >
            Agregar {mobileSelected.length}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
