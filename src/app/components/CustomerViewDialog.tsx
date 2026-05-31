import { useEffect, useState } from "react";
import { Phone, FileText, MapPin, Car, TrendingDown } from "lucide-react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { cn } from "./ui/utils";
import { type BackendCustomer } from "../services/customerService";
import { getCustomerContacts, type BackendCustomerContact } from "../services/customerContactService";
import { getCustomerDrivers, type BackendCustomerDriver } from "../services/customerDriverService";
import { getCustomerPrices, type BackendCustomerPrice } from "../services/customerPricingService";
import { getCustomerNaulages, type BackendCustomerNaulage } from "../services/customerNaulageService";
import { getAllMovements, type BackendMovement } from "../services/movementService";
import { Tag } from "lucide-react";

/* ── avatar gradient (deterministic by first char) ── */
const GRADS = [
  "from-blue-400 to-blue-700", "from-violet-400 to-violet-700",
  "from-emerald-400 to-emerald-700", "from-rose-400 to-rose-600",
  "from-amber-400 to-orange-500", "from-cyan-400 to-cyan-700",
  "from-pink-400 to-pink-700", "from-indigo-400 to-indigo-700",
];
function avatarGrad(name: string) {
  return GRADS[(name.charCodeAt(0) || 0) % GRADS.length];
}

/* ── parse brand/unit from notes §§ encoding ── */
function parseExtraNotes(notes?: string | null) {
  if (!notes?.startsWith("§§")) return { brandName: "", unit: "" };
  try { const d = JSON.parse(notes.slice(2)); return { brandName: d._b ?? "", unit: d._u ?? "" }; }
  catch { return { brandName: "", unit: "" }; }
}

interface Props {
  customer: BackendCustomer | null;
  onClose: () => void;
}

