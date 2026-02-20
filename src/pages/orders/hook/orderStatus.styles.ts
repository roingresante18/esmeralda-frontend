import type { OrderStatus } from "../types";

export const orderStatusColors: Record<OrderStatus, string> = {
  QUOTATION: "#9e9e9e",
  CONFIRMED: "#1976d2",
  PREPARING: "#ed6c02",
  PREPARED: "#9c27b0",
  QUALITY_CHECKED: "#00897b",
  ASSIGNED: "#fbc02d",
  IN_DELIVERY: "#66bb6a",
  DELIVERED: "#2e7d32",
  CANCELLED: "#d32f2f",
};
