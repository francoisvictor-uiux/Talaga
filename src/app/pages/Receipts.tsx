import { useState } from "react";
import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { receipts, customers } from "../data/mockData";
import { Wallet, Printer, Save, Search, X } from "lucide-react";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Receipts() {
  const [historySearch, setHistorySearch] = useState("");

  const filteredReceipts = receipts.filter(r =>
    r.voucherNo.includes(historySearch) || r.party.includes(historySearch) || r.type.includes(historySearch)
  );
  const pager = usePagination(filteredReceipts, 10);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">السندات والتحصيلات</h2>
          <p className="text-sm text-gray-500">إدارة سندات القبض والصرف</p>
        </div>
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
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">RV-2024-{String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}</span>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>العميل *</Label>
                    <Select>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل" /></SelectTrigger>
                      <SelectContent dir="rtl">
                        {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>المبلغ (جنيه) *</Label>
                    <Input type="number" placeholder="0.00" dir="rtl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>طريقة الدفع</Label>
                    <Select>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الطريقة" /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>التاريخ</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} dir="rtl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>ملاحظات</Label>
                    <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none" rows={2} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => toast.success("تم حفظ سند القبض")} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                    <Printer className="w-4 h-4" />حفظ وطباعة السند
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
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-mono">EV-2024-{String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}</span>
              </div>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label>البند</Label>
                    <Input placeholder="وصف المصروف" dir="rtl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>المبلغ (جنيه) *</Label>
                    <Input type="number" placeholder="0.00" dir="rtl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>من الخزينة</Label>
                    <Select>
                      <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الخزينة" /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="main">الخزينة الرئيسية</SelectItem>
                        <SelectItem value="petty">صندوق المصروفات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>التاريخ</Label>
                    <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} dir="rtl" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label>ملاحظات</Label>
                    <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none" rows={2} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => toast.success("تم حفظ سند الصرف")} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                    <Printer className="w-4 h-4" />حفظ وطباعة السند
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
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">أنشئ بواسطة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pager.paginated.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-gray-400">لا توجد نتائج</td></tr>
                    ) : (
                      pager.paginated.map((r, idx) => (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-blue-600">{r.voucherNo}</td>
                          <td className="px-4 py-3">
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", r.type === "قبض" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {r.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{r.party}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{r.amount.toLocaleString()} ج.م</td>
                          <td className="px-4 py-3 text-gray-600">{r.paymentMethod}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{r.date}</td>
                          <td className="px-4 py-3 text-gray-600">{r.createdBy}</td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
                <Pagination
                  page={pager.page} totalPages={pager.totalPages}
                  total={pager.total} pageSize={pager.pageSize}
                  onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}