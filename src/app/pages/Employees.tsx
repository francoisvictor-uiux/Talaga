import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Eye, Edit, Shield, List, LayoutGrid, Search, X,
  Phone, Mail, DollarSign, CheckCircle2, XCircle, Clock,
  AlertCircle, Banknote, Calendar, TrendingUp, Users
} from "lucide-react";
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
import { useDb } from "../context/DbContext";

type Employee = ReturnType<typeof useDb>["employees"][0];
type SalaryRecord = ReturnType<typeof useDb>["salaryRecords"][0];
type LeaveRequest = ReturnType<typeof useDb>["leaveRequests"][0];
type Advance = ReturnType<typeof useDb>["advances"][0];
type AbsenceRecord = ReturnType<typeof useDb>["absenceRecords"][0];

const roleColors: Record<string, string> = {
  "مدير": "bg-purple-100 text-purple-700 border-purple-200",
  "محاسب": "bg-blue-100 text-blue-700 border-blue-200",
  "عامل مخزن": "bg-green-100 text-green-700 border-green-200",
};

const permModules = ["المخازن", "الأصناف", "العملاء", "الوارد", "المنصرف", "التحويلات", "الجرد", "السندات", "التقارير", "الإعدادات"];
const permActions = ["عرض", "إضافة", "تعديل", "حذف"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardItem = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

/* ──────────────────────────────────────────
   SALARIES TAB
────────────────────────────────────────── */
function SalariesTab() {
  const { employees, salaryRecords, addSalaryRecord, updateSalaryRecord } = useDb();
  const [filterMonth, setFilterMonth] = useState("2024-02");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkPay, setShowBulkPay] = useState(false);
  const [showBulkBonus, setShowBulkBonus] = useState(false);
  const [bonusAmount, setBonusAmount] = useState("");
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [addForm, setAddForm] = useState({ employeeId: "", month: "", baseSalary: "", bonus: "0", deductions: "0", notes: "" });

  const monthRecords = salaryRecords.filter(r => r.month === filterMonth);
  const pendingRecords = monthRecords.filter(r => r.status === "معلق");

  const totalPaid = monthRecords.reduce((s, r) => s + (r.status === "مدفوع" ? r.netSalary : 0), 0);
  const totalPending = pendingRecords.reduce((s, r) => s + r.netSalary, 0);

  const getName = (id: number) => employees.find(e => e.id === id)?.name ?? `موظف #${id}`;

  const toggleSelect = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    const pendingIds = pendingRecords.map(r => r.id);
    setSelectedIds(prev => pendingIds.every(id => prev.includes(id)) ? [] : pendingIds);
  };

  const handleBulkPay = () => {
    selectedIds.forEach(id => {
      updateSalaryRecord(id, { status: "مدفوع", paidDate: new Date().toISOString().slice(0, 10) });
    });
    toast.success(`تم صرف ${selectedIds.length} راتب بنجاح`);
    setSelectedIds([]);
    setShowBulkPay(false);
  };

  const handleBulkBonus = () => {
    const amount = Number(bonusAmount);
    if (!amount || amount <= 0) { toast.error("أدخل مبلغ صحيح"); return; }
    selectedIds.forEach(id => {
      const rec = salaryRecords.find(r => r.id === id);
      if (rec) updateSalaryRecord(id, { bonus: rec.bonus + amount, netSalary: rec.netSalary + amount });
    });
    toast.success(`تمت إضافة إكرامية ${amount.toLocaleString()} ج.م لـ ${selectedIds.length} موظفين`);
    setBonusAmount("");
    setSelectedIds([]);
    setShowBulkBonus(false);
  };

  const handleAddSalary = () => {
    if (!addForm.employeeId || !addForm.month || !addForm.baseSalary) {
      toast.error("يرجى تعبئة الحقول الإلزامية"); return;
    }
    const base = Number(addForm.baseSalary);
    const bonus = Number(addForm.bonus) || 0;
    const deductions = Number(addForm.deductions) || 0;
    addSalaryRecord({
      employeeId: Number(addForm.employeeId),
      month: addForm.month,
      baseSalary: base,
      bonus,
      deductions,
      netSalary: base + bonus - deductions,
      status: "معلق",
      paidDate: "",
      notes: addForm.notes,
    });
    toast.success("تمت إضافة سجل الراتب");
    setShowAddSalary(false);
    setAddForm({ employeeId: "", month: "", baseSalary: "", bonus: "0", deductions: "0", notes: "" });
  };

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "إجمالي المدفوع", value: `${totalPaid.toLocaleString()} ج.م`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "في الانتظار", value: `${totalPending.toLocaleString()} ج.م`, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "عدد السجلات", value: monthRecords.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "معلق", value: pendingRecords.length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm">الشهر:</Label>
          <Input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-40 border-gray-200" />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <Button size="sm" onClick={() => setShowBulkPay(true)} className="bg-green-600 hover:bg-green-700 text-white gap-1">
                <Banknote className="w-4 h-4" />صرف مرتبات ({selectedIds.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowBulkBonus(true)} className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 gap-1">
                <TrendingUp className="w-4 h-4" />إضافة إكرامية ({selectedIds.length})
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => setShowAddSalary(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
            <Plus className="w-4 h-4" />إضافة راتب
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-3 text-center w-10">
                  <Checkbox
                    checked={pendingRecords.length > 0 && pendingRecords.every(r => selectedIds.includes(r.id))}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الموظف</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الشهر</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الأساسي</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الإكرامية</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الاستقطاع</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الصافي</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">لا توجد سجلات لهذا الشهر</td></tr>
              ) : monthRecords.map((rec, idx) => (
                <tr key={rec.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                  <td className="px-3 py-3 text-center">
                    {rec.status === "معلق" ? (
                      <Checkbox checked={selectedIds.includes(rec.id)} onCheckedChange={() => toggleSelect(rec.id)} />
                    ) : <span />}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{getName(rec.employeeId)}</td>
                  <td className="px-4 py-3.5 text-gray-600">{rec.month}</td>
                  <td className="px-4 py-3.5 text-gray-700">{rec.baseSalary.toLocaleString()}</td>
                  <td className="px-4 py-3.5 text-yellow-600">{rec.bonus > 0 ? `+${rec.bonus.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3.5 text-red-500">{rec.deductions > 0 ? `-${rec.deductions.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-3.5 text-green-700 font-semibold">{rec.netSalary.toLocaleString()} ج.م</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      rec.status === "مدفوع" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>{rec.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 text-xs">{rec.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Bulk Pay Confirm */}
      <Dialog open={showBulkPay} onOpenChange={setShowBulkPay}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تأكيد صرف المرتبات</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            هل تريد صرف مرتبات <strong>{selectedIds.length}</strong> موظفين؟
            إجمالي: <strong className="text-green-600">{selectedIds.reduce((s, id) => s + (salaryRecords.find(r => r.id === id)?.netSalary ?? 0), 0).toLocaleString()} ج.م</strong>
          </p>
          <DialogFooter className="gap-2">
            <Button onClick={handleBulkPay} className="bg-green-600 hover:bg-green-700 text-white">تأكيد الصرف</Button>
            <Button variant="outline" onClick={() => setShowBulkPay(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Bonus */}
      <Dialog open={showBulkBonus} onOpenChange={setShowBulkBonus}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>إضافة إكرامية جماعية</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500">سيتم إضافة الإكرامية لـ {selectedIds.length} موظفين</p>
            <div className="space-y-1.5">
              <Label>مبلغ الإكرامية (ج.م)</Label>
              <Input type="number" dir="rtl" value={bonusAmount} onChange={e => setBonusAmount(e.target.value)} placeholder="0" className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handleBulkBonus} className="bg-yellow-500 hover:bg-yellow-600 text-white">إضافة الإكرامية</Button>
            <Button variant="outline" onClick={() => setShowBulkBonus(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Salary */}
      <Dialog open={showAddSalary} onOpenChange={setShowAddSalary}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>إضافة سجل راتب</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={addForm.employeeId} onValueChange={v => setAddForm({ ...addForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>الشهر <span className="text-red-500">*</span></Label>
              <Input type="month" value={addForm.month} onChange={e => setAddForm({ ...addForm, month: e.target.value })} className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>الراتب الأساسي <span className="text-red-500">*</span></Label>
              <Input type="number" dir="rtl" value={addForm.baseSalary} onChange={e => setAddForm({ ...addForm, baseSalary: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>الإكرامية</Label>
              <Input type="number" dir="rtl" value={addForm.bonus} onChange={e => setAddForm({ ...addForm, bonus: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>الاستقطاعات</Label>
              <Input type="number" dir="rtl" value={addForm.deductions} onChange={e => setAddForm({ ...addForm, deductions: e.target.value })} placeholder="0" className="border-gray-200" />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input dir="rtl" value={addForm.notes} onChange={e => setAddForm({ ...addForm, notes: e.target.value })} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleAddSalary} className="bg-blue-600 hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddSalary(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────────────────────────────────────
   LEAVES TAB
────────────────────────────────────────── */
function LeavesTab() {
  const { employees, leaveRequests, addLeaveRequest, updateLeaveRequest } = useDb();
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ employeeId: "", type: "سنوي", startDate: "", endDate: "", reason: "" });

  const getName = (id: number) => employees.find(e => e.id === id)?.name ?? `موظف #${id}`;

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(diff / 86400000) + 1);
  };

  const handleAdd = () => {
    if (!addForm.employeeId || !addForm.startDate || !addForm.endDate) {
      toast.error("يرجى تعبئة الحقول الإلزامية"); return;
    }
    addLeaveRequest({
      employeeId: Number(addForm.employeeId),
      type: addForm.type,
      startDate: addForm.startDate,
      endDate: addForm.endDate,
      days: calcDays(addForm.startDate, addForm.endDate),
      status: "معلق",
      reason: addForm.reason,
      approvedBy: "",
    });
    toast.success("تم تقديم طلب الإجازة");
    setShowAdd(false);
    setAddForm({ employeeId: "", type: "سنوي", startDate: "", endDate: "", reason: "" });
  };

  const handleApprove = (req: LeaveRequest) => {
    updateLeaveRequest(req.id, { status: "موافق", approvedBy: "الإدارة" });
    toast.success(`تمت الموافقة على إجازة ${getName(req.employeeId)}`);
  };

  const handleReject = (req: LeaveRequest) => {
    updateLeaveRequest(req.id, { status: "مرفوض", approvedBy: "الإدارة" });
    toast.error(`تم رفض إجازة ${getName(req.employeeId)}`);
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
              {leaveRequests.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">لا توجد طلبات إجازة</td></tr>
              ) : leaveRequests.map((req, idx) => (
                <tr key={req.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{getName(req.employeeId)}</td>
                  <td className="px-4 py-3.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", typeColors[req.type] ?? "bg-gray-100 text-gray-600")}>{req.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{req.startDate}</td>
                  <td className="px-4 py-3.5 text-gray-600">{req.endDate}</td>
                  <td className="px-4 py-3.5 text-center font-semibold text-blue-700">{req.days}</td>
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
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
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
function AdvancesTab() {
  const { employees, advances, absenceRecords, addAdvance, updateAdvance, addAbsenceRecord } = useDb();
  const [showAddAdv, setShowAddAdv] = useState(false);
  const [showAddAbs, setShowAddAbs] = useState(false);
  const [advForm, setAdvForm] = useState({ employeeId: "", amount: "", reason: "", deductMonths: "1" });
  const [absForm, setAbsForm] = useState({ employeeId: "", date: "", type: "غياب", reason: "", deduction: "" });

  const getName = (id: number) => employees.find(e => e.id === id)?.name ?? `موظف #${id}`;

  const handleAddAdv = () => {
    if (!advForm.employeeId || !advForm.amount) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    const amt = Number(advForm.amount);
    const months = Number(advForm.deductMonths) || 1;
    addAdvance({
      employeeId: Number(advForm.employeeId),
      amount: amt,
      date: new Date().toISOString().slice(0, 10),
      reason: advForm.reason,
      deductMonths: months,
      monthlyDeduction: Math.ceil(amt / months),
      remainingAmount: amt,
      status: "نشط",
    });
    toast.success("تم تسجيل السلفة");
    setShowAddAdv(false);
    setAdvForm({ employeeId: "", amount: "", reason: "", deductMonths: "1" });
  };

  const handleAddAbs = () => {
    if (!absForm.employeeId || !absForm.date) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    addAbsenceRecord({
      employeeId: Number(absForm.employeeId),
      date: absForm.date,
      type: absForm.type,
      reason: absForm.reason,
      deduction: Number(absForm.deduction) || 0,
      notes: "",
    });
    toast.success("تم تسجيل الغياب/التأخير");
    setShowAddAbs(false);
    setAbsForm({ employeeId: "", date: "", type: "غياب", reason: "", deduction: "" });
  };

  const advStatusStyle = (s: string) =>
    s === "مسدد" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700";

  return (
    <div className="space-y-6">
      {/* Advances */}
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
                  {["الموظف", "المبلغ", "التاريخ", "السبب", "الاستقطاع الشهري", "المتبقي", "الحالة"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {advances.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">لا توجد سلف مسجلة</td></tr>
                ) : advances.map((adv, idx) => (
                  <tr key={adv.id} className={cn("border-b hover:bg-gray-50/50", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                    <td className="px-4 py-3.5 font-medium text-gray-800">{getName(adv.employeeId)}</td>
                    <td className="px-4 py-3.5 font-semibold text-red-600">{adv.amount.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3.5 text-gray-600">{adv.date}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{adv.reason}</td>
                    <td className="px-4 py-3.5 text-orange-600">{adv.monthlyDeduction.toLocaleString()} ج.م</td>
                    <td className="px-4 py-3.5 font-medium">
                      {adv.remainingAmount > 0
                        ? <span className="text-orange-700">{adv.remainingAmount.toLocaleString()} ج.م</span>
                        : <span className="text-green-600">مسدد</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", advStatusStyle(adv.status))}>{adv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Absences */}
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
                  {["الموظف", "التاريخ", "النوع", "السبب", "الاستقطاع", "ملاحظات"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {absenceRecords.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400">لا توجد سجلات غياب</td></tr>
                ) : absenceRecords.map((abs, idx) => (
                  <tr key={abs.id} className={cn("border-b hover:bg-gray-50/50", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                    <td className="px-4 py-3.5 font-medium text-gray-800">{getName(abs.employeeId)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{abs.date}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs", abs.type === "غياب" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700")}>
                        {abs.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{abs.reason || "—"}</td>
                    <td className="px-4 py-3.5 text-red-600 font-medium">{abs.deduction > 0 ? `-${abs.deduction.toLocaleString()} ج.م` : "—"}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{abs.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Add Advance Dialog */}
      <Dialog open={showAddAdv} onOpenChange={setShowAddAdv}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>إضافة سلفة جديدة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={advForm.employeeId} onValueChange={v => setAdvForm({ ...advForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
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

      {/* Add Absence Dialog */}
      <Dialog open={showAddAbs} onOpenChange={setShowAddAbs}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تسجيل غياب / تأخير</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <Label>الموظف <span className="text-red-500">*</span></Label>
              <Select value={absForm.employeeId} onValueChange={v => setAbsForm({ ...absForm, employeeId: v })}>
                <SelectTrigger dir="rtl" className="border-gray-200"><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                <SelectContent dir="rtl">{employees.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
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
              <Label>السبب</Label>
              <Input dir="rtl" value={absForm.reason} onChange={e => setAbsForm({ ...absForm, reason: e.target.value })} className="border-gray-200" />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button onClick={handleAddAbs} className="bg-orange-500 hover:bg-orange-600 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddAbs(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ──────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────── */
export function Employees() {
  const { employees, updateEmployee } = useDb();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showPerms, setShowPerms] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [viewTarget, setViewTarget] = useState<Employee | null>(null);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", phone: "", email: "", salary: "" });
  const [search, setSearch] = useState("");

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.role.includes(search) || e.phone.includes(search)
  );
  const pager = usePagination(filtered, 12);

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setEditForm({ name: emp.name, role: emp.role, phone: emp.phone, email: emp.email, salary: String(emp.salary) });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editTarget) return;
    if (!editForm.name || !editForm.role) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    updateEmployee(editTarget.id, {
      name: editForm.name, role: editForm.role, phone: editForm.phone,
      email: editForm.email, salary: Number(editForm.salary) || 0,
    });
    toast.success(`تم تحديث بيانات "${editForm.name}" بنجاح`);
    setShowEdit(false);
    setEditTarget(null);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={cardItem} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">الموظفون</h2>
          <p className="text-sm text-gray-500 mt-0.5">{employees.length} موظفين مسجلين</p>
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
                          <div className="flex gap-1">
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => { setViewTarget(emp); setShowView(true); }}><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors" onClick={() => openEdit(emp)}><Edit className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors" onClick={() => { setSelected(emp); setShowPerms(true); }}><Shield className="w-3.5 h-3.5" /></button>
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

        <TabsContent value="salaries"><SalariesTab /></TabsContent>
        <TabsContent value="leaves"><LeavesTab /></TabsContent>
        <TabsContent value="advances"><AdvancesTab /></TabsContent>
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
                  { label: "رقم الهاتف", value: viewTarget.phone || "—", icon: Phone },
                  { label: "البريد الإلكتروني", value: viewTarget.email || "—", icon: Mail },
                  { label: "الراتب", value: `${viewTarget.salary.toLocaleString()} ج.م`, icon: DollarSign },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-xs text-gray-400 flex items-center gap-1.5"><row.icon className="w-3.5 h-3.5 text-gray-400" />{row.label}</span>
                    <span className="text-sm font-semibold text-gray-800">{row.value}</span>
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
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5"><Label>الاسم الكامل <span className="text-red-500">*</span></Label><Input dir="rtl" placeholder="الاسم الكامل للموظف" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5">
              <Label>الدور الوظيفي <span className="text-red-500">*</span></Label>
              <Select>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="مدير">مدير</SelectItem>
                  <SelectItem value="محاسب">محاسب</SelectItem>
                  <SelectItem value="عامل مخزن">عامل مخزن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>حالة الموظف</Label>
              <Select defaultValue="active">
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input dir="rtl" placeholder="01XXXXXXXXX" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><Input dir="rtl" type="email" placeholder="example@coldstorage.eg" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5"><Label>الراتب (ج.م)</Label><Input dir="rtl" type="number" placeholder="0" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={() => { toast.success("تم إضافة الموظف بنجاح"); setShowAdd(false); }} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>تعديل بيانات الموظف</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>الاسم الكامل <span className="text-red-500">*</span></Label>
              <Input dir="rtl" placeholder="الاسم الكامل للموظف" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الدور الوظيفي <span className="text-red-500">*</span></Label>
              <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="مدير">مدير</SelectItem>
                  <SelectItem value="محاسب">محاسب</SelectItem>
                  <SelectItem value="عامل مخزن">عامل مخزن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <Input dir="rtl" placeholder="01XXXXXXXXX" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>البريد الإلكتروني</Label>
              <Input dir="rtl" type="email" placeholder="example@coldstorage.eg" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الراتب (ج.م)</Label>
              <Input dir="rtl" type="number" placeholder="0" className="border border-[#d1d5dc] bg-[#f9fafb]" value={editForm.salary} onChange={e => setEditForm({ ...editForm, salary: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEdit} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setShowEdit(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
