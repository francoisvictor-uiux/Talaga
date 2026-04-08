import { useState } from "react";
import { motion } from "motion/react";
import { Plus, Eye, Edit, Shield, List, LayoutGrid, Search, X } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { employees } from "../data/mockData";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

type Employee = typeof employees[0];

const roleColors: Record<string, string> = {
  "مدير": "bg-purple-100 text-purple-700 border-purple-200",
  "محاسب": "bg-blue-100 text-blue-700 border-blue-200",
  "عامل مخزن": "bg-green-100 text-green-700 border-green-200",
};

const permModules = ["المخازن", "الأصناف", "العملاء", "الوارد", "المنصرف", "التحويلات", "الجرد", "السندات", "التقارير", "الإعدادات"];
const permActions = ["عرض", "إضافة", "تعديل", "حذف"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const cardItem = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

export function Employees() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showPerms, setShowPerms] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");

  const filtered = employees.filter(e =>
    e.name.includes(search) || e.role.includes(search) || e.phone.includes(search)
  );
  const pager = usePagination(filtered, 12);

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
                              <button className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                <Eye className="w-3.5 h-3.5" />عرض
                              </button>
                              <button className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors">
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
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                            <button className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"><Edit className="w-3.5 h-3.5" /></button>
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

        <TabsContent value="salaries">
          <Card className="border-0 shadow-sm p-6 text-center">
            <p className="text-gray-500">سيتم عرض بيانات الرواتب هنا</p>
          </Card>
        </TabsContent>
        <TabsContent value="leaves">
          <Card className="border-0 shadow-sm p-6 text-center">
            <p className="text-gray-500">سيتم عرض بيانات الإجازات هنا</p>
          </Card>
        </TabsContent>
        <TabsContent value="advances">
          <Card className="border-0 shadow-sm p-6 text-center">
            <p className="text-gray-500">سيتم عرض السلف والغياب هنا</p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permissions Dialog */}
      <Dialog open={showPerms} onOpenChange={setShowPerms}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>صلاحيات الموظف: {selected?.name}</DialogTitle>
          </DialogHeader>
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
            <div className="col-span-2 space-y-1.5"><Label>الاسم الكامل</Label><Input dir="rtl" placeholder="الاسم الكامل للموظف" className="border border-[#d1d5dc] bg-[#f9fafb]" /></div>
            <div className="space-y-1.5">
              <Label>الدور الوظيفي</Label>
              <Select>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="مدير">مدير</SelectItem>
                  <SelectItem value="محاسب">محاسب</SelectItem>
                  <SelectItem value="عامل مخزن">عامل مخزن</SelectItem>
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
    </motion.div>
  );
}