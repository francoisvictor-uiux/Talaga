import { NavLink, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Warehouse, Package, Users, UserCheck,
  ArrowLeftRight, ClipboardList,
  BarChart3, CheckSquare, Shield, Settings,
  ChevronRight, Snowflake, LogOut
} from "lucide-react";
import { cn } from "../ui/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

const navItems = [
  { path: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { path: "/warehouses", label: "المخازن والثلاجات", icon: Warehouse },
  { path: "/items", label: "الأصناف والعبوات", icon: Package },
  { path: "/customers", label: "العملاء", icon: Users },
  { path: "/employees", label: "الموظفون", icon: UserCheck },
  { path: "/movements", label: "الحركات", icon: ArrowLeftRight, color: "text-blue-300" },
  { path: "/inventory", label: "الجرد والتسويات", icon: ClipboardList },
  { path: "/reports", label: "التقارير", icon: BarChart3 },
  { path: "/tasks", label: "قائمة المهام", icon: CheckSquare },
  { path: "/audit", label: "سجل التعديلات", icon: Shield },
  { path: "/settings", label: "الإعدادات", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (val: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();

  return (
    <TooltipProvider delayDuration={200}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="flex flex-col h-full bg-[#0F2044] text-white overflow-hidden flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500 flex-shrink-0">
            <Snowflake className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-semibold text-white leading-tight">نظام مخازن</p>
                <p className="text-xs text-blue-300 leading-tight">التبريد</p>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => onCollapse(!collapsed)}
            className={cn(
              "flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors",
              collapsed ? "mx-auto" : "mr-auto"
            )}
          >
            <motion.div
              animate={{ rotate: collapsed ? 0 : 180 }}
              transition={{ duration: 0.25 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const navContent = (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      "hover:bg-white/10",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                        : "text-white/75 hover:text-white"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", item.color && !isActive ? item.color : "")} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-sm whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{navContent}</TooltipTrigger>
                    <TooltipContent side="left" className="bg-[#1E3A5F] text-white border-blue-800">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return <div key={item.path}>{navContent}</div>;
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => navigate("/login")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm whitespace-nowrap overflow-hidden"
                >
                  تسجيل الخروج
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}