import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router";
import {
  Plus, Trash2, Printer, Save,
  PackagePlus, PackageMinus, ArrowLeftRight, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { customers, items, packages, warehouses } from "../data/mockData";
import { useConfirmDelete } from "../components/ui/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";

/* ─── animation presets ─── */
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

/* ─── tab meta ─── */
const TAB_META = {
  incoming: {
    label: "الوارد",
    icon: PackagePlus,
    color: "text-green-600",
    activeBg: "bg-green-600",
    activeText: "text-white",
    headerBg: "bg-green-600",
    prefix: "INV",
    invoiceLabel: "فاتورة استلام جديدة",
    invoiceDesc: "تسجيل البضاعة الواردة للمخزن",
  },
  outgoing: {
    label: "المنصرف",
    icon: PackageMinus,
    color: "text-red-600",
    activeBg: "bg-red-600",
    activeText: "text-white",
    headerBg: "bg-red-600",
    prefix: "OUT",
    invoiceLabel: "فاتورة صرف جديدة",
    invoiceDesc: "تسجيل البضاعة المنصرفة من المخزن",
  },
  transfers: {
    label: "التحويلات",
    icon: ArrowLeftRight,
    color: "text-orange-600",
    activeBg: "bg-orange-600",
    activeText: "text-white",
    headerBg: "bg-orange-600",
    prefix: "TRF",
    invoiceLabel: "تحويل جديد",
    invoiceDesc: "تحويل الأصناف بين المخازن أو العملاء",
  },
};

/* ══════════════════════════════════════════════
   INCOMING TAB CONTENT
══════════════════════════════════════════════ */
interface IncomingRow {
  id: number; item: string; pkg: string; quantity: string;
  weight: string; productionDate: string; expiryDate: string;
  serial: string; chamber: string;
}

function IncomingTab() {
  const [rows, setRows] = useState<IncomingRow[]>([
    { id: 1, item: "", pkg: "", quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamber: "" }
  ]);
  const invoiceNo = `INV-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  const addRow = () => setRows(r => [...r, { id: Date.now(), item: "", pkg: "", quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamber: "" }]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id: number, field: keyof IncomingRow, value: string) =>
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));

  const totalQty = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Form header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
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
                  <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
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

      {/* Items table */}
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
                    {["#","الصنف","العبوة","الكمية","الوزن (كجم)","تاريخ الإنتاج","تاريخ الانتهاء","رقم السيريال","العنبر/المربع",""].map((h,i) => (
                      <th key={i} className={cn("text-right px-3 py-2.5 text-xs font-medium text-green-800", i === 0 ? "w-8" : "", i === 9 ? "w-8" : "")}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="border-b hover:bg-gray-50/30 transition-colors">
                      <td className="px-3 py-2 text-gray-500 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <Select onValueChange={v => updateRow(row.id, "item", v)}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="اختر الصنف" /></SelectTrigger>
                          <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Select onValueChange={v => updateRow(row.id, "pkg", v)}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="اختر العبوة" /></SelectTrigger>
                          <SelectContent dir="rtl">{packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.quantity} onChange={e => updateRow(row.id, "quantity", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" type="number" placeholder="0" dir="rtl" value={row.weight} onChange={e => updateRow(row.id, "weight", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.productionDate} onChange={e => updateRow(row.id, "productionDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.expiryDate} onChange={e => updateRow(row.id, "expiryDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" value={row.serial} onChange={e => updateRow(row.id, "serial", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" placeholder="عنبر A-1" dir="rtl" value={row.chamber} onChange={e => updateRow(row.id, "chamber", e.target.value)} /></td>
                      <td className="px-2 py-1.5">
                        <button
                          onClick={() => confirmDelete(
                            row.item || `السطر ${idx + 1}`,
                            () => removeRow(row.id),
                            { title: "حذف السطر", description: "هل تريد حذف هذا السطر من الفاتورة؟" }
                          )}
                          className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                        >
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

      {/* Footer */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-green-50 border border-green-100">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-8">
              <div><p className="text-xs text-gray-500">إجمالي الطرود</p><p className="text-2xl font-bold text-green-700">{totalQty.toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">إجمالي الوزن</p><p className="text-2xl font-bold text-green-700">{totalWeight.toLocaleString()} كجم</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 gap-2"><Printer className="w-4 h-4" />طباعة + QR</Button>
              <Button onClick={() => toast.success(`تم حفظ فاتورة الاستلام ${invoiceNo} بنجاح`)} className="bg-green-600 hover:bg-green-700 text-white gap-2"><Save className="w-4 h-4" />حفظ الفاتورة</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {confirmDialog}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   OUTGOING TAB CONTENT
══════════════════════════════════════════════ */
interface OutgoingRow {
  id: number; item: string; pkg: string; requestedQty: string;
  availableQty: number; serial: string; damaged: string; chamber: string;
}
const MOCK_AVAILABLE: Record<string, number> = {
  "دجاج مجمد": 150, "لحم بقري": 80, "أسماك": 45, "خضروات مبردة": 200, "فواكه مبردة": 120,
};

function OutgoingTab() {
  const [rows, setRows] = useState<OutgoingRow[]>([
    { id: 1, item: "", pkg: "", requestedQty: "", availableQty: 0, serial: "", damaged: "0", chamber: "" }
  ]);
  const invoiceNo = `OUT-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  const addRow = () => setRows(r => [...r, { id: Date.now(), item: "", pkg: "", requestedQty: "", availableQty: 0, serial: "", damaged: "0", chamber: "" }]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id: number, field: keyof OutgoingRow, value: string | number) =>
    setRows(r => r.map(x => {
      if (x.id !== id) return x;
      const updated = { ...x, [field]: value };
      if (field === "item") updated.availableQty = MOCK_AVAILABLE[value as string] || 0;
      return updated;
    }));

  const hasError = (row: OutgoingRow) => Number(row.requestedQty) > row.availableQty && row.availableQty > 0 && row.requestedQty !== "";

  const handleSave = () => {
    if (rows.some(hasError)) { toast.error("الكمية المطلوبة تتجاوز الكمية المتاحة"); return; }
    toast.success(`تم حفظ فاتورة الصرف ${invoiceNo} بنجاح`);
  };

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Form header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
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
                  <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
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

      {/* Items table */}
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
                    {["#","الصنف","العبوة","الكمية المطلوبة","الكمية المتاحة","رقم السيريال","العوارية (التالف)","العنبر/المربع",""].map((h,i) => (
                      <th key={i} className="text-right px-3 py-2.5 text-xs font-medium text-red-800">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const err = hasError(row);
                    return (
                      <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={cn("border-b transition-colors", err ? "bg-red-50/50" : "hover:bg-gray-50/30")}>
                        <td className="px-3 py-2 text-gray-500 text-xs">{idx + 1}</td>
                        <td className="px-2 py-1.5">
                          <Select onValueChange={v => updateRow(row.id, "item", v)}>
                            <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                            <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <Select>
                            <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                            <SelectContent dir="rtl">{packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="relative">
                            <Input className={cn("h-8 text-xs w-24", err ? "border-red-500 bg-red-50" : "")} type="number" placeholder="0" dir="rtl" value={row.requestedQty} onChange={e => updateRow(row.id, "requestedQty", e.target.value)} />
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
                          <button
                            onClick={() => confirmDelete(
                              row.item || `السطر ${idx + 1}`,
                              () => removeRow(row.id),
                              { title: "حذف السطر", description: "هل تريد حذف هذا السطر من فاتورة الصرف؟" }
                            )}
                            className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"
                          >
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
            <div>
              <p className="text-xs text-gray-500">إجمالي الطرود المنصرفة</p>
              <p className="text-2xl font-bold text-red-700">{rows.reduce((s, r) => s + (Number(r.requestedQty) || 0), 0).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-red-600 text-red-700 hover:bg-red-50 gap-2"><Printer className="w-4 h-4" />طباعة</Button>
              <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white gap-2"><Save className="w-4 h-4" />حفظ وطباعة</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {confirmDialog}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   TRANSFERS TAB CONTENT
══════════════════════════════════════════���═══ */
function TransfersTab() {
  const [subTab, setSubTab] = useState("warehouses");
  const trf = `TRF-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  const handleSave = (type: string) =>
    toast.success(`تم تأكيد ${type === "warehouses" ? "تحويل المخزن" : "تحويل العميل"} بنجاح`);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={anim}>
        <Tabs defaultValue="warehouses" onValueChange={setSubTab} dir="rtl">
          <TabsList className="bg-orange-50 border border-orange-100">
            <TabsTrigger value="warehouses" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">تحويل بين مخازن</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">تحويل بين عملاء</TabsTrigger>
          </TabsList>

          {/* Between Warehouses */}
          <TabsContent value="warehouses">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">من</span>
                      المخزن المصدر
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">المخزن</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن المصدر" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العنبر</Label>
                      <Input placeholder="مثال: A-1" dir="rtl" />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">إلى</span>
                      المخزن الوجهة
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">المخزن</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن الوجهة" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العنبر</Label>
                      <Input placeholder="مثال: A-1" dir="rtl" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف المحوَّل</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">الصنف</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">العبوة</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                        <SelectContent dir="rtl">{packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" placeholder="0" dir="rtl" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظات إضافية..." dir="rtl" /></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("warehouses")} className="bg-orange-600 hover:bg-orange-700 text-white gap-2"><Save className="w-4 h-4" />تأكيد التحويل</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Between Customers */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm">العميل المصدر</p>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل المصدر" /></SelectTrigger>
                        <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm">العميل الوجهة</p>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل الوجهة" /></SelectTrigger>
                        <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">الصنف</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" placeholder="0" dir="rtl" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">العنبر</Label><Input placeholder="مثال: A-1" dir="rtl" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظات إضافية..." dir="rtl" /></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("customers")} className="bg-orange-600 hover:bg-orange-700 text-white gap-2"><Save className="w-4 h-4" />تأكيد التحويل</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Recent transfers table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <div className="px-4 py-3 border-b"><h3 className="font-semibold text-gray-800">آخر التحويلات</h3></div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {["رقم التحويل","النوع","من","إلى","الكمية","التاريخ"].map(h => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { no: "TRF-2024-005", type: "بين مخازن", from: "ثلاجة المنطقة الأولى", to: "ثلاجة الحبوب", qty: 20, date: "2024-01-18" },
                  { no: "TRF-2024-004", type: "بين عملاء", from: "شركة النور", to: "مجموعة الخليج", qty: 15, date: "2024-01-17" },
                  { no: "TRF-2024-003", type: "بين مخازن", from: "ثلاجة اللحوم", to: "ثلاجة الخضروات", qty: 30, date: "2024-01-16" },
                ].map((t, i) => (
                  <tr key={t.no} className={i % 2 === 0 ? "bg-white border-b" : "bg-gray-50/30 border-b"}>
                    <td className="px-4 py-3 font-mono text-xs text-orange-600">{t.no}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{t.type}</span></td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.from}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.to}</td>
                    <td className="px-4 py-3 text-gray-700">{t.qty} طرد</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   MAIN MOVEMENTS PAGE
══════════════════════════════════════════════ */
type TabKey = "incoming" | "outgoing" | "transfers";

export function Movements() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabKey) || "incoming";

  const setTab = (tab: string) => setSearchParams({ tab }, { replace: true });

  const meta = TAB_META[activeTab];
  const Icon = meta.icon;

  const invoiceNo = `${meta.prefix}-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Coloured header — changes with active tab */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={anim}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: -8 }}
          className={cn("text-white rounded-xl p-4 flex items-center justify-between", meta.headerBg)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold">{meta.invoiceLabel}</h2>
              <p className="text-white/80 text-xs">{meta.invoiceDesc}</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-white/70">رقم المستند</p>
            <p className="font-bold font-mono text-lg">{invoiceNo}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Tab bar */}
      <motion.div variants={anim}>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit" dir="rtl">
          {(Object.entries(TAB_META) as [TabKey, typeof TAB_META[TabKey]][]).map(([key, m]) => {
            const TabIcon = m.icon;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? `${m.activeBg} ${m.activeText} shadow-md`
                    : "text-gray-600 hover:text-gray-800 hover:bg-white/70"
                )}
              >
                <TabIcon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          {activeTab === "incoming" && <IncomingTab />}
          {activeTab === "outgoing" && <OutgoingTab />}
          {activeTab === "transfers" && <TransfersTab />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}