import { useState } from "react";
import { motion } from "motion/react";
import { Settings as SettingsIcon, Building2, Printer, Shield, Database, Palette, Save, Upload } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Separator } from "../components/ui/separator";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

const settingsTabs = [
  { id: "company", label: "بيانات الشركة", icon: Building2 },
  { id: "printing", label: "إعدادات الطباعة", icon: Printer },
  { id: "security", label: "الأمان", icon: Shield },
  { id: "backup", label: "النسخ الاحتياطي", icon: Database },
  { id: "appearance", label: "المظهر", icon: Palette },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  const [qrSize, setQrSize] = useState([80]);
  const [fontSize, setFontSize] = useState([14]);

  const handleSave = () => toast.success("تم حفظ الإعدادات بنجاح");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={anim} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">الإعدادات</h2>
          <p className="text-sm text-gray-500">إعدادات النظام وبيانات الشركة</p>
        </div>
      </motion.div>

      <motion.div variants={anim} className="flex gap-5">
        {/* Left Tabs */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {settingsTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 text-right px-3 py-2.5 rounded-lg text-sm transition-colors",
                  activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "company" && (
            <motion.div key="company" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-5">
                  <h3 className="font-semibold text-gray-800">بيانات الشركة</h3>
                  {/* Logo Upload */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">م.ت</span>
                    </div>
                    <div>
                      <Button variant="outline" className="gap-2 text-xs">
                        <Upload className="w-3.5 h-3.5" />رفع شعار
                      </Button>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 2MB</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>اسم الشركة (عربي)</Label>
                      <Input defaultValue="شركة التبريد والتخزين المتحدة" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>اسم الشركة (إنجليزي)</Label>
                      <Input defaultValue="United Cold Storage Co." dir="ltr" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>السجل التجاري</Label>
                      <Input defaultValue="123456789" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>الرقم الضريبي</Label>
                      <Input defaultValue="987654321" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>رقم الهاتف</Label>
                      <Input defaultValue="01012345678" dir="rtl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>البريد الإلكتروني</Label>
                      <Input defaultValue="info@coldstorage.eg" dir="ltr" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>العنوان</Label>
                      <Textarea defaultValue="مصر، القاهرة، المنطقة الصناعية بمدينة نصر" dir="rtl" className="resize-none" rows={2} />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Save className="w-4 h-4" />حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "printing" && (
            <motion.div key="printing" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-5">
                  <h3 className="font-semibold text-gray-800">إعدادات الطباعة</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-800">نوع الورق</p>
                        <p className="text-xs text-gray-500 mt-0.5">حجم الورق الافتراضي للطباعة</p>
                      </div>
                      <Select defaultValue="a4">
                        <SelectTrigger className="w-36" dir="rtl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="a4">A4 (عادي)</SelectItem>
                          <SelectItem value="thermal">حراري (80mm)</SelectItem>
                          <SelectItem value="a5">A5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-800">طباعة الشعار على الفاتورة</p>
                        <p className="text-xs text-gray-500 mt-0.5">إظهار شعار الشركة في الفواتير</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-800">رمز QR في الفاتورة</p>
                        <p className="text-xs text-gray-500 mt-0.5">إضافة رمز QR لتتبع الشحنة</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="py-3">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-800">حجم رمز QR</p>
                        <span className="text-sm text-blue-600 font-medium">{qrSize[0]}px</span>
                      </div>
                      <Slider value={qrSize} onValueChange={setQrSize} min={40} max={150} step={10} className="w-full" />
                    </div>
                  </div>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Save className="w-4 h-4" />حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div key="security" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-gray-800">إعدادات الأمان</h3>
                  {[
                    { label: "المصادقة الثنائية (2FA)", desc: "تفعيل طبقة حماية إضافية", checked: false },
                    { label: "تسجيل جميع الإجراءات", desc: "حفظ سجل كامل لكل العمليات", checked: true },
                    { label: "تنبيه تسجيل دخول من جهاز جديد", desc: "إرسال بريد تنبيهي عند الدخول من جهاز غير معروف", checked: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={item.checked} />
                    </div>
                  ))}
                  <div className="space-y-1.5 pt-2">
                    <Label>مدة انتهاء الجلسة (دقائق)</Label>
                    <Select defaultValue="30">
                      <SelectTrigger dir="rtl" className="w-48"><SelectValue /></SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="15">15 دقيقة</SelectItem>
                        <SelectItem value="30">30 دقيقة</SelectItem>
                        <SelectItem value="60">ساعة</SelectItem>
                        <SelectItem value="never">لا تنتهي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Save className="w-4 h-4" />حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "backup" && (
            <motion.div key="backup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-gray-800">النسخ الاحتياطي</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-green-800">آخر نسخة احتياطية</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">اليوم، 03:00 صباحاً</p>
                    <p className="text-xs text-green-600 mt-0.5">حجم النسخة: 245 MB</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "النسخ الاحتياطي التلقائي اليومي", checked: true },
                      { label: "النسخ على السحابة", checked: false },
                      { label: "إشعار عند فشل النسخ", checked: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                        <p className="text-sm text-gray-700">{item.label}</p>
                        <Switch defaultChecked={item.checked} />
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => toast.success("جاري إنشاء النسخة الاحتياطية...")} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full">
                    <Database className="w-4 h-4" />إنشاء نسخة احتياطية الآن
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-5">
                  <h3 className="font-semibold text-gray-800">المظهر</h3>
                  <div>
                    <Label className="mb-3 block">لون الثيم الأساسي</Label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { color: "#1E40AF", label: "أزرق" },
                        { color: "#059669", label: "أخضر" },
                        { color: "#7C3AED", label: "بنفسجي" },
                        { color: "#DC2626", label: "أحمر" },
                        { color: "#374151", label: "رمادي" },
                      ].map(c => (
                        <button
                          key={c.color}
                          className="flex flex-col items-center gap-1"
                          onClick={() => toast.info(`تم تطبيق ثيم ${c.label}`)}
                        >
                          <div
                            className="w-10 h-10 rounded-full border-4 border-white shadow-md hover:scale-110 transition-transform"
                            style={{ background: c.color, outline: c.color === "#1E40AF" ? `3px solid ${c.color}` : "none", outlineOffset: 2 }}
                          />
                          <span className="text-xs text-gray-500">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="py-2">
                    <div className="flex items-center justify-between mb-3">
                      <Label>حجم الخط</Label>
                      <span className="text-sm text-blue-600 font-medium">{fontSize[0]}px</span>
                    </div>
                    <Slider value={fontSize} onValueChange={setFontSize} min={12} max={18} step={1} className="w-full" />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>صغير</span><span>متوسط</span><span>كبير</span>
                    </div>
                  </div>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Save className="w-4 h-4" />حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}