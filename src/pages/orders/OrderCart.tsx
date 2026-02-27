import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Stack,
  Paper,
  Divider,
  useMediaQuery,
  Box,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import type { CartItem } from "../types/types";
import { order } from "@mui/system";

interface Props {
  items: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onUpdateDiscount: (productId: number, value: number) => void;
  onRemove: (productId: number) => void;
  readonly?: boolean;
}

export default function OrderCart({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemove,
  readonly = false,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  /**
   * 🔹 Calcula precio final unitario con descuento %
   */
  const calculateFinalPrice = (item: CartItem) => {
    const discountPercent = Math.min(
      Math.max(item.discountPercent ?? 0, 0),
      100,
    );

    const discounted =
      item.sale_price - (item.sale_price * discountPercent) / 100;

    return Math.max(discounted, 0);
  };
  /* ======================= 📱 MOBILE ======================= */
  if (isMobile) {
    return (
      <Stack spacing={2}>
        {items.map((item) => {
          const finalPrice = calculateFinalPrice(item);
          const total = finalPrice * item.quantity;

          return (
            <Paper
              key={item.productId}
              sx={{ p: 2, borderRadius: 2 }}
              elevation={2}
            >
              <Stack spacing={1.5}>
                <Typography fontWeight={600}>{item.description}</Typography>

                <Typography variant="body2" color="text.secondary">
                  Precio unitario: $
                  {(item.sale_price ?? 0).toLocaleString("en-ES")}
                </Typography>

                {item.discountPercent ? (
                  <Typography variant="body2" color="success.main">
                    Precio con descuento: ${finalPrice.toLocaleString("en-ES")}
                  </Typography>
                ) : null}

                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Cantidad"
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 1 }}
                    value={item.quantity}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateQuantity(item.productId, Number(e.target.value))
                    }
                  />

                  <TextField
                    label="Descuento %"
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, max: 100, maxLength: 3 }}
                    value={item.discountPercent ?? ""}
                    disabled={readonly}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Permitir vacío
                      if (value === "") {
                        onUpdateDiscount(item.productId, 0);
                        return;
                      }

                      let num = Number(value);

                      if (isNaN(num)) return;

                      // Limitar entre 0 y 100
                      num = Math.min(Math.max(num, 0), 100);

                      onUpdateDiscount(item.productId, num);
                    }}
                  />
                </Stack>

                <Divider />

                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography fontWeight="bold">
                    Total: ${total.toLocaleString("en-ES")}
                  </Typography>

                  {!readonly && (
                    <IconButton
                      color="error"
                      onClick={() => onRemove(item.productId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
            </Paper>
          );
        })}

        {items.length === 0 && (
          <Typography textAlign="center" color="text.secondary">
            No hay productos agregados
          </Typography>
        )}
      </Stack>
    );
  }

  /* ======================= 💻 DESKTOP ======================= */
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Producto</TableCell>
            <TableCell width={100}>Cantidad</TableCell>
            <TableCell width={130}>Precio</TableCell>
            <TableCell width={150}>Descuento %</TableCell>
            <TableCell width={120}>Total</TableCell>
            <TableCell width={48} />
          </TableRow>
        </TableHead>

        <TableBody>
          {items.map((item) => {
            const finalPrice = calculateFinalPrice(item);
            const total = finalPrice * item.quantity;

            return (
              <TableRow key={item.productId}>
                <TableCell>
                  <Typography fontWeight={500}>{item.description}</Typography>
                </TableCell>

                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 1 }}
                    value={item.quantity}
                    disabled={readonly}
                    onChange={(e) =>
                      onUpdateQuantity(item.productId, Number(e.target.value))
                    }
                  />
                </TableCell>

                <TableCell>
                  <Stack>
                    <Typography>
                      ${item.sale_price.toLocaleString("en-ES")}
                    </Typography>

                    {item.discountPercent ? (
                      <Typography variant="caption" color="success.main">
                        Final: ${finalPrice.toLocaleString("en-ES")}
                      </Typography>
                    ) : null}
                  </Stack>
                </TableCell>

                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, max: 100, maxLength: 3 }}
                    value={item.discountPercent ?? ""}
                    disabled={readonly}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Permitir vacío
                      if (value === "") {
                        onUpdateDiscount(item.productId, 0);
                        return;
                      }

                      let num = Number(value);

                      if (isNaN(num)) return;

                      // Limitar entre 0 y 100
                      num = Math.min(Math.max(num, 0), 100);

                      onUpdateDiscount(item.productId, num);
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Typography fontWeight="bold">
                    ${total.toLocaleString("en-ES")}
                  </Typography>
                </TableCell>

                <TableCell>
                  {!readonly && (
                    <IconButton
                      color="error"
                      onClick={() => onRemove(item.productId)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography color="text.secondary">
                  No hay productos agregados
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
