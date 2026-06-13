import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FC } from "react";

type CreatedBy = {
  id?: number;
  full_name?: string;
  email?: string;
};

interface ComboItem {
  id?: number;
  quantity: number;
  product?: {
    id?: number;
    description?: string;
  } | null;
}

interface OrderItem {
  id: number;
  quantity: number;
  sale_price?: number;
  description?: string;
  unit_price?: number;
  discount_percent?: number;

  product?: {
    id?: number;
    description?: string;
    is_combo?: boolean;
    combo_items?: ComboItem[];
  } | null;

  is_combo?: boolean;
  combo_items?: ComboItem[];
}

interface Order {
  id: number;
  client: {
    name: string;
    phone: string;
    address?: string;
  };
  items: OrderItem[];
  municipality_snapshot: string;
  notes?: string;
  createdBy?: CreatedBy | null;
}

interface Props {
  order: Order;
}

const formatMoney = (value: number) =>
  value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
  });

const getItemDescription = (item: OrderItem) =>
  item.product?.description || item.description || "Producto sin descripción";

const getItemPrice = (item: OrderItem) => {
  const basePrice = item.sale_price ?? item.unit_price ?? 0;
  const discount = item.discount_percent ?? 0;
  return discount > 0 ? basePrice * (1 - discount / 100) : basePrice;
};

const isComboItem = (item: OrderItem) =>
  Boolean(item.is_combo || item.product?.is_combo);

const getComboItems = (item: OrderItem) =>
  item.combo_items || item.product?.combo_items || [];

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },
  copy: { minHeight: "47%" },
  title: { fontSize: 16, marginBottom: 8, fontWeight: "bold" },
  section: { marginBottom: 8 },
  infoText: { marginBottom: 3, lineHeight: 1.3 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #ccc",
    paddingVertical: 3,
  },
  comboHeader: {
    paddingVertical: 4,
    borderBottom: "1px solid #999",
  },
  comboTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  comboRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    paddingLeft: 10,
    borderBottom: "1px solid #eee",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontWeight: "bold",
    borderBottom: "2px solid #000",
    marginBottom: 4,
    paddingBottom: 4,
  },
  productText: { width: "80%", paddingRight: 8 },
  quantityText: { width: "20%", textAlign: "right" },
  productClientText: { width: "50%", paddingRight: 8 },
  quantityClientText: { width: "12%", textAlign: "right" },
  priceText: { width: "19%", textAlign: "right" },
  footer: { marginTop: 10, fontSize: 9, color: "#666" },
  separator: {
    borderBottom: "1px dashed #999",
    marginVertical: 12,
  },
  total: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
});

