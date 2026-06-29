import { useCallback, useEffect, useState } from "react";
import { useSessionFilter } from "../hooks/useSessionFilter";
import { motion } from "motion/react";
import {
  Plus, Eye, EyeOff, Edit, Shield, List, LayoutGrid, Search, X, Trash2,
  Phone, Mail, DollarSign, CheckCircle2, XCircle, Clock,
  AlertCircle, Banknote, Calendar, TrendingUp, Users, CreditCard, ChevronDown, Info,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { getAllEmployees, addEmployeeRequest, editEmployeeRequest, type BackendEmployee } from "../services/employeeService";
import { getJobTitlesDDL, addJobTitle as apiAddJobTitle, type JobTitleOption } from "../services/jobTitleService";
import {
  getSalaries, addSalary, editSalary, markSalaryPaid, addSalaryBonus, type BackendSalary,
  getDeductions, addDeduction, editDeduction, deleteDeduction, type BackendDeduction,
  getLeaves, addLeave, setLeaveStatus, type BackendLeave,
  getAdvances, addAdvance, editAdvance, type BackendAdvance,
  getAbsences, addAbsence, editAbsence, type BackendAbsence,
} from "../services/hrService";
import { validatePhoneOptional, normalizePhone, PHONE_PLACEHOLDER } from "../utils/phone";

const ROLE_OPTIONS = [
  { code: "Admin",      label: "مدير النظام" },
  { code: "Manager",    label: "مدير" },
  { code: "Warehouse",  label: "عامل ثلاجة" },
  { code: "Accountant", label: "محاسب" },
  { code: "Viewer",     label: "مشاهدة فقط" },
];

type EmployeeMini = { id: string; name: string; salary: number; status: string };

const roleColors: Record<string, string> = {
  "مدير النظام": "bg-red-100 text-red-700 border-red-200",
  "مدير": "bg-purple-100 text-purple-700 border-purple-200",
  "محاسب": "bg-blue-100 text-blue-700 border-blue-200",
  "عامل ثلاجة": "bg-green-100 text-green-700 border-green-200",
  "مشاهدة فقط": "bg-gray-100 text-gray-700 border-gray-200",
};

const permModules = ["الثلاجات", "الأصناف", "العملاء", "الوارد", "المنصرف", "التحويلات", "الجرد", "السندات", "التقارير", "الإعدادات"];
const permActions = ["عرض", "إضافة", "تعديل", "حذف"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardItem = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

/* ──────────────────────────────────────────
   SALARIES TAB
────────────────────────────────────────── */
/* Working days per month used for daily rate calculation */
const WORKING_DAYS = 30;
const DEDUCTION_TYPES = ["غياب", "تأخير", "تأديبي", "خصم تأمين", "أخرى"] as const;

function SalariesTab({ employees }: { employees: EmployeeMini[] }) {
  const [filterMonth, setFilterMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [rows, setRows]             = useState<BackendSalary[]>([]);
  const [deductions, setDeductions] = useState<BackendDeduction[]>([]);
  const [allAdvances, setAllAdvances] = useState<BackendAdvance[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds]     = useState<string[]>([]);
  const [showBulkPay, setShowBulkPay]     = useState(false);
  const [showBulkBonus, setShowBulkBonus] = useState(false);
  const [bonusAmount, setBonusAmount]     = useState("");

  // Edit salary record dialog (bonuses, deductions/insurance, notes)
  const [editRec, setEditRec]   = useState<BackendSalary | null>(null);
  const [editForm, setEditForm] = useState({ bonuses: "", deductions: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);

  // Deductions drawer: show/add/edit/delete deduction records for a salary row
  const [deductRec, setDeductRec]     = useState<BackendSalary | null>(null);   // salary row whose deductions we're managing
  const [editDeductRow, setEditDeductRow] = useState<BackendDeduction | null>(null);
  const [deductForm, setDeductForm]   = useState({ days: "", amount: "", type: "أخرى", reason: "" });
  const [deductSaving, setDeductSaving] = useState(false);

  const [year, month] = filterMonth.split("-").map(Number);

  const loadDeductions = useCallback(async () => {
    try { setDeductions(await getDeductions(year, month)); }
    catch { setDeductions([]); } // silent — endpoint may not exist yet
  }, [year, month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [salRows, advList] = await Promise.all([getSalaries(year, month), getAdvances()]);
      setRows(salRows);
      setAllAdvances(advList.filter(a => a.status !== "مسدد"));
      void loadDeductions();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل تحميل المرتبات"); }
    finally { setLoading(false); }
  }, [year, month, loadDeductions]);

  // Auto-generate missing salary records for active employees each month
  const autoGenerate = useCallback(async (existing: BackendSalary[]) => {
    const active = employees.filter(e => e.status === "active" && e.salary > 0);
    if (!active.length) return;
    const has = new Set(existing.map(r => r.employeeId));
    const missing = active.filter(e => !has.has(e.id));
    if (!missing.length) return;
    setGenerating(true);
    try {
      await Promise.all(missing.map(e =>
        addSalary({ employeeId: e.id, year, month, baseSalary: e.salary })
      ));
      setRows(await getSalaries(year, month));
    } catch { /* silent */ }
    finally { setGenerating(false); }
  }, [employees, year, month]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSalaries(year, month)
      .then(list => {
        if (cancelled) return;
        setRows(list);
        void autoGenerate(list);
        void loadDeductions();
      })
      .catch(err => toast.error(err instanceof Error ? err.message : "فشل تحميل المرتبات"))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, month, autoGenerate, loadDeductions]);

  // Helper: sum of deduction amounts for a given employeeId this month
  const empDeductTotal = (employeeId: string) =>
    deductions.filter(d => d.employeeId === employeeId).reduce((s, d) => s + d.amount, 0);

  const pendingRows    = rows.filter(r => r.status === "معلق");
  const totalPaid      = rows.reduce((s, r) => s + (r.status === "مدفوع" ? r.netSalary : 0), 0);
  const totalPending   = pendingRows.reduce((s, r) => s + r.netSalary, 0);
  const totalDeductAll = deductions.reduce((s, d) => s + d.amount, 0);
  const dailyRate      = (rec: BackendSalary) => rec.baseSalary / WORKING_DAYS;

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => {
    const ids = pendingRows.map(r => r.id);
    setSelectedIds(prev => ids.every(id => prev.includes(id)) ? [] : ids);
  };

  const handleBulkPay = async () => {
    try {
      await Promise.all(selectedIds.map(id => markSalaryPaid(id)));
      toast.success(`تم صرف ${selectedIds.length} راتب بنجاح`);
      setSelectedIds([]); setShowBulkPay(false); await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل صرف المرتبات"); }
  };

  const handleBulkBonus = async () => {
    const amount = Number(bonusAmount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    try {
      await Promise.all(selectedIds.map(id => addSalaryBonus(id, amount)));
      toast.success(`تمت إضافة إكرامية ${amount.toLocaleString()} ج.م`);
      setBonusAmount(""); setSelectedIds([]); setShowBulkBonus(false); await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل إضافة الإكرامية"); }
  };

  // ── Edit salary record (bonuses / deductions-insurance / notes) ──
  const openEdit = (rec: BackendSalary) => {
    setEditRec(rec);
    setEditForm({ bonuses: String(rec.bonuses ?? ""), deductions: String(rec.deductions ?? ""), notes: rec.notes ?? "" });
  };

  const handleSaveEdit = async () => {
    if (!editRec) return;
    setEditSaving(true);
    try {
      await editSalary({
        id: editRec.id, employeeId: editRec.employeeId,
        year: editRec.year, month: editRec.month, baseSalary: editRec.baseSalary,
        bonuses:    Number(editForm.bonuses)    || undefined,
        deductions: Number(editForm.deductions) || undefined,
        notes:      editForm.notes || undefined,
        isActive: true,
      });
      toast.success(`تم تحديث راتب ${editRec.employeeName ?? ""}`);
      setEditRec(null); await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل حفظ التعديلات"); }
    finally { setEditSaving(false); }
  };

  // ── Deductions drawer ──
  const openDeductions = (rec: BackendSalary) => {
    setDeductRec(rec);
    setEditDeductRow(null);
    setDeductForm({ days: "", amount: "", type: "أخرى", reason: "" });
  };

  const openEditDeduct = (d: BackendDeduction) => {
    setEditDeductRow(d);
    setDeductForm({ days: String(d.days ?? ""), amount: String(d.amount), type: d.deductionType, reason: d.reason ?? "" });
  };

  const resetDeductForm = () => {
    setEditDeductRow(null);
    setDeductForm({ days: "", amount: "", type: "أخرى", reason: "" });
  };

  // Computed amount from days
  const computedDeductAmt = deductRec && deductForm.days && Number(deductForm.days) > 0
    ? Math.round(dailyRate(deductRec) * Number(deductForm.days) * 100) / 100
    : null;

  const handleSaveDeduct = async () => {
    if (!deductRec) return;
    const finalAmount = computedDeductAmt ?? Number(deductForm.amount);
    if (!finalAmount || finalAmount <= 0) { toast.error("أدخل عدد الأيام أو المبلغ"); return; }
    setDeductSaving(true);
    try {
      if (editDeductRow) {
        await editDeduction({
          id: editDeductRow.id,
          employeeId: deductRec.employeeId,
          year: deductRec.year, month: deductRec.month,
          days: deductForm.days ? Number(deductForm.days) : undefined,
          amount: finalAmount,
          deductionType: deductForm.type,
          reason: deductForm.reason || undefined,
          isActive: true,
        });
        toast.success("تم تعديل الخصم");
      } else {
        await addDeduction({
          employeeId: deductRec.employeeId,
          year: deductRec.year, month: deductRec.month,
          days: deductForm.days ? Number(deductForm.days) : undefined,
          amount: finalAmount,
          deductionType: deductForm.type,
          reason: deductForm.reason || undefined,
        });
        toast.success("تم إضافة الخصم");
      }
      resetDeductForm();
      await loadDeductions();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل حفظ الخصم"); }
    finally { setDeductSaving(false); }
  };

  const handleDeleteDeduct = async (d: BackendDeduction) => {
    try {
      await deleteDeduction(d.id);
      toast.success("تم حذف الخصم");
      await loadDeductions();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل الحذف"); }
  };

  return (
    <div className="space-y-4">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المدفوع",  value: `${totalPaid.toLocaleString()} ج.م`,      icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50"  },
          { label: "في الانتظار",      value: `${totalPending.toLocaleString()} ج.م`,   icon: Clock,        color: "text-orange-600", bg: "bg-orange-50" },
          { label: "إجمالي الخصومات", value: `${totalDeductAll.toLocaleString()} ج.م`, icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50"    },
          { label: "عدد السجلات",      value: rows.length,                              icon: Users,        color: "text-blue-600",   bg: "bg-blue-50"   },
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
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm">الشهر:</Label>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40 border-gray-200" />
          {generating && <span className="text-xs text-blue-500 animate-pulse">جاري إنشاء سجلات الشهر...</span>}
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowBulkPay(true)} className="bg-green-600 hover:bg-green-700 text-white gap-1">
              <Banknote className="w-4 h-4" />صرف مرتبات ({selectedIds.length})
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowBulkBonus(true)} className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 gap-1">
              <TrendingUp className="w-4 h-4" />إضافة إكرامية ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-3 text-center w-10">
                    <Checkbox checked={pendingRows.length > 0 && pendingRows.every(r => selectedIds.includes(r.id))} onCheckedChange={toggleAll} />
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الموظف</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الشهر</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الأساسي</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">سعر اليوم</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-yellow-600">الإكرامية</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">الاستقطاعات<br/><span className="font-normal text-gray-400 text-[10px]">(تأمين/ضريبة)</span></th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-orange-600 whitespace-nowrap">خصم سلف<br/><span className="font-normal text-gray-400 text-[10px]">(تلقائي)</span></th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-orange-600 whitespace-nowrap">خصم غياب<br/><span className="font-normal text-gray-400 text-[10px]">(تلقائي)</span></th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-red-600 whitespace-nowrap">الخصومات<br/><span className="font-normal text-gray-400 text-[10px]">(تأديبية)</span></th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-green-600">الصافي الفعلي</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">ملاحظات</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={14} className="text-center py-10 text-gray-400">جاري التحميل...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={14} className="text-center py-10 text-gray-400">لا توجد سجلات لهذا الشهر</td></tr>
                ) : rows.map((rec, idx) => (
                  <tr key={rec.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                    <td className="px-3 py-3 text-center">
                      {rec.status === "معلق"
                        ? <Checkbox checked={selectedIds.includes(rec.id)} onCheckedChange={() => toggleSelect(rec.id)} />
                        : <span />}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-800">{rec.employeeName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-gray-600">{rec.year}-{String(rec.month).padStart(2, "0")}</td>
                    <td className="px-4 py-3.5 text-gray-700">{rec.baseSalary.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-blue-600 text-xs">{dailyRate(rec).toFixed(1)} ج.م</td>
                    <td className="px-4 py-3.5 text-yellow-600">{(rec.bonuses ?? 0) > 0 ? `+${(rec.bonuses ?? 0).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3.5 text-gray-500">{(rec.deductions ?? 0) > 0 ? `-${(rec.deductions ?? 0).toLocaleString()} ج.م` : "—"}</td>
                    <td className="px-4 py-3.5">
                      {(() => {
                        const empAdvances = allAdvances.filter(a => a.employeeId === rec.employeeId);
                        const thisMonthAdvances = empAdvances.filter(a =>
                          (a.salaryMonth === month && a.salaryYear === year) ||
                          (!a.salaryMonth && !a.salaryYear)
                        );
                        const deducted = rec.advancesDeducted ?? 0;
                        if (deducted === 0 && empAdvances.length === 0) return <span className="text-gray-300 text-xs">—</span>;
                        return (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="flex items-center gap-1 text-orange-600 font-semibold text-xs hover:text-orange-700 transition-colors">
                                -{deducted.toLocaleString()} ج.م
                                {empAdvances.length > 0 && (
                                  <span className="bg-orange-100 text-orange-700 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                    {empAdvances.length}
                                  </span>
                                )}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent dir="rtl" className="w-72 p-3 space-y-2" align="start">
                              <p className="text-xs font-semibold text-gray-700 border-b pb-2">
                                سلف {rec.employeeName} — {year}/{String(month).padStart(2,"0")}
                              </p>
                              {empAdvances.length === 0 ? (
                                <p className="text-xs text-gray-400">لا توجد سلف نشطة</p>
                              ) : empAdvances.map(a => {
                                const isThisMonth = (a.salaryMonth === month && a.salaryYear === year) || (!a.salaryMonth && !a.salaryYear);
                                return (
                                  <div key={a.id} className={cn("rounded-lg p-2 text-xs space-y-0.5 border", isThisMonth ? "bg-orange-50 border-orange-200" : "bg-gray-50 border-gray-100")}>
                                    <div className="flex justify-between">
                                      <span className="text-gray-500">{a.reason || "سلفة"}</span>
                                      <span className="font-bold text-red-600">{a.amount.toLocaleString()} ج.م</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                      <span>استقطاع شهري: <span className="text-orange-600 font-medium">{a.monthlyDeduction.toLocaleString()} ج.م</span></span>
                                      <span>متبقي: <span className="text-orange-700">{(a.remainingAmount ?? 0).toLocaleString()} ج.م</span></span>
                                    </div>
                                    {a.salaryMonth && a.salaryYear && (
                                      <p className={cn("text-[10px] font-medium", isThisMonth ? "text-orange-500" : "text-gray-400")}>
                                        {isThisMonth ? "✓ مخصصة لهذا الشهر" : `مخصصة لـ ${a.salaryYear}/${String(a.salaryMonth).padStart(2,"0")}`}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                              <div className="border-t pt-1.5 flex justify-between text-xs font-semibold">
                                <span className="text-gray-600">إجمالي الاستقطاع هذا الشهر</span>
                                <span className="text-orange-700">{deducted.toLocaleString()} ج.م</span>
                              </div>
                            </PopoverContent>
                          </Popover>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5 text-orange-600 text-xs font-medium">
                      {(rec.absenceDeductions ?? 0) > 0 ? `-${(rec.absenceDeductions ?? 0).toLocaleString()} ج.م` : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      {(() => {
                        const total = rec.employeeDeductionsTotal ?? empDeductTotal(rec.employeeId);
                        const count = deductions.filter(d => d.employeeId === rec.employeeId).length;
                        return (
                          <button
                            onClick={() => openDeductions(rec)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors",
                              total > 0
                                ? "text-red-600 border-red-200 bg-red-50 hover:bg-red-100 font-semibold"
                                : "text-gray-400 border-gray-200 hover:bg-gray-50"
                            )}
                          >
                            {total > 0 ? `-${total.toLocaleString()} ج.م` : "لا يوجد"}
                            {count > 0 && <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">{count}</span>}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-green-700 font-bold text-sm">
                          {(rec.actualNetSalary ?? rec.netSalary).toLocaleString()} ج.م
                        </span>
                        {(rec.employeeDeductionsTotal ?? 0) > 0 && (
                          <span className="text-[10px] text-gray-400">
                            قبل التأديبي: {rec.netSalary.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                        rec.status === "مدفوع" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      )}>{rec.status}</span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[120px] truncate">{rec.notes || "—"}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openEdit(rec)}
                        className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="text-[10px] font-medium whitespace-nowrap">تعديل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ── Bulk Pay ── */}
      <Dialog open={showBulkPay} onOpenChange={setShowBulkPay}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تأكيد صرف المرتبات</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            هل تريد صرف مرتبات <strong>{selectedIds.length}</strong> موظفين؟
            إجمالي: <strong className="text-green-600">{selectedIds.reduce((s, id) => s + (rows.find(r => r.id === id)?.netSalary ?? 0), 0).toLocaleString()} ج.م</strong>
          </p>
          <DialogFooter className="gap-2">
            <Button onClick={handleBulkPay} className="bg-green-600 hover:bg-green-700 text-white">تأكيد الصرف</Button>
            <Button variant="outline" onClick={() => setShowBulkPay(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Bonus ── */}
      <Dialog open={showBulkBonus} onOpenChange={setShowBulkBonus}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>إضافة إكرامية</DialogTitle></DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>المبلغ لكل موظف (ج.م)</Label>
            <Input type="number" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} dir="rtl" className="border-gray-200" />
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handleBulkBonus} className="bg-yellow-500 hover:bg-yellow-600 text-white">إضافة</Button>
            <Button variant="outline" onClick={() => setShowBulkBonus(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Salary Record Dialog (bonuses / insurance / notes) ── */}
      <Dialog open={!!editRec} onOpenChange={() => setEditRec(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تعديل راتب — {editRec?.employeeName}</DialogTitle></DialogHeader>
          {editRec && (
            <div className="space-y-3 py-1">
              <div className="grid grid-cols-2 gap-2 text-center bg-gray-50 rounded-xl p-3">
                <div><p className="text-[10px] text-gray-400">الراتب الأساسي</p><p className="font-bold text-gray-800">{editRec.baseSalary.toLocaleString()} ج.م</p></div>
                <div><p className="text-[10px] text-gray-400">سعر اليوم</p><p className="font-bold text-blue-600">{dailyRate(editRec).toFixed(1)} ج.م</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-yellow-700">الإكرامية (ج.م)</Label>
                  <Input type="number" dir="rtl" placeholder="0" value={editForm.bonuses}
                    onChange={e => setEditForm(f => ({ ...f, bonuses: e.target.value }))} className="border-yellow-200 bg-yellow-50/30" />
                </div>
                <div className="space-y-1.5">
                  <Label>الاستقطاعات — تأمين/ضريبة</Label>
                  <Input type="number" dir="rtl" placeholder="0" value={editForm.deductions}
                    onChange={e => setEditForm(f => ({ ...f, deductions: e.target.value }))} className="border-gray-200" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Input dir="rtl" placeholder="ملاحظات..." value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} className="border-gray-200" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleSaveEdit} disabled={editSaving} className="bg-[#155dfc] hover:bg-blue-700 text-white">
              {editSaving ? "جاري الحفظ..." : "حفظ"}
            </Button>
            <Button variant="outline" onClick={() => setEditRec(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deductions Manager Dialog ── */}
      <Dialog open={!!deductRec} onOpenChange={() => { setDeductRec(null); resetDeductForm(); }}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>سجلات الخصم — {deductRec?.employeeName}</DialogTitle>
          </DialogHeader>
          {deductRec && (
            <div className="space-y-4 py-1">

              {/* Info */}
              <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-3 text-sm">
                <div><p className="text-[10px] text-gray-400">الراتب الأساسي</p><p className="font-bold">{deductRec.baseSalary.toLocaleString()} ج.م</p></div>
                <div><p className="text-[10px] text-gray-400">سعر اليوم</p><p className="font-bold text-blue-600">{dailyRate(deductRec).toFixed(1)} ج.م</p></div>
                <div><p className="text-[10px] text-gray-400">إجمالي الخصم</p><p className="font-bold text-red-600">{empDeductTotal(deductRec.employeeId).toLocaleString()} ج.م</p></div>
              </div>

              {/* Existing records */}
              {deductions.filter(d => d.employeeId === deductRec.employeeId).length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        {["النوع","الأيام","المبلغ","السبب","إجراء"].map(h => (
                          <th key={h} className="text-right px-3 py-2 font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.filter(d => d.employeeId === deductRec.employeeId).map(d => (
                        <tr key={d.id} className="border-b hover:bg-gray-50/50">
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px]">{d.deductionType}</span>
                          </td>
                          <td className="px-3 py-2 text-gray-600">{d.days ?? "—"}</td>
                          <td className="px-3 py-2 font-semibold text-red-600">-{d.amount.toLocaleString()} ج.م</td>
                          <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{d.reason || "—"}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              <button onClick={() => openEditDeduct(d)} className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteDeduct(d)} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Add / Edit form */}
              <div className={cn("border rounded-xl p-3 space-y-3", editDeductRow ? "border-blue-200 bg-blue-50/20" : "border-dashed border-red-200 bg-red-50/10")}>
                <p className="text-xs font-semibold text-gray-600">
                  {editDeductRow ? `تعديل خصم: ${editDeductRow.deductionType}` : "إضافة خصم جديد"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">نوع الخصم</Label>
                    <Select value={deductForm.type} onValueChange={v => setDeductForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger dir="rtl" className="h-8 text-xs border-gray-200"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        {DEDUCTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">عدد الأيام <span className="text-gray-400">(اختياري)</span></Label>
                    <Input type="number" dir="rtl" min="0" step="0.5" placeholder="0.5"
                      value={deductForm.days}
                      onChange={e => {
                        const days = e.target.value;
                        const amt = deductRec ? String(Math.round(dailyRate(deductRec) * (Number(days) || 0) * 100) / 100) : "";
                        setDeductForm(f => ({ ...f, days, amount: days ? amt : f.amount }));
                      }}
                      className="h-8 text-xs border-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">المبلغ (ج.م) <span className="text-red-500">*</span></Label>
                    <Input type="number" dir="rtl" min="0" placeholder="0"
                      value={deductForm.amount}
                      onChange={e => setDeductForm(f => ({ ...f, amount: e.target.value, days: "" }))}
                      className="h-8 text-xs border-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">السبب</Label>
                    <Input dir="rtl" placeholder="سبب الخصم" value={deductForm.reason}
                      onChange={e => setDeductForm(f => ({ ...f, reason: e.target.value }))}
                      className="h-8 text-xs border-gray-200" />
                  </div>
                </div>
                {computedDeductAmt !== null && computedDeductAmt > 0 && (
                  <div className="flex items-center justify-between bg-red-100 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-red-700">{deductForm.days} يوم × {dailyRate(deductRec).toFixed(1)} ج.م</span>
                    <span className="font-bold text-red-700">{computedDeductAmt.toLocaleString()} ج.م</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveDeduct} disabled={deductSaving}
                    className={cn("flex-1 text-white", editDeductRow ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700")}>
                    {deductSaving ? "..." : editDeductRow ? "حفظ التعديل" : "إضافة الخصم"}
                  </Button>
                  {editDeductRow && (
                    <Button size="sm" variant="outline" onClick={resetDeductForm}>إلغاء</Button>
                  )}
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
/* ──────────────────────────────────────────
   DEDUCTIONS TAB  (الخصومات)
────────────────────────────────────────── */
function DeductionsTab({ employees }: { employees: EmployeeMini[] }) {
  const [filterMonth, setFilterMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [deductions, setDeductions] = useState<BackendDeduction[]>([]);
  const [loading, setLoading]       = useState(false);

  // Add / Edit state
  const [showAdd, setShowAdd]           = useState(false);
  const [editRow, setEditRow]           = useState<BackendDeduction | null>(null);
  const [form, setForm]                 = useState({ employeeId: "", days: "", amount: "", type: "أخرى", reason: "" });
  const [saving, setSaving]             = useState(false);

  const [year, month] = filterMonth.split("-").map(Number);

  const load = useCallback(async () => {
    setLoading(true);
    try { setDeductions(await getDeductions(year, month)); }
    catch { setDeductions([]); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { void load(); }, [load]);

  const dailyRateOf = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.salary / WORKING_DAYS : 0;
  };

  const computedAmt = form.employeeId && form.days && Number(form.days) > 0
    ? Math.round(dailyRateOf(form.employeeId) * Number(form.days) * 100) / 100
    : null;

  const openAdd = () => {
    setEditRow(null);
    setForm({ employeeId: "", days: "", amount: "", type: "أخرى", reason: "" });
    setShowAdd(true);
  };

  const openEdit = (d: BackendDeduction) => {
    setEditRow(d);
    setForm({ employeeId: d.employeeId, days: String(d.days ?? ""), amount: String(d.amount), type: d.deductionType, reason: d.reason ?? "" });
    setShowAdd(true);
  };

  const handleSave = async () => {
    const finalAmt = computedAmt ?? Number(form.amount);
    if (!form.employeeId) { toast.error("اختر الموظف"); return; }
    if (!finalAmt || finalAmt <= 0) { toast.error("أدخل الأيام أو المبلغ"); return; }
    setSaving(true);
    try {
      if (editRow) {
        await editDeduction({ id: editRow.id, employeeId: form.employeeId, year, month, days: form.days ? Number(form.days) : undefined, amount: finalAmt, deductionType: form.type, reason: form.reason || undefined, isActive: true });
        toast.success("تم تعديل الخصم");
      } else {
        await addDeduction({ employeeId: form.employeeId, year, month, days: form.days ? Number(form.days) : undefined, amount: finalAmt, deductionType: form.type, reason: form.reason || undefined });
        toast.success("تم إضافة الخصم");
      }
      setShowAdd(false);
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل الحفظ"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (d: BackendDeduction) => {
    try { await deleteDeduction(d.id); toast.success("تم الحذف"); await load(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "فشل الحذف"); }
  };

  const totalAll = deductions.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm">الشهر:</Label>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40 border-gray-200" />
          {deductions.length > 0 && (
            <span className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 px-2 py-1 rounded-lg">
              إجمالي الخصومات: {totalAll.toLocaleString()} ج.م
            </span>
          )}
        </div>
        <Button size="sm" onClick={openAdd} className="bg-red-600 hover:bg-red-700 text-white gap-1">
          <Plus className="w-3.5 h-3.5" />إضافة خصم
        </Button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {["الموظف","نوع الخصم","الأيام","المبلغ","سعر اليوم","السبب","إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">جاري التحميل...</td></tr>
              ) : deductions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">لا توجد خصومات لهذا الشهر</td></tr>
              ) : deductions.map((d, idx) => (
                <tr key={d.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{d.employeeName ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{d.deductionType}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{d.days ?? "—"}</td>
                  <td className="px-4 py-3.5 font-semibold text-red-600">-{d.amount.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3.5 text-blue-600 text-xs">{dailyRateOf(d.employeeId).toFixed(1)} ج.م</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{d.reason || "—"}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(d)} className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-5 h-5" />
                        <span className="text-[10px] font-medium whitespace-nowrap">تعديل</span>
                      </button>
                      <button onClick={() => handleDelete(d)} className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-5 h-5" />
                        <span className="text-[10px] font-medium whitespace-nowrap">حذف</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={o => { setShowAdd(o); if (!o) setEditRow(null); }}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{editRow ? "تعديل خصم" : "إضافة خصم جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {/* Employee */}
            <div className="space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={form.employeeId} onValueChange={v => setForm(f => ({ ...f, employeeId: v, days: "", amount: "" }))}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Info bar when employee selected */}
            {form.employeeId && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs">
                <span className="text-gray-500">الراتب الأساسي:</span>
                <span className="font-semibold text-gray-800">{(employees.find(e => e.id === form.employeeId)?.salary ?? 0).toLocaleString()} ج.م</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">سعر اليوم:</span>
                <span className="font-semibold text-blue-600">{dailyRateOf(form.employeeId).toFixed(1)} ج.م</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Type */}
              <div className="space-y-1.5">
                <Label>نوع الخصم</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {DEDUCTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Days */}
              <div className="space-y-1.5">
                <Label>عدد الأيام <span className="text-gray-400 text-[11px]">(اختياري)</span></Label>
                <Input type="number" dir="rtl" min="0" step="0.5" placeholder="0.5"
                  value={form.days}
                  onChange={e => {
                    const days = e.target.value;
                    const amt  = form.employeeId
                      ? String(Math.round(dailyRateOf(form.employeeId) * (Number(days) || 0) * 100) / 100)
                      : "";
                    setForm(f => ({ ...f, days, amount: days ? amt : f.amount }));
                  }}
                  className="border-gray-200" />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>المبلغ (ج.م) <span className="text-red-500">*</span></Label>
                <Input type="number" dir="rtl" min="0" placeholder="0"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value, days: "" }))}
                  className="border-gray-200" />
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label>السبب</Label>
                <Input dir="rtl" placeholder="مثال: غياب بدون إذن"
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="border-gray-200" />
              </div>
            </div>

            {/* Live amount preview */}
            {computedAmt !== null && computedAmt > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                <span className="text-sm text-gray-600">
                  {form.days} يوم × {dailyRateOf(form.employeeId).toFixed(1)} ج.م =
                </span>
                <span className="text-lg font-bold text-red-600">{computedAmt.toLocaleString()} ج.م</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white">
              {saving ? "جاري الحفظ..." : editRow ? "حفظ التعديل" : "إضافة الخصم"}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────────────────────────────────────
   LEAVES TAB
────────────────────────────────────────── */
function LeavesTab({ employees }: { employees: EmployeeMini[] }) {
  const [rows, setRows] = useState<BackendLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ employeeId: "", type: "سنوي", startDate: "", endDate: "", reason: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await getLeaves()); }
    catch (err) { toast.error(err instanceof Error ? err.message : "فشل تحميل الإجازات"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / 86400000) + 1);
  };

  const handleAdd = async () => {
    if (!addForm.employeeId || !addForm.startDate || !addForm.endDate) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    try {
      await addLeave({
        employeeId: addForm.employeeId,
        leaveType: addForm.type,
        fromDate: addForm.startDate,
        toDate: addForm.endDate,
        reason: addForm.reason || undefined,
      });
      toast.success("تم تقديم طلب الإجازة");
      setShowAdd(false);
      setAddForm({ employeeId: "", type: "سنوي", startDate: "", endDate: "", reason: "" });
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إضافة الإجازة");
    }
  };

  const handleApprove = async (req: BackendLeave) => {
    try {
      await setLeaveStatus(req.id, "موافق");
      toast.success(`تمت الموافقة على إجازة ${req.employeeName ?? ""}`);
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل الموافقة"); }
  };

  const handleReject = async (req: BackendLeave) => {
    try {
      await setLeaveStatus(req.id, "مرفوض");
      toast.error(`تم رفض إجازة ${req.employeeName ?? ""}`);
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل الرفض"); }
  };

  const statusStyle = (s: string) =>
    s === "موافق" ? "bg-green-100 text-green-700" :
    s === "مرفوض" ? "bg-red-100 text-red-700" :
    "bg-orange-100 text-orange-700";

  const typeColors: Record<string, string> = {
    "سنوي": "bg-blue-100 text-blue-700",
    "مرضي": "bg-red-100 text-red-600",
    "عارض": "bg-yellow-100 text-yellow-700",
    "بدون راتب": "bg-gray-100 text-gray-600",
  };

  const fmt = (d: string) => d ? d.split("T")[0] : "";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(true)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
          <Plus className="w-4 h-4" />طلب إجازة جديد
        </Button>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الموظف</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">النوع</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">من</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">إلى</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">أيام</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">السبب</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">جاري التحميل...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">لا توجد طلبات إجازة</td></tr>
              ) : rows.map((req, idx) => (
                <tr key={req.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{req.employeeName ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", typeColors[req.leaveType] ?? "bg-gray-100 text-gray-600")}>{req.leaveType}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{fmt(req.fromDate)}</td>
                  <td className="px-4 py-3.5 text-gray-600">{fmt(req.toDate)}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-blue-700">{req.daysCount}</td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs max-w-[140px] truncate">{req.reason || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusStyle(req.status))}>{req.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {req.status === "معلق" && (
                      <div className="flex gap-1">
                        <button onClick={() => handleApprove(req)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors" title="موافقة">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleReject(req)} className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors" title="رفض">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>طلب إجازة جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={addForm.employeeId} onValueChange={v => setAddForm({ ...addForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>نوع الإجازة</Label>
              <Select value={addForm.type} onValueChange={v => setAddForm({ ...addForm, type: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  {["سنوي", "مرضي", "عارض", "بدون راتب"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>من تاريخ <span className="text-red-500">*</span></Label>
              <Input type="date" value={addForm.startDate} onChange={e => setAddForm({ ...addForm, startDate: e.target.value })} className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>إلى تاريخ <span className="text-red-500">*</span></Label>
              <Input type="date" value={addForm.endDate} onChange={e => setAddForm({ ...addForm, endDate: e.target.value })} className="border-gray-200" />
            </div>
            {addForm.startDate && addForm.endDate && (
              <div className="col-span-2 bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
                عدد الأيام: <strong>{calcDays(addForm.startDate, addForm.endDate)}</strong>
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label>سبب الإجازة</Label>
              <Textarea dir="rtl" value={addForm.reason} onChange={e => setAddForm({ ...addForm, reason: e.target.value })} rows={2} className="border-gray-200 resize-none" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">تقديم الطلب</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────────────────────────────────────
   ADVANCES & ABSENCES TAB
────────────────────────────────────────── */
function AdvancesTab({ employees }: { employees: EmployeeMini[] }) {
  const [advances, setAdvances]   = useState<BackendAdvance[]>([]);
  const [absences, setAbsences]   = useState<BackendAbsence[]>([]);
  const [loading, setLoading]     = useState(true);

  // Add state
  const [showAddAdv, setShowAddAdv] = useState(false);
  const [showAddAbs, setShowAddAbs] = useState(false);
  const [advForm, setAdvForm] = useState({ employeeId: "", amount: "", reason: "", deductMonths: "1", salaryMonth: "", salaryYear: "" });
  const [absForm, setAbsForm] = useState({ employeeId: "", date: "", type: "غياب", reason: "", deduction: "" });

  // Edit state
  const [editAdv, setEditAdv] = useState<BackendAdvance | null>(null);
  const [editAdvForm, setEditAdvForm] = useState({ employeeId: "", amount: "", reason: "", deductMonths: "1", salaryMonth: "", salaryYear: "" });
  const [editAbs, setEditAbs] = useState<BackendAbsence | null>(null);
  const [editAbsForm, setEditAbsForm] = useState({ employeeId: "", date: "", type: "غياب", reason: "", deduction: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [advList, absList] = await Promise.all([getAdvances(), getAbsences()]);
      setAdvances(advList);
      setAbsences(absList);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تحميل البيانات");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Add handlers ──
  const handleAddAdv = async () => {
    if (!advForm.employeeId || !advForm.amount) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    try {
      await addAdvance({
        employeeId: advForm.employeeId,
        amount: Number(advForm.amount),
        installmentsCount: Number(advForm.deductMonths) || 1,
        reason: advForm.reason || undefined,
        salaryMonth: advForm.salaryMonth ? Number(advForm.salaryMonth) : undefined,
        salaryYear: advForm.salaryYear ? Number(advForm.salaryYear) : undefined,
      });
      toast.success("تم تسجيل السلفة");
      setShowAddAdv(false);
      setAdvForm({ employeeId: "", amount: "", reason: "", deductMonths: "1", salaryMonth: "", salaryYear: "" });
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل إضافة السلفة"); }
  };

  const handleAddAbs = async () => {
    if (!absForm.employeeId || !absForm.date) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    try {
      await addAbsence({ employeeId: absForm.employeeId, absenceDate: absForm.date, absenceType: absForm.type, deductionAmount: Number(absForm.deduction) || 0, notes: absForm.reason || undefined });
      toast.success("تم تسجيل الغياب/التأخير");
      setShowAddAbs(false);
      setAbsForm({ employeeId: "", date: "", type: "غياب", reason: "", deduction: "" });
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل تسجيل الغياب"); }
  };

  // ── Edit openers ──
  const openEditAdv = (adv: BackendAdvance) => {
    setEditAdv(adv);
    setEditAdvForm({
      employeeId: adv.employeeId,
      amount: String(adv.amount),
      reason: adv.reason ?? "",
      deductMonths: String(adv.installmentsCount ?? 1),
      salaryMonth: adv.salaryMonth != null ? String(adv.salaryMonth) : "",
      salaryYear: adv.salaryYear != null ? String(adv.salaryYear) : "",
    });
  };

  const openEditAbs = (abs: BackendAbsence) => {
    setEditAbs(abs);
    setEditAbsForm({
      employeeId: abs.employeeId,
      date: abs.absenceDate ? abs.absenceDate.split("T")[0] : "",
      type: abs.absenceType ?? "غياب",
      reason: abs.notes ?? "",
      deduction: String(abs.deductionAmount ?? ""),
    });
  };

  // ── Edit handlers ──
  const handleEditAdv = async () => {
    if (!editAdv) return;
    if (!editAdvForm.amount) { toast.error("يرجى إدخال المبلغ"); return; }
    try {
      await editAdvance({
        id: editAdv.id,
        employeeId: editAdvForm.employeeId,
        amount: Number(editAdvForm.amount),
        installmentsCount: Number(editAdvForm.deductMonths) || 1,
        reason: editAdvForm.reason || undefined,
        salaryMonth: editAdvForm.salaryMonth ? Number(editAdvForm.salaryMonth) : undefined,
        salaryYear: editAdvForm.salaryYear ? Number(editAdvForm.salaryYear) : undefined,
        isActive: true,
      });
      toast.success("تم تعديل السلفة");
      setEditAdv(null);
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل تعديل السلفة"); }
  };

  const handleEditAbs = async () => {
    if (!editAbs) return;
    if (!editAbsForm.date) { toast.error("يرجى إدخال التاريخ"); return; }
    try {
      await editAbsence({
        id: editAbs.id,
        employeeId: editAbsForm.employeeId,
        absenceDate: editAbsForm.date,
        absenceType: editAbsForm.type,
        deductionAmount: Number(editAbsForm.deduction) || 0,
        notes: editAbsForm.reason || undefined,
        isActive: true,
      });
      toast.success("تم تعديل سجل الغياب");
      setEditAbs(null);
      await load();
    } catch (err) { toast.error(err instanceof Error ? err.message : "فشل تعديل الغياب"); }
  };

  const advStatusStyle = (s?: string | null) =>
    s === "مسدد" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700";

  const fmt = (d: string) => d ? d.split("T")[0] : "";

  return (
    <div className="space-y-6">

      {/* ── السلف ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm">السلف</h3>
          <Button size="sm" onClick={() => setShowAddAdv(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Plus className="w-3.5 h-3.5" />إضافة سلفة
          </Button>
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {["الموظف", "المبلغ", "التاريخ", "السبب", "الاستقطاع الشهري", "شهر المرتب", "المتبقي", "الحالة", "إجراء"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">جاري التحميل...</td></tr>
                ) : advances.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400">لا توجد سلف مسجلة</td></tr>
                ) : advances.map((adv, idx) => (
                  <tr key={adv.id} className={cn("border-b hover:bg-gray-50/50", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                    <td className="px-4 py-3.5 font-medium text-gray-800">{adv.employeeName ?? "—"}</td>
                    <td className="px-4 py-3.5 font-semibold text-red-600">{adv.amount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3.5 text-gray-600">{fmt(adv.advanceDate)}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{adv.reason ?? "—"}</td>
                    <td className="px-4 py-3.5 text-orange-600">{adv.monthlyDeduction.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3.5">
                      {adv.salaryMonth && adv.salaryYear ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          <Calendar className="w-3 h-3" />
                          {adv.salaryYear}/{String(adv.salaryMonth).padStart(2, "0")}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {(adv.remainingAmount ?? 0) > 0
                        ? <span className="text-orange-700">{(adv.remainingAmount ?? 0).toLocaleString()} ج.م</span>
                        : <span className="text-green-600">مسدد</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", advStatusStyle(adv.status))}>{adv.status ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openEditAdv(adv)}
                        className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="text-[10px] font-medium whitespace-nowrap">تعديل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── الغياب والتأخير ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700 text-sm">الغياب والتأخير</h3>
          <Button size="sm" onClick={() => setShowAddAbs(true)} className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
            <Plus className="w-3.5 h-3.5" />تسجيل غياب
          </Button>
        </div>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  {["الموظف", "التاريخ", "النوع", "الاستقطاع", "ملاحظات", "إجراء"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">جاري التحميل...</td></tr>
                ) : absences.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد سجلات غياب</td></tr>
                ) : absences.map((abs, idx) => (
                  <tr key={abs.id} className={cn("border-b hover:bg-gray-50/50", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                    <td className="px-4 py-3.5 font-medium text-gray-800">{abs.employeeName ?? "—"}</td>
                    <td className="px-4 py-3.5 text-gray-600">{fmt(abs.absenceDate)}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs", abs.absenceType === "غياب" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700")}>
                        {abs.absenceType ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-red-600 font-medium">{(abs.deductionAmount ?? 0) > 0 ? `-${(abs.deductionAmount ?? 0).toLocaleString()} ج.م` : "—"}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{abs.notes || "—"}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => openEditAbs(abs)}
                        className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                        <span className="text-[10px] font-medium whitespace-nowrap">تعديل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── Add Advance Dialog ── */}
      <Dialog open={showAddAdv} onOpenChange={setShowAddAdv}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>إضافة سلفة جديدة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={advForm.employeeId} onValueChange={v => setAdvForm({ ...advForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (ج.م) <span className="text-red-500">*</span></Label>
              <Input type="number" dir="rtl" value={advForm.amount} onChange={e => setAdvForm({ ...advForm, amount: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>عدد أشهر الاستقطاع</Label>
              <Input type="number" dir="rtl" value={advForm.deductMonths} onChange={e => setAdvForm({ ...advForm, deductMonths: e.target.value })} min="1" className="border-gray-200" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                تُستقطع من مرتب شهر (اختياري)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={advForm.salaryMonth} onValueChange={v => setAdvForm({ ...advForm, salaryMonth: v })}>
                  <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="الشهر" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {Array.from({length:12},(_,i)=>i+1).map(m=>(
                      <SelectItem key={m} value={String(m)}>{String(m).padStart(2,"0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" dir="rtl" placeholder={String(new Date().getFullYear())}
                  value={advForm.salaryYear} onChange={e => setAdvForm({ ...advForm, salaryYear: e.target.value })}
                  className="border-gray-200" />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>السبب</Label>
              <Input dir="rtl" value={advForm.reason} onChange={e => setAdvForm({ ...advForm, reason: e.target.value })} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleAddAdv} className="bg-blue-600 hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddAdv(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Advance Dialog ── */}
      <Dialog open={!!editAdv} onOpenChange={() => setEditAdv(null)}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تعديل السلفة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>الموظف</Label>
              <Select value={editAdvForm.employeeId} onValueChange={v => setEditAdvForm({ ...editAdvForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>المبلغ (ج.م) <span className="text-red-500">*</span></Label>
              <Input type="number" dir="rtl" value={editAdvForm.amount} onChange={e => setEditAdvForm({ ...editAdvForm, amount: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>عدد أشهر الاستقطاع</Label>
              <Input type="number" dir="rtl" value={editAdvForm.deductMonths} onChange={e => setEditAdvForm({ ...editAdvForm, deductMonths: e.target.value })} min="1" className="border-gray-200" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                تُستقطع من مرتب شهر (اختياري)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={editAdvForm.salaryMonth} onValueChange={v => setEditAdvForm({ ...editAdvForm, salaryMonth: v })}>
                  <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="الشهر" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {Array.from({length:12},(_,i)=>i+1).map(m=>(
                      <SelectItem key={m} value={String(m)}>{String(m).padStart(2,"0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" dir="rtl" placeholder={String(new Date().getFullYear())}
                  value={editAdvForm.salaryYear} onChange={e => setEditAdvForm({ ...editAdvForm, salaryYear: e.target.value })}
                  className="border-gray-200" />
              </div>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>السبب</Label>
              <Input dir="rtl" value={editAdvForm.reason} onChange={e => setEditAdvForm({ ...editAdvForm, reason: e.target.value })} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleEditAdv} className="bg-blue-600 hover:bg-blue-700 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditAdv(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Absence Dialog ── */}
      <Dialog open={showAddAbs} onOpenChange={setShowAddAbs}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تسجيل غياب / تأخير</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={absForm.employeeId} onValueChange={v => setAbsForm({ ...absForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>التاريخ <span className="text-red-500">*</span></Label>
              <Input type="date" value={absForm.date} onChange={e => setAbsForm({ ...absForm, date: e.target.value })} className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={absForm.type} onValueChange={v => setAbsForm({ ...absForm, type: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="غياب">غياب</SelectItem>
                  <SelectItem value="تأخير">تأخير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الاستقطاع (ج.م)</Label>
              <Input type="number" dir="rtl" value={absForm.deduction} onChange={e => setAbsForm({ ...absForm, deduction: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>ملاحظات</Label>
              <Input dir="rtl" value={absForm.reason} onChange={e => setAbsForm({ ...absForm, reason: e.target.value })} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleAddAbs} className="bg-orange-500 hover:bg-orange-600 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddAbs(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Absence Dialog ── */}
      <Dialog open={!!editAbs} onOpenChange={() => setEditAbs(null)}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تعديل سجل الغياب</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الموظف</Label>
              <Select value={editAbsForm.employeeId} onValueChange={v => setEditAbsForm({ ...editAbsForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>التاريخ <span className="text-red-500">*</span></Label>
              <Input type="date" value={editAbsForm.date} onChange={e => setEditAbsForm({ ...editAbsForm, date: e.target.value })} className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <Select value={editAbsForm.type} onValueChange={v => setEditAbsForm({ ...editAbsForm, type: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="غياب">غياب</SelectItem>
                  <SelectItem value="تأخير">تأخير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الاستقطاع (ج.م)</Label>
              <Input type="number" dir="rtl" value={editAbsForm.deduction} onChange={e => setEditAbsForm({ ...editAbsForm, deduction: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>ملاحظات</Label>
              <Input dir="rtl" value={editAbsForm.reason} onChange={e => setEditAbsForm({ ...editAbsForm, reason: e.target.value })} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleEditAbs} className="bg-orange-500 hover:bg-orange-600 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditAbs(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */
type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  jobTitleId: string | null;
  status: "active" | "inactive";
  phone: string;
  email: string;
  salary: number;
  raw: BackendEmployee;
};

function toRow(e: BackendEmployee): EmployeeRow {
  return {
    id: e.id,
    name: (e.arName?.trim() || e.fullName) ?? "",
    role: (e.jobTitleArName?.trim() || e.jobTitleName) ?? "",
    jobTitleId: e.jobTitleId ?? null,
    status: e.employmentStatus?.toLowerCase() === "active" ? "active" : "inactive",
    phone: e.phone ?? "",
    email: e.email ?? "",
    salary: e.baseSalary ?? 0,
    raw: e,
  };
}

export function Employees() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [jobTitles, setJobTitles] = useState<JobTitleOption[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showPerms, setShowPerms] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState<EmployeeRow | null>(null);
  const [viewTarget, setViewTarget] = useState<EmployeeRow | null>(null);
  const [editTarget, setEditTarget] = useState<EmployeeRow | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", arName: "", nationalId: "", jobTitleId: "", phone: "", email: "", salary: "", status: "active" });
  const [search, setSearch] = useSessionFilter("emp_search", "");

  const emptyAddForm = {
    fullName: "", arName: "", nationalId: "", userName: "", email: "", phone: "",
    role: "Warehouse", jobTitleId: "", status: "active", salary: "",
    password: "", confirmPassword: "", isUser: false,
  };
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [showPwd, setShowPwd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  /* ── Inline job-title creation (shared by Add & Edit dialogs) ── */
  const [showNewJobTitle, setShowNewJobTitle]   = useState(false);
  const [newJobTitleName, setNewJobTitleName]   = useState("");
  const [savingJobTitle, setSavingJobTitle]     = useState(false);

  const handleAddJobTitle = async (onSelect: (id: string) => void) => {
    if (!newJobTitleName.trim()) { toast.error("أدخل اسم المسمى الوظيفي"); return; }
    setSavingJobTitle(true);
    try {
      const added = await apiAddJobTitle(newJobTitleName.trim());
      setJobTitles(prev => [...prev, added]);
      onSelect(added.id);
      setNewJobTitleName("");
      setShowNewJobTitle(false);
      toast.success(`تم إضافة المسمى "${added.arName || added.name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة المسمى");
    } finally {
      setSavingJobTitle(false);
    }
  };

  const loadEmployees = useCallback(async () => {
    setLoadingList(true);
    try {
      const { items } = await getAllEmployees(1, 100);
      setEmployees(items.map(toRow));
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل تحميل الموظفين";
      toast.error(message);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadJobTitles = useCallback(async () => {
    try {
      const list = await getJobTitlesDDL();
      setJobTitles(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل تحميل المسميات الوظيفية";
      toast.error(message);
    }
  }, []);

  useEffect(() => { loadEmployees(); loadJobTitles(); }, [loadEmployees, loadJobTitles]);

  const handleAddEmployee = async () => {
    if (!addForm.fullName || !addForm.jobTitleId) {
      toast.error("يرجى تعبئة الحقول الإلزامية");
      return;
    }
    {
      const phoneErr = validatePhoneOptional(addForm.phone);
      if (phoneErr) { toast.error(phoneErr); return; }
    }
    if (addForm.isUser) {
      if (!addForm.userName || !addForm.email || !addForm.password) {
        toast.error("يرجى تعبئة بيانات تسجيل الدخول");
        return;
      }
      if (addForm.password !== addForm.confirmPassword) {
        toast.error("كلمتا المرور غير متطابقتين");
        return;
      }
    }
    setAddLoading(true);
    try {
      await addEmployeeRequest({
        code: `EMP-${Date.now()}`,
        fullName: addForm.fullName,
        arName: addForm.arName || undefined,
        nationalId: addForm.nationalId || undefined,
        phone: addForm.phone ? normalizePhone(addForm.phone) : undefined,
        email: addForm.email || undefined,
        jobTitleId: addForm.jobTitleId,
        baseSalary: addForm.salary ? Number(addForm.salary) : undefined,
        employmentStatus: addForm.status === "active" ? "Active" : "Inactive",
        ...(addForm.isUser ? {
          userName: addForm.userName,
          password: addForm.password,
          roles: [addForm.role],
        } : {}),
      });
      toast.success(`تم إضافة "${addForm.arName || addForm.fullName}" بنجاح`);
      setAddForm(emptyAddForm);
      setShowAdd(false);
      await loadEmployees();
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل إضافة الموظف";
      toast.error(message);
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.role.includes(search) || e.phone.includes(search)
  );
  const pager = usePagination(filtered, 50);

  const openEdit = (emp: EmployeeRow) => {
    setEditTarget(emp);
    setEditForm({
      fullName: emp.raw.fullName ?? "",
      arName: emp.raw.arName ?? "",
      nationalId: emp.raw.nationalId ?? "",
      jobTitleId: emp.jobTitleId ?? "",
      phone: emp.phone,
      email: emp.email,
      salary: String(emp.salary),
      status: emp.status,
    });
    setShowEdit(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (!editForm.fullName || !editForm.jobTitleId) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    {
      const phoneErr = validatePhoneOptional(editForm.phone);
      if (phoneErr) { toast.error(phoneErr); return; }
    }
    setEditLoading(true);
    try {
      const r = editTarget.raw;
      await editEmployeeRequest({
        id: r.id,
        code: r.code,
        fullName: editForm.fullName,
        arName: editForm.arName || null,
        nationalId: editForm.nationalId || null,
        phone: editForm.phone ? normalizePhone(editForm.phone) : null,
        email: editForm.email || null,
        address: r.address ?? null,
        jobTitleId: editForm.jobTitleId,
        department: r.department ?? null,
        hireDate: r.hireDate ?? null,
        terminationDate: r.terminationDate ?? null,
        baseSalary: editForm.salary ? Number(editForm.salary) : null,
        employmentStatus: editForm.status === "active" ? "Active" : "Inactive",
        bankAccountNumber: r.bankAccountNumber ?? null,
        notes: r.notes ?? null,
        userId: r.userId ?? null,
        isActive: r.isActive,
      });
      toast.success(`تم تحديث بيانات "${editForm.arName || editForm.fullName}" بنجاح`);
      setShowEdit(false);
      setEditTarget(null);
      await loadEmployees();
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل تحديث الموظف";
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={cardItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">الموظفون</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loadingList ? "جاري التحميل..." : `${employees.length} موظفين مسجلين`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
            <button onClick={() => setView("grid")} className={cn("p-2 transition-colors", view === "grid" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50")}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView("list")} className={cn("p-2 transition-colors", view === "list" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50")}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" />إضافة موظف
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="بحث بالاسم أو الدور أو الهاتف..."
          className="pr-9 bg-white border-gray-200"
          value={search}
          onChange={e => { setSearch(e.target.value); pager.reset(); }}
          dir="rtl"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <Tabs defaultValue="employees" dir="rtl">
        <TabsList className="bg-gray-100 mb-4">
          <TabsTrigger value="employees">الموظفون</TabsTrigger>
          <TabsTrigger value="salaries">المرتبات</TabsTrigger>
          <TabsTrigger value="deductions">الخصومات</TabsTrigger>
          <TabsTrigger value="leaves">الإجازات</TabsTrigger>
          <TabsTrigger value="advances">السلف والغياب</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          {view === "grid" ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                {pager.paginated.length === 0 ? (
                  <div className="text-center py-12 text-gray-400"><Search className="w-8 h-8 mx-auto mb-2 opacity-30" /><p>لا توجد نتائج</p></div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pager.paginated.map((emp) => (
                      <motion.div key={emp.id} variants={cardItem}>
                        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                          <CardContent className="p-5">
                            <div className="text-center mb-4">
                              <div className="relative inline-block">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-xl font-bold mx-auto">
                                  {emp.name.charAt(0)}
                                </div>
                                <div className={cn("absolute bottom-0 left-0 w-4 h-4 rounded-full border-2 border-white", emp.status === "active" ? "bg-green-500" : "bg-gray-400")} />
                              </div>
                              <h3 className="font-semibold text-gray-800 mt-3 text-sm leading-snug">{emp.name}</h3>
                              <Badge className={cn("text-xs border mt-1", roleColors[emp.role])}>{emp.role}</Badge>
                            </div>
                            <div className="space-y-1.5 text-xs text-gray-500 border-t pt-3">
                              <p>{emp.phone}</p>
                              <p>{emp.email}</p>
                              <p className="text-green-600 font-medium">{emp.salary.toLocaleString()} ج.م</p>
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-4">
                              <button
                                className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                onClick={() => { setViewTarget(emp); setShowView(true); }}
                              >
                                <Eye className="w-3.5 h-3.5" />عرض
                              </button>
                              <button
                                className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                                onClick={() => openEdit(emp)}
                              >
                                <Edit className="w-3.5 h-3.5" />تعديل
                              </button>
                              <button
                                className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                                onClick={() => { setSelected(emp); setShowPerms(true); }}
                              >
                                <Shield className="w-3.5 h-3.5" />الصلاحيات
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
              <Pagination
                page={pager.page} totalPages={pager.totalPages}
                total={pager.total} pageSize={pager.pageSize}
                onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
              />
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الموظف</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الدور</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الهاتف</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الراتب</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pager.paginated.map((emp, idx) => (
                      <tr key={emp.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">{emp.name.charAt(0)}</div>
                            <span className="font-medium text-gray-800">{emp.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5"><Badge className={cn("text-xs border", roleColors[emp.role])}>{emp.role}</Badge></td>
                        <td className="px-4 py-3.5 text-gray-600">{emp.phone}</td>
                        <td className="px-4 py-3.5 text-green-600 font-medium">{emp.salary.toLocaleString()} ج.م</td>
                        <td className="px-4 py-3.5">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs", emp.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                            {emp.status === "active" ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => { setViewTarget(emp); setShowView(true); }}>
                              <Eye className="w-5 h-5" />
                              <span className="text-[10px] font-medium whitespace-nowrap">بيانات الموظف</span>
                            </button>
                            <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => openEdit(emp)}>
                              <Edit className="w-5 h-5" />
                              <span className="text-[10px] font-medium whitespace-nowrap">تعديل</span>
                            </button>
                            <button className="flex flex-col items-center gap-0.5 px-2 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" onClick={() => { setSelected(emp); setShowPerms(true); }}>
                              <Shield className="w-5 h-5" />
                              <span className="text-[10px] font-medium whitespace-nowrap">الصلاحيات</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              <Pagination
                page={pager.page} totalPages={pager.totalPages}
                total={pager.total} pageSize={pager.pageSize}
                onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
              />
            </Card>
          )}
        </TabsContent>

        <TabsContent value="salaries"><SalariesTab employees={employees.map(e => ({ id: e.id, name: e.name, salary: e.salary, status: e.status }))} /></TabsContent>
        <TabsContent value="deductions"><DeductionsTab employees={employees.map(e => ({ id: e.id, name: e.name, salary: e.salary, status: e.status }))} /></TabsContent>
        <TabsContent value="leaves"><LeavesTab employees={employees.map(e => ({ id: e.id, name: e.name, salary: e.salary, status: e.status }))} /></TabsContent>
        <TabsContent value="advances"><AdvancesTab employees={employees.map(e => ({ id: e.id, name: e.name, salary: e.salary, status: e.status }))} /></TabsContent>
      </Tabs>

      {/* View Employee Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent dir="rtl" className="max-w-md bg-white p-0 overflow-hidden">
          {viewTarget && (
            <>
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 px-6 py-8 text-center relative">
                <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
                  {viewTarget.name.charAt(0)}
                </div>
                <h2 className="text-white font-bold text-lg leading-tight">{viewTarget.name}</h2>
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  <Badge className={cn("text-xs border", roleColors[viewTarget.role] ?? "bg-gray-100 text-gray-700")}>{viewTarget.role}</Badge>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", viewTarget.status === "active" ? "bg-green-500/80 text-white" : "bg-gray-400/80 text-white")}>
                    {viewTarget.status === "active" ? "نشط" : "غير نشط"}
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: "الرقم القومي", value: viewTarget.raw.nationalId || "—", icon: CreditCard, mono: true },
                  { label: "رقم الهاتف", value: viewTarget.phone || "—", icon: Phone, mono: false },
                  { label: "البريد الإلكتروني", value: viewTarget.email || "—", icon: Mail, mono: false },
                  { label: "الراتب", value: `${viewTarget.salary.toLocaleString()} ج.م`, icon: DollarSign, mono: false },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5"><row.icon className="w-3.5 h-3.5 text-gray-400" />{row.label}</span>
                    <span className={cn("text-sm font-semibold text-gray-800", row.mono && row.value !== "—" && "font-mono tracking-widest")}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 flex gap-2">
                <Button className="flex-1 bg-[#155dfc] hover:bg-blue-700 text-white gap-1.5" onClick={() => { setShowView(false); openEdit(viewTarget); }}>
                  <Edit className="w-3.5 h-3.5" />تعديل البيانات
                </Button>
                <Button variant="outline" className="flex-1 border-purple-300 text-purple-600 hover:bg-purple-50 gap-1.5" onClick={() => { setShowView(false); setSelected(viewTarget); setShowPerms(true); }}>
                  <Shield className="w-3.5 h-3.5" />الصلاحيات
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={showPerms} onOpenChange={setShowPerms}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader><DialogTitle>صلاحيات الموظف: {selected?.name}</DialogTitle></DialogHeader>
          <div className="py-2">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 rounded">
                    <th className="text-right px-3 py-2 text-xs font-medium text-gray-600">الموديول</th>
                    {permActions.map(a => <th key={a} className="text-center px-3 py-2 text-xs font-medium text-gray-600">{a}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {permModules.map((mod, i) => (
                    <tr key={mod} className={cn("border-b", i % 2 === 0 ? "bg-white" : "bg-gray-50/40")}>
                      <td className="px-3 py-3 font-medium text-gray-700">{mod}</td>
                      {permActions.map(a => (
                        <td key={a} className="px-3 py-3 text-center">
                          <Checkbox defaultChecked={a === "عرض" || (mod !== "الإعدادات" && a === "إضافة")} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end flex-row-reverse">
            <Button onClick={() => { toast.success("تم حفظ الصلاحيات"); setShowPerms(false); }} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ الصلاحيات</Button>
            <Button variant="outline" onClick={() => setShowPerms(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) setAddForm(emptyAddForm); }}>
        <DialogContent dir="rtl" className="max-w-lg bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الاسم الكامل <span className="text-red-500">*</span></Label>
              <Input
                dir="ltr" placeholder="Employee full name"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={addForm.fullName}
                onChange={e => setAddForm({ ...addForm, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>الاسم بالعربية</Label>
              <Input
                dir="rtl" placeholder="الاسم بالعربية"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={addForm.arName}
                onChange={e => setAddForm({ ...addForm, arName: e.target.value })}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">ID</span>
                الرقم القومي
              </Label>
              <Input
                dir="ltr" inputMode="numeric" maxLength={14} placeholder="00000000000000"
                className="border border-[#d1d5dc] bg-[#f9fafb] font-mono tracking-widest"
                value={addForm.nationalId}
                onChange={e => setAddForm({ ...addForm, nationalId: e.target.value.replace(/\D/g, "").slice(0, 14) })}
              />
              {addForm.nationalId && addForm.nationalId.length !== 14 && (
                <p className="text-[11px] text-amber-500">الرقم القومي يجب أن يكون 14 رقماً</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>المسمى الوظيفي <span className="text-red-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => { setShowNewJobTitle(v => !v); setNewJobTitleName(""); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                  title="إضافة مسمى جديد"
                >
                  <Plus className="w-3 h-3" />إضافة
                </button>
              </div>
              <Select value={addForm.jobTitleId} onValueChange={v => setAddForm({ ...addForm, jobTitleId: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر المسمى" /></SelectTrigger>
                <SelectContent dir="rtl">
                  {jobTitles.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.arName || j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showNewJobTitle && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Input
                    dir="rtl" placeholder="اسم المسمى الوظيفي..." autoFocus
                    className="h-8 text-sm border border-blue-300 bg-blue-50/40 flex-1"
                    value={newJobTitleName}
                    onChange={e => setNewJobTitleName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddJobTitle(id => setAddForm(f => ({ ...f, jobTitleId: id }))); if (e.key === "Escape") setShowNewJobTitle(false); }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddJobTitle(id => setAddForm(f => ({ ...f, jobTitleId: id })))}
                    disabled={savingJobTitle}
                    className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs disabled:opacity-50 flex-shrink-0"
                  >
                    {savingJobTitle ? "..." : "حفظ"}
                  </button>
                  <button type="button" onClick={() => setShowNewJobTitle(false)} className="h-8 w-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-md flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>حالة الموظف</Label>
              <Select value={addForm.status} onValueChange={v => setAddForm({ ...addForm, status: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input
                dir="ltr" inputMode="tel" placeholder={PHONE_PLACEHOLDER}
                className={cn("border bg-[#f9fafb]",
                  validatePhoneOptional(addForm.phone) ? "border-red-400 focus-visible:ring-red-300" : "border-[#d1d5dc]")}
                value={addForm.phone}
                onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
              />
              {validatePhoneOptional(addForm.phone) && (
                <p className="text-[11px] text-red-500">{validatePhoneOptional(addForm.phone)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>البريد الإلكتروني{addForm.isUser && <span className="text-red-500"> *</span>}</Label>
              <Input
                dir="ltr" type="email" placeholder="example@coldstorage.eg"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={addForm.email}
                onChange={e => setAddForm({ ...addForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>الراتب (ج.م)</Label>
              <Input
                dir="rtl" type="number" placeholder="0"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={addForm.salary}
                onChange={e => setAddForm({ ...addForm, salary: e.target.value })}
              />
            </div>

            <div className="col-span-2 pt-2 border-t flex items-center gap-2">
              <Checkbox
                id="isUser"
                checked={addForm.isUser}
                onCheckedChange={c => setAddForm({ ...addForm, isUser: Boolean(c) })}
              />
              <Label htmlFor="isUser" className="cursor-pointer">يمكنه تسجيل الدخول للنظام</Label>
            </div>

            {addForm.isUser && (
              <>
                <div className="space-y-1.5">
                  <Label>اسم المستخدم <span className="text-red-500">*</span></Label>
                  <Input
                    dir="ltr" placeholder="username"
                    className="border border-[#d1d5dc] bg-[#f9fafb]"
                    value={addForm.userName}
                    onChange={e => setAddForm({ ...addForm, userName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>الصلاحية <span className="text-red-500">*</span></Label>
                  <Select value={addForm.role} onValueChange={v => setAddForm({ ...addForm, role: v })}>
                    <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر الصلاحية" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>كلمة المرور <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      dir="ltr" type={showPwd ? "text" : "password"}
                      className="border border-[#d1d5dc] bg-[#f9fafb]"
                      value={addForm.password}
                      onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(s => !s)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>تأكيد كلمة المرور <span className="text-red-500">*</span></Label>
                  <Input
                    dir="ltr" type={showPwd ? "text" : "password"}
                    className="border border-[#d1d5dc] bg-[#f9fafb]"
                    value={addForm.confirmPassword}
                    onChange={e => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                  />
                </div>

                <p className="col-span-2 text-xs text-gray-500">
                  يجب أن تحتوي كلمة المرور على حرف كبير أو صغير، رقم، ورمز خاص، وطولها 6 أحرف على الأقل.
                </p>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button
              onClick={handleAddEmployee}
              disabled={addLoading}
              className="bg-[#155dfc] hover:bg-blue-700 text-white"
            >
              {addLoading ? "..." : "حفظ"}
            </Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>تعديل بيانات الموظف</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الاسم الكامل <span className="text-red-500">*</span></Label>
              <Input dir="ltr" placeholder="Employee full name" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الاسم بالعربية</Label>
              <Input dir="rtl" placeholder="اسم الموظف بالعربية" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.arName} onChange={e => setEditForm({ ...editForm, arName: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">ID</span>
                الرقم القومي
              </Label>
              <Input
                dir="ltr" inputMode="numeric" maxLength={14} placeholder="00000000000000"
                className="border border-[#d1d5dc] bg-[#f9fafb] font-mono tracking-widest"
                value={editForm.nationalId}
                onChange={e => setEditForm({ ...editForm, nationalId: e.target.value.replace(/\D/g, "").slice(0, 14) })}
              />
              {editForm.nationalId && editForm.nationalId.length !== 14 && (
                <p className="text-[11px] text-amber-500">الرقم القومي يجب أن يكون 14 رقماً</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>المسمى الوظيفي <span className="text-red-500">*</span></Label>
                <button
                  type="button"
                  onClick={() => { setShowNewJobTitle(v => !v); setNewJobTitleName(""); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
                  title="إضافة مسمى جديد"
                >
                  <Plus className="w-3 h-3" />إضافة
                </button>
              </div>
              <Select value={editForm.jobTitleId} onValueChange={v => setEditForm({ ...editForm, jobTitleId: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر المسمى" /></SelectTrigger>
                <SelectContent dir="rtl">
                  {jobTitles.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.arName || j.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showNewJobTitle && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Input
                    dir="rtl" placeholder="اسم المسمى الوظيفي..." autoFocus
                    className="h-8 text-sm border border-blue-300 bg-blue-50/40 flex-1"
                    value={newJobTitleName}
                    onChange={e => setNewJobTitleName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddJobTitle(id => setEditForm(f => ({ ...f, jobTitleId: id }))); if (e.key === "Escape") setShowNewJobTitle(false); }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddJobTitle(id => setEditForm(f => ({ ...f, jobTitleId: id })))}
                    disabled={savingJobTitle}
                    className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs disabled:opacity-50 flex-shrink-0"
                  >
                    {savingJobTitle ? "..." : "حفظ"}
                  </button>
                  <button type="button" onClick={() => setShowNewJobTitle(false)} className="h-8 w-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-md flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" inputMode="tel" placeholder={PHONE_PLACEHOLDER}
                className={cn("border bg-[#f9fafb]",
                  validatePhoneOptional(editForm.phone) ? "border-red-400 focus-visible:ring-red-300" : "border-[#d1d5dc]")}
                value={editForm.phone}
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              {validatePhoneOptional(editForm.phone) && (
                <p className="text-[11px] text-red-500">{validatePhoneOptional(editForm.phone)}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input dir="rtl" type="email" placeholder="example@coldstorage.eg" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الراتب (ج.م)</Label>
              <Input dir="rtl" type="number" placeholder="0" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>حالة الموظف</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="active"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />نشط</span></SelectItem>
                  <SelectItem value="inactive"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />غير نشط</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEdit} disabled={editLoading} className="bg-[#155dfc] hover:bg-blue-700 text-white">
              {editLoading ? "..." : "حفظ التعديلات"}
            </Button>
            <Button variant="outline" onClick={() => setShowEdit(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
