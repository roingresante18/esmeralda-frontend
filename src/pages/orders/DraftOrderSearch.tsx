import {
  TextField,
  Stack,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../../api/api";

interface DraftOrderSearchProps {
  onSelect: (order: any) => void;
}

export default function DraftOrderSearch({ onSelect }: DraftOrderSearchProps) {
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setOrders([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/orders/drafts/search", {
          params: /^\d+$/.test(q)
            ? { phone: q } // 🔍 buscar por teléfono
            : { name: q }, // 🔍 buscar por nombre
        });

        setOrders(res.data);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Recuperar cotización guardada
      </Typography>

      <TextField
        label="Buscar por nombre o teléfono"
        placeholder="Ej: Juan  o 3755..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        autoComplete="off"
        InputProps={{
          endAdornment: loading ? <CircularProgress size={20} /> : null,
        }}
      />

      {orders.length > 0 && (
        <List sx={{ mt: 1 }}>
          {orders.map((order) => {
            const daysLeft =
              15 -
              Math.floor(
                (Date.now() - new Date(order.created_at).getTime()) /
                  (1000 * 60 * 60 * 24),
              );

            return (
              <ListItemButton
                key={order.id}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&:hover": { bgcolor: "action.hover" },
                }}
                onClick={() => onSelect(order)}
              >
                <ListItemText
                  primary={`${order.client?.name || "Sin nombre"} · Pedido #${order.id}`}
                  secondary={`📅 ${new Date(
                    order.created_at,
                  ).toLocaleDateString()} · ⏳ vence en ${daysLeft} días`}
                />
              </ListItemButton>
            );
          })}
        </List>
      )}
    </Paper>
  );
}
