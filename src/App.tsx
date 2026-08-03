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
import ProductsManager from "./pages/admin/ProductsManager";
import StockManager from "./pages/admin/StockManager";
import BusinessDashboard from "./pages/BusinessDashboard";
import Profile from "./pages/Profile";
import UserManager from "./pages/admin/UserManager";

import ControlOrders from "./pages/preparacion/ControlOrders";
import DepositOrders from "./pages/preparacion/DepositOrders";
import LogisticsOrders from "./pages/preparacion/LogisticsOrders";

import OrdersDashboard from "./pages/orders/OrdersDashboard";

import ControlOrdersMobile from "./pages/preparacion/ControlOrdersMobile";

import ProductsAlertsDashboard from "./pages/admin/ProductsAlertsDashboard";

import DeliveryDashboardPage from "./modules/reparto/pages/DeliveryDashboardPage";

import MunicipalityRouteListPage from "./modules/reparto/pages/MunicipalityRouteListPage";

import MunicipalityOrdersPage from "./modules/reparto/pages/MunicipalityOrdersPage";

import DeliverySettlementPage from "./modules/reparto/pages/DeliverySettlementPage";

import TruckPreparationPage from "./modules/reparto/pages/TruckPreparationPage";

/*
 * =========================================================
 * MÓDULO DE COMUNICACIONES
 * =========================================================
 *
 * Panel administrativo SaaS para configurar:
 *
 * - WhatsApp;
 * - Email;
 * - automatizaciones por evento.
 */
import CommunicationsPage from "./modules/communications/pages/CommunicationsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*
           * =====================================================
           * RUTAS PÚBLICAS
           * =====================================================
           */}

          {/*
           * Si alguien entra a "/",
           * se redirige al login.
           */}
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={<Login />} />

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/*
           * =====================================================
           * DASHBOARD GENERAL
           * =====================================================
           */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * GESTIÓN GENERAL DE PEDIDOS
           * =====================================================
           */}

          <Route
            path="/ordersCompletos"
            element={
              <ProtectedRoute roles={["ADMIN", "VENTAS"]}>
                <OrdersDashboard />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * ADMINISTRACIÓN
           * =====================================================
           */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/*
           * NUEVO:
           *
           * Configuración SaaS de comunicaciones.
           *
           * Solamente ADMIN puede acceder.
           */}
          <Route
            path="/admin/communications"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <CommunicationsPage />
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

          {/*
           * =====================================================
           * VENTAS
           * =====================================================
           */}

          <Route
            path="/ventas"
            element={
              <ProtectedRoute roles={["VENTAS", "ADMIN"]}>
                <VentasPanel />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * FORMULARIOS / PEDIDOS
           * =====================================================
           */}

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

          {/*
           * =====================================================
           * PRODUCTOS
           * =====================================================
           */}

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

          {/*
           * =====================================================
           * PERFIL
           * =====================================================
           */}

          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["ADMIN", "VENTAS"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * DEPÓSITO
           * =====================================================
           */}

          <Route
            path="/deposito"
            element={
              <ProtectedRoute roles={["ADMIN", "DEPOSITO"]}>
                <DepositOrders />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * CONTROL
           * =====================================================
           */}

          <Route
            path="/controlDeposito"
            element={
              <ProtectedRoute roles={["ADMIN", "CONTROL"]}>
                <ControlOrders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/control-orders/mobile"
            element={
              <ProtectedRoute roles={["ADMIN", "CONTROL"]}>
                <ControlOrdersMobile />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * LOGÍSTICA
           * =====================================================
           */}

          <Route
            path="/logistica"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <LogisticsOrders />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * REPARTO
           * =====================================================
           */}

          <Route
            path="/repartidor"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <DeliveryDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reparto/municipios"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <MunicipalityRouteListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reparto/municipios/:municipality"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <MunicipalityOrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reparto/preparacion"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <TruckPreparationPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reparto/cierre"
            element={
              <ProtectedRoute roles={["ADMIN", "LOGISTICA", "REPARTIDOR"]}>
                <DeliverySettlementPage driverId={1} />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * ANALYTICS
           * =====================================================
           */}

          <Route
            path="/analytics"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <BusinessDashboard />
              </ProtectedRoute>
            }
          />

          {/*
           * =====================================================
           * ALERTAS DE PRODUCTOS
           * =====================================================
           */}

          <Route
            path="/admin/product-alerts"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <ProductsAlertsDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
