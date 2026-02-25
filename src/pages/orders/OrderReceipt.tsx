import { forwardRef } from "react";
import { Stack, Typography, Divider, Box } from "@mui/material";
import type { OrderDraft } from "../types/types";
import { FaPhone, FaClock, FaMapMarkerAlt } from "react-icons/fa";
import { formatArgentinaDate } from "../../utils/date";
import { formatDateAR } from "../../utils/dateUtils";

type Props = {
  order: OrderDraft;
  totalAmount: number;
  logoUrl?: string;
  orderDate?: string;
};
const addDays = (date: string | Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};
const OrderReceipt = forwardRef<HTMLDivElement, Props>(
  ({ order, totalAmount, logoUrl, orderDate }, ref) => {
    return (
      <Stack
        ref={ref}
        spacing={2.5}
        sx={{
          width: 380,
          p: 3,
          bgcolor: "#fff",
          borderRadius: 4,
          boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
          fontFamily: "Roboto, sans-serif",
        }}
      >
        {/* ENCABEZADO COMPACTO PARA WHATSAPP */}
        {logoUrl && (
          <Box
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 2,
              mb: 2,
            }}
          >
            {/* Empresa */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                component="img"
                src={logoUrl}
                alt="Logo"
                sx={{
                  height: 100,
                  width: 100,
                  objectFit: "contain",
                }}
              />

              <Stack spacing={0.2}>
                <Typography fontWeight={700} fontSize={12}>
                  Esmeralda Productos de Limpieza e Higiene
                </Typography>

                <Typography fontSize={12} color="text.secondary">
                  Av. Juan Domingo Perón
                </Typography>

                <Typography fontSize={12} color="text.secondary">
                  <FaMapMarkerAlt /> 25 de Mayo, Misiones {"  -  "}
                  <FaPhone /> Tel: 3755-557599
                </Typography>
              </Stack>
            </Stack>

            {/* Separador */}
            <Box sx={{ borderTop: "1px solid #e0e0e0", my: 1.5 }} />

            {/* Pedido */}
            <Stack spacing={0.5}>
              <Typography fontWeight={600}>
                Pedido Nº {order.orderId ?? "—"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Fecha: {order.createdAt ? formatDateAR(order.createdAt) : "—"}
                {"  --  "}
                Válido hasta:{" "}
                {order.createdAt
                  ? formatDateAR(
                      new Date(
                        new Date(order.createdAt).getTime() +
                          14 * 24 * 60 * 60 * 1000,
                      ).toISOString(),
                    )
                  : "—"}
              </Typography>
            </Stack>

            <Box sx={{ borderTop: "1px solid #e0e0e0", my: 1.5 }} />

            {/* Cliente */}
            <Stack spacing={0.4}>
              <Typography fontWeight={600}>
                {order.clientName || "—"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Tel: {order.clientPhone || "—"}
                {"   -   "}
                {order.municipality_snapshot}
              </Typography>
            </Stack>
          </Box>
        )}
        {/* HEADER */}
        <Stack spacing={0.5} alignItems="center">
          <Typography fontWeight="bold" fontSize={20}>
            Cotización Proforma
          </Typography>

          {orderDate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
            >
              <FaClock /> {orderDate}
            </Typography>
          )}
        </Stack>

        <Divider />

        {/* PRODUCTOS — formato ticket profesional */}
        <Stack spacing={1.2}>
          {order.items.map((item, index) => {
            const unitPrice = Number(item.sale_price ?? 0);
            const discount = Number(item.discountPercent ?? 0);

            const finalUnit =
              unitPrice * (1 - Math.min(Math.max(discount, 0), 100) / 100);

            const total = finalUnit * item.quantity;

            return (
              <Box
                key={item.id ?? `${item.productId}-${index}`}
                sx={{
                  pb: 0.8,
                  borderBottom: "1px dashed #ddd",
                }}
              >
                {/* Línea 1 — Nº + descripción */}
                <Typography fontWeight={600} fontSize={15} lineHeight={1.2}>
                  {index + 1}) {item.description}
                </Typography>

                {/* Línea 2 — Cantidad y total */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={0.3}
                >
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} × ${unitPrice.toLocaleString("es-AR")}
                  </Typography>

                  <Typography fontWeight={700}>
                    ${total.toLocaleString("es-AR")}
                  </Typography>
                </Stack>

                {/* Descuento */}
                {discount > 0 && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight={600}
                  >
                    Desc. {discount}%
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>

        {/* OBSERVACIONES */}
        {order.notes && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary">
              Observaciones
            </Typography>
            <Typography variant="body2">{order.notes}</Typography>
          </>
        )}

        <Divider sx={{ mt: 1 }} />

        {/* TOTAL */}
        <Stack spacing={0.5} alignItems="center">
          <Typography color="text.secondary">Total a pagar</Typography>

          <Typography fontSize={32} fontWeight="bold" sx={{ color: "#06a22a" }}>
            $
            {totalAmount.toLocaleString("es-AR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </Typography>
        </Stack>

        {/* FOOTER */}
        <Stack>
          <Typography
            fontSize={15}
            align="center"
            color="text.secondary"
            sx={{ mt: 1 }}
          >
            Gracias por su compra
          </Typography>
        </Stack>
      </Stack>
    );
  },
);

export default OrderReceipt;
