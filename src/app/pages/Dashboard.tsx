import { motion } from "motion/react";
import {
  Package,
  Percent,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
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
import {
  dailyMovement,
  warehouseOccupancy,
  transactions,
  alerts,
} from "../data/mockData";
import { cn } from "../components/ui/utils";

const kpiCards = [
  {
    title: "إجمالي الأصناف المخزنة",
    value: "1,248",
    unit: "طرد",
    icon: Package,
    color: "text-blue-600",
    bg: "bg-blue-50",
    trend: "+12%",
    trendUp: true,
  },
  {
    title: "نسبة الإشغال الكلية",
    value: "73%",
    unit: "من اجمالي سعة الثلاجات",
    icon: Percent,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    trend: "+5%",
    trendUp: true,
  },
  {
    title: "إيرادات اليوم",
    value: "18,540",
    unit: "جنيه",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
    trend: "+8%",
    trendUp: true,
  },
  {
    title: "تنبيهات منتهية الصلاحية",
    value: "7",
    unit: "صنف",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    trend: "+3",
    trendUp: false,
  },
];

const typeColors: Record<string, string> = {
  وارد: "bg-green-100 text-green-700",
  منصرف: "bg-red-100 text-red-700",
  تحويل: "bg-orange-100 text-orange-700",
};

const CHART_COLORS = [
  "#3B82F6",
  "#1E40AF",
  "#60A5FA",
  "#93C5FD",
  "#BFDBFE",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Pure CSS bar chart — avoids Recharts duplicate-key warning
function CustomBarChart({
  data,
}: {
  data: typeof dailyMovement;
}) {
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.incoming, d.outgoing]),
  );
  const BAR_HEIGHT = 180;
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-end justify-between gap-2"
        style={{ height: BAR_HEIGHT }}
      >
        {data.map((d) => (
          <div
            key={d.day}
            className="flex-1 flex items-end justify-center gap-0.5"
          >
            <div
              className="flex-1 rounded-t-sm bg-green-500"
              style={{
                height: `${(d.incoming / maxVal) * BAR_HEIGHT}px`,
              }}
            />
            <div
              className="flex-1 rounded-t-sm bg-red-500"
              style={{
                height: `${(d.outgoing / maxVal) * BAR_HEIGHT}px`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between gap-2">
        {data.map((d) => (
          <div
            key={d.day}
            className="flex-1 text-center text-[10px] text-gray-500 truncate"
          >
            {d.day.replace("ال", "")}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} variants={item}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center",
                        card.bg,
                      )}
                    >
                      <Icon
                        className={cn("w-5 h-5", card.color)}
                      />
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                        card.trendUp
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700",
                      )}
                    >
                      {card.trendUp ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {card.trend}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {card.unit}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {card.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Custom Bar Chart */}
        <motion.div variants={item} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                حركة الوارد والمنصرف (آخر 7 أيام)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomBarChart data={dailyMovement} />
              <div className="flex items-center justify-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-600">
                    وارد
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-gray-600">
                    منصرف
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Donut Chart */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                توزيع إشغال المخازن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={warehouseOccupancy}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {warehouseOccupancy.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          CHART_COLORS[
                            index % CHART_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => [
                      `${value}%`,
                      "نسبة الإشغال",
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {warehouseOccupancy.map((w, i) => (
                  <div
                    key={`legend-${i}`}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: CHART_COLORS[i] }}
                      />
                      <span className="text-gray-600 truncate max-w-[120px]">
                        {w.name}
                      </span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {w.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <motion.div variants={item} className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-800">
                آخر الحركات
              </CardTitle>
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                <span>عرض الكل</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-100">
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        رقم الفاتورة
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        العميل
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        النوع
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        الكمية
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        التاريخ
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">
                        الحالة
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 6).map((tx, i) => (
                      <tr
                        key={tx.id}
                        className={cn(
                          "border-b border-gray-50 hover:bg-gray-50/50 transition-colors",
                          i % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50/30",
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-blue-600">
                          {tx.invoice}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {tx.customer}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium",
                              typeColors[tx.type],
                            )}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {tx.quantity} طرد
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {tx.date}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts */}
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
                <div
                  key={alert.id}
                  className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700 leading-snug">
                      {alert.text}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {alert.time}
                    </p>
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
    </motion.div>
  );
}