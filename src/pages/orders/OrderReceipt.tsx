import { forwardRef } from "react";
import { Stack, Typography, Divider, Box } from "@mui/material";
import type { OrderDraft } from "./types";
import { FaPhone, FaClock, FaMapMarkerAlt } from "react-icons/fa";

type Props = {
  order: OrderDraft;
  totalAmount: number;
  logoUrl?: string;
  orderDate?: string;
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
        {/* LOGO + DATOS CLIENTE */}
        {logoUrl && (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={2}
            sx={{
              borderBottom: "1px solid #e0e0e0",
              pb: 1,
            }}
          >
            <Box
              component="img"
              src={logoUrl}
              alt="Logo"
              sx={{
                height: 60,
                width: 60,
                objectFit: "contain",
                borderRadius: 2,
              }}
            />

            <Stack spacing={0.3}>
              <Typography fontWeight={700} fontSize={18} lineHeight={1.2}>
                {order.clientName || "—"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                <FaPhone /> {order.clientPhone || "—"}
              </Typography>

              {/* ✅ MUNICIPIO DESDE SNAPSHOT */}
              {order.municipality_snapshot && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                  }}
                >
                  <FaMapMarkerAlt />
                  {order.municipality_snapshot}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        <Divider />

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

        {/* PRODUCTOS */}
        <Stack spacing={1.5}>
          {order.items.map((item, index) => {
            const unitPrice = Number(item.sale_price ?? 0);
            const discount = Number(item.discountPercent ?? 0);

            const finalUnit =
              unitPrice * (1 - Math.min(Math.max(discount, 0), 100) / 100);

            const total = finalUnit * item.quantity;

            return (
              <Box key={item.id ?? `${item.productId}-${index}`}>
                <Typography fontWeight={600}>{item.description}</Typography>

                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} × ${unitPrice.toLocaleString("es-AR")}
                  </Typography>

                  <Typography fontWeight={600}>
                    ${total.toLocaleString("es-AR")}
                  </Typography>
                </Stack>

                {discount > 0 && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight={500}
                  >
                    Descuento {discount}% aplicado
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
        <Typography
          variant="caption"
          align="center"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Gracias por su compra
        </Typography>
      </Stack>
    );
  },
);

export default OrderReceipt;
