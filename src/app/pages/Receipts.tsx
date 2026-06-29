import { useEffect, useState } from "react";
import { useSessionFilter } from "../hooks/useSessionFilter";
import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Wallet, Printer, Save, Search, X } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { getAllVouchers, addVoucher, type BackendVoucher } from "../services/cashVoucherService";
import { getAllCustomers, type BackendCustomer } from "../services/customerService";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const blankReceipt = () => ({ customerId: "", partyName: "", amount: "", paymentMethod: "نقدي", cashAccount: "", voucherDate: new Date().toISOString().split("T")[0], notes: "" });

export function Receipts() {
  const [vouchers, setVouchers] = useState<BackendVoucher[]>([]);
  const [customers, setCustomers] = useState<BackendCustomer[]>([]);
  const [historySearch, setHistorySearch, resetHistorySearch] = useSessionFilter("rec_search", "");
  const [receiptForm, setReceiptForm] = useState(blankReceipt());
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", cashAccount: "main", voucherDate: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);

  const reload = () => getAllVouchers().then(setVouchers).catch(() => {});

  useEffect(() => {
    void reload();
    getAllCustomers(1, 200).then(l => setCustomers(l.filter(c => c.isActive))).catch(() => {});
  }, []);

  const filtered = vouchers.filter(v =>
    !historySearch || v.voucherNo.includes(historySearch) || v.partyName.includes(historySearch) || v.voucherType.includes(historySearch)
  );
  const pager = usePagination(filtered, 50);

  const handleSaveReceipt = async () => {
    if (!receiptForm.customerId && !receiptForm.partyName) { toast.error("يرجى اختيار العميل"); return; }
    if (!receiptForm.amount || Number(receiptForm.amount) <= 0) { toast.error("يرجى إدخال مبلغ صحيح"); return; }
    const cust = customers.find(c => c.id === receiptForm.customerId);
    setSaving(true);
    try {
      await addVoucher({
        voucherType: "قبض",
        customerId: receiptForm.customerId || undefined,
        partyName: cust ? (cust.arName || cust.name) : receiptForm.partyName,
        partyType: "customer",
        amount: Number(receiptForm.amount),
        paymentMethod: receiptForm.paymentMethod,
        cashAccount: receiptForm.cashAccount || undefined,
        voucherDate: receiptForm.voucherDate,
        notes: receiptForm.notes || undefined,
      });
      toast.success("تم حفظ سند القبض بنجاح");
      setReceiptForm(blankReceipt());
      void reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ السند");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!expenseForm.description) { toast.error("يرجى إدخال البند"); return; }
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) { toast.error("يرجى إدخال مبلغ صحيح"); return; }
    setSaving(true);
    try {
      await addVoucher({
        voucherType: "صرف",
        partyName: expenseForm.description,
        partyType: "expense",
        amount: Number(expenseForm.amount),
        paymentMethod: "نقدي",
        cashAccount: expenseForm.cashAccount,
        voucherDate: expenseForm.voucherDate,
        notes: expenseForm.notes || undefined,
      });
      toast.success("تم حفظ سند الصرف بنجاح");
      setExpenseForm({ description: "", amount: "", cashAccount: "main", voucherDate: new Date().toISOString().split("T")[0], notes: "" });
      void reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ السند");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim}>
        <PageHeader icon={Wallet} title="السندات والتحصيلات" subtitle="إدارة سندات القبض والصرف" color="blue" />
      </motion.div>

      <motion.div variants={anim}>
        <Tabs defaultValue="receipt" dir="rtl">
          <TabsList className="bg-gray-100 mb-4">
            <TabsTrigger value="receipt">سندات القبض</TabsTrigger>
            <TabsTrigger value="expense">سندات الصرف</TabsTrigger>
            <TabsTrigger value="history">السجل</TabsTrigger>
          </TabsList>

          {/* Receipt Tab */}
          <TabsContent value="receipt">
            <Card className="border-0 shadow-sm">
              <div className="bg-green-600 text-white px-5 py-3 flex items-center justify-between">
                <h3 className="font-semibold">سند قبض جديد</h3>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>العميل *</Label>
                    <Select value={receiptForm.customerId} onValueChange={v => setReceiptForm({...receiptForm, customerId: v, partyName: ""})}>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                      <SelectContent dir="rtl">{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.arName || c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المبلغ (جنيه) *</Label>
                    <Input type="number" placeholder="0.00" dir="rtl" value={receiptForm.amount} onChange={e => setReceiptForm({...receiptForm, amount: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>طريقة الدفع</Label>
                    <Select value={receiptForm.paymentMethod} onValueChange={v => setReceiptForm({...receiptForm, paymentMethod: v})}>
                      <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="نقدي">نقدي</SelectItem>
                        <SelectItem value="تحويل بنكي">تحويل بنكي</SelectItem>
                        <SelectItem value="شيك">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>التاريخ</Label>
                    <Input type="date" dir="rtl" value={receiptForm.voucherDate} onChange={e => setReceiptForm({...receiptForm, voucherDate: e.target.value})} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>ملاحظات</Label>
                    <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none" rows={2} value={receiptForm.notes} onChange={e => setReceiptForm({...receiptForm, notes: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveReceipt} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ سند القبض"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Tab */}
          <TabsContent value="expense">
            <Card className="border-0 shadow-sm">
              <div className="bg-red-600 text-white px-5 py-3 flex items-center justify-between">
                <h3 className="font-semibold">سند صرف جديد</h3>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>البند *</Label>
                    <Input placeholder="وصف المصروف" dir="rtl" value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>المبلغ (جنيه) *</Label>
                    <Input type="number" placeholder="0.00" dir="rtl" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>من الخزينة</Label>
                    <Select value={expenseForm.cashAccount} onValueChange={v => setExpenseForm({...expenseForm, cashAccount: v})}>
                      <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="main">الخزينة الرئيسية</SelectItem>
                        <SelectItem value="petty">صندوق المصروفات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>التاريخ</Label>
                    <Input type="date" dir="rtl" value={expenseForm.voucherDate} onChange={e => setExpenseForm({...expenseForm, voucherDate: e.target.value})} />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>ملاحظات</Label>
                    <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none" rows={2} value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSaveExpense} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                    <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ سند الصرف"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="font-semibold text-gray-800">سجل السندات</h3>
                <div className="relative flex-1 min-w-48 max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input placeholder="بحث بالرقم أو الطرف..." className="pr-8 h-8 text-sm border-gray-200 bg-white" dir="rtl"
                    value={historySearch} onChange={e => { setHistorySearch(e.target.value); pager.reset(); }} />
                  {historySearch && <button onClick={() => setHistorySearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3 h-3" /></button>}
                </div>
              </div>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">رقم السند</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">النوع</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الطرف</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">المبلغ</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">طريقة الدفع</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pager.paginated.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">لا توجد سندات بعد</td></tr>
                    ) : (
                      pager.paginated.map((r, idx) => (
                        <tr key={r.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                          <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.voucherNo}</td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", r.voucherType === "قبض" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{r.voucherType}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{r.partyName}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{r.amount.toLocaleString("ar-EG")} ج.م</td>
                          <td className="px-4 py-3 text-gray-600">{r.paymentMethod}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.voucherDate).toLocaleDateString("ar-EG")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <Pagination page={pager.page} totalPages={pager.totalPages} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
