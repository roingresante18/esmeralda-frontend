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

export type DeliveryFailureReason =
  | "CUSTOMER_ABSENT"
  | "ADDRESS_NOT_FOUND"
  | "REJECTED_BY_CUSTOMER"
  | "NO_CASH_AVAILABLE"
  | "ACCESS_ISSUE"
  | "VEHICLE_ISSUE"
  | "WEATHER"
  | "OTHER";

export type DeliveryRescheduleReason =
  | "CUSTOMER_REQUEST"
  | "ADDRESS_CLOSED"
  | "ROUTE_DELAY"
  | "OPERATIONAL_ISSUE"
  | "STOCK_ISSUE"
  | "OTHER";

export interface GPSPoint {
  latitude: number;
  longitude: number;
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

export type DeliveryAuditEventType =
  | "ORDER_ASSIGNED_TO_DRIVER"
  | "ORDER_CONFIRMED_FOR_DELIVERY"
  | "ORDER_GPS_UPDATED"
  | "DRIVER_STARTED_ROUTE"
  | "DRIVER_CAPTURED_GPS"
  | "DELIVERY_STATUS_CHANGED"
  | "DELIVERY_CONFIRMED"
  | "PAYMENT_RECORDED"
  | "EXPENSE_RECORDED"
  | "DELIVERY_RESCHEDULED"
  | "DELIVERY_FAILED"
  | "DELIVERY_PARTIAL";

export interface DeliveryAuditEvent {
  id: string;
  type: DeliveryAuditEventType;
  title: string;
  description?: string;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface DeliveryTraceability {
  customerGps?: GPSPoint | null;
  orderGps?: GPSPoint | null;
  deliveredGps?: GPSPoint | null;
  distanceCustomerToOrderMeters?: number | null;
  distanceOrderToDeliveredMeters?: number | null;
  distanceCustomerToDeliveredMeters?: number | null;
  gpsConsistencyStatus?: "OK" | "WARNING" | "CRITICAL" | "NO_DATA";
  gpsConsistencyMessage?: string;
}

export interface DeliveryPaymentSummary {
  cash: number;
  transfer: number;
  card: number;
  check: number;
  other: number;
  total_paid: number;
}

export interface DeliveryPayment {
  id: number;
  amount: number;
  method: string;
  type: string;
  status: string;
  reference?: string | null;
  external_id?: string | null;
  notes?: string | null;
  created_at: string;
  confirmed_at?: string | null;
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
  traceability?: DeliveryTraceability;
  auditEvents?: DeliveryAuditEvent[];
  paymentSummary?: DeliveryPaymentSummary;
  payments?: DeliveryPayment[];
}
