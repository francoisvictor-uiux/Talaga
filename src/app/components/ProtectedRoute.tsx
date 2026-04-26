import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

type Props = {
  requireRoles?: string[];
};

export function ProtectedRoute({ requireRoles }: Props) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requireRoles && requireRoles.length > 0) {
    const hasRole = user?.roles?.some((r) => requireRoles.includes(r));
    if (!hasRole) return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
