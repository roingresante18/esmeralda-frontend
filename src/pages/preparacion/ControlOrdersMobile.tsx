import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Grow,
} from "@mui/material";
import api from "../../api/api";

interface OrderItem {
  quantity: number;
  product: {
    description: string;
  };
}

interface Order {
  id: number;
  client: {
    name: string;
  };
  items: OrderItem[];
  observations?: string;
  delivery_date?: string;
}

export default function ControlOrdersMobile() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentOrder = orders[currentIndex];

  /* ================= FETCH ================= */

  const fetchOrders = async () => {
    const res = await api.get("/orders?last_2_weeks=true");

    const prepared = res.data
      .filter((o: any) => o.status === "PREPARED")
      .sort((a: any, b: any) => {
        const dateA = new Date(a.delivery_date || 0).getTime();
        const dateB = new Date(b.delivery_date || 0).getTime();
        return dateA - dateB;
      });

    setOrders(prepared);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ================= URGENCIA ================= */

  const getUrgency = (date?: string) => {
    if (!date) return { color: "default", label: "Sin fecha" };

    const today = new Date();
    const delivery = new Date(date);

    const diff = Math.floor(
      (delivery.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
    );

    if (diff <= 0) return { color: "error", label: "HOY" };
    if (diff === 1) return { color: "warning", label: "MAÑANA" };

    return { color: "info", label: delivery.toLocaleDateString("es-AR") };
  };

  /* ================= TOGGLE ================= */

  const toggleItem = (index: number) => {
    if (!currentOrder) return;

    if (navigator.vibrate) navigator.vibrate(40);

    setCheckedItems((prev) => {
      const updated = prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index];

      return updated;
    });

    const next = index + 1;

    if (itemRefs.current[next]) {
      setTimeout(() => {
        itemRefs.current[next]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 200);
    }
  };

  /* ================= PROGRESO ================= */

  const progress =
    currentOrder && currentOrder.items.length > 0
      ? (checkedItems.length / currentOrder.items.length) * 100
      : 0;

  const allChecked =
    currentOrder && checkedItems.length === currentOrder.items.length;

  /* ================= FINALIZAR ================= */

  const goNextOrder = () => {
    setCheckedItems([]);

    if (currentIndex + 1 < orders.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      fetchOrders();
      setCurrentIndex(0);
    }
  };

  const finishOrder = async () => {
    if (!currentOrder) return;

    await api.patch(`/orders/${currentOrder.id}/status`, {
      new_status: "QUALITY_CHECKED",
    });

    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);

    setTimeout(goNextOrder, 500);
  };

  /* ================= DEVOLVER A DEPOSITO ================= */

  const sendBackToWarehouse = async () => {
    if (!currentOrder) return;

    await api.patch(`/orders/${currentOrder.id}/status`, {
      new_status: "PREPARING",
    });

    if (navigator.vibrate) navigator.vibrate([120, 40, 120]);

    setTimeout(goNextOrder, 500);
  };

  /* ================= SIN PEDIDOS ================= */

  if (!currentOrder) {
    return (
      <Box p={3}>
        <Typography variant="h6">No hay pedidos para controlar</Typography>
      </Box>
    );
  }

  const urgency = getUrgency(currentOrder.delivery_date);

  /* ================= UI ================= */

  return (
    <Box p={2}>
      {/* HEADER */}

      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Pedido #{currentOrder.id}</Typography>

        <Typography color="text.secondary">
          {currentOrder.client.name}
        </Typography>

        <Stack direction="row" spacing={1} mt={1}>
          <Chip
            label={`Pedido ${currentIndex + 1} de ${orders.length}`}
            color="primary"
          />

          <Chip label={urgency.label} color={urgency.color as any} />
        </Stack>

        <Box mt={2}>
          <LinearProgress variant="determinate" value={progress} />

          <Typography variant="caption">
            {checkedItems.length} / {currentOrder.items.length} productos
          </Typography>
        </Box>
      </Card>

      {/* OBSERVACIONES */}

      {currentOrder.observations && (
        <Card
          sx={{
            p: 2,
            mb: 2,
            background: "#fff8e1",
            border: "1px solid #ffe082",
          }}
        >
          <Typography fontWeight="bold">⚠ Observaciones</Typography>

          <Typography>{currentOrder.observations}</Typography>
        </Card>
      )}

      {/* ITEMS */}

      <Stack spacing={2}>
        {currentOrder.items.map((item, index) => {
          const checked = checkedItems.includes(index);

          return (
            <Grow in timeout={250} key={index}>
              <Card
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => toggleItem(index)}
                sx={{
                  p: 2,
                  cursor: "pointer",
                  transition: "all 0.25s",
                  transform: checked ? "scale(1.02)" : "scale(1)",
                  backgroundColor: checked ? "#e8f5e9" : "#fff",
                  border: checked ? "2px solid #4caf50" : "1px solid #ddd",
                }}
              >
                <Typography fontWeight="bold">
                  {item.product.description}
                </Typography>

                <Typography color="text.secondary">
                  Cantidad: {item.quantity}
                </Typography>

                {checked && (
                  <Typography color="success.main">✔ Controlado</Typography>
                )}
              </Card>
            </Grow>
          );
        })}
      </Stack>

      {/* BOTONES */}

      <Stack spacing={2} mt={3}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          size="large"
          disabled={!allChecked}
          onClick={finishOrder}
          sx={{
            height: 65,
            fontSize: 18,
            fontWeight: "bold",
          }}
        >
          ✔ CONTROL OK
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="large"
          onClick={sendBackToWarehouse}
          sx={{
            height: 60,
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          ↩ DEVOLVER A DEPÓSITO
        </Button>
      </Stack>
    </Box>
  );
}
