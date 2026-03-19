export type DeliveryStatus =
  | "ASSIGNED"
  | "IN_DELIVERY"
  | "DELIVERED"
  | "PARTIAL_DELIVERED"
  | "PENDING_DELIVERY"
  | "RESCHEDULED"
  | "NOT_DELIVERED";

export type PaymentMethod = "CASH" | "TRANSFER" | "BOTH";

export type ExpenseType = "TOLL" | "BROMATOLOGY" | "FUEL" | "OTHER";

export type GpsSource =
  | "CUSTOMER_PROFILE"
  | "ORDER_CONFIRMED"
  | "DRIVER_CAPTURE"
  | "MANUAL";

export interface GPSPoint {
  lat: number;
  lng: number;
  accuracy?: number;
  source?: GpsSource;
  capturedAt?: string;
}

export interface DeliveryProduct {
  productId: number;
  productName: string;
  quantityOrdered: number;
  quantityDelivered: number;
  delivered: boolean;
}

export interface DeliveryTotals {
  subtotal?: number;
  discounts?: number;
  shipping?: number;
  total: number;
  currency?: string;
}

export interface DeliveryAuditEntry {
  id: string;
  type:
    | "STATUS_CHANGED"
    | "GPS_CAPTURED"
    | "PAYMENT_REGISTERED"
    | "EXPENSE_CREATED"
    | "DELIVERY_CONFIRMED"
    | "ORDER_SYNCED";
  message: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryCustomerSnapshot {
  customerId: number;
  customerName: string;
  phone?: string;
  address: string;
  municipality: string;
  zone: string;
  customerGps?: GPSPoint | null;
}

export interface DeliveryOrder {
  id: number;
  customerId: number;
  customerName: string;
  phone?: string;
  address: string;
  municipality: string;
  zone: string;
  deliveryDate: string | null;
  deliveryStatus: DeliveryStatus;
  paymentMethod: PaymentMethod;
  amountToCharge: number;
  assignedDriverId?: number | null;
  assignedDriverName?: string | null;
  notes?: string;
  products: DeliveryProduct[];
  totals: DeliveryTotals;
  routeOrder?: number | null;
  municipalityOrder?: number | null;
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
  deliveredGps?: GPSPoint | null;
  deliveredAt?: string | null;
  deliveredBy?: {
    userId: number;
    name: string;
  } | null;
  deliveryObservation?: string;
  evidencePending?: boolean;
  municipalityDeliveryOrder?: number | null;
  priority?: number | null;
}

export interface DriverExpense {
  id: string;
  type: ExpenseType;
  amount: number;
  note?: string;
  createdAt: string;
  createdBy: string;
}

export interface DriverDailySettlement {
  driverId: number;
  driverName?: string;
  date: string;
  assignedOrders: number;
  deliveredOrders: number;
  partialDeliveredOrders: number;
  pendingOrders: number;
  rescheduledOrders: number;
  notDeliveredOrders: number;
  cashCollected: number;
  transferCollected: number;
  totalCollected: number;
  openingCash: number;
  expenses: DriverExpense[];
  expectedClosingBalance: number;
  declaredClosingBalance?: number | null;
  difference?: number | null;
  auditLog: DeliveryAuditEntry[];
}

export interface DeliveryDashboardKpis {
  totalAssigned: number;
  totalToday: number;
  pending: number;
  delivered: number;
  partialDelivered: number;
  rescheduled: number;
  notDelivered: number;
  cashCollected: number;
  transferCollected: number;
  totalCollected: number;
}

export interface MunicipalityGroup {
  municipality: string;
  municipalityOrder: number;
  zone?: string;
  count: number;
  deliveredCount: number;
  pendingCount: number;
  orders: DeliveryOrder[];
}

export interface DeliveryFilters {
  date?: string;
  zone?: string;
  municipality?: string;
  status?: DeliveryStatus | "ALL";
  onlyToday?: boolean;
  onlyNext12h?: boolean;
}

export interface ConfirmDeliveryPayload {
  orderId: number;
  deliveryStatus:
    | "DELIVERED"
    | "PARTIAL_DELIVERED"
    | "RESCHEDULED"
    | "NOT_DELIVERED";
  deliveredGps: GPSPoint;
  deliveredAt: string;
  paymentMethod: PaymentMethod;
  amountCollectedCash: number;
  amountCollectedTransfer: number;
  products: DeliveryProduct[];
  deliveryObservation?: string;
  deliveredByUserId?: number;
}

export interface PreparationSummary {
  totalToday: number;
  totalTomorrow: number;
  totalNext12h: number;
  groupedByDate: Array<{
    date: string;
    count: number;
  }>;
  groupedByZone: Array<{
    zone: string;
    count: number;
  }>;
  groupedByMunicipality: Array<{
    municipality: string;
    count: number;
  }>;
  groupedByDriver: Array<{
    driverName: string;
    count: number;
  }>;
}
export interface CustomerDeliverySnapshot {
  customerId: number;
  customerName: string;
  phone?: string;
  address: string;
  municipality: string;
  zone: string;
  customerGps?: GPSPoint | null;
}

export interface ConfirmDeliveryDataPayload {
  orderId: number;
  deliveryDate: string;
  paymentMethod: PaymentMethod;
  address: string;
  municipality: string;
  zone: string;
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
  notes?: string;
}

export interface DeliveryDataFormValues {
  deliveryDate: string;
  paymentMethod: PaymentMethod | "";
  address: string;
  municipality: string;
  zone: string;
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
  notes: string;
}
