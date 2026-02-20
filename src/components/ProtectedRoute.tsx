import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[]; // ✅ Si querés restringir por rol
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  // Mientras carga la sesión (por ejemplo desde AsyncStorage o localStorage)
  if (loading) return <p>Cargando...</p>;

  // ❌ Si no hay usuario autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ⚠️ Si hay restricción de roles y el rol del usuario no está permitido
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ Si pasa todas las validaciones
  return <>{children}</>;
};

export default ProtectedRoute;
