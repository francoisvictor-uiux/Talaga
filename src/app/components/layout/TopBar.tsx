import { Bell, User, Search, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  Admin: "مدير النظام",
  Manager: "مدير",
  Warehouse: "عامل مخزن",
  Accountant: "محاسب",
  Viewer: "مشاهدة فقط",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return parts[0][0] + parts[1][0];
}

const pageTitles: Record<string, string> = {
  "/dashboard": "لوحة التحكم",
  "/warehouses": "المخازن والثلاجات",
  "/items": "الأصناف والعبوات",
  "/customers": "إدارة العملاء",
  "/employees": "الموظفون",
  "/movements": "الوارد والمنصرف والتحويلات",
  "/inventory": "الجرد والتسويات",
  "/receipts": "السندات والتحصيلات",
  "/reports": "التقارير",
  "/tasks": "قائمة المهام",
  "/audit": "سجل التعديلات",
  "/settings": "الإعدادات",
};

export function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const title = pageTitles[location.pathname] || "نظام مخازن التبريد";

  const displayName = user?.arName?.trim() || user?.fullName || "مستخدم";
  const roleLabel = user?.roles?.[0] ? (ROLE_LABELS[user.roles[0]] ?? user.roles[0]) : "";
  const initials = getInitials(displayName);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 flex-shrink-0 z-30">
      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
        <p className="text-xs text-gray-500">
          {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="بحث سريع..."
          className="pr-9 pl-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-56 text-right"
          dir="rtl"
        />
      </div>

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-blue-600">
            <Bell className="w-5 h-5" />
            <Badge className="absolute -top-1 -left-1 w-5 h-5 p-0 text-xs flex items-center justify-center bg-red-500 text-white border-white border-2">
              4
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80" dir="rtl">
          <div className="px-4 py-3 border-b">
            <p className="font-semibold text-gray-800">الإشعارات</p>
            <p className="text-xs text-gray-500">4 إشعارات غير مقروءة</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {[
              { text: "صنف دجاج مجمد سينتهي خلال 7 أيام", time: "منذ ساعة", dot: "bg-orange-500" },
              { text: "ثلاجة الحبوب وصلت 92% من الطاقة", time: "منذ 3 ساعات", dot: "bg-red-500" },
              { text: "سند قبض من مؤسسة الفجر متأخر", time: "منذ يوم", dot: "bg-yellow-500" },
              { text: "تم إتمام جرد ثلاجة الخضروات", time: "منذ يومين", dot: "bg-green-500" },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dot}`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{n.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-800 leading-tight">{displayName}</p>
              {roleLabel && <p className="text-xs text-gray-500 leading-tight">{roleLabel}</p>}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" dir="rtl">
          <DropdownMenuItem>
            <User className="w-4 h-4 ml-2" />
            الملف الشخصي
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={handleLogout}
          >
            تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}