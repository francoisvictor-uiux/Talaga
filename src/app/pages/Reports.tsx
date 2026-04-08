import { useState } from "react";
import { motion } from "motion/react";
import { BarChart3, Play, Download, Printer, FileText } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { reportCategories, customers, warehouses } from "../data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const mockReportData = [
  { name: "شركة النور", incoming: 450, outgoing: 320 },
  { name: "مؤسسة الفجر", incoming: 280, outgoing: 210 },
  { name: "مجموعة الخليج", incoming: 680, outgoing: 520 },
  { name: "شركة الأمل", incoming: 190, outgoing: 150 },
  { name: "مؤسسة البركة", incoming: 340, outgoing: 280 },
];

export function Reports() {
  const [selectedCat, setSelectedCat] = useState<string>("movement");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const activeCat = reportCategories.find(c => c.id === selectedCat);

  const runReport = () => {
    setShowResults(true);
    toast.success("تم تشغيل التقرير بنجاح");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={anim} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">التقارير</h2>
          <p className="text-sm text-gray-500">تقارير مالية وتشغيلية شاملة</p>
        </div>
      </motion.div>

      <motion.div variants={anim} className="flex gap-5">
        {/* Left Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {reportCategories.map(cat => (
            <div key={cat.id}>
              <button
                onClick={() => { setSelectedCat(cat.id); setSelectedReport(null); setShowResults(false); }}
                className={cn(
                  "w-full text-right px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  selectedCat === cat.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {cat.label}
              </button>
              {selectedCat === cat.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mr-3 space-y-0.5 mt-1">
                  {cat.items.map(item => (
                    <button
                      key={item}
                      onClick={() => { setSelectedReport(item); setShowResults(false); }}
                      className={cn(
                        "w-full text-right px-3 py-1.5 rounded-md text-xs transition-colors",
                        selectedReport === item ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3 text-sm">
                {selectedReport ? selectedReport : activeCat?.label || "اختر تقريراً"}
              </h3>
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
              <div className="flex items-center gap-2 mt-3">
                <Button onClick={runReport} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  <Play className="w-4 h-4" />تشغيل التقرير
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {showResults && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">نتائج التقرير</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Printer className="w-3.5 h-3.5" />طباعة
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Download className="w-3.5 h-3.5" />تصدير Excel
                  </Button>
                </div>
              </div>

              {/* Chart */}
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={mockReportData}>
                      <CartesianGrid key="grid" strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis key="x-axis" dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <YAxis key="y-axis" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                      <Tooltip key="tooltip" contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      <Bar key="bar-incoming" dataKey="incoming" name="وارد" fill="#16A34A" radius={[4, 4, 0, 0]} />
                      <Bar key="bar-outgoing" dataKey="outgoing" name="منصرف" fill="#DC2626" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Table */}
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
                        <tr key={idx} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
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

          {!showResults && (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>اختر نوع التقرير وانقر على "تشغيل التقرير"</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}