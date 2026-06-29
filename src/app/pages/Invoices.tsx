import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useSessionFilter } from "../hooks/useSessionFilter";
import { motion } from "motion/react";
import {
  FileText, Plus, Search, X, Filter, CheckCircle2,
  Clock, AlertCircle, DollarSign, Eye, RefreshCw, Printer, Zap, MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { PageHeader } from "../components/layout/PageHeader";
import {
  getInvoices, generateMonthlyInvoice, previewMonthlyInvoice, issueInvoice, recordPayment, cancelInvoice,
  type BackendInvoice, type InvoiceStatus, type PreviewMonthlyResult,
} from "../services/invoiceService";
import { getAllCustomers, type BackendCustomer } from "../services/customerService";
import { getAllMovements } from "../services/movementService";

/* ── constants ── */
const BILLING_MONTH_DAYS = 28;

const TYPE_LABELS: Record<string, string> = {
  Opening:     "فاتورة استلام",
  MonthlyRent: "إيجار شهري",
  Outgoing:    "فاتورة صرف",
  Final:       "فاتورة ختامية",
};
const TYPE_COLORS: Record<string, string> = {
  Opening:     "bg-blue-100 text-blue-700",
  MonthlyRent: "bg-violet-100 text-violet-700",
  Outgoing:    "bg-red-100 text-red-700",
  Final:       "bg-gray-100 text-gray-600",
};
const STATUS_COLORS: Record<string, string> = {
  Draft:         "bg-gray-100 text-gray-600",
  Issued:        "bg-orange-100 text-orange-700",
  PartiallyPaid: "bg-yellow-100 text-yellow-700",
  Paid:          "bg-green-100 text-green-700",
  Cancelled:     "bg-red-100 text-red-500",
};
const STATUS_LABELS: Record<string, string> = {
  Draft: "مسودة", Issued: "صادرة", PartiallyPaid: "مدفوعة جزئياً", Paid: "مدفوعة", Cancelled: "ملغاة",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const anim      = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

/* ── helpers ── */
const fmt = (d: string) => d ? d.split("T")[0] : "";

export function Invoices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices]     = useState<BackendInvoice[]>([]);
  const [customers, setCustomers]   = useState<BackendCustomer[]>([]);
  const [loading, setLoading]       = useState(true);

  // Filters — pre-fill from URL ?customer=id, fall back to sessionStorage
  const urlCustomer = searchParams.get("customer");
  const [search, setSearch, resetSearch]               = useSessionFilter("inv_search", "");
  const [filterCustomer, setFilterCustomer, resetCust] = useSessionFilter("inv_customer", urlCustomer ?? "all");
  const [filterStatus, setFilterStatus, resetStatus]   = useSessionFilter<InvoiceStatus | "all">("inv_status", "all");
  const [filterType, setFilterType, resetType]         = useSessionFilter("inv_type", "all");
  const [filterFrom, setFilterFrom, resetFrom]         = useSessionFilter("inv_from", "");
  const [filterTo, setFilterTo, resetTo]               = useSessionFilter("inv_to", "");

  // If URL has ?customer=, apply it immediately (overrides sessionStorage)
  useEffect(() => { if (urlCustomer) setFilterCustomer(urlCustomer); }, [urlCustomer]); // eslint-disable-line

  const hasActiveFilters = search || filterCustomer !== "all" || filterStatus !== "all" || filterType !== "all" || filterFrom || filterTo;
  const resetAllFilters = () => { resetSearch(); resetCust(); resetStatus(); resetType(); resetFrom(); resetTo(); };

  // Monthly invoice generator dialog
  const [showGenMonthly, setShowGenMonthly] = useState(false);
  const [genCustomerId, setGenCustomerId]   = useState("");
  const [genPeriodTo, setGenPeriodTo]       = useState(new Date().toISOString().split("T")[0]);
  const [genNotes, setGenNotes]             = useState("");
  const [generating, setGenerating]         = useState(false);
  const [genStep, setGenStep]               = useState<"input" | "preview">("input");
  const [previewData, setPreviewData]       = useState<PreviewMonthlyResult | null>(null);
  const [previewing, setPreviewing]         = useState(false);

  // Backfill opening invoices
  const [backfilling, setBackfilling] = useState(false);

  // Payment dialog
  const [payTarget, setPayTarget]   = useState<BackendInvoice | null>(null);
  const [payAmount, setPayAmount]   = useState("");
  const [payNotes, setPayNotes]     = useState("");
  const [paying, setPaying]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const args: Record<string, string> = {};
      if (filterCustomer !== "all") args.customerId = filterCustomer;
      if (filterStatus   !== "all") args.status     = filterStatus;
      if (filterFrom)               args.from       = filterFrom;
      if (filterTo)                 args.to         = filterTo;
      const list = await getInvoices(args);
      setInvoices(list);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل الفواتير");
    } finally { setLoading(false); }
  }, [filterCustomer, filterStatus, filterFrom, filterTo]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { getAllCustomers(1, 200).then(l => setCustomers(l.filter(c => c.isActive))).catch(() => {}); }, []);

  const filtered = useMemo(() => {
    if (!search && filterType === "all") return invoices;
    return invoices.filter(inv => {
      if (filterType !== "all" && inv.invoiceType !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        return inv.invoiceNumber.toLowerCase().includes(q)
            || (inv.customerName ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [invoices, search, filterType]);

  // Stats
  const totalIssued   = invoices.filter(i => i.status !== "Cancelled").reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid     = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.totalAmount, 0);
  const outstanding   = invoices.filter(i => ["Issued","PartiallyPaid"].includes(i.status)).reduce((s, i) => s + i.outstandingAmount, 0);
  const pendingCount  = invoices.filter(i => i.status === "Draft").length;

  const resetGenDialog = () => {
    setGenCustomerId(""); setGenPeriodTo(new Date().toISOString().split("T")[0]);
    setGenNotes(""); setGenStep("input"); setPreviewData(null);
  };

  const handlePreviewMonthly = async () => {
    if (!genCustomerId) { toast.error("اختر العميل"); return; }
    setPreviewing(true);
    try {
      const data = await previewMonthlyInvoice(genCustomerId, genPeriodTo || undefined);
      setPreviewData(data);
      setGenStep("preview");
    } catch (err: any) { toast.error(err?.message ?? "فشل حساب الفاتورة"); }
    finally { setPreviewing(false); }
  };

  const handleGenerateMonthly = async () => {
    if (!genCustomerId) { toast.error("اختر العميل"); return; }
    setGenerating(true);
    try {
      await generateMonthlyInvoice(genCustomerId, genPeriodTo || undefined, genNotes || undefined);
      toast.success("تم إنشاء الفاتورة الشهرية بنجاح");
      setShowGenMonthly(false);
      resetGenDialog();
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل إنشاء الفاتورة"); }
    finally { setGenerating(false); }
  };

  const handleBackfillOpeningInvoices = async () => {
    if (!confirm("سيقوم هذا بإنشاء فواتير الاستلام لجميع حركات الوارد التي لا تحتوي على فاتورة. هل تريد المتابعة؟")) return;
    setBackfilling(true);
    try {
      const movements = await getAllMovements({ movementType: "Incoming", pageSize: 1000 });
      let created = 0;
      for (const m of movements) {
        try {
          await generateOpeningInvoice(m.id);
          created++;
        } catch {
          // Already has an invoice or missing pricing — skip silently
        }
      }
      toast.success(created > 0
        ? `تم إنشاء ${created} فاتورة استلام فائتة`
        : "جميع حركات الوارد لديها فواتير بالفعل"
      );
      if (created > 0) await load();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل الحركات");
    } finally {
      setBackfilling(false);
    }
  };

  const handleIssue = async (inv: BackendInvoice) => {
    try {
      await issueInvoice(inv.id);
      toast.success(`تم إصدار الفاتورة ${inv.invoiceNumber}`);
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل الإصدار"); }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    setPaying(true);
    try {
      await recordPayment(payTarget.id, amount, payNotes || undefined);
      toast.success("تم تسجيل الدفع");
      setPayTarget(null); setPayAmount(""); setPayNotes("");
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل تسجيل الدفع"); }
    finally { setPaying(false); }
  };

  const handleCancel = async (inv: BackendInvoice) => {
    if (!confirm(`إلغاء الفاتورة ${inv.invoiceNumber}؟`)) return;
    try {
      await cancelInvoice(inv.id);
      toast.success("تم إلغاء الفاتورة");
      await load();
    } catch (err: any) { toast.error(err?.message ?? "فشل الإلغاء"); }
  };

  const handlePrint = (inv: BackendInvoice) => {
    navigate(`/invoices/${inv.id}?print=1`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5" dir="rtl">

      {/* Header */}
      <motion.div variants={anim}>
        <PageHeader
          icon={FileText}
          title="الفواتير"
          subtitle={`${invoices.length} فاتورة — نظام الإيجار الشهري (الشهر = ${BILLING_MONTH_DAYS} يوم)`}
          color="blue"
          actions={
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => load()} className="gap-1">
                <RefreshCw className="w-3.5 h-3.5" />تحديث
              </Button>
              <Button size="sm" variant="outline" onClick={handleBackfillOpeningInvoices} disabled={backfilling} className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50">
                <Zap className="w-3.5 h-3.5" />{backfilling ? "جاري الإنشاء..." : "فواتير استلام فائتة"}
              </Button>
              <Button onClick={() => setShowGenMonthly(true)} className="text-white gap-1 bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4" />فاتورة شهرية
              </Button>
            </div>
          }
        />
      </motion.div>

      {/* Stats */}
      <motion.div variants={anim} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي الفواتير",  value: `${totalIssued.toLocaleString("ar-EG")} ج.م`,  icon: FileText,     color: "text-blue-600",   bg: "bg-blue-50"   },
          { label: "إجمالي المحصّل",   value: `${totalPaid.toLocaleString("ar-EG")} ج.م`,    icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "مستحقات متبقية",   value: `${outstanding.toLocaleString("ar-EG")} ج.م`,  icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50"    },
          { label: "مسودات",           value: pendingCount,                                    icon: Clock,        color: "text-orange-600", bg: "bg-orange-50" },
        ].map(k => (
          <Card key={k.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", k.bg)}><k.icon className={cn("w-5 h-5", k.color)} /></div>
              <div>
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className={cn("text-lg font-bold", k.color)}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="بحث برقم الفاتورة أو اسم العميل..."
                  className="pr-9 border-gray-200" value={search}
                  onChange={e => setSearch(e.target.value)} dir="rtl" />
                {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <Select value={filterCustomer} onValueChange={v => { setFilterCustomer(v); }}>
                <SelectTrigger dir="rtl" className="w-44 border-gray-200 h-9"><SelectValue placeholder="كل العملاء" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل العملاء</SelectItem>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
                <SelectTrigger dir="rtl" className="w-36 border-gray-200 h-9"><SelectValue placeholder="كل الحالات" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger dir="rtl" className="w-36 border-gray-200 h-9"><SelectValue placeholder="كل الأنواع" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأنواع</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-gray-500 whitespace-nowrap">من:</Label>
                <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border-gray-200 h-9 w-36" />
              </div>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-gray-500 whitespace-nowrap">إلى:</Label>
                <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border-gray-200 h-9 w-36" />
              </div>
              {hasActiveFilters && (
                <button onClick={resetAllFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                  <X className="w-3.5 h-3.5" />إعادة تعيين
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    {["رقم الفاتورة","العميل","النوع","الفترة","الإجمالي","المدفوع","المتبقي","الحالة","إجراء"].map(h => (
                      <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="text-center py-12 text-gray-400">جاري التحميل...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      لا توجد فواتير
                    </td></tr>
                  ) : filtered.map((inv, idx) => (
                    <tr key={inv.id} className={cn("border-b hover:bg-blue-50/20 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/20")}>
                      <td className="px-4 py-3.5">
                        <button onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="font-mono text-xs text-blue-600 hover:underline font-semibold">
                          {inv.invoiceNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800 text-sm">{inv.customerName ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", TYPE_COLORS[inv.invoiceType] ?? "bg-gray-100 text-gray-600")}>
                          {TYPE_LABELS[inv.invoiceType] ?? inv.invoiceType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                        {fmt(inv.periodFrom)} → {fmt(inv.periodTo)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-800">{inv.totalAmount.toLocaleString("ar-EG")} ج.م</td>
                      <td className="px-4 py-3.5 text-green-600 font-medium">{inv.paidAmount > 0 ? `${inv.paidAmount.toLocaleString("ar-EG")} ج.م` : "—"}</td>
                      <td className="px-4 py-3.5">
                        {inv.outstandingAmount > 0
                          ? <span className="text-red-600 font-semibold">{inv.outstandingAmount.toLocaleString("ar-EG")} ج.م</span>
                          : <span className="text-green-600 text-xs">مسدّدة</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-500")}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/invoices/${inv.id}`)}
                            className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                            <span className="text-[10px] font-medium">عرض</span>
                          </button>
                          {inv.status === "Draft" && (
                            <button onClick={() => handleIssue(inv)}
                              className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-medium">إصدار</span>
                            </button>
                          )}
                          {["Issued","PartiallyPaid"].includes(inv.status) && (
                            <button onClick={() => { setPayTarget(inv); setPayAmount(String(inv.outstandingAmount)); }}
                              className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <DollarSign className="w-4 h-4" />
                              <span className="text-[10px] font-medium">دفع</span>
                            </button>
                          )}
                          <button onClick={() => {
                              const STATUS_AR: Record<string, string> = { Draft: "مسودة", Issued: "صادرة", PartiallyPaid: "مدفوعة جزئياً", Paid: "مدفوعة", Cancelled: "ملغاة" };
                              const TYPE_AR: Record<string, string> = { Opening: "فاتورة استلام", MonthlyRent: "إيجار شهري", Outgoing: "فاتورة صرف", Final: "فاتورة ختامية" };
                              const msg = `📄 *${TYPE_AR[inv.invoiceType] ?? inv.invoiceType}*\nرقم: ${inv.invoiceNumber}\nالعميل: ${inv.customerName ?? "—"}\nالإجمالي: ${inv.totalAmount.toLocaleString("ar-EG")} ج.م${inv.outstandingAmount > 0 ? `\nالمتبقي: ${inv.outstandingAmount.toLocaleString("ar-EG")} ج.م` : ""}\nالحالة: ${STATUS_AR[inv.status] ?? inv.status}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                            }}
                            className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-[10px] font-medium">واتساب</span>
                          </button>
                          <button onClick={() => handlePrint(inv)}
                            className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            <Printer className="w-4 h-4" />
                            <span className="text-[10px] font-medium">طباعة</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Generate Monthly Invoice Dialog */}
      <Dialog open={showGenMonthly} onOpenChange={v => { if (!v) resetGenDialog(); setShowGenMonthly(v); }}>
        <DialogContent dir="rtl" className={cn("bg-white transition-all", genStep === "preview" ? "max-w-3xl" : "max-w-md")}>
          <DialogHeader>
            <DialogTitle>
              {genStep === "input" ? "إنشاء فاتورة إيجار شهري" : `معاينة الفاتورة — ${previewData?.customerName ?? ""}`}
            </DialogTitle>
          </DialogHeader>

          {genStep === "input" ? (
            <div className="space-y-4 py-2">
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs text-violet-700">
                احتساب مقدّم للفترة من آخر فاتورة حتى التاريخ المحدد
                (الشهر = {BILLING_MONTH_DAYS} يوم — أي جزء من الشهر يُحتسب شهراً كاملاً)
              </div>
              <div className="space-y-1.5">
                <Label>العميل <span className="text-red-500">*</span></Label>
                <Select value={genCustomerId} onValueChange={setGenCustomerId}>
                  <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>نهاية الفترة</Label>
                <Input type="date" value={genPeriodTo} onChange={e => setGenPeriodTo(e.target.value)} className="border-gray-200" />
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button onClick={handlePreviewMonthly} disabled={previewing} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {previewing ? "جاري الحساب..." : "معاينة الحساب"}
                </Button>
                <Button variant="outline" onClick={() => { resetGenDialog(); setShowGenMonthly(false); }}>إلغاء</Button>
              </DialogFooter>
            </div>
          ) : previewData && (
            <div className="space-y-4 py-2">
              {/* Period badge */}
              <div className="flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5 text-sm">
                <span className="text-violet-700 font-medium">الفترة:</span>
                <span className="font-mono text-violet-800">{previewData.periodFrom.split("T")[0]}</span>
                <span className="text-violet-400">←</span>
                <span className="font-mono text-violet-800">{previewData.periodTo.split("T")[0]}</span>
              </div>

              {/* Preview table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-violet-50 border-b border-violet-100">
                      {["#","الصنف","الماركة","الكمية","الأيام","الأشهر","السعر","الإيجار"].map(h => (
                        <th key={h} className="text-right px-3 py-2 font-medium text-violet-800 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.items.map((item, i) => (
                      <tr key={i} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                        <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{item.itemName}</td>
                        <td className="px-3 py-2 text-violet-600">{item.brandName || "—"}</td>
                        <td className="px-3 py-2 text-gray-700">{item.quantity.toLocaleString("ar-EG")}</td>
                        <td className="px-3 py-2 text-blue-600">{item.daysStored}</td>
                        <td className="px-3 py-2 text-blue-800 font-semibold">
                          {item.billingMethod === "PerDay" ? "—" : Math.ceil(item.daysStored / BILLING_MONTH_DAYS)}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {item.billingMethod === "PerDay"
                            ? (item.pricePerDay > 0 ? `${item.pricePerDay.toFixed(2)} /يوم` : "—")
                            : (item.pricePerMonth > 0 ? `${item.pricePerMonth.toLocaleString("ar-EG")} /شهر` : "—")}
                        </td>
                        <td className="px-3 py-2 font-semibold text-violet-700">{item.rentAmount.toLocaleString("ar-EG")} ج.م</td>
                      </tr>
                    ))}
                    <tr className="bg-violet-50 font-bold border-t-2 border-violet-200">
                      <td colSpan={7} className="px-3 py-2.5 text-violet-800 text-right">الإجمالي</td>
                      <td className="px-3 py-2.5 text-violet-700 text-base">{previewData.subTotal.toLocaleString("ar-EG")} ج.م</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>ملاحظات (اختياري)</Label>
                <Input dir="rtl" value={genNotes} onChange={e => setGenNotes(e.target.value)} className="border-gray-200" placeholder="ملاحظات على الفاتورة" />
              </div>

              <DialogFooter className="gap-2 pt-1">
                <Button onClick={handleGenerateMonthly} disabled={generating} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {generating ? "جاري الإنشاء..." : "إنشاء الفاتورة"}
                </Button>
                <Button variant="outline" onClick={() => setGenStep("input")}>تعديل</Button>
                <Button variant="outline" onClick={() => { resetGenDialog(); setShowGenMonthly(false); }}>إلغاء</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!payTarget} onOpenChange={() => setPayTarget(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تسجيل دفع — {payTarget?.invoiceNumber}</DialogTitle></DialogHeader>
          {payTarget && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-center bg-gray-50 rounded-xl p-3">
                <div><p className="text-[10px] text-gray-400">الإجمالي</p><p className="font-bold text-gray-800">{payTarget.totalAmount.toLocaleString("ar-EG")} ج.م</p></div>
                <div><p className="text-[10px] text-gray-400">المتبقي</p><p className="font-bold text-red-600">{payTarget.outstandingAmount.toLocaleString("ar-EG")} ج.م</p></div>
              </div>
              <div className="space-y-1.5">
                <Label>المبلغ المدفوع (ج.م) <span className="text-red-500">*</span></Label>
                <Input type="number" dir="rtl" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Input dir="rtl" value={payNotes} onChange={e => setPayNotes(e.target.value)} className="border-gray-200" placeholder="وسيلة الدفع، مرجع..." />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button onClick={handlePay} disabled={paying} className="bg-green-600 hover:bg-green-700 text-white">
              {paying ? "جاري التسجيل..." : "تسجيل الدفع"}
            </Button>
            <Button variant="outline" onClick={() => setPayTarget(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
