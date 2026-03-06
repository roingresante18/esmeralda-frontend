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

interface Order {
  id: number;
  client: {
    name: string;

    phone: string;
    address: string;
  };
  items: OrderItem[];
  municipality_snapshot: string;
  observations?: string;
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
  // 👤 Usuario logueado
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  // 📅 Fecha actual con día y hora
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
      {/* TÍTULO */}
      <Text style={styles.title}>Pedido #{order.id}</Text>

      {/* INFO GENERAL */}
      <View style={styles.section}>
        <Text>
          Cliente: {order.client.name} {" // "} {order.client.phone} {" // "}{" "}
          Dirección: {order.client.address} {" // "} Localidad:{" "}
          {order.municipality_snapshot}
        </Text>
        <Text>Observaciones: {order.observations}</Text>
      </View>

      {/* TABLA PRODUCTOS */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text>Producto</Text>
          <Text>Cantidad</Text>
        </View>

        {order.items.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <Text>{item.product.description}</Text>
            <Text>{item.quantity}</Text>
          </View>
        ))}
        <Text style={styles.footer}>
          Usuario: {loggedUser.full_name || loggedUser.name || "Usuario"}
          {" //  "}
          Fecha impresión: {formattedDate}
        </Text>
      </View>

      {/* FOOTER */}
    </Page>
  );
};

export default OrderDepositPDF;
