import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Printer, Save, PackagePlus } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { getAllCustomers, type BackendCustomer } from "../services/customerService";
import { getAllItems, getAllPackages, type BackendItem, type BackendPackage } from "../services/itemService";
import { getAllWarehouses, getChambers, type BackendWarehouse, type BackendChamber } from "../services/warehouseService";
import { addMovement } from "../services/movementService";

interface IncomingRow {
  id: number;
  itemId: string;
  itemName: string;
  packageId: string;
  packageName: string;
  quantity: string;
  weight: string;
  productionDate: string;
  expiryDate: string;
  serial: string;
  chamberId: string;
}

const emptyRow = (): IncomingRow => ({
  id: Date.now() + Math.random(),
  itemId: "", itemName: "", packageId: "", packageName: "",
  quantity: "", weight: "", productionDate: "", expiryDate: "", serial: "", chamberId: "",
});

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Incoming() {
  const [rows, setRows] = useState<IncomingRow[]>([emptyRow()]);
  const [customerId, setCustomerId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split("T")[0]);
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [items, setItems] = useState<BackendItem[]>([]);
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [chambers, setChambers] = useState<BackendChamber[]>([]);

  useEffect(() => {
    Promise.all([
      getAllCustomers(1, 200).then(list => setCustomers(list.filter(c => c.isActive))).catch(() => {}),
      getAllItems(1, 200).then(list => setItems(list.filter(i => i.isActive))).catch(() => {}),
      getAllPackages(1, 200).then(list => setPackages(list.filter(p => p.isActive))).catch(() => {}),
      getAllWarehouses(1, 200).then(list => setWarehouses(list.filter(w => w.isActive))).catch(() => {}),
    ]);
  }, []);

  const handleWarehouseChange = async (wId: string) => {
    setWarehouseId(wId);
    setChambers([]);
    if (wId) {
      try {
        const ch = await getChambers(wId);
        setChambers(ch.filter(c => c.isActive));
      } catch { /* ignore */ }
    }
  };

  const addRow = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id: number) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = <K extends keyof IncomingRow>(id: number, field: K, value: IncomingRow[K]) =>
    setRows(r => r.map(x => x.id === id ? { ...x, [field]: value } : x));

  const totalQty = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0);

  const handleSave = async () => {
    if (!customerId) { toast.error("يرجى اختيار العميل"); return; }
    if (!warehouseId) { toast.error("يرجى اختيار الثلاجة المستلم"); return; }
    const validRows = rows.filter(r => r.itemId && r.quantity);
    if (!validRows.length) { toast.error("يرجى إضافة صنف واحد على الأقل مع الكمية"); return; }
    setSaving(true);
    try {
      const movNum = `INV-${Date.now()}`;
      await Promise.all(validRows.map(row =>
        addMovement({
          movementNumber: movNum,
          movementType: "Incoming",
          movementDate,
          customerId,
          itemId: row.itemId,
          packageId: row.packageId || undefined,
          toWarehouseId: warehouseId,
          toChamberId: row.chamberId || undefined,
          quantity: Number(row.quantity),
          netWeightKg: row.weight ? Number(row.weight) : undefined,
          referenceNumber: row.serial || undefined,
          driverName: driverName || undefined,
          vehiclePlate: vehiclePlate || undefined,
          notes: formNotes || undefined,
        })
      ));
      toast.success(`تم حفظ فاتورة الاستلام ${movNum} بنجاح — ${validRows.length} صنف`);
      setRows([emptyRow()]);
      setCustomerId(""); setWarehouseId(""); setChambers([]);
      setDriverName(""); setVehiclePlate(""); setFormNotes("");
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim} className="bg-green-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><PackagePlus className="w-5 h-5" /></div>
          <div>
            <h2 className="font-bold">فاتورة استلام جديدة</h2>
            <p className="text-green-100 text-xs">تسجيل البضاعة الواردة للثلاجة</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-green-200">تاريخ الفاتورة</p>
          <p className="font-bold font-mono text-lg">{movementDate}</p>
        </div>
      </motion.div>

      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>العميل *</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>التاريخ *</Label>
                <Input type="date" dir="rtl" value={movementDate} onChange={e => setMovementDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>الثلاجة المستلم *</Label>
                <Select value={warehouseId} onValueChange={handleWarehouseChange}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>السائق</Label>
                <Input placeholder="اسم السائق" dir="rtl" value={driverName} onChange={e => setDriverName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>رقم السيارة</Label>
                <Input placeholder="أ ب ج 1234" dir="rtl" value={vehiclePlate} onChange={e => setVehiclePlate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none h-9 py-1" rows={1} value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">رقم الرسالة</th>
                    <th className="text-right px-3 py-2.5 text-xs font-medium text-green-800">مربع التبريد</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <motion.tr key={row.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="border-b hover:bg-gray-50/30 transition-colors">
                      <td className="px-3 py-2 text-gray-500 text-xs">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <Select value={row.itemId} onValueChange={v => { const i = items.find(x => x.id === v); updateRow(row.id, "itemId", v); updateRow(row.id, "itemName", i?.arName || i?.name || ""); }}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                          <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.id}>{i.arName || i.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5">
                        <Select value={row.packageId} onValueChange={v => { const p = packages.find(x => x.id === v); updateRow(row.id, "packageId", v); updateRow(row.id, "packageName", p?.arName || p?.name || ""); }}>
                          <SelectTrigger className="h-8 text-xs" dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                          <SelectContent dir="rtl">{packages.map(p => <SelectItem key={p.id} value={p.id}>{p.arName || p.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-20" type="number" placeholder="0" dir="rtl" value={row.quantity} onChange={e => updateRow(row.id, "quantity", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-24" type="number" placeholder="0" dir="rtl" value={row.weight} onChange={e => updateRow(row.id, "weight", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.productionDate} onChange={e => updateRow(row.id, "productionDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs" type="date" value={row.expiryDate} onChange={e => updateRow(row.id, "expiryDate", e.target.value)} /></td>
                      <td className="px-2 py-1.5"><Input className="h-8 text-xs w-28" placeholder="SN-XXXXX" dir="rtl" value={row.serial} onChange={e => updateRow(row.id, "serial", e.target.value)} /></td>
                      <td className="px-2 py-1.5">
                        {chambers.length > 0 ? (
                          <Select value={row.chamberId} onValueChange={v => updateRow(row.id, "chamberId", v)}>
                            <SelectTrigger className="h-8 text-xs w-28" dir="rtl"><SelectValue placeholder="مربع التبريد" /></SelectTrigger>
                            <SelectContent dir="rtl">{chambers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name || c.code}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <Input className="h-8 text-xs w-28" placeholder="اختر ثلاجة أولاً" dir="rtl" disabled />
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeRow(row.id)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
                  <Printer className="w-4 h-4" />طباعة
                </Button>
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ الفاتورة"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
