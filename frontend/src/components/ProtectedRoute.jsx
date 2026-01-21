// src/components/ProtectedRoute.jsx
import { useAuthStore } from "../store/authStore";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
