import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart3, Play, Download, Printer, FileText, TrendingUp, Package, Wallet, Users, ChevronLeft } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useDb } from "../context/DbContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const reportCategories = [
  {
    id: "movement", label: "حركة البضاعة", icon: TrendingUp, color: "blue",
    bg: "bg-blue-50", iconBg: "bg-blue-100", iconColor: "text-blue-600", activeBg: "bg-blue-600",
    items: ["تقرير الوارد", "تقرير المنصرف", "تقرير التحويلات", "ملخص الحركة"],
  },
  {
    id: "inventory", label: "المخزون", icon: Package, color: "green",
    bg: "bg-green-50", iconBg: "bg-green-100", iconColor: "text-green-600", activeBg: "bg-green-600",
    items: ["رصيد المخزون", "المخزون حسب المخزن", "المخزون حسب العميل", "حركة الصنف"],
  },
  {
    id: "financial", label: "مالي", icon: Wallet, color: "orange",
    bg: "bg-orange-50", iconBg: "bg-orange-100", iconColor: "text-orange-600", activeBg: "bg-orange-600",
    items: ["الفواتير والإيصالات", "تقرير الأسعار", "الإيرادات"],
  },
  {
    id: "customers", label: "العملاء", icon: Users, color: "purple",
    bg: "bg-purple-50", iconBg: "bg-purple-100", iconColor: "text-purple-600", activeBg: "bg-purple-600",
    items: ["نشاط العملاء", "أرصدة العملاء", "أداء العملاء"],
  },
];

const mockReportData = [
  { name: "شركة النور", incoming: 450, outgoing: 320 },
  { name: "مؤسسة الفجر", incoming: 280, outgoing: 210 },
  { name: "مجموعة الخليج", incoming: 680, outgoing: 520 },
  { name: "شركة الأمل", incoming: 190, outgoing: 150 },
  { name: "مؤسسة البركة", incoming: 340, outgoing: 280 },
];

export function Reports() {
  const { customers, warehouses } = useDb();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const activeCat = reportCategories.find(c => c.id === selectedCat);

  const runReport = () => {
    setShowResults(true);
    toast.success("تم تشغيل التقرير بنجاح");
  };

  const resetSelection = () => {
    setSelectedCat(null);
    setSelectedReport(null);
    setShowResults(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim}>
        <PageHeader icon={BarChart3} title="التقارير" subtitle="تقارير مالية وتشغيلية شاملة" color="indigo" />
      </motion.div>

      {/* Breadcrumb */}
      {selectedCat && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-sm text-gray-500">
          <button onClick={resetSelection} className="hover:text-blue-600 transition-colors">التقارير</button>
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
          <button onClick={() => { setSelectedReport(null); setShowResults(false); }} className={cn("transition-colors", selectedReport ? "hover:text-blue-600" : "text-gray-800 font-medium")}>
            {activeCat?.label}
          </button>
          {selectedReport && (
            <>
              <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              <span className="text-gray-800 font-medium">{selectedReport}</span>
            </>
          )}
        </motion.div>
      )}

      {/* Step 1: Category Selection */}
      {!selectedCat && (
        <motion.div variants={anim} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCat(cat.id)}
                className={cn("rounded-2xl p-5 text-right border border-transparent hover:border-gray-200 hover:shadow-md transition-all duration-200", cat.bg)}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", cat.iconBg)}>
                  <Icon className={cn("w-5 h-5", cat.iconColor)} />
                </div>
                <p className="font-semibold text-gray-800">{cat.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cat.items.length} تقارير</p>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Step 2: Sub-report selection */}
      {selectedCat && !selectedReport && activeCat && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <p className="text-sm text-gray-500 font-medium">اختر التقرير</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeCat.items.map(item => (
              <motion.button
                key={item}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedReport(item)}
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3.5 text-right hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{item}</span>
                <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors rotate-180" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Step 3: Filters + Run */}
      {selectedReport && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">{selectedReport}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">من تاريخ</Label>
                  <Input type="date" dir="rtl" defaultValue="2024-01-01" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">إلى تاريخ</Label>
                  <Input type="date" dir="rtl" defaultValue={new Date().toISOString().split("T")[0]} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">العميل</Label>
                  <Select>
                    <SelectTrigger dir="rtl"><SelectValue placeholder="كل العملاء" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">كل العملاء</SelectItem>
                      {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">المخزن</Label>
                  <Select>
                    <SelectTrigger dir="rtl"><SelectValue placeholder="كل المخازن" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">كل المخازن</SelectItem>
                      {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={runReport} className="gap-2">
                <Play className="w-4 h-4" />تشغيل التقرير
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <AnimatePresence>
            {showResults && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">نتائج التقرير</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Printer className="w-3.5 h-3.5" />طباعة
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Download className="w-3.5 h-3.5" />تصدير Excel
                    </Button>
                  </div>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={mockReportData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }} />
                        <Bar dataKey="incoming" name="وارد" fill="#16A34A" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="outgoing" name="منصرف" fill="#DC2626" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">العميل</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">إجمالي الوارد</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">إجمالي المنصرف</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الرصيد</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockReportData.map((row, idx) => (
                          <tr key={idx} className={cn("border-b last:border-0 hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                            <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                            <td className="px-4 py-3 text-green-600 font-medium">{row.incoming} طرد</td>
                            <td className="px-4 py-3 text-red-600 font-medium">{row.outgoing} طرد</td>
                            <td className="px-4 py-3 font-semibold text-blue-600">{row.incoming - row.outgoing} طرد</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {!showResults && (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">اضبط الفلاتر ثم انقر على "تشغيل التقرير"</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
