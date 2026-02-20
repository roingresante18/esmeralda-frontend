import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/admin/AdminPanel";
import VentasPanel from "./pages/orders/VentasPanel";
import Unauthorized from "./pages/Unauthorized";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OrderManager from "./pages/orders/OrderManager";
import ClientManager from "./pages/modules/Clients/ClientManager";
// import ProductsManager from "./pages/admin/ProductsManager";
import ProductsManager from "./pages/modules/products/ProductsManager";

// import StockManager from "./pages/admin/StockManager";
import StockManager from "./pages/admin/StockManager";

import Profile from "./pages/Profile";
import UserManager from "./pages/admin/UserManager";
import ControlOrders from "./pages/preparacion/ControlOrders";
import DepositOrders from "./pages/preparacion/DepositOrders";
import LogisticsOrders from "./pages/preparacion/LogisticsOrders";
import OrdersDashboard from "./pages/orders/OrdersDashboard";
import DriverOrders from "./pages/preparacion/DriverOrders";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas públicas */}
          {/* ✅ Si alguien entra a "/", lo redirige a /login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* ✅ Ruta pública */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ordersCompletos"
            element={
              <ProtectedRoute roles={["ADMIN", "VENTAS"]}>
                <OrdersDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <UserManager />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ventas"
            element={
              <ProtectedRoute roles={["VENTAS", "ADMIN"]}>
                <VentasPanel />
              </ProtectedRoute>
            }
          />
          {/* 🔹 Formularios */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute roles={["VENTAS", "ADMIN"]}>
                <OrderManager
                  currentUser={{
                    role: "ADMIN",
                  }}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute roles={["VENTAS", "ADMIN"]}>
                <ClientManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <ProductsManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <StockManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["ADMIN", "VENTAS"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deposito"
            element={
              <ProtectedRoute roles={["ADMIN", "DEPOSITO"]}>
                <DepositOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/controlDeposito"
            element={
              <ProtectedRoute roles={["ADMIN", "CONTROL"]}>
                <ControlOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistica"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <LogisticsOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reparto"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <DriverOrders />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
