import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Search, Eye, Edit, Phone, X, DollarSign } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { customers, customerDrivers, customerPricing } from "../data/mockData";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

type Customer = typeof customers[0];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Customers() {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.code.includes(search) || c.phone.includes(search)
  );

  const pager = usePagination(filtered, 10);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">إدارة العملاء</h2>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} عملاء مسجلين</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />إضافة عميل
        </Button>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="بحث بالاسم أو الكود أو الهاتف..."
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
      </motion.div>

      {/* Table */}
      <motion.div variants={item}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">كود العميل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">اسم العميل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الهاتف</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الرصيد</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الأصناف المخزنة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">المندوب</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.paginated.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className={cn("border-b hover:bg-blue-50/30 transition-colors cursor-pointer", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-blue-600">{c.code}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                            {c.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{c.phone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn("font-semibold", c.balance >= 0 ? "text-green-600" : "text-red-600")}>
                          {c.balance.toLocaleString("ar-EG")} ج.م
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{c.itemsStored} طرد</td>
                      <td className="px-4 py-3.5 text-gray-600">{c.agent}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            onClick={() => setSelectedCustomer(c)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
                  </table>
            </div>
            <Pagination
              page={pager.page} totalPages={pager.totalPages}
              total={pager.total} pageSize={pager.pageSize}
              onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <SheetContent side="left" className="w-full sm:w-[480px] overflow-y-auto" dir="rtl">
          {selectedCustomer && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  {selectedCustomer.name}
                </SheetTitle>
                <p className="text-xs text-gray-500">{selectedCustomer.code}</p>
              </SheetHeader>

              <Tabs defaultValue="basic" dir="rtl">
                <TabsList dir="rtl" className="w-full bg-[#f3f4f6] rounded-xl p-1 h-auto mb-4">
                  <TabsTrigger value="basic" className="flex-1 text-xs rounded-xl data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">البيانات</TabsTrigger>
                  <TabsTrigger value="pricing" className="flex-1 text-xs rounded-xl data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">الأسعار</TabsTrigger>
                  <TabsTrigger value="drivers" className="flex-1 text-xs rounded-xl data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">السائقون</TabsTrigger>
                  <TabsTrigger value="statement" className="flex-1 text-xs rounded-xl data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">كشف الحساب</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">الهاتف</Label>
                      <p className="text-sm font-medium">{selectedCustomer.phone}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">الرصيد</Label>
                      <p className={cn("text-sm font-medium", selectedCustomer.balance >= 0 ? "text-green-600" : "text-red-600")}>
                        {selectedCustomer.balance.toLocaleString()} ج.م
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">العنوان</Label>
                      <p className="text-sm font-medium">{selectedCustomer.address}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">الرقم الضريبي</Label>
                      <p className="text-sm font-medium font-mono">{selectedCustomer.taxNumber}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">المندوب</Label>
                      <p className="text-sm font-medium">{selectedCustomer.agent}</p>
                    </div>
                    {selectedCustomer.notes && (
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">ملاحظات</Label>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 mt-1">{selectedCustomer.notes}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pricing">
                  <div className="space-y-2">
                    {customerPricing.filter(p => p.customerId === selectedCustomer.id).length > 0 ? (
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50 rounded"><th className="text-right p-2 text-xs text-gray-500">الصنف</th><th className="text-right p-2 text-xs text-gray-500">سعر اليوم</th><th className="text-right p-2 text-xs text-gray-500">سعر الشهر</th></tr></thead>
                        <tbody>
                          {customerPricing.filter(p => p.customerId === selectedCustomer.id).map(p => (
                            <tr key={p.id} className="border-b"><td className="p-2">{p.itemName}</td><td className="p-2">{p.pricePerDay} ج.م</td><td className="p-2">{p.pricePerMonth} ج.م</td></tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <p className="text-sm text-gray-500 text-center py-8">لا توجد أسعار مخصصة</p>}
                  </div>
                </TabsContent>

                <TabsContent value="drivers">
                  <div className="space-y-2">
                    {customerDrivers.filter(d => d.customerId === selectedCustomer.id).map(d => (
                      <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-700 font-semibold">{d.name.charAt(0)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-gray-500">{d.phone} — {d.plate}</p>
                        </div>
                      </div>
                    ))}
                    {customerDrivers.filter(d => d.customerId === selectedCustomer.id).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">لا يوجد سائقون مسجلون</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="statement">
                  <div className="space-y-2">
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">الرصيد الحالي</span>
                      <span className={cn("font-bold", selectedCustomer.balance >= 0 ? "text-green-600" : "text-red-600")}>
                        {selectedCustomer.balance.toLocaleString()} ج.م
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 text-center py-4">سيتم عرض كشف الحساب التفصيلي هنا</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Customer Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>إضافة عميل جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5"><Label>كود العميل</Label><Input placeholder="C007" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5"><Label>اسم العميل</Label><Input placeholder="اسم الشركة أو المؤسسة" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input placeholder="01XXXXXXXXX" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5"><Label>المندوب</Label><Input placeholder="اسم المندوب" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="col-span-2 space-y-1.5"><Label>العنوان</Label><Input placeholder="المحافظة - الحي" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5"><Label>الرقم الضريبي</Label><Input placeholder="XXXXXXXXX" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="col-span-2 space-y-1.5"><Label>ملاحظات</Label><Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none border border-[#d1d5dc] bg-[#f9fafb]" rows={2} /></div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={() => { toast.success("تم إضافة العميل بنجاح"); setShowAdd(false); }} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}