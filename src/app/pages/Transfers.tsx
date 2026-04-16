import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeftRight, Save } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useDb } from "../context/DbContext";
import { toast } from "sonner";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Transfers() {
  const { customers, items, packages, warehouses } = useDb();
  const [tab, setTab] = useState("warehouses");

  const handleSave = (type: string) => {
    toast.success(`تم تأكيد ${type === "warehouses" ? "تحويل المخزن" : "تحويل العميل"} بنجاح`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Orange Header */}
      <motion.div variants={anim} className="bg-orange-600 text-white rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold">التحويلات</h2>
            <p className="text-orange-100 text-xs">تحويل الأصناف بين المخازن أو العملاء</p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-xs text-orange-200">رقم التحويل</p>
          <p className="font-bold font-mono">TRF-2024-{String(Math.floor(Math.random() * 900) + 100).padStart(3, "0")}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={anim}>
        <Tabs defaultValue="warehouses" onValueChange={setTab} dir="rtl">
          <TabsList className="bg-orange-50 border border-orange-100">
            <TabsTrigger value="warehouses" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              تحويل بين مخازن
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              تحويل بين عملاء
            </TabsTrigger>
          </TabsList>

          {/* Between Warehouses */}
          <TabsContent value="warehouses">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* From */}
                  <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">من</span>
                      المخزن المصدر
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">المخزن</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن المصدر" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العنبر</Label>
                      <Input placeholder="رقم العنبر" dir="rtl" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2">
                    <ArrowLeftRight className="w-6 h-6 text-orange-500" />
                  </div>

                  {/* To */}
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">إلى</span>
                      المخزن الوجهة
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">المخزن</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المخزن الوجهة" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العنبر</Label>
                      <Input placeholder="رقم العنبر" dir="rtl" />
                    </div>
                  </div>
                </div>

                {/* Item Details */}
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف المحوَّل</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">الصنف</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العبوة</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="العبوة" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {packages.map(p => <SelectItem key={p.id} value={p.type}>{p.type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الكمية</Label>
                      <Input type="number" placeholder="0" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">ملاحظات</Label>
                      <Input placeholder="ملاحظات" dir="rtl" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("warehouses")} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Save className="w-4 h-4" />تأكيد التحويل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Between Customers */}
          <TabsContent value="customers">
            <Card className="border-0 shadow-sm mt-4">
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="font-semibold text-orange-800 text-sm">العميل المصدر</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العميل</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل المصدر" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-800 text-sm">العميل الوجهة</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العميل</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر العميل الوجهة" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {customers.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="font-semibold text-gray-700 text-sm mb-3">تفاصيل الصنف</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">الصنف</Label>
                      <Select>
                        <SelectTrigger dir="rtl"><SelectValue placeholder="الصنف" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">الكمية</Label>
                      <Input type="number" placeholder="0" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">العنبر</Label>
                      <Input placeholder="رقم العنبر" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">ملاحظات</Label>
                      <Input placeholder="ملاحظات" dir="rtl" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-start">
                  <Button onClick={() => handleSave("customers")} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                    <Save className="w-4 h-4" />تأكيد التحويل
                  </Button>
                </div>
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
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">النوع</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">من</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">إلى</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">الكمية</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { no: "TRF-2024-005", type: "بين مخازن", from: "ثلاجة المنطقة الأولى", to: "ثلاجة الحبوب", qty: 20, date: "2024-01-18" },
                  { no: "TRF-2024-004", type: "بين عملاء", from: "شركة النور", to: "مجموعة الخليج", qty: 15, date: "2024-01-17" },
                  { no: "TRF-2024-003", type: "بين مخازن", from: "ثلاجة اللحوم", to: "ثلاجة الخضروات", qty: 30, date: "2024-01-16" },
                ].map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white border-b" : "bg-gray-50/30 border-b"}>
                    <td className="px-4 py-3 font-mono text-xs text-orange-600">{t.no}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">{t.type}</span></td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.from}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs">{t.to}</td>
                    <td className="px-4 py-3 text-gray-700">{t.qty} طرد</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.date}</td>
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
