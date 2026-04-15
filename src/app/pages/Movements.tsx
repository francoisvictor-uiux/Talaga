import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router";
import {
  Plus, Trash2, Printer, Save,
  PackagePlus, PackageMinus, ArrowLeftRight, AlertCircle,
  Thermometer, MessageCircle, Gift, Cigarette, DoorOpen, Send, X,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { customers, items, packages, warehouses, customerItems, employees } from "../data/mockData";
import { useConfirmDelete } from "../components/ui/ConfirmDialog";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";

/* ─── animation presets ─── */
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

/* ─── tab meta ─── */
const TAB_META = {
  incoming: {
    label: "الوارد", icon: PackagePlus, color: "text-green-600",
    activeBg: "bg-green-600", activeText: "text-white", headerBg: "bg-green-600",
    prefix: "INV", invoiceLabel: "فاتورة استلام جديدة", invoiceDesc: "تسجيل البضاعة الواردة للمخزن",
  },
  outgoing: {
    label: "المنصرف", icon: PackageMinus, color: "text-red-600",
    activeBg: "bg-red-600", activeText: "text-white", headerBg: "bg-red-600",
    prefix: "OUT", invoiceLabel: "فاتورة صرف جديدة", invoiceDesc: "تسجيل البضاعة المنصرفة من المخزن",
  },
  transfers: {
    label: "التحويلات", icon: ArrowLeftRight, color: "text-orange-600",
    activeBg: "bg-orange-600", activeText: "text-white", headerBg: "bg-orange-600",
    prefix: "TRF", invoiceLabel: "تحويل جديد", invoiceDesc: "تحويل الأصناف بين المخازن أو العملاء",
  },
};

/* ─── WhatsApp helper ─── */
const sendWhatsApp = (message: string) => {
  const phone = localStorage.getItem("wa_notify_phone") || "";
  if (!phone) {
    toast.info("لم يتم تحديد رقم واتساب للإشعارات — يمكنك تعيينه من الإعدادات");
    return;
  }
  const clean = phone.replace(/\D/g, "").replace(/^0/, "20");
  window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
};

/* ─── Naulage lookup ─── */
const getNaulage = (customerId: string, itemName: string): number => {
  if (!customerId) return 0;
  const specific = customerItems.find(
    ci => ci.customerId === Number(customerId) && ci.itemName === itemName,
  );
  if (specific) return specific.naulage;
  const cust = customers.find(c => c.id === Number(customerId));
  return cust?.defaultNaulage ?? 0;
};

/* ══════════════════════════════════════════════
   INCOMING TAB
══════════════════════════════════════════════ */
interface IncomingRow {
  id: number; item: string; pkg: string; quantity: string;
  weight: string; productionDate: string; expiryDate: string;
  serial: string; chamber: string; naulage: string;
}

interface GratuityDist {
  employeeId: number; name: string; selected: boolean; amount: string;
}

function IncomingTab() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [temperature, setTemperature] = useState("");
  const [openingFee, setOpeningFee] = useState("");
  const [rows, setRows] = useState<IncomingRow[]>([
    { id: 1, item: "", pkg: "", quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamber: "", naulage: "" },
  ]);
  const [showGratuity, setShowGratuity] = useState(false);
  const [gratuityTotal, setGratuityTotal] = useState("");
  const [gratuityDist, setGratuityDist] = useState<GratuityDist[]>(
    employees.filter(e => e.status === "active").map(e => ({ employeeId: e.id, name: e.name, selected: false, amount: "" })),
  );
  const invoiceNo = `INV-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  const addRow = () => setRows(r => [...r, { id: Date.now(), item: "", pkg: "", quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamber: "", naulage: "" }]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id: number, field: keyof IncomingRow, value: string) =>
    setRows(r => r.map(x => {
      if (x.id !== id) return x;
      const updated = { ...x, [field]: value };
      if (field === "item" && selectedCustomerId) updated.naulage = String(getNaulage(selectedCustomerId, value));
      return updated;
    }));

  const onCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    setRows(r => r.map(x => ({ ...x, naulage: x.item ? String(getNaulage(val, x.item)) : x.naulage })));
  };

  const totalQty = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);
  const totalNaulage = rows.reduce((s, r) => s + (Number(r.naulage) || 0) * (Number(r.quantity) || 0), 0);

  const handleSave = () => {
    const customerName = customers.find(c => c.id === Number(selectedCustomerId))?.name || "عميل";
    const msg = `🟢 *وارد جديد*\nرقم الفاتورة: ${invoiceNo}\nالعميل: ${customerName}\nالكمية: ${totalQty.toLocaleString()} طرد\nالوزن: ${totalWeight.toLocaleString()} كجم\nدرجة الحرارة: ${temperature || "—"} °م\nالنولون: ${totalNaulage.toLocaleString()} ج.م\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
    toast.success(`تم حفظ فاتورة الاستلام ${invoiceNo} بنجاح`);
    sendWhatsApp(msg);
  };

  const handleGratuitySave = () => {
    const selected = gratuityDist.filter(d => d.selected);
    if (!gratuityTotal || selected.length === 0) { toast.error("حدد المبلغ والموظفين"); return; }
    toast.success(`تم توزيع إكرامية ${Number(gratuityTotal).toLocaleString()} ج.م على ${selected.length} موظف`);
    setShowGratuity(false);
    setGratuityTotal("");
    setGratuityDist(d => d.map(x => ({ ...x, selected: false, amount: "" })));
  };

  const splitEqually = () => {
    const sel = gratuityDist.filter(d => d.selected);
    if (!gratuityTotal || sel.length === 0) return;
    const share = (Number(gratuityTotal) / sel.length).toFixed(2);
    setGratuityDist(d => d.map(x => x.selected ? { ...x, amount: share } : x));
  };

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select onValueChange={onCustomerChange}>
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
                <Label className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-blue-500" />درجة الحرارة (°م)</Label>
                <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="col-span-2 md:col-span-3 space-y-1.5">
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
              <table className="w-full text-sm min-w-[1050px]">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100">
                    {["#","الصنف","العبوة","الكمية","الوزن (كجم)","تاريخ الإنتاج","تاريخ الانتهاء","رقم السيريال","العنبر/المربع","نولون (ج.م/طرد)",""].map((h,i) => (
                      <th key={i} className={cn("text-right px-3 py-2.5 text-xs font-medium text-green-800", i===9?"bg-amber-50 text-amber-800":"")}>{h}</th>
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
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                          <SelectContent dir="rtl">{packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.quantity} onChange={e => updateRow(row.id, "quantity", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" type="number" placeholder="0" dir="rtl" value={row.weight} onChange={e => updateRow(row.id, "weight", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.productionDate} onChange={e => updateRow(row.id, "productionDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.expiryDate} onChange={e => updateRow(row.id, "expiryDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" value={row.serial} onChange={e => updateRow(row.id, "serial", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" placeholder="A-1" dir="rtl" value={row.chamber} onChange={e => updateRow(row.id, "chamber", e.target.value)} /></td>
                      <td className="px-2 py-1.5 bg-amber-50/50">
                        <div className="flex items-center gap-1">
                          <Input className="h-8 text-xs w-20 border-amber-200 bg-amber-50" type="number" placeholder="0" dir="rtl" value={row.naulage} onChange={e => updateRow(row.id, "naulage", e.target.value)} />
                          {row.naulage && <span className="text-xs text-amber-600">=&nbsp;{((Number(row.naulage)||0)*(Number(row.quantity)||0)).toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => confirmDelete(row.item || `السطر ${idx+1}`, () => removeRow(row.id), { title: "حذف السطر", description: "هل تريد حذف هذا السطر من الفاتورة؟" })} className="p-1 text-red-400 hover:bg-red-50 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t">
              <button onClick={addRow} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium hover:bg-green-50 px-3 py-1.5 rounded">
                <Plus className="w-4 h-4" />إضافة صنف
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-green-50 border border-green-100">
          <CardContent className="p-4 space-y-3">
            {/* Totals row */}
            <div className="flex items-center gap-8 flex-wrap">
              <div><p className="text-xs text-gray-500">إجمالي الطرود</p><p className="text-2xl font-bold text-green-700">{totalQty.toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">إجمالي الوزن</p><p className="text-2xl font-bold text-green-700">{totalWeight.toLocaleString()} كجم</p></div>
              <div><p className="text-xs text-gray-500">إجمالي النولون</p><p className="text-2xl font-bold text-amber-600">{totalNaulage.toLocaleString()} ج.م</p></div>
              {temperature && (
                <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-semibold">{temperature} °م</span>
                </div>
              )}
            </div>
            {/* Extra fees + actions */}
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-green-200">
              <div className="flex items-center gap-3 flex-wrap">
                {/* فتح عنبر */}
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-1.5">
                  <DoorOpen className="w-4 h-4 text-green-600" />
                  <Label className="text-xs text-gray-600 whitespace-nowrap">فتح عنبر (إيراد):</Label>
                  <Input type="number" placeholder="0" dir="rtl" value={openingFee} onChange={e => setOpeningFee(e.target.value)} className="h-7 text-xs w-24 border-0 bg-transparent p-0 focus-visible:ring-0" />
                  <span className="text-xs text-gray-500">ج.م</span>
                </div>
                {/* إكرامية button */}
                <Button variant="outline" size="sm" onClick={() => setShowGratuity(true)} className="border-purple-400 text-purple-700 hover:bg-purple-50 gap-1.5">
                  <Gift className="w-4 h-4" />إكرامية
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 gap-2"><Printer className="w-4 h-4" />طباعة + QR</Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Save className="w-4 h-4" />حفظ + <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {confirmDialog}

      {/* Gratuity Dialog */}
      <Dialog open={showGratuity} onOpenChange={setShowGratuity}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Gift className="w-5 h-5 text-purple-600" />توزيع إكرامية على الموظفين</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <Label>إجمالي الإكرامية (ج.م)</Label>
                <Input type="number" placeholder="0" dir="rtl" value={gratuityTotal} onChange={e => setGratuityTotal(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <Button size="sm" variant="outline" onClick={splitEqually} className="mt-6 whitespace-nowrap">توزيع متساوي</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-purple-50 px-3 py-2 border-b">
                <p className="text-xs font-medium text-purple-800">اختر الموظفين وحدد نصيب كل واحد</p>
              </div>
              <div className="divide-y max-h-56 overflow-y-auto">
                {gratuityDist.map((d, i) => (
                  <div key={d.employeeId} className="flex items-center gap-3 px-3 py-2.5">
                    <Checkbox
                      checked={d.selected}
                      onCheckedChange={checked => setGratuityDist(prev => prev.map((x, j) => j===i ? {...x, selected: !!checked} : x))}
                    />
                    <span className="flex-1 text-sm font-medium text-gray-700">{d.name}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" placeholder="0" dir="rtl"
                        value={d.amount}
                        onChange={e => setGratuityDist(prev => prev.map((x,j) => j===i ? {...x, amount: e.target.value} : x))}
                        disabled={!d.selected}
                        className="h-7 w-24 text-xs border border-[#d1d5dc] bg-[#f9fafb] disabled:opacity-40"
                      />
                      <span className="text-xs text-gray-500">ج.م</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {gratuityTotal && gratuityDist.filter(d=>d.selected).length > 0 && (
              <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 text-sm">
                <span className="text-gray-600">موزع على {gratuityDist.filter(d=>d.selected).length} موظفين</span>
                <span className="font-semibold text-purple-700">
                  متبقي: {(Number(gratuityTotal) - gratuityDist.reduce((s,d)=>s+(Number(d.amount)||0),0)).toLocaleString()} ج.م
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleGratuitySave} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ وإضافة للمستحقات</Button>
            <Button variant="outline" onClick={() => setShowGratuity(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   OUTGOING TAB
══════════════════════════════════════════════ */
interface OutgoingRow {
  id: number; item: string; pkg: string; requestedQty: string;
  availableQty: number; serial: string; damaged: string; chamber: string; naulage: string;
}
const MOCK_AVAILABLE: Record<string, number> = {
  "دجاج مجمد": 150, "لحم بقري": 80, "أسماك": 45, "خضروات مبردة": 200, "فواكه مبردة": 120,
};

function OutgoingTab() {
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [temperature, setTemperature] = useState("");
  const [openingFee, setOpeningFee] = useState("");
  const [rows, setRows] = useState<OutgoingRow[]>([
    { id: 1, item: "", pkg: "", requestedQty: "", availableQty: 0, serial: "", damaged: "0", chamber: "", naulage: "" },
  ]);
  const [showTips, setShowTips] = useState(false);
  const [tipsAmount, setTipsAmount] = useState("");
  const [tipsNote, setTipsNote] = useState("");
  const invoiceNo = `OUT-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  const addRow = () => setRows(r => [...r, { id: Date.now(), item: "", pkg: "", requestedQty: "", availableQty: 0, serial: "", damaged: "0", chamber: "", naulage: "" }]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id: number, field: keyof OutgoingRow, value: string | number) =>
    setRows(r => r.map(x => {
      if (x.id !== id) return x;
      const updated = { ...x, [field]: value };
      if (field === "item") {
        updated.availableQty = MOCK_AVAILABLE[value as string] || 0;
        if (selectedCustomerId) updated.naulage = String(getNaulage(selectedCustomerId, value as string));
      }
      return updated;
    }));

  const onCustomerChange = (val: string) => {
    setSelectedCustomerId(val);
    setRows(r => r.map(x => ({ ...x, naulage: x.item ? String(getNaulage(val, x.item)) : x.naulage })));
  };

  const hasError = (row: OutgoingRow) => Number(row.requestedQty) > row.availableQty && row.availableQty > 0 && row.requestedQty !== "";
  const totalQty = rows.reduce((s, r) => s + (Number(r.requestedQty) || 0), 0);
  const totalNaulage = rows.reduce((s, r) => s + (Number(r.naulage) || 0) * (Number(r.requestedQty) || 0), 0);

  const handleSave = () => {
    if (rows.some(hasError)) { toast.error("الكمية المطلوبة تتجاوز الكمية المتاحة"); return; }
    const customerName = customers.find(c => c.id === Number(selectedCustomerId))?.name || "عميل";
    const msg = `🔴 *منصرف جديد*\nرقم الفاتورة: ${invoiceNo}\nالعميل: ${customerName}\nالكمية: ${totalQty.toLocaleString()} طرد\nدرجة الحرارة: ${temperature || "—"} °م\nالنولون: ${totalNaulage.toLocaleString()} ج.م${openingFee ? `\nفتح عنبر: ${Number(openingFee).toLocaleString()} ج.م` : ""}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
    toast.success(`تم حفظ فاتورة الصرف ${invoiceNo} بنجاح`);
    sendWhatsApp(msg);
  };

  const handleTipsSave = () => {
    if (!tipsAmount) { toast.error("أدخل مبلغ الدخان"); return; }
    toast.success(`تم تسجيل دخان بقيمة ${Number(tipsAmount).toLocaleString()} ج.م كمصروف`);
    setShowTips(false); setTipsAmount(""); setTipsNote("");
  };

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Header */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select onValueChange={onCustomerChange}>
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
                <Select onValueChange={setSelectedDriver}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر السائق (إلزامي)" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="يوسف عبدالرحمن">يوسف عبدالرحمن</SelectItem>
                    <SelectItem value="طارق الحسين">طارق الحسين</SelectItem>
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
                <Label className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-blue-500" />درجة الحرارة (°م)</Label>
                <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="col-span-2 md:col-span-3 space-y-1.5">
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
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-red-50 border-b border-red-100">
                    {["#","الصنف","العبوة","الكمية المطلوبة","الكمية المتاحة","رقم السيريال","العوارية","العنبر","نولون (ج.م/طرد)",""].map((h,i) => (
                      <th key={i} className={cn("text-right px-3 py-2.5 text-xs font-medium text-red-800", i===8?"bg-amber-50 text-amber-800":"")}>{h}</th>
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
                        <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" placeholder="A-1" dir="rtl" /></td>
                        <td className="px-2 py-1.5 bg-amber-50/50">
                          <div className="flex items-center gap-1">
                            <Input className="h-8 text-xs w-20 border-amber-200 bg-amber-50" type="number" placeholder="0" dir="rtl" value={row.naulage} onChange={e => updateRow(row.id, "naulage", e.target.value)} />
                            {row.naulage && <span className="text-xs text-amber-600">=&nbsp;{((Number(row.naulage)||0)*(Number(row.requestedQty)||0)).toLocaleString()}</span>}
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <button onClick={() => confirmDelete(row.item || `السطر ${idx+1}`, () => removeRow(row.id), { title: "حذف السطر", description: "هل تريد حذف هذا السطر من فاتورة الصرف؟" })} className="p-1 text-red-400 hover:bg-red-50 rounded">
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
              <button onClick={addRow} className="flex items-center gap-1.5 text-red-600 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded">
                <Plus className="w-4 h-4" />إضافة صنف
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm bg-red-50 border border-red-100">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-8 flex-wrap">
              <div><p className="text-xs text-gray-500">إجمالي الطرود المنصرفة</p><p className="text-2xl font-bold text-red-700">{totalQty.toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-500">إجمالي النولون</p><p className="text-2xl font-bold text-amber-600">{totalNaulage.toLocaleString()} ج.م</p></div>
              {temperature && (
                <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-semibold">{temperature} °م</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-red-200">
              <div className="flex items-center gap-3 flex-wrap">
                {/* فتح عنبر */}
                <div className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                  <DoorOpen className="w-4 h-4 text-red-600" />
                  <Label className="text-xs text-gray-600 whitespace-nowrap">فتح عنبر (مصروف):</Label>
                  <Input type="number" placeholder="0" dir="rtl" value={openingFee} onChange={e => setOpeningFee(e.target.value)} className="h-7 text-xs w-24 border-0 bg-transparent p-0 focus-visible:ring-0" />
                  <span className="text-xs text-gray-500">ج.م</span>
                </div>
                {/* دخان button */}
                <Button variant="outline" size="sm" onClick={() => setShowTips(true)} className="border-orange-400 text-orange-700 hover:bg-orange-50 gap-1.5">
                  <Cigarette className="w-4 h-4" />دخان (تيبس)
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-red-600 text-red-700 hover:bg-red-50 gap-2"><Printer className="w-4 h-4" />طباعة</Button>
                <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Save className="w-4 h-4" />حفظ + <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {confirmDialog}

      {/* Tips Dialog */}
      <Dialog open={showTips} onOpenChange={setShowTips}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Cigarette className="w-5 h-5 text-orange-600" />إضافة دخان (تيبس للسائق)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>اسم السائق</Label>
              <Input dir="rtl" value={selectedDriver || tipsNote} onChange={e => setTipsNote(e.target.value)} placeholder="اسم السائق" className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (ج.م)</Label>
              <Input type="number" placeholder="0" dir="rtl" value={tipsAmount} onChange={e => setTipsAmount(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-xs text-orange-700">
              <p>سيتم تسجيل هذا المبلغ كمصروف في المصاريف التشغيلية.</p>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleTipsSave} className="bg-[#155dfc] hover:bg-blue-700 text-white">تسجيل كمصروف</Button>
            <Button variant="outline" onClick={() => setShowTips(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   TRANSFERS TAB CONTENT
══════════════════════════════════════════════ */
function TransfersTab() {
  const [subTab, setSubTab] = useState("warehouses");
  const [temperature, setTemperature] = useState("");
  const trf = `TRF-2024-${String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}`;

  const handleSave = (type: string) => {
    const label = type === "warehouses" ? "تحويل مخزن" : "تحويل عميل";
    const msg = `🟡 *${label} جديد*\nرقم التحويل: ${trf}${temperature ? `\nدرجة الحرارة: ${temperature} °م` : ""}\nالتاريخ: ${new Date().toLocaleDateString("ar-EG")}`;
    toast.success(`تم تأكيد ${label} بنجاح`);
    sendWhatsApp(msg);
  };

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
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">من</span>المخزن المصدر
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">المخزن</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">العنبر</Label><Input placeholder="A-1" dir="rtl" /></div>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                        <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">إلى</span>المخزن الوجهة
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">المخزن</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">العنبر المستهدف</Label><Input placeholder="B-2" dir="rtl" /></div>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" />درجة الحرارة (°م)</Label>
                      <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظات..." dir="rtl" /></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("warehouses")} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Save className="w-4 h-4" />تأكيد التحويل + <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Between Customers */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">من</span>العميل المحوِّل
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                        <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">المخزن والعنبر</Label><Input placeholder="ثلاجة A — عنبر 2" dir="rtl" /></div>
                  </div>
                  <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">إلى</span>العميل المستلِم
                    </p>
                    <div className="space-y-1.5"><Label className="text-xs">العميل</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                        <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">المخزن والعنبر</Label><Input placeholder="ثلاجة B — عنبر 1" dir="rtl" /></div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5"><Label className="text-xs">الصنف</Label>
                      <Select><SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">الكمية</Label><Input type="number" placeholder="0" dir="rtl" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" />درجة الحرارة (°م)</Label>
                      <Input type="number" placeholder="-18" dir="rtl" value={temperature} onChange={e => setTemperature(e.target.value)} className="border border-[#d1d5dc] bg-[#f9fafb]" />
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">ملاحظات</Label><Input placeholder="ملاحظات إضافية..." dir="rtl" /></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("customers")} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Save className="w-4 h-4" />تأكيد التحويل + <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Recent transfers */}
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
    <div className="space-y-5" dir="rtl">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className={cn("px-5 py-4 text-white", meta.headerBg)}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold">{meta.invoiceLabel}</h2>
                  <p className="text-xs opacity-80">{meta.invoiceDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* WhatsApp notice */}
                <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-xs">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>واتساب: {localStorage.getItem("wa_notify_phone") || "غير محدد"}</span>
                </div>
                <div className="font-mono text-sm bg-white/20 px-3 py-1.5 rounded-lg">{invoiceNo}</div>
              </div>
            </div>
          </div>
          {/* Tab navigation */}
          <div className="px-5 py-3 bg-[#f3f4f6] flex items-center gap-2 border-b overflow-x-auto">
            {(["incoming","outgoing","transfers"] as TabKey[]).map(tab => {
              const m = TAB_META[tab];
              const TabIcon = m.icon;
              return (
                <button
                  key={tab}
                  onClick={() => setTab(tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === tab ? `${m.activeBg} ${m.activeText} shadow-sm` : "text-gray-600 hover:bg-white",
                  )}
                >
                  <TabIcon className="w-4 h-4" />{m.label}
                </button>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "incoming" && <IncomingTab />}
          {activeTab === "outgoing" && <OutgoingTab />}
          {activeTab === "transfers" && <TransfersTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
