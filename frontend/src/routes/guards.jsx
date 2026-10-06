import { lazy, Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";

const OpenSourceLanding = lazy(() => import("../pages/opensourceLanding"));

export function RequireAuth() {
  const { user } = useApp();
  return user?.id ? <Outlet /> : <Navigate to="/signin" replace />;
}

export function RequireGuest() {
  const { user } = useApp();
  return user?.id ? <Navigate to="/home" replace /> : <Outlet />;
}

export function RequireAdmin() {
  const { user } = useApp();
  if (!user?.id) return <Navigate to="/signin" replace />;
  if (user?.role !== "admin" && user?.role !== "super_admin")
    return <Navigate to="/home" replace />;
  return <Outlet />;
}

export function GuestLanding() {
  return (
    <Suspense fallback={null}>
      <OpenSourceLanding />
    </Suspense>
  );
}
