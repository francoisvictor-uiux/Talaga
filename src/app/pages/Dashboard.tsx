import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Package,
  Percent,
  AlertTriangle,
  Building2,
  Users,
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  ArrowLeftRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { alerts } from "../data/mockData";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import {
  getDashboardSummary,
  type BackendDashboardSummary,
  type BackendDailyFlow,
} from "../services/dashboardService";
import { onDataChanged } from "../services/realtime";

const TYPE_LABEL: Record<string, string> = {
  Incoming: "وارد",
  Outgoing: "منصرف",
  Transfer: "تحويل",
};
const TYPE_COLOR: Record<string, string> = {
  Incoming: "bg-green-100 text-green-700",
  Outgoing: "bg-red-100 text-red-700",
  Transfer: "bg-orange-100 text-orange-700",
};

const CHART_COLORS = [
  "#3B82F6",
  "#1E40AF",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE",
  "#06B6D4",
  "#0EA5E9",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ar-EG");
}

function CustomBarChart({ data }: { data: BackendDailyFlow[] }) {
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.incomingQty, d.outgoingQty]));
  const BAR_HEIGHT = 180;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end justify-between gap-2" style={{ height: BAR_HEIGHT }}>
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex items-end justify-center gap-0.5">
            <div
              className="flex-1 rounded-t-sm bg-green-500"
              style={{ height: `${(d.incomingQty / maxVal) * BAR_HEIGHT}px` }}
              title={`وارد ${d.incomingQty}`}
            />
            <div
              className="flex-1 rounded-t-sm bg-red-500"
              style={{ height: `${(d.outgoingQty / maxVal) * BAR_HEIGHT}px` }}
              title={`منصرف ${d.outgoingQty}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2">
        {data.map((d) => (
          <div key={d.date} className="flex-1 text-center text-[10px] text-gray-500 truncate">
            {d.dayLabel.replace("ال", "")}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<BackendDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let inflight = false;
    let pending = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const load = async (silent = false) => {
      if (inflight) { pending = true; return; }
      inflight = true;
      try {
        const data = await getDashboardSummary();
        if (!cancelled) setSummary(data);
      } catch (err: any) {
        if (!cancelled && !silent) toast.error(err?.message ?? "فشل تحميل لوحة التحكم");
      } finally {
        inflight = false;
        if (!cancelled) setLoading(false);
        if (pending && !cancelled) {
          pending = false;
          void load(true);
        }
      }
    };

    const scheduleReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { void load(true); }, 300);
    };

    load();
    const unsubscribe = onDataChanged(scheduleReload);

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, []);

  const kpiCards = [
    {
      title: "إجمالي الأصناف الثلاجةة",
      value: summary ? summary.totalStoredQuantity.toLocaleString("ar-EG") : "—",
      unit: `من ${summary ? summary.totalCapacity.toLocaleString("ar-EG") : "—"} مربع`,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "نسبة الإشغال الكلية",
      value: summary ? `${summary.occupancyPercentage}%` : "—",
      unit: "من إجمالي سعة مربعات التبريد",
      icon: Percent,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "حركات آخر 7 أيام",
      value: summary
        ? (summary.incomingLast7d + summary.outgoingLast7d + summary.transferLast7d).toLocaleString("ar-EG")
        : "—",
      unit: summary
        ? `وارد ${summary.incomingLast7d} · منصرف ${summary.outgoingLast7d} · تحويل ${summary.transferLast7d}`
        : "—",
      icon: ArrowLeftRight,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "العملاء النشطون",
      value: summary ? summary.customersCount.toLocaleString("ar-EG") : "—",
      unit: summary ? `${summary.warehousesCount} ثلاجات · ${summary.itemsCount} صنف` : "—",
      icon: Users,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const occupancySlices = summary?.warehouseOccupancy.filter((w) => w.capacity > 0) ?? [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} variants={item}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", card.bg)}>
                      <Icon className={cn("w-5 h-5", card.color)} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{card.unit}</p>
                    <p className="text-sm text-gray-600 mt-1">{card.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Bar chart */}
        <motion.div variants={item} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                حركة الوارد والمنصرف (آخر 7 أيام)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-12">جاري التحميل...</p>
              ) : summary && summary.dailyFlow.length > 0 ? (
                <>
                  <CustomBarChart data={summary.dailyFlow} />
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-gray-600">وارد</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs text-gray-600">منصرف</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-12">لا توجد حركات في آخر 7 أيام</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Donut */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                توزيع إشغال الثلاجات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-12">جاري التحميل...</p>
              ) : occupancySlices.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-12">لا توجد بيانات إشغال</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={occupancySlices.map((w) => ({ name: w.name, value: Number(w.percentage) }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {occupancySlices.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, "نسبة الإشغال"]}
                        contentStyle={{
                          borderRadius: 8,
                          border: "none",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-1">
                    {occupancySlices.map((w, i) => (
                      <div key={w.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-gray-600 truncate max-w-[120px]">{w.name}</span>
                        </div>
                        <span className="font-medium text-gray-800">{w.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent movements */}
        <motion.div variants={item} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800">آخر الحركات</CardTitle>
              <button onClick={() => navigate("/movements")} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <span>عرض الكل</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="text-sm text-gray-400 text-center py-8">جاري التحميل...</p>
              ) : !summary || summary.recentMovements.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">لا توجد حركات</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-100">
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">رقم الفاتورة</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">العميل</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الصنف</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">النوع</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الكمية</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recentMovements.map((m, i) => (
                        <tr
                          key={m.id}
                          className={cn(
                            "border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-blue-600">{m.number}</td>
                          <td className="px-4 py-3 text-gray-700">{m.customerName}</td>
                          <td className="px-4 py-3 text-gray-700">{m.itemName}</td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLOR[m.type] ?? "bg-gray-100 text-gray-700")}>
                              {TYPE_LABEL[m.type] ?? m.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {m.quantity.toLocaleString()} {m.unit ?? ""}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(m.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts (mock until alerts module is built) */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                تنبيهات النظام
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 leading-snug">{alert.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{alert.time}</p>
                  </div>
                </div>
              ))}
              <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1">
                عرض جميع التنبيهات
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Module counters strip */}
      {summary && (
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <CounterChip icon={Building2} value={summary.warehousesCount} label="ثلاجات" color="text-blue-600 bg-blue-50" />
          <CounterChip icon={Package} value={summary.chambersCount} label="مربعات تبريد" color="text-cyan-600 bg-cyan-50" />
          <CounterChip icon={Package} value={summary.itemsCount} label="أصناف" color="text-violet-600 bg-violet-50" />
          <CounterChip icon={Users} value={summary.customersCount} label="عملاء" color="text-emerald-600 bg-emerald-50" />
          <CounterChip icon={Users} value={summary.employeesCount} label="موظفون" color="text-rose-600 bg-rose-50" />
          <CounterChip icon={ArrowLeftRight} value={summary.movementsCount} label="حركات" color="text-amber-600 bg-amber-50" />
        </motion.div>
      )}
    </motion.div>
  );
}

function CounterChip({
  icon: Icon, value, label, color,
}: { icon: any; value: number; label: string; color: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color.split(" ").filter(c => c.startsWith("bg-")).join(" "))}>
          <Icon className={cn("w-4 h-4", color.split(" ").filter(c => c.startsWith("text-")).join(" "))} />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{value.toLocaleString("ar-EG")}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
