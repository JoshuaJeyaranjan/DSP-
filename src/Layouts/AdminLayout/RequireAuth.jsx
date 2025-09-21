// src/Layouts/RequireAuth.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}