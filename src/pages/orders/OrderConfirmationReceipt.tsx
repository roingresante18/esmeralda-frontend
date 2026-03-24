import { forwardRef } from "react";
import { Stack, Typography, Divider, Box } from "@mui/material";
import type { OrderDraft } from "../types/types";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaTruck,
  FaMoneyBillWave,
} from "react-icons/fa";
import { formatDateAR } from "../../utils/dateUtils";
type Props = {
  order: OrderDraft;
  totalAmount: number;
  logoUrl?: string;

  address?: string;
  deliveryDate?: string;

  cash?: number;
  transfer?: number;
  reference?: string;
};

function toTitleCase(str: string): string {
  if (!str) return "";

  return str
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word
        .split(/[-']/)
        .map((sub) => sub.charAt(0).toUpperCase() + sub.slice(1))
        .join(""),
    )
    .join(" ");
}

const OrderConfirmationReceipt = forwardRef<HTMLDivElement, Props>(
  (
    {
      order,
      totalAmount,
      logoUrl,
      address,
      deliveryDate,
      cash = 0,
      transfer = 0,
      reference,
    },
    ref,
  ) => {
    const totalPaid = cash + transfer;
    const remaining = totalAmount - totalPaid;
    // console.log("CONFIRM RECEIPT ORDER", order);
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
        {" "}
        {/* ENCABEZADO EMPRESA */}{" "}
        {logoUrl && (
          <Box sx={{ borderBottom: "1px solid #e0e0e0", pb: 1, mb: 1 }}>
            {" "}
            <Stack direction="row" spacing={2.5} alignItems="center">
              {" "}
              <Box
                component="img"
                src={logoUrl}
                alt="Logo"
                sx={{ height: 90, width: 130, objectFit: "contain" }}
              />{" "}
              <Stack spacing={0.2}>
                {" "}
                <Typography fontWeight={700} fontSize={12}>
                  {" "}
                  Esmeralda Productos de Limpieza e Higiene{" "}
                </Typography>{" "}
                <Typography fontSize={12} color="text.secondary">
                  {" "}
                  Av. Juan Domingo Perón{" "}
                </Typography>{" "}
                <Typography fontSize={12} color="text.secondary">
                  {" "}
                  <FaMapMarkerAlt /> 25 de Mayo, Misiones{" "}
                </Typography>{" "}
                <Typography fontSize={12} color="text.secondary">
                  {" "}
                  <FaPhone /> Tel: 3755-557599{" "}
                </Typography>{" "}
              </Stack>{" "}
            </Stack>{" "}
            <Box sx={{ borderTop: "1px solid #e0e0e0", my: 0.5 }} />{" "}
            {/* PEDIDO */}{" "}
            <Stack spacing={0.4}>
              {" "}
              <Typography fontWeight={600}>
                {" "}
                Pedido Nº {order.orderId ?? "—"}{" "}
              </Typography>{" "}
              <Typography variant="body2" color="text.secondary">
                {" "}
                Fecha:{" "}
                {order.createdAt ? formatDateAR(order.createdAt) : "—"}{" "}
              </Typography>{" "}
            </Stack>{" "}
            <Box sx={{ borderTop: "1px solid #e0e0e0", my: 0.5 }} />{" "}
            {/* CLIENTE */}{" "}
            <Stack spacing={0.4}>
              {" "}
              <Typography fontWeight={600}>
                {" "}
                {toTitleCase(order.clientName || "—")}{" "}
              </Typography>{" "}
              <Typography variant="body2" color="text.secondary">
                {" "}
                Tel: {order.clientPhone || "—"} {" - "}{" "}
                {toTitleCase(order.municipality_snapshot)}{" "}
              </Typography>{" "}
            </Stack>{" "}
          </Box>
        )}{" "}
        {/* TITULO */}{" "}
        <Stack alignItems="center">
          {" "}
          <Typography fontWeight="bold" fontSize={22} sx={{ color: "#1b8f2f" }}>
            {" "}
            PEDIDO CONFIRMADO{" "}
          </Typography>{" "}
        </Stack>{" "}
        <Divider /> {/* PRODUCTOS */}{" "}
        <Stack spacing={1.2}>
          {" "}
          {order?.items?.map((item, index) => {
            const unitPrice = Number(item.sale_price ?? 0);
            const discount = Number(item.discountPercent ?? 0);
            const finalUnit =
              unitPrice * (1 - Math.min(Math.max(discount, 0), 100) / 100);
            const total = finalUnit * item.quantity;
            return (
              <Box
                key={item.id ?? `${item.productId}-${index}`}
                sx={{ pb: 0.8, borderBottom: "1px dashed #ddd" }}
              >
                {" "}
                <Typography fontWeight={600} fontSize={14}>
                  {" "}
                  {index + 1}) {item.description}{" "}
                </Typography>{" "}
                <Stack direction="row" justifyContent="space-between" mt={0.3}>
                  {" "}
                  <Typography variant="body2" color="text.secondary">
                    {" "}
                    {item.quantity} × ${unitPrice.toLocaleString("es-AR")}{" "}
                  </Typography>{" "}
                  <Typography fontWeight={700}>
                    {" "}
                    $
                    {total.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                  </Typography>{" "}
                </Stack>{" "}
                {discount > 0 && (
                  <Typography
                    variant="caption"
                    color="success.main"
                    fontWeight={600}
                  >
                    {" "}
                    Descuento {discount}% aplicado{" "}
                  </Typography>
                )}{" "}
              </Box>
            );
          })}{" "}
        </Stack>{" "}
        <Divider /> {/* ENTREGA */}{" "}
        <Stack spacing={0.4}>
          {" "}
          <Typography fontWeight={600} sx={{ color: "#1b8f2f" }}>
            {" "}
            <FaTruck /> Datos de entrega{" "}
          </Typography>{" "}
          <Typography variant="body2">
            {" "}
            Dirección: {address || "—"}{" "}
          </Typography>{" "}
          <Typography variant="body2">
            {" "}
            Fecha de entrega:{" "}
            {deliveryDate ? formatDateAR(deliveryDate) : "—"}{" "}
          </Typography>{" "}
          <Typography align="center" fontSize={11} color="text.secondary">
            {" "}
            La modificacion o cancelacion de los pedidios se puede realizar
            hasta 24 hs antes de la fecha de entrega{" "}
          </Typography>{" "}
        </Stack>{" "}
        <Divider /> {/* PAGOS */}{" "}
        <Stack spacing={0.3}>
          {" "}
          <Typography fontWeight={600} sx={{ color: "#1b8f2f" }}>
            {" "}
            <FaMoneyBillWave /> Estado del pago{" "}
          </Typography>{" "}
          <Typography variant="body2">
            {" "}
            Total del pedido: $
            {totalAmount.toLocaleString("es-AR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{" "}
          </Typography>{" "}
          <Typography variant="body2">
            {" "}
            Efectivo entregado: ${cash.toLocaleString("es-AR")}{" "}
          </Typography>{" "}
          <Typography variant="body2">
            {" "}
            Transferencia: ${transfer.toLocaleString("es-AR")}{" "}
          </Typography>{" "}
          {reference && (
            <Typography variant="body2">
              {" "}
              Ref. transferencia: {reference}{" "}
            </Typography>
          )}{" "}
          <Typography fontWeight={800}>
            {" "}
            Saldo pendiente: $
            {remaining.toLocaleString("es-AR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}{" "}
          </Typography>{" "}
        </Stack>{" "}
        <Divider />{" "}
        <Typography align="center" fontSize={14} color="text.secondary">
          {" "}
          ✔ Pedido confirmado correctamente{" "}
        </Typography>{" "}
      </Stack>
    );
  },
);

export default OrderConfirmationReceipt;
