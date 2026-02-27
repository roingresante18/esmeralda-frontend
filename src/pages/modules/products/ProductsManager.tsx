import { Container, Tabs, Tab, Box, Typography, Button } from "@mui/material";
import { useState, useEffect } from "react";
import ProductsDashboard from "./ProductsDashboard";
import ImportProducts from "./ImportProducts";
import ProductsManager2 from "../../admin/ProductsManager"; // 👈 tu grilla real
import StockManager from "../../admin/StockManager"; // 👈 tu gestor de stock
import { can } from "./permissions";
import api from "../../../api/api";
import { useNavigate } from "react-router-dom";

const USER_ROLE = "ADMIN";

function TabPanel({ value, index, children }: any) {
  return value === index ? <Box mt={3}>{children}</Box> : null;
}

export default function ProductsManager() {
  const [tab, setTab] = useState(0);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    api.get("/products/metrics").then((r) => setMetrics(r.data));
  }, []);
  const navigate = useNavigate();
  return (
    <Container maxWidth="xl">
      <Button
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          borderRadius: 50,
          zIndex: 1300,
        }}
        variant="contained"
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/");
          }
        }}
      >
        ← Volver
      </Button>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Dashboard" />
        <Tab label="Productos" />
        <Tab label="Stock" />
        {/* <Tab label="Importación" /> */}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <ProductsDashboard metrics={metrics} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <ProductsManager2 />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <StockManager />
      </TabPanel>

      {/* <TabPanel value={tab} index={3}>
        {can(USER_ROLE as any, "IMPORT_PRODUCTS") ? (
          <ImportProducts />
        ) : (
          <Typography color="error">
            No tenés permisos para importar productos
          </Typography>
        )}
      </TabPanel> */}
    </Container>
  );
}
