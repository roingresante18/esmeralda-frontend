import { forwardRef } from "react";
import { Stack, Typography, Divider, Box } from "@mui/material";
import type { OrderDraft } from "./types";
import { FaPhone, FaClock } from "react-icons/fa";

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
        {/* LOGO */}
        {logoUrl && (
          <Box display="flex" justifyContent="center">
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxHeight: 60, objectFit: "contain" }}
            />
          </Box>
        )}

        {/* HEADER */}
        <Stack spacing={0.5} alignItems="center">
          <Typography fontWeight="bold" fontSize={20}>
            Pedido
          </Typography>

          {orderDate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <FaClock /> {orderDate}
            </Typography>
          )}
        </Stack>

        <Divider />

        {/* CLIENTE */}
        <Stack spacing={0.5}>
          <Typography fontWeight={600}>{order.clientName || "—"}</Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <FaPhone /> {order.clientPhone || "—"}
          </Typography>
          {order.observations && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Observaciones
              </Typography>
              <Typography variant="body2">{order.observations}</Typography>
            </>
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
                {/* NOMBRE */}
                <Typography fontWeight={600}>{item.description}</Typography>

                {/* DETALLE */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    {item.quantity} × ${unitPrice.toLocaleString("en-ES")}
                  </Typography>

                  <Typography fontWeight={600}>
                    ${total.toLocaleString("en-ES")}
                  </Typography>
                </Stack>

                {/* DESCUENTO */}
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

        <Divider sx={{ mt: 1 }} />

        {/* TOTAL GRANDE */}
        <Stack spacing={0.5} alignItems="center">
          <Typography color="text.secondary">Total a pagar</Typography>

          <Typography fontSize={32} fontWeight="bold" sx={{ color: "#06a22a" }}>
            $
            {totalAmount.toLocaleString("en-ES", {
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
        {/* <Typography
          variant="caption"
          align="center"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Software Desarrollado por Zarate Rodrigo Mateo
        </Typography>
        <Typography
          variant="caption"
          align="center"
          color="text.secondary"
          sx={{ mt: 0 }}
        >
          Cel: 3764-963653 /email: rodrimateo18@gmail.com
        </Typography> */}
      </Stack>
    );
  },
);

export default OrderReceipt;
