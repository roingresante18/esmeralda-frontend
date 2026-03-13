import { Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FC } from "react";

/* ============================================================
   TYPES
============================================================ */

interface Product {
  description: string;
}

interface OrderItem {
  quantity: number;
  product: Product;
}
type CreatedBy = {
  id?: number;
  full_name?: string;
  email?: string;
};

interface Order {
  id: number;
  client: {
    name: string;
    phone: string;
    address: string;
  };
  items: OrderItem[];
  municipality_snapshot: string;
  notes?: string;
  createdBy?: CreatedBy | null;
}

interface Props {
  order: Order;
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 11,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 12,
  },
  infoText: {
    marginBottom: 4,
    lineHeight: 1.4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #ccc",
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontWeight: "bold",
    borderBottom: "2px solid #000",
    marginBottom: 4,
    paddingBottom: 4,
  },
  productText: {
    width: "80%",
    paddingRight: 8,
  },
  quantityText: {
    width: "20%",
    textAlign: "right",
  },
  footer: {
    marginTop: 20,
    fontSize: 10,
    color: "#666",
  },
});

/* ============================================================
   COMPONENT
============================================================ */

const OrderDepositPDF: FC<Props> = ({ order }) => {
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const now = new Date();
  const formattedDate = now.toLocaleString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Pedido #{order.id}</Text>

      <View style={styles.section}>
        <Text style={styles.infoText}>
          Cliente: {order.client.name} {" // "} {order.client.phone} {" // "}
          Dirección: {order.client.address} {" // "} Localidad:{" "}
          {order.municipality_snapshot}
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

        {order.items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <Text style={styles.productText}>{item.product.description}</Text>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Deposito: {loggedUser.full_name || loggedUser.name || "Usuario"}
          {" // "} Vendedor: {order.createdBy?.full_name} {" // "}
          Fecha impresión: {formattedDate}
        </Text>
      </View>
    </Page>
  );
};

export default OrderDepositPDF;
