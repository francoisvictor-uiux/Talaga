import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Printer, Save, PackagePlus } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { customers, items, packages, warehouses } from "../data/mockData";
import { toast } from "sonner";

interface IncomingRow {
  id: number;
  item: string;
  pkg: string;
  quantity: string;
  weight: string;
  productionDate: string;
  expiryDate: string;
  serial: string;
  chamber: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Incoming() {
  const [rows, setRows] = useState<IncomingRow[]>([
    { id: 1, item: "", pkg: "", quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamber: "" }
  ]);
  const invoiceNo = "INV-2024-" + String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");

  const addRow = () => {
    setRows([...rows, { id: Date.now(), item: "", pkg: "", quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamber: "" }]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof IncomingRow, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const totalQty = rows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const totalWeight = rows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

  const handleSave = () => {
    toast.success(`تم حفظ فاتورة الاستلام ${invoiceNo} بنجاح`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Green Header */}
      <motion.div variants={anim} className="bg-green-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold">فاتورة استلام جديدة</h2>
            <p className="text-green-100 text-xs">تسجيل البضاعة الواردة للمخزن</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-green-200">رقم الفاتورة</p>
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
                <Label>السائق</Label>
                <Select>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر السائق" /></SelectTrigger>
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
                <Label>المخزن المستلم *</Label>
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
            <h3 className="font-semibold text-gray-800">الأصناف الواردة</h3>
            <span className="text-xs text-gray-500">{rows.length} صنف</span>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800 w-8">#</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">الصنف</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">العبوة</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">الكمية</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">الوزن (كجم)</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">تاريخ الإنتاج</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">تاريخ الانتهاء</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">رقم السيريال</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">العنبر/المربع</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="border-b hover:bg-gray-50/30 transition-colors"
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
                        <Select onValueChange={v => updateRow(row.id, "pkg", v)}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                          <SelectContent dir="rtl">
                            {packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.quantity} onChange={e => updateRow(row.id, "quantity", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" type="number" placeholder="0" dir="rtl" value={row.weight} onChange={e => updateRow(row.id, "weight", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.productionDate} onChange={e => updateRow(row.id, "productionDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.expiryDate} onChange={e => updateRow(row.id, "expiryDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" value={row.serial} onChange={e => updateRow(row.id, "serial", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" placeholder="عنبر A-1" dir="rtl" value={row.chamber} onChange={e => updateRow(row.id, "chamber", e.target.value)} /></td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeRow(row.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t">
              <button onClick={addRow} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium hover:bg-green-50 px-3 py-1.5 rounded transition-colors">
                <Plus className="w-4 h-4" />إضافة صنف
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer Summary */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-green-50 border border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-gray-500">إجمالي الطرود</p>
                  <p className="text-2xl font-bold text-green-700">{totalQty.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">إجمالي الوزن</p>
                  <p className="text-2xl font-bold text-green-700">{totalWeight.toLocaleString()} كجم</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 gap-2">
                  <Printer className="w-4 h-4" />طباعة + QR
                </Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Save className="w-4 h-4" />حفظ الفاتورة
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
