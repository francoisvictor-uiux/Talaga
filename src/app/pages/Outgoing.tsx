import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Printer, Save, PackageMinus, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useDb } from "../context/DbContext";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";

interface OutgoingRow {
  id: number;
  item: string;
  pkg: string;
  requestedQty: string;
  availableQty: number;
  serial: string;
  damaged: string;
  chamber: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const MOCK_AVAILABLE: Record<string, number> = {
  "دجاج مجمد": 150, "لحم بقري": 80, "أسماك": 45, "خضروات مبردة": 200, "فواكه مبردة": 120,
};

export function Outgoing() {
  const { customers, items, packages, warehouses } = useDb();
  const [rows, setRows] = useState<OutgoingRow[]>([
    { id: 1, item: "", pkg: "", requestedQty: "", availableQty: 0, serial: "", damaged: "0", chamber: "" }
  ]);
  const invoiceNo = "OUT-2024-" + String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");

  const addRow = () => {
    setRows([...rows, { id: Date.now(), item: "", pkg: "", requestedQty: "", availableQty: 0, serial: "", damaged: "0", chamber: "" }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof OutgoingRow, value: string | number) => {
    setRows(rows.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === "item") {
        updated.availableQty = MOCK_AVAILABLE[value as string] || 0;
      }
      return updated;
    }));
  };

  const hasError = (row: OutgoingRow) => Number(row.requestedQty) > row.availableQty && row.availableQty > 0 && row.requestedQty !== "";

  const handleSave = () => {
    const errors = rows.filter(hasError);
    if (errors.length > 0) { toast.error("الكمية المطلوبة تتجاوز الكمية المتاحة"); return; }
    toast.success(`تم حفظ فاتورة الصرف ${invoiceNo} بنجاح`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Red Header */}
      <motion.div variants={anim} className="bg-red-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <PackageMinus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold">فاتورة صرف جديدة</h2>
            <p className="text-red-100 text-xs">تسجيل البضاعة المنصرفة من المخزن</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-red-200">رقم الفاتورة</p>
          <p className="font-bold font-mono text-lg">{invoiceNo}</p>
        </div>
      </motion.div>

      {/* Form Header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ *</Label>
                <Input type="date" dir="rtl" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1.5">
                <Label>السائق *</Label>
                <Select>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر السائق (إلزامي)" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="1">يوسف عبدالرحمن</SelectItem>
                    <SelectItem value="2">طارق الحسين</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>رقم السيارة</Label>
                <Input placeholder="أ ب ج 1234" dir="rtl" />
              </div>
              <div className="space-y-1.5">
                <Label>المخزن *</Label>
                <Select>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none h-9 py-1" rows={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Items Table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">الأصناف المنصرفة</h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-red-50 border-b border-red-100">
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800 w-8">#</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">الصنف</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">العبوة</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">الكمية المطلوبة</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">الكمية المتاحة</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">رقم السيريال</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">العوارية (التالف)</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-red-800">العنبر/المربع</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const err = hasError(row);
                    return (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn("border-b transition-colors", err ? "bg-red-50/50" : "hover:bg-gray-50/30")}
                      >
                        <td className="px-3 py-2 text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <Select onValueChange={v => updateRow(row.id, "item", v)}>
                            <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                            <SelectContent dir="rtl">
                              {items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Select>
                            <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                            <SelectContent dir="rtl">
                              {packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="relative">
                            <Input
                              className={cn("h-8 text-xs w-24", err ? "border-red-500 bg-red-50" : "")}
                              type="number" placeholder="0" dir="rtl"
                              value={row.requestedQty}
                              onChange={e => updateRow(row.id, "requestedQty", e.target.value)}
                            />
                            {err && <AlertCircle className="absolute left-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-red-500" />}
                          </div>
                          {err && <p className="text-red-500 text-xs mt-0.5">يتجاوز المتاح!</p>}
                        </td>
                        <td className="px-2 py-1.5">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded", row.availableQty > 0 ? "text-green-700 bg-green-100" : "text-gray-400 bg-gray-100")}>
                            {row.availableQty || "—"} طرد
                          </span>
                        </td>
                        <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" /></td>
                        <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" defaultValue="0" dir="rtl" /></td>
                        <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" placeholder="عنبر A-1" dir="rtl" /></td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => removeRow(row.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t">
              <button onClick={addRow} className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded transition-colors">
                <Plus className="w-4 h-4" />إضافة صنف
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-red-50 border border-red-100">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-gray-500">إجمالي الطرود المنصرفة</p>
                <p className="text-2xl font-bold text-red-700">
                  {rows.reduce((s, r) => s + (Number(r.requestedQty) || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-red-600 text-red-700 hover:bg-red-50 gap-2">
                <Printer className="w-4 h-4" />طباعة
              </Button>
              <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Save className="w-4 h-4" />حفظ وطباعة
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
