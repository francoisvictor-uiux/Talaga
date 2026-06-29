import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  ArrowRight, Printer, CheckCircle2, DollarSign, XCircle,
  FileText, Calendar, User, Hash, RefreshCw, MessageCircle, PlusCircle,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import {
  getInvoice, issueInvoice, recordPayment, cancelInvoice, generateOpeningInvoice,
  getInvoices, addManualExpense,
  type BackendInvoice, type InvoiceStatus,
} from "../services/invoiceService";

/* ── palette constants ── */
const TYPE_LABELS: Record<string, string> = {
  Opening: "فاتورة استلام", MonthlyRent: "إيجار شهري", Outgoing: "فاتورة صرف", Final: "فاتورة ختامية",
};
const TYPE_BG: Record<string, string> = {
  Opening: "from-blue-500 to-blue-700", MonthlyRent: "from-violet-500 to-violet-700",
  Outgoing: "from-red-500 to-red-700", Final: "from-gray-500 to-gray-700",
};
const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-600", Issued: "bg-orange-100 text-orange-700",
  PartiallyPaid: "bg-yellow-100 text-yellow-700", Paid: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-500",
};
const STATUS_LABELS: Record<string, string> = {
  Draft: "مسودة", Issued: "صادرة", PartiallyPaid: "مدفوعة جزئياً", Paid: "مدفوعة", Cancelled: "ملغاة",
};
const fmt = (d: string) => d ? d.split("T")[0] : "—";
const fmtExpiry = (d: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("T")[0].split("-");
  return `${parseInt(day)}-${parseInt(m)}-${y}`;
};

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<BackendInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment dialog
  const [showPay, setShowPay]   = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes]   = useState("");
  const [paying, setPaying]       = useState(false);

  // General collection dialog
  const [showGeneralCollect, setShowGeneralCollect] = useState(false);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectNotes, setCollectNotes] = useState("");
  const [collectLoading, setCollectLoading] = useState(false);
  const [customerInvoices, setCustomerInvoices] = useState<BackendInvoice[]>([]);

  const openGeneralCollect = async () => {
    if (!invoice) return;
    setCollectAmount(String(invoice.outstandingAmount));
    setCollectNotes("");
    setCollectLoading(true);
    try {
      const all = await getInvoices({ customerId: invoice.customerId, status: "Issued" });
      const partial = await getInvoices({ customerId: invoice.customerId, status: "PartiallyPaid" });
      const combined = [...all, ...partial].sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate));
      setCustomerInvoices(combined);
    } catch { setCustomerInvoices([]); }
    finally { setCollectLoading(false); }
    setShowGeneralCollect(true);
  };

  const handleGeneralCollect = async () => {
    let remaining = Number(collectAmount);
    if (!remaining || remaining <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    setPaying(true);
    try {
      for (const inv of customerInvoices) {
        if (remaining <= 0) break;
        const toPay = Math.min(remaining, inv.outstandingAmount);
        if (toPay > 0) {
          await recordPayment(inv.id, toPay, collectNotes || undefined);
          remaining -= toPay;
        }
      }
      toast.success("تم التحصيل بنجاح");
      setShowGeneralCollect(false);
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل التحصيل"); }
    finally { setPaying(false); }
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try { setInvoice(await getInvoice(id)); }
    catch (err: any) { toast.error(err?.message ?? "فشل تحميل الفاتورة"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [id]);

  // Auto-print if ?print=1
  useEffect(() => {
    if (searchParams.get("print") === "1" && invoice) {
      setTimeout(() => window.print(), 500);
    }
  }, [invoice, searchParams]);

  const handleIssue = async () => {
    if (!invoice) return;
    try { await issueInvoice(invoice.id); toast.success("تم إصدار الفاتورة"); await load(); }
    catch (err: any) { toast.error(err?.message ?? "فشل الإصدار"); }
  };

  const handlePay = async () => {
    if (!invoice) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    setPaying(true);
    try {
      await recordPayment(invoice.id, amount, payNotes || undefined);
      toast.success("تم تسجيل الدفع");
      setShowPay(false); setPayAmount(""); setPayNotes("");
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل الدفع"); }
    finally { setPaying(false); }
  };

  const handleCancel = async () => {
    if (!invoice || !confirm(`إلغاء الفاتورة ${invoice.invoiceNumber}؟`)) return;
    try { await cancelInvoice(invoice.id); toast.success("تم الإلغاء"); await load(); }
    catch (err: any) { toast.error(err?.message ?? "فشل الإلغاء"); }
  };

  // Manual expense dialog
  const [showManual, setShowManual] = useState(false);
  const [manualDesc, setManualDesc] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [savingManual, setSavingManual] = useState(false);

  const handleAddManualExpense = async () => {
    if (!invoice || !manualDesc.trim()) { toast.error("أدخل وصف المصروف"); return; }
    const amount = Number(manualAmount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    setSavingManual(true);
    try {
      await addManualExpense(invoice.id, manualDesc.trim(), amount);
      toast.success("تم إضافة المصروف بنجاح");
      setShowManual(false); setManualDesc(""); setManualAmount("");
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل إضافة المصروف"); }
    finally { setSavingManual(false); }
  };

  const handleWhatsApp = () => {
    if (!invoice) return;
    const typeAr = TYPE_LABELS[invoice.invoiceType] ?? invoice.invoiceType;
    const statusAr = ({ Draft: "مسودة", Issued: "صادرة", PartiallyPaid: "مدفوعة جزئياً", Paid: "مدفوعة", Cancelled: "ملغاة" } as Record<string, string>)[invoice.status] ?? invoice.status;
    const msg = `📄 *${typeAr}*\n` +
      `رقم الفاتورة: ${invoice.invoiceNumber}\n` +
      `العميل: ${invoice.customerName ?? "—"}\n` +
      `الإجمالي: ${invoice.totalAmount.toLocaleString("ar-EG")} ج.م\n` +
      (invoice.outstandingAmount > 0 ? `المتبقي: ${invoice.outstandingAmount.toLocaleString("ar-EG")} ج.م\n` : "") +
      `الحالة: ${statusAr}\n` +
      `التاريخ: ${fmt(invoice.invoiceDate)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleRenew = async () => {
    if (!invoice) return;
    const movementId = invoice.items.find(i => i.sourceMovementId)?.sourceMovementId;
    if (!movementId) { toast.error("لا يوجد رقم حركة مرتبط بهذه الفاتورة"); return; }
    if (!confirm(`سيتم إلغاء ${invoice.invoiceNumber} وإعادة إنشائها بالبيانات المحدثة. هل تريد المتابعة؟`)) return;
    try {
      await cancelInvoice(invoice.id);
      const renewed = await generateOpeningInvoice(movementId);
      toast.success("تم إلغاء الفاتورة وإعادة إنشائها بنجاح");
      navigate(`/invoices/${renewed.id}`);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إعادة إنشاء الفاتورة");
      await load();
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400" dir="rtl">جاري التحميل...</div>;
  if (!invoice) return <div className="flex flex-col items-center justify-center h-64 gap-3" dir="rtl">
    <FileText className="w-10 h-10 text-gray-300" />
    <p className="text-gray-500">لم يتم العثور على الفاتورة</p>
    <Button onClick={() => navigate("/invoices")} variant="outline" className="gap-2"><ArrowRight className="w-4 h-4" />عودة</Button>
  </div>;

  const bg = TYPE_BG[invoice.invoiceType] ?? "from-gray-500 to-gray-700";
  const activeItems = invoice.items.filter(i => (i as any).isActive !== false);
  const hasPerDay = activeItems.some(i => i.billingMethod === "PerDay");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-4xl mx-auto" dir="rtl">

      {/* Back + Print */}
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate("/invoices")} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
          <ArrowRight className="w-4 h-4" />العودة للفواتير
        </button>
        <div className="flex gap-2">
          {invoice.status === "Draft" && (
            <Button size="sm" onClick={handleIssue} className="bg-violet-600 hover:bg-violet-700 text-white gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />إصدار الفاتورة
            </Button>
          )}
          {["Issued","PartiallyPaid"].includes(invoice.status) && (
            <>
              <Button size="sm" onClick={() => { setShowPay(true); setPayAmount(String(invoice.outstandingAmount)); }} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                <DollarSign className="w-3.5 h-3.5" />تسجيل دفع
              </Button>
              <Button size="sm" onClick={openGeneralCollect} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1">
                <DollarSign className="w-3.5 h-3.5" />تحصيل عام للعميل
              </Button>
            </>
          )}
          {invoice.invoiceType === "Opening" && !["Paid","Cancelled"].includes(invoice.status) && (
            <Button size="sm" variant="outline" onClick={handleRenew} className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1">
              <RefreshCw className="w-3.5 h-3.5" />إلغاء وإعادة إنشاء
            </Button>
          )}
          {!["Paid","Cancelled"].includes(invoice.status) && (
            <Button size="sm" variant="outline" onClick={handleCancel} className="border-red-200 text-red-600 hover:bg-red-50 gap-1">
              <XCircle className="w-3.5 h-3.5" />إلغاء
            </Button>
          )}
          {!["Paid","Cancelled"].includes(invoice.status) && (
            <Button size="sm" variant="outline" onClick={() => setShowManual(true)} className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
              <PlusCircle className="w-3.5 h-3.5" />إضافة مصروف
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleWhatsApp} className="gap-1 border-green-200 text-green-700 hover:bg-green-50">
            <MessageCircle className="w-3.5 h-3.5" />واتساب
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1">
            <Printer className="w-3.5 h-3.5" />طباعة
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <Card className="border-0 shadow-lg overflow-hidden print:shadow-none">

        {/* Hero header */}
        <div className={cn("relative bg-gradient-to-br text-white px-8 py-6", bg)}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 opacity-80" />
                <span className="text-sm opacity-80">{TYPE_LABELS[invoice.invoiceType] ?? invoice.invoiceType}</span>
              </div>
              <h1 className="text-2xl font-bold font-mono tracking-wide">{invoice.invoiceNumber}</h1>
              <p className="text-sm opacity-80 mt-1">{invoice.customerName}</p>
            </div>
            <div className="text-left">
              <p className="text-3xl font-bold">{invoice.totalAmount.toLocaleString("ar-EG")} ج.م</p>
              <span className={cn("inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white")}>
                {STATUS_LABELS[invoice.status] ?? invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse border-b bg-gray-50/60">
          {[
            { icon: Hash,     label: "رقم الفاتورة",  value: invoice.invoiceNumber },
            { icon: User,     label: "العميل",         value: invoice.customerName ?? "—" },
            { icon: Calendar, label: "تاريخ الإصدار",  value: fmt(invoice.invoiceDate) },
            { icon: Calendar, label: "الفترة",          value: `${fmt(invoice.periodFrom)} ← ${fmt(invoice.periodTo)}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="px-5 py-3 text-center">
              <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1"><Icon className="w-3 h-3" />{label}</p>
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        <CardContent className="p-6 space-y-6">

          {/* Line items */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">بنود الفاتورة</h3>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {["الصنف / الماركة","الكمية","الوزن (كجم)",...(hasPerDay ? ["أيام"] : []),"أشهر","السعر","الإيجار",...(invoice.invoiceType !== "Outgoing" ? ["نولون"] : []),"فتح عنبر","إعادة تبريد","أخرى","الإجمالي"].map(h => (
                      <th key={h} className="text-right px-3 py-2.5 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeItems.map((item, i) => (
                    <tr key={item.id} className={cn("border-b hover:bg-gray-50/50", i % 2 === 0 ? "bg-white" : "bg-gray-50/20")}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-gray-800">{item.itemName}</p>
                          {(item as any).isManual && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">يدوي</span>
                          )}
                        </div>
                        {item.brandName && <p className="text-[10px] text-violet-600">{item.brandName}</p>}
                        {item.description && <p className="text-[10px] text-gray-400 mt-0.5">{item.description}</p>}
                        {(item as any).addedByName && <p className="text-[10px] text-amber-500 mt-0.5">بواسطة: {(item as any).addedByName}</p>}
                        {invoice.invoiceType === "Opening" && invoice.periodTo && (
                          <p className="text-[10px] text-amber-600 font-medium mt-0.5">ينتهي في {fmtExpiry(invoice.periodTo)}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{item.quantity.toLocaleString("ar-EG")}</td>
                      <td className="px-3 py-2.5 text-gray-500">{item.weightKg ? item.weightKg.toLocaleString("ar-EG") : "—"}</td>
                      {hasPerDay && <td className="px-3 py-2.5 text-blue-600 font-medium">{item.daysStored > 0 ? item.daysStored : "—"}</td>}
                      <td className="px-3 py-2.5 text-blue-800 font-semibold">
                        {item.billingMethod === "PerDay" ? "—" : (item.daysStored > 0 ? Math.ceil(item.daysStored / 28) : "—")}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {item.billingMethod === "PerDay"
                          ? (item.pricePerDay > 0 ? `${item.pricePerDay.toFixed(2)} /يوم` : "—")
                          : (item.pricePerMonth > 0 ? `${item.pricePerMonth.toLocaleString("ar-EG")} /شهر` : "—")}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-violet-700">{item.rentAmount > 0 ? item.rentAmount.toLocaleString("ar-EG") : "—"}</td>
                      {invoice.invoiceType !== "Outgoing" && <td className="px-3 py-2.5 text-orange-600">{item.naulageAmount > 0 ? item.naulageAmount.toLocaleString("ar-EG") : "—"}</td>}
                      <td className="px-3 py-2.5 text-blue-600">{item.openingFeeAmount > 0 ? item.openingFeeAmount.toLocaleString("ar-EG") : "—"}</td>
                      <td className="px-3 py-2.5 text-cyan-600">{item.preCoolingFeeAmount > 0 ? item.preCoolingFeeAmount.toLocaleString("ar-EG") : "—"}</td>
                      <td className="px-3 py-2.5 text-gray-500">{item.otherFeesAmount > 0 ? item.otherFeesAmount.toLocaleString("ar-EG") : "—"}</td>
                      <td className="px-3 py-2.5 font-bold text-gray-900">{item.lineTotal.toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>المجموع قبل الضريبة</span>
                <span className="font-medium">{invoice.subTotal.toLocaleString("ar-EG")} ج.م</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>ضريبة ({invoice.taxRate}%)</span>
                  <span className="font-medium">{invoice.taxAmount.toLocaleString("ar-EG")} ج.م</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2 text-gray-900">
                <span>الإجمالي</span>
                <span>{invoice.totalAmount.toLocaleString("ar-EG")} ج.م</span>
              </div>
              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>المدفوع</span>
                  <span>- {invoice.paidAmount.toLocaleString("ar-EG")} ج.م</span>
                </div>
              )}
              {invoice.outstandingAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold bg-red-50 rounded-lg px-3 py-2">
                  <span>المتبقي</span>
                  <span>{invoice.outstandingAmount.toLocaleString("ar-EG")} ج.م</span>
                </div>
              )}
              {invoice.outstandingAmount <= 0 && invoice.status === "Paid" && (
                <div className="flex justify-between text-green-600 font-bold bg-green-50 rounded-lg px-3 py-2">
                  <span>الحالة</span>
                  <span>مسدّدة بالكامل ✓</span>
                </div>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-medium mb-1">ملاحظات</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPay} onOpenChange={setShowPay}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تسجيل دفع — {invoice.invoiceNumber}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2 text-center bg-gray-50 rounded-xl p-3">
              <div><p className="text-[10px] text-gray-400">الإجمالي</p><p className="font-bold">{invoice.totalAmount.toLocaleString("ar-EG")} ج.م</p></div>
              <div><p className="text-[10px] text-gray-400">المتبقي</p><p className="font-bold text-red-600">{invoice.outstandingAmount.toLocaleString("ar-EG")} ج.م</p></div>
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (ج.م) <span className="text-red-500">*</span></Label>
              <Input type="number" dir="rtl" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input dir="rtl" value={payNotes} onChange={e => setPayNotes(e.target.value)} className="border-gray-200" placeholder="وسيلة الدفع..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handlePay} disabled={paying} className="bg-green-600 hover:bg-green-700 text-white">
              {paying ? "..." : "تأكيد الدفع"}
            </Button>
            <Button variant="outline" onClick={() => setShowPay(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Expense Dialog */}
      <Dialog open={showManual} onOpenChange={setShowManual}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>إضافة مصروف يدوي</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              سيُميَّز هذا البند بعلامة "يدوي" في الفاتورة مع اسم من أضافه والتاريخ
            </p>
            <div className="space-y-1.5">
              <Label>وصف المصروف <span className="text-red-500">*</span></Label>
              <Input autoFocus dir="rtl" value={manualDesc} onChange={e => setManualDesc(e.target.value)}
                placeholder="مثال: رسوم نقل إضافية" className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (ج.م) <span className="text-red-500">*</span></Label>
              <Input type="number" dir="rtl" value={manualAmount} onChange={e => setManualAmount(e.target.value)} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handleAddManualExpense} disabled={savingManual} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingManual ? "..." : "إضافة"}
            </Button>
            <Button variant="outline" onClick={() => setShowManual(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* General Collection Dialog */}
      <Dialog open={showGeneralCollect} onOpenChange={setShowGeneralCollect}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تحصيل عام — {invoice.customerName}</DialogTitle></DialogHeader>
          {collectLoading ? (
            <p className="text-center text-gray-400 py-4">جاري التحميل...</p>
          ) : (
            <div className="space-y-4 py-2">
              {customerInvoices.length === 0 ? (
                <p className="text-center text-gray-400 py-4">لا توجد فواتير مستحقة لهذا العميل</p>
              ) : (
                <>
                  <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg">
                    {customerInvoices.map((inv, i) => (
                      <div key={inv.id} className={cn("flex justify-between items-center px-3 py-2 text-xs", i % 2 === 0 ? "bg-gray-50" : "bg-white")}>
                        <span className="font-mono text-blue-600">{inv.invoiceNumber}</span>
                        <span className="text-gray-500">{inv.invoiceDate.slice(0, 10)}</span>
                        <span className="font-semibold text-red-600">{inv.outstandingAmount.toLocaleString("ar-EG")} ج.م</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t pt-2">
                    <span>الإجمالي المستحق</span>
                    <span className="text-red-600">{customerInvoices.reduce((s, i) => s + i.outstandingAmount, 0).toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <p className="text-[11px] text-gray-400">سيتم تطبيق المبلغ على الفواتير بالترتيب من الأقدم للأحدث</p>
                  <div className="space-y-1.5">
                    <Label>المبلغ المحصَّل (ج.م) <span className="text-red-500">*</span></Label>
                    <Input type="number" dir="rtl" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} className="border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ملاحظات</Label>
                    <Input dir="rtl" value={collectNotes} onChange={e => setCollectNotes(e.target.value)} placeholder="وسيلة الدفع..." className="border-gray-200" />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {customerInvoices.length > 0 && (
              <Button onClick={handleGeneralCollect} disabled={paying || collectLoading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                {paying ? "..." : "تأكيد التحصيل"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowGeneralCollect(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