export function CustomerViewDialog({ customer, onClose }: Props) {
  const [contacts, setContacts]   = useState<BackendCustomerContact[]>([]);
  const [drivers, setDrivers]     = useState<BackendCustomerDriver[]>([]);
  const [pricing, setPricing]     = useState<BackendCustomerPrice[]>([]);
  const [naulages, setNaulages]   = useState<BackendCustomerNaulage[]>([]);
  const [movements, setMovements] = useState<BackendMovement[]>([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (!customer) { setContacts([]); setDrivers([]); setPricing([]); setNaulages([]); setMovements([]); return; }
    setLoading(true);
    Promise.all([
      getCustomerContacts(customer.id).catch(() => [] as BackendCustomerContact[]),
      getCustomerDrivers(customer.id).catch(()  => [] as BackendCustomerDriver[]),
      getCustomerPrices(customer.id).catch(()   => [] as BackendCustomerPrice[]),
      getCustomerNaulages(customer.id).catch(() => [] as BackendCustomerNaulage[]),
      getAllMovements({ customerId: customer.id, pageSize: 200 }).catch(() => [] as BackendMovement[]),
    ]).then(([c, d, p, n, m]) => {
      setContacts(c.filter(x => x.isActive));
      setDrivers(d.filter(x => x.isActive));
      setPricing(p.filter(x => x.isActive));
      setNaulages(n.filter(x => x.isActive));
      setMovements(m.filter(x => x.isActive));
    }).finally(() => setLoading(false));
  }, [customer?.id]);

  /* compute statement totals */
  const sorted = [...movements].sort((a, b) => new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime());
  let runningBal = customer?.openingBalance ?? 0;
  let inQty = 0, outQty = 0, totalFees = 0;
  const rows = sorted.map(m => {
    const fee = ((m.naulagePerUnit ?? 0) * (m.quantity ?? 0)) + (m.openingFee ?? 0) + (m.preCoolingFee ?? 0);
    totalFees += fee;
    runningBal -= fee;
    if (m.movementType === "Incoming") inQty += m.quantity ?? 0;
    else if (m.movementType === "Outgoing") outQty += m.quantity ?? 0;
    return { m, fee, balance: runningBal };
  });
  const storedQty = Math.max(0, inQty - outQty);
  const currentBalance = (customer?.openingBalance ?? 0) - totalFees;

  const name = customer?.arName || customer?.name || "";
  const grad = avatarGrad(name);

  const TYPE_MAP: Record<string, { label: string; cls: string }> = {
    Incoming:  { label: "وارد",   cls: "bg-green-100 text-green-700" },
    Outgoing:  { label: "صادر",   cls: "bg-red-100 text-red-700" },
    Transfers: { label: "تحويل",  cls: "bg-orange-100 text-orange-700" },
  };

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden max-h-[92vh] flex flex-col rounded-2xl border border-gray-100 shadow-xl" dir="rtl">
        {customer && (
          <>
            {/* ── Hero header ── */}
            <div className={cn("relative h-28 flex-shrink-0 bg-gradient-to-br", grad)}>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute bottom-0 right-0 left-0 px-6 pb-4 flex items-end gap-4">
                <div className={cn("relative w-16 h-16 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center font-bold text-white text-2xl overflow-hidden bg-gradient-to-br flex-shrink-0", grad)}>
                  <span>{name.charAt(0)}</span>
                </div>
                <div className="pb-1">
                  <h2 className="text-white font-bold text-lg leading-tight drop-shadow">{name}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-mono text-[11px] bg-white/20 text-white px-2 py-0.5 rounded">{customer.code}</span>
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", (customer.currentBalance ?? 0) >= 0 ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white")}>
                      {(customer.currentBalance ?? 0) >= 0 ? "+" : ""}{(customer.currentBalance ?? 0).toLocaleString()} ج.م
                    </span>
                    {customer.customerType && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/80 text-white flex items-center gap-1">
                        <Tag className="w-3 h-3" />{customer.customerType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Quick stats bar ── */}
            <div className="grid grid-cols-3 divide-x divide-x-reverse border-b bg-gray-50/60">
              <div className="px-5 py-3 text-center">
                <p className="text-xs text-gray-400">الأصناف الثلاجةة</p>
                <p className="text-lg font-bold text-gray-800">{storedQty.toLocaleString()} <span className="text-xs font-normal text-gray-500">طرد</span></p>
              </div>
              <div className="px-5 py-3 text-center">
                <p className="text-xs text-gray-400">إجمالي الرسوم</p>
                <p className="text-lg font-bold text-amber-600">{totalFees.toLocaleString()} <span className="text-xs font-normal text-gray-500">ج.م</span></p>
              </div>
              <div className="px-5 py-3 text-center">
                <p className="text-xs text-gray-400">الرصيد الحالي</p>
                <p className={cn("text-lg font-bold", currentBalance >= 0 ? "text-green-600" : "text-red-600")}>{currentBalance.toLocaleString()} <span className="text-xs font-normal text-gray-500">ج.م</span></p>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="p-5 overflow-y-auto flex-1">
              <Tabs defaultValue="basic" dir="rtl">
                <TabsList dir="rtl" className="w-full bg-[#f3f4f6] rounded-xl p-1 h-auto mb-5">
                  {[
                    { value: "basic",     label: "البيانات" },
                    { value: "contacts",  label: "جهات الاتصال" },
                    { value: "naulage",   label: "النولون" },
                    { value: "pricing",   label: "الأسعار" },
                    { value: "drivers",   label: "السائقون" },
                    { value: "statement", label: "كشف الحساب" },
                  ].map(t => (
                    <TabsTrigger key={t.value} value={t.value}
                      className="flex-1 text-xs rounded-xl data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-600">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* ── Basic ── */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-0.5">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />رقم الهاتف</p>
                      <p className="text-sm font-semibold text-gray-800">{customer.mobile || customer.phone || "—"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3.5 space-y-0.5">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" />الرقم الضريبي</p>
                      <p className="text-sm font-semibold font-mono text-gray-800">{customer.taxNumber || "—"}</p>
                    </div>
                    <div className="col-span-2 bg-gray-50 rounded-xl p-3.5 space-y-0.5">
                      <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />العنوان</p>
                      <p className="text-sm font-medium text-gray-800">{customer.address || "—"}</p>
                    </div>
                    {customer.notes && (
                      <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3.5 space-y-0.5">
                        <p className="text-[11px] text-amber-600">ملاحظات</p>
                        <p className="text-sm text-gray-700">{customer.notes}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* ── Contacts ── */}
                <TabsContent value="contacts">
                  <div className="space-y-2">
                    {loading && contacts.length === 0 && <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">جاري التحميل...</p>}
                    {contacts.map(ct => (
                      <div key={ct.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm text-purple-700 font-bold flex-shrink-0">{ct.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{ct.name}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{ct.phone}</span>
                            {ct.role && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{ct.role}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!loading && contacts.length === 0 && <p className="text-sm text-gray-500 text-center py-10 bg-gray-50 rounded-xl">لا توجد جهات اتصال مضافة</p>}
                  </div>
                </TabsContent>

                {/* ── Naulage ── */}
                <TabsContent value="naulage">
                  {loading && naulages.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">جاري التحميل...</p>
                    : naulages.length === 0
                      ? <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">لا توجد نولونات خاصة</p>
                      : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-amber-50">
                              <th className="text-right p-2.5 text-xs text-gray-500">الصنف</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الماركة</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">النولون</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الوحدة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {naulages.map(ci => {
                              const { brandName } = parseExtraNotes(ci.notes);
                              return (
                                <tr key={ci.id} className="border-b hover:bg-gray-50/50">
                                  <td className="p-2.5 font-medium">{ci.itemName}</td>
                                  <td className="p-2.5">{brandName ? <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{brandName}</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                                  <td className="p-2.5"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">{ci.naulage} ج.م</span></td>
                                  <td className="p-2.5 text-xs text-gray-600">/ {ci.naulageUnit || "طرد"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )
                  }
                </TabsContent>

                {/* ── Pricing ── */}
                <TabsContent value="pricing">
                  {loading && pricing.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">جاري التحميل...</p>
                    : pricing.length === 0
                      ? <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">لا توجد أسعار مخصصة</p>
                      : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-emerald-50">
                              <th className="text-right p-2.5 text-xs text-gray-500">الصنف</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الماركة</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">سعر اليوم</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">سعر الشهر</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الوحدة</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pricing.map(p => {
                              const { brandName, unit } = parseExtraNotes(p.notes);
                              return (
                                <tr key={p.id} className="border-b hover:bg-gray-50/50">
                                  <td className="p-2.5 font-medium">{p.itemName}</td>
                                  <td className="p-2.5">{brandName ? <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{brandName}</span> : <span className="text-gray-300 text-xs">—</span>}</td>
                                  <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">{p.pricePerDay} ج.م</span></td>
                                  <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">{p.pricePerMonth} ج.م</span></td>
                                  <td className="p-2.5 text-xs text-gray-600">/ {unit || "طرد"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )
                  }
                </TabsContent>

                {/* ── Drivers ── */}
                <TabsContent value="drivers">
                  <div className="space-y-2">
                    {loading && drivers.length === 0 && <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">جاري التحميل...</p>}
                    {drivers.map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm text-blue-700 font-bold flex-shrink-0">{d.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone || "—"}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Car className="w-3 h-3" />{d.plate}</span>
                            {d.nationalId && <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-mono flex items-center gap-1"><FileText className="w-3 h-3" />{d.nationalId}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {!loading && drivers.length === 0 && <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">لا يوجد سائقون مسجلون</p>}
                  </div>
                </TabsContent>

                {/* ── Statement ── */}
                <TabsContent value="statement">
                  <div className="space-y-3">
                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl p-3 bg-gray-50 border border-gray-200 text-center">
                        <p className="text-xs text-gray-500 mb-1">الرصيد الافتتاحي</p>
                        <p className={cn("text-xl font-bold", (customer.openingBalance ?? 0) >= 0 ? "text-gray-700" : "text-red-600")}>{(customer.openingBalance ?? 0).toLocaleString("ar-EG")} ج.م</p>
                      </div>
                      <div className="rounded-xl p-3 bg-orange-50 border border-orange-100 text-center">
                        <p className="text-xs text-gray-500 mb-1 flex items-center justify-center gap-1"><TrendingDown className="w-3 h-3 text-orange-500" />إجمالي الرسوم</p>
                        <p className="text-xl font-bold text-orange-600">{totalFees.toLocaleString("ar-EG")} ج.م</p>
                      </div>
                      <div className={cn("rounded-xl p-3 border text-center", currentBalance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-200")}>
                        <p className="text-xs text-gray-500 mb-1">الرصيد الحالي</p>
                        <p className={cn("text-xl font-bold", currentBalance >= 0 ? "text-green-600" : "text-red-600")}>{currentBalance.toLocaleString("ar-EG")} ج.م</p>
                      </div>
                    </div>

                    {/* Inventory summary */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                      <p className="text-xs text-gray-500">الأصناف الثلاجةة</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-green-700 font-medium">وارد {inQty.toLocaleString()} طرد</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-red-700 font-medium">منصرف {outQty.toLocaleString()} طرد</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-blue-700 font-bold">{storedQty.toLocaleString()} طرد رصيد</span>
                      </div>
                    </div>

                    {/* Movements table */}
                    {loading ? (
                      <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">جاري التحميل...</p>
                    ) : rows.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">لا توجد حركات لهذا العميل</p>
                    ) : (
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                          <span className="text-xs font-medium text-gray-600">{rows.length} حركة</span>
                        </div>
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-right p-2.5 text-gray-500 whitespace-nowrap">التاريخ</th>
                                <th className="text-right p-2.5 text-gray-500 whitespace-nowrap">رقم الحركة</th>
                                <th className="text-right p-2.5 text-gray-500">النوع</th>
                                <th className="text-right p-2.5 text-gray-500">الصنف</th>
                                <th className="text-right p-2.5 text-gray-500">الكمية</th>
                                <th className="text-right p-2.5 text-orange-600 whitespace-nowrap">الرسوم</th>
                                <th className="text-right p-2.5 text-gray-500 whitespace-nowrap">الرصيد الجاري</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map(({ m, fee, balance }) => {
                                const t = TYPE_MAP[m.movementType] ?? { label: m.movementType, cls: "bg-gray-100 text-gray-600" };
                                return (
                                  <tr key={m.id} className="border-b hover:bg-gray-50/50">
                                    <td className="p-2.5 text-gray-500 whitespace-nowrap">{new Date(m.movementDate).toLocaleDateString("ar-EG")}</td>
                                    <td className="p-2.5 font-mono text-blue-600 whitespace-nowrap">{m.movementNumber}</td>
                                    <td className="p-2.5"><span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", t.cls)}>{t.label}</span></td>
                                    <td className="p-2.5 text-gray-700">{m.itemArName || m.itemName || "—"}</td>
                                    <td className="p-2.5 font-medium">{m.quantity ?? 0} طرد</td>
                                    <td className="p-2.5 text-orange-600 font-medium">{fee > 0 ? `${fee.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                                    <td className={cn("p-2.5 font-semibold whitespace-nowrap", balance >= 0 ? "text-green-600" : "text-red-600")}>{balance.toLocaleString("ar-EG")} ج.م</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
