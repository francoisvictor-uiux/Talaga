import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight, Save } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { getAllCustomers, type BackendCustomer } from "../services/customerService";
import { getAllItems, getAllPackages, type BackendItem, type BackendPackage } from "../services/itemService";
import { getAllWarehouses, getChambers, type BackendWarehouse, type BackendChamber } from "../services/warehouseService";
import { addMovement, getAllMovements, type BackendMovement } from "../services/movementService";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Transfers() {
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [items, setItems] = useState<BackendItem[]>([]);
  const [packages, setPackages] = useState<BackendPackage[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<BackendMovement[]>([]);

  /* Warehouse transfer state */
  const [whFromId, setWhFromId] = useState("");
  const [whFromChambers, setWhFromChambers] = useState<BackendChamber[]>([]);
  const [whFromChamberId, setWhFromChamberId] = useState("");
  const [whToId, setWhToId] = useState("");
  const [whToChambers, setWhToChambers] = useState<BackendChamber[]>([]);
  const [whToChamberId, setWhToChamberId] = useState("");
  const [whCustomerId, setWhCustomerId] = useState("");
  const [whItemId, setWhItemId] = useState("");
  const [whPkgId, setWhPkgId] = useState("");
  const [whQty, setWhQty] = useState("");
  const [whNotes, setWhNotes] = useState("");
  const [savingWh, setSavingWh] = useState(false);

  /* Customer transfer state */
  const [cstFromId, setCstFromId] = useState("");
  const [cstToId, setCstToId] = useState("");
  const [cstItemId, setCstItemId] = useState("");
  const [cstQty, setCstQty] = useState("");
  const [cstWarehouseId, setCstWarehouseId] = useState("");
  const [cstNotes, setCstNotes] = useState("");
  const [savingCst, setSavingCst] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    Promise.all([
      getAllCustomers(1, 200).then(l => setCustomers(l.filter(c => c.isActive))).catch(() => {}),
      getAllItems(1, 200).then(l => setItems(l.filter(i => i.isActive))).catch(() => {}),
      getAllPackages(1, 200).then(l => setPackages(l.filter(p => p.isActive))).catch(() => {}),
      getAllWarehouses(1, 200).then(l => setWarehouses(l.filter(w => w.isActive))).catch(() => {}),
      getAllMovements({ movementType: "Transfer", pageSize: 10 }).then(setRecentTransfers).catch(() => {}),
    ]);
  }, []);

  const loadChambers = async (wId: string, setter: (ch: BackendChamber[]) => void) => {
    if (!wId) { setter([]); return; }
    try { setter((await getChambers(wId)).filter(c => c.isActive)); } catch { setter([]); }
  };

  const handleWarehouseTransfer = async () => {
    if (!whCustomerId) { toast.error("يرجى اختيار العميل"); return; }
    if (!whFromId || !whToId) { toast.error("يرجى اختيار الثلاجة المصدر والوجهة"); return; }
    if (whFromId === whToId) { toast.error("الثلاجة المصدر والوجهة يجب أن يكونا مختلفين"); return; }
    if (!whItemId) { toast.error("يرجى اختيار الصنف"); return; }
    if (!whQty) { toast.error("يرجى إدخال الكمية"); return; }
    setSavingWh(true);
    try {
      const movNum = `TRF-WH-${Date.now()}`;
      await addMovement({
        movementNumber: movNum,
        movementType: "Transfer",
        movementDate: new Date().toISOString().split("T")[0],
        customerId: whCustomerId,
        itemId: whItemId,
        packageId: whPkgId || undefined,
        fromWarehouseId: whFromId,
        fromChamberId: whFromChamberId || undefined,
        toWarehouseId: whToId,
        toChamberId: whToChamberId || undefined,
        quantity: Number(whQty),
        notes: whNotes || undefined,
      });
      toast.success(`تم تأكيد التحويل بين الثلاجات ${movNum}`);
      setWhFromId(""); setWhFromChamberId(""); setWhFromChambers([]);
      setWhToId(""); setWhToChamberId(""); setWhToChambers([]);
      setWhCustomerId(""); setWhItemId(""); setWhPkgId(""); setWhQty(""); setWhNotes("");
      getAllMovements({ movementType: "Transfer", pageSize: 10 }).then(setRecentTransfers).catch(() => {});
    } catch (err: any) {
      toast.error(err?.message ?? "فشل التحويل");
    } finally {
      setSavingWh(false);
    }
  };

  const handleCustomerTransfer = async () => {
    if (!cstFromId || !cstToId) { toast.error("يرجى اختيار العميل المصدر والوجهة"); return; }
    if (cstFromId === cstToId) { toast.error("العميل المصدر والوجهة يجب أن يكونا مختلفين"); return; }
    if (!cstItemId) { toast.error("يرجى اختيار الصنف"); return; }
    if (!cstQty) { toast.error("يرجى إدخال الكمية"); return; }
    setSavingCst(true);
    try {
      const movNum = `TRF-CST-${Date.now()}`;
      await addMovement({
        movementNumber: movNum,
        movementType: "Transfer",
        movementDate: new Date().toISOString().split("T")[0],
        customerId: cstFromId,
        toCustomerId: cstToId,
        itemId: cstItemId,
        fromWarehouseId: cstWarehouseId || undefined,
        quantity: Number(cstQty),
        notes: cstNotes || undefined,
      });
      toast.success(`تم تأكيد التحويل بين العملاء ${movNum}`);
      setCstFromId(""); setCstToId(""); setCstItemId(""); setCstWarehouseId(""); setCstQty(""); setCstNotes("");
      getAllMovements({ movementType: "Transfer", pageSize: 10 }).then(setRecentTransfers).catch(() => {});
    } catch (err: any) {
      toast.error(err?.message ?? "فشل التحويل");
    } finally {
      setSavingCst(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim} className="bg-orange-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"><ArrowLeftRight className="w-5 h-5" /></div>
          <div>
            <h2 className="font-bold">التحويلات</h2>
            <p className="text-orange-100 text-xs">تحويل الأصناف بين الثلاجات أو العملاء</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={anim}>
        <Tabs defaultValue="warehouses" dir="rtl">
          <TabsList className="bg-orange-50 border border-orange-100">
            <TabsTrigger value="warehouses" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">تحويل بين ثلاجات</TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">تحويل بين عملاء</TabsTrigger>
          </TabsList>

          {/* ── Warehouse Transfer ── */}
          <TabsContent value="warehouses">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* From */}
                  <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm">الثلاجة المصدر</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الثلاجة</Label>
                      <Select value={whFromId} onValueChange={v => { setWhFromId(v); setWhFromChamberId(""); loadChambers(v, setWhFromChambers); }}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة المصدر" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">مربع التبريد</Label>
                      <Select value={whFromChamberId} onValueChange={setWhFromChamberId} disabled={!whFromChambers.length}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر مربع التبريد" /></SelectTrigger>
                        <SelectContent dir="rtl">{whFromChambers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name || c.code}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* To */}
                  <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm">الثلاجة الوجهة</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الثلاجة</Label>
                      <Select value={whToId} onValueChange={v => { setWhToId(v); setWhToChamberId(""); loadChambers(v, setWhToChambers); }}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الثلاجة الوجهة" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">مربع التبريد</Label>
                      <Select value={whToChamberId} onValueChange={setWhToChamberId} disabled={!whToChambers.length}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر مربع التبريد" /></SelectTrigger>
                        <SelectContent dir="rtl">{whToChambers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name || c.code}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف المحوَّل</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">العميل *</Label>
                      <Select value={whCustomerId} onValueChange={setWhCustomerId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="العميل" /></SelectTrigger>
                        <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الصنف *</Label>
                      <Select value={whItemId} onValueChange={setWhItemId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.id}>{i.arName || i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العبوة</Label>
                      <Select value={whPkgId} onValueChange={setWhPkgId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                        <SelectContent dir="rtl">{packages.map(p => <SelectItem key={p.id} value={p.id}>{p.arName || p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الكمية *</Label>
                      <Input type="number" placeholder="0" dir="rtl" value={whQty} onChange={e => setWhQty(e.target.value)} />
                    </div>
                    <div className="col-span-2 md:col-span-4 space-y-1.5">
                      <Label className="text-xs">ملاحظات</Label>
                      <Input placeholder="ملاحظات" dir="rtl" value={whNotes} onChange={e => setWhNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
                <Button onClick={handleWarehouseTransfer} disabled={savingWh} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                  <Save className="w-4 h-4" />{savingWh ? "جاري التأكيد..." : "تأكيد التحويل"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Customer Transfer ── */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm">العميل المصدر</p>
                    <Select value={cstFromId} onValueChange={setCstFromId}>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل المصدر" /></SelectTrigger>
                      <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm">العميل الوجهة</p>
                    <Select value={cstToId} onValueChange={setCstToId}>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل الوجهة" /></SelectTrigger>
                      <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">الصنف *</Label>
                      <Select value={cstItemId} onValueChange={setCstItemId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">{items.map(i => <SelectItem key={i.id} value={i.id}>{i.arName || i.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الثلاجة</Label>
                      <Select value={cstWarehouseId} onValueChange={setCstWarehouseId}>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الثلاجة" /></SelectTrigger>
                        <SelectContent dir="rtl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الكمية *</Label>
                      <Input type="number" placeholder="0" dir="rtl" value={cstQty} onChange={e => setCstQty(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">ملاحظات</Label>
                      <Input placeholder="ملاحظات" dir="rtl" value={cstNotes} onChange={e => setCstNotes(e.target.value)} />
                    </div>
                  </div>
                </div>
                <Button onClick={handleCustomerTransfer} disabled={savingCst} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                  <Save className="w-4 h-4" />{savingCst ? "جاري التأكيد..." : "تأكيد التحويل"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Recent Transfers */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-800">آخر التحويلات</h3>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">رقم التحويل</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">من</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">إلى</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">الكمية</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {recentTransfers.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs">لا توجد تحويلات بعد</td></tr>
                ) : recentTransfers.map((t, i) => (
                  <tr key={t.id} className={i % 2 === 0 ? "bg-white border-b" : "bg-gray-50/30 border-b"}>
                    <td className="px-4 py-3 font-mono text-xs text-orange-600">{t.movementNumber}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.fromWarehouseName || t.customerArName || t.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.toWarehouseName || "—"}</td>
                    <td className="px-4 py-3 text-gray-700">{t.quantity} {t.unit || "طرد"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.movementDate).toLocaleDateString("ar-EG")}</td>
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