const OrderDepositPDF: FC<Props> = ({ order }) => {
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const formattedDate = new Date().toLocaleString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const depositUserName = loggedUser.full_name || loggedUser.name || "Usuario";
  const sellerName = order.createdBy?.full_name || "Sin vendedor";

  const total = order.items.reduce((sum, item) => {
    return sum + item.quantity * getItemPrice(item);
  }, 0);

  return (
    <Page size="A4" style={styles.page}>
      {/* COPIA DEPÓSITO */}
      <View style={styles.copy}>
        <Text style={styles.title}>Pedido #{order.id} - Depósito</Text>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Cliente: {order.client.name} {" // "} {order.client.phone} {" // "}
            Dirección: {order.client.address || "Sin dirección"} {" // "}
            Localidad: {order.municipality_snapshot}
          </Text>

          <Text style={styles.infoText}>
            Observaciones: {order.notes?.trim() || "Sin observaciones"}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.productText}>Producto</Text>
            <Text style={styles.quantityText}>Cantidad</Text>
          </View>

          {order.items.map((item, idx) => {
            const combo = isComboItem(item);
            const comboItems = getComboItems(item);

            if (!combo) {
              return (
                <View key={item.id || idx} style={styles.row}>
                  <Text style={styles.productText}>
                    {getItemDescription(item)}
                  </Text>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
              );
            }

            return (
              <View key={item.id || idx}>
                <View style={styles.comboHeader}>
                  <Text style={styles.comboTitle}>
                    {idx + 1}) COMBO x {item.quantity}
                  </Text>
                </View>

                {comboItems.map((comboItem, comboIdx) => {
                  const comboQuantity =
                    Number(comboItem.quantity || 0) *
                    Number(item.quantity || 1);

                  return (
                    <View
                      key={comboItem.id || comboIdx}
                      style={styles.comboRow}
                    >
                      <Text style={styles.productText}>
                        {comboItem.product?.description ||
                          "Producto sin descripción"}
                      </Text>
                      <Text style={styles.quantityText}>{comboQuantity}</Text>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Depósito: {depositUserName}
          {" // "} Vendedor: {sellerName}
          {" // "} Fecha impresión: {formattedDate}
        </Text>
      </View>

      <View style={styles.separator} />

      {/* COPIA CLIENTE */}
      <View style={styles.copy}>
        <Text style={styles.title}>Pedido #{order.id} - Cliente</Text>

        <View style={styles.section}>
          <Text style={styles.infoText}>
            Cliente: {order.client.name} {" // "} {order.client.phone} {" // "}
            Dirección: {order.client.address || "Sin dirección"} {" // "}
            Localidad: {order.municipality_snapshot}
          </Text>

          <Text style={styles.infoText}>
            Observaciones: {order.notes?.trim() || "Sin observaciones"}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.productClientText}>Producto</Text>
            <Text style={styles.quantityClientText}>Cant.</Text>
            <Text style={styles.priceText}>Precio</Text>
            <Text style={styles.priceText}>Subtotal</Text>
          </View>

          {order.items.map((item, idx) => {
            const price = getItemPrice(item);
            const subtotal = item.quantity * price;
            const combo = isComboItem(item);
            const comboItems = getComboItems(item);

            if (!combo) {
              return (
                <View key={item.id || idx} style={styles.row}>
                  <Text style={styles.productClientText}>
                    {getItemDescription(item)}
                  </Text>
                  <Text style={styles.quantityClientText}>{item.quantity}</Text>
                  <Text style={styles.priceText}>{formatMoney(price)}</Text>
                  <Text style={styles.priceText}>{formatMoney(subtotal)}</Text>
                </View>
              );
            }

            return (
              <View key={item.id || idx}>
                <View style={styles.comboHeader}>
                  <Text style={styles.comboTitle}>
                    {idx + 1}) COMBO x {item.quantity}
                  </Text>
                </View>

                {comboItems.map((comboItem, comboIdx) => {
                  const comboQuantity =
                    Number(comboItem.quantity || 0) *
                    Number(item.quantity || 1);

                  return (
                    <View
                      key={comboItem.id || comboIdx}
                      style={styles.comboRow}
                    >
                      <Text style={styles.productClientText}>
                        {comboItem.product?.description ||
                          "Producto sin descripción"}
                      </Text>
                      <Text style={styles.quantityClientText}>
                        {comboQuantity}
                      </Text>
                      <Text style={styles.priceText}></Text>
                      <Text style={styles.priceText}></Text>
                    </View>
                  );
                })}

                <View style={styles.row}>
                  <Text style={styles.productClientText}>Total combo</Text>
                  <Text style={styles.quantityClientText}></Text>
                  <Text style={styles.priceText}>{formatMoney(price)}</Text>
                  <Text style={styles.priceText}>{formatMoney(subtotal)}</Text>
                </View>
              </View>
            );
          })}

          <Text style={styles.total}>Total: {formatMoney(total)}</Text>
        </View>

        <Text style={styles.footer}>
          Vendedor: {sellerName}
          {" // "} Fecha impresión: {formattedDate}
        </Text>
      </View>
    </Page>
  );
};

export default OrderDepositPDF;
