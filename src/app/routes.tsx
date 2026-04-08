import { createHashRouter, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Warehouses } from "./pages/Warehouses";
import { Items } from "./pages/Items";
import { Customers } from "./pages/Customers";
import { Employees } from "./pages/Employees";
import { Movements } from "./pages/Movements";
import { Inventory } from "./pages/Inventory";
import { Reports } from "./pages/Reports";
import { TodoList } from "./pages/TodoList";
import { AuditLog } from "./pages/AuditLog";
import { Settings } from "./pages/Settings";

export const router = createHashRouter([
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: AppLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "warehouses", Component: Warehouses },
      { path: "items", Component: Items },
      { path: "customers", Component: Customers },
      { path: "employees", Component: Employees },
      { path: "movements", Component: Movements },
      { path: "inventory", Component: Inventory },
      { path: "reports", Component: Reports },
      { path: "tasks", Component: TodoList },
      { path: "audit", Component: AuditLog },
      { path: "settings", Component: Settings },
    ],
  },
]);
