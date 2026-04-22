import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Settings as SettingsIcon, Building2, Printer, Shield, Database, Palette, Save, Upload, MessageCircle, Check } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
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
import { useTheme, THEMES, type ThemeKey } from "../context/ThemeContext";

const settingsTabs = [
  { id: "company", label: "بيانات الشركة", icon: Building2 },
  { id: "notifications", label: "الإشعارات", icon: MessageCircle },
  { id: "printing", label: "إعدادات الطباعة", icon: Printer },
  { id: "backup", label: "النسخ الاحتياطي", icon: Database },
  { id: "appearance", label: "المظهر", icon: Palette },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  const [qrSize, setQrSize] = useState([80]);
  const [waPhone, setWaPhone] = useState(() => localStorage.getItem("wa_sender_phone") || "");
  const [waEnabled, setWaEnabled] = useState(() => localStorage.getItem("wa_notify_enabled") === "true");

  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const [localFontSize, setLocalFontSize] = useState([fontSize]);

  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(0);

    let progress = 0;
    intervalRef.current = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(intervalRef.current!);
        setBackupProgress(100);
        setIsBackingUp(false);

        // Build CSV
        const now = new Date();
        const dateStr = now.toLocaleDateString("ar-EG");
        const rows = [
          ["النسخة الاحتياطية — نظام التبريد والتخزين"],
          ["تاريخ الإنشاء", dateStr],
          [],
          ["الجدول", "عدد السجلات", "الحالة"],
          ["العملاء", "24", "مكتمل"],
          ["الموظفين", "12", "مكتمل"],
          ["الأصناف", "38", "مكتمل"],
          ["الثلاجات والعنابر", "8", "مكتمل"],
          ["الحركات", "156", "مكتمل"],
          ["المستلمات", "42", "مكتمل"],
          ["سجل التدقيق", "320", "مكتمل"],
        ];
        const csv = "\uFEFF" + rows.map(r => r.join(",")).join("\r\n");
        const blob = new Blob([csv], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}.xls`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setBackupProgress(progress);
      }
    }, 120);
  };

  const handleSave = () => toast.success("تم حفظ الإعدادات بنجاح");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim}>
        <PageHeader icon={SettingsIcon} title="الإعدادات" subtitle="إعدادات النظام وبيانات الشركة" color="gray" />
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

          {activeTab === "notifications" && (
            <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-gray-800">إعدادات الإشعارات</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-800">إشعارات الواتساب</p>
                        <p className="text-xs text-gray-500 mt-0.5">إرسال إشعارات عبر الواتساب عند حدوث حدث مهم</p>
                      </div>
                      <Switch defaultChecked={waEnabled} onCheckedChange={setWaEnabled} />
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="text-sm font-medium text-gray-800">رقم واتساب الشركة (للإرسال)</p>
                        <p className="text-xs text-gray-500 mt-0.5">رقم الواتساب الخاص بالشركة الذي سيتم الإرسال منه</p>
                      </div>
                      <Input defaultValue={waPhone} dir="rtl" onChange={e => setWaPhone(e.target.value)} />
                    </div>
                  </div>
                  <Button onClick={() => {
                    localStorage.setItem("wa_notify_enabled", waEnabled.toString());
                    localStorage.setItem("wa_sender_phone", waPhone);
                    handleSave();
                  }} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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
                    <div className="flex items-center justify-between py-2">
                      <p className="text-sm text-gray-700">النسخ الاحتياطي التلقائي اليومي</p>
                      <Switch defaultChecked />
                    </div>
                  </div>
                  {isBackingUp && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>جاري إنشاء النسخة الاحتياطية...</span>
                        <span>{backupProgress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${backupProgress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  )}

                  {!isBackingUp && backupProgress === 100 && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      تم إنشاء النسخة الاحتياطية بنجاح وتم حفظها
                    </div>
                  )}

                  <Button
                    onClick={handleBackup}
                    disabled={isBackingUp}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full disabled:opacity-60"
                  >
                    <Database className="w-4 h-4" />
                    {isBackingUp ? `جاري النسخ... ${backupProgress}%` : "إنشاء نسخة احتياطية الآن"}
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

                  {/* ── Color Palette ── */}
                  <div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {THEMES.filter(t => t.key !== "gray").map(t => (
                        <button
                          key={t.key}
                          className="flex flex-col items-center gap-1.5 group"
                          onClick={() => { setTheme(t.key as ThemeKey); toast.success(`تم تطبيق ثيم ${t.label}`); }}
                        >
                          <div
                            className="relative w-11 h-11 rounded-full border-4 border-white shadow-md hover:scale-110 transition-transform flex items-center justify-center"
                            style={{
                              background: t.primary,
                              outline: theme.key === t.key ? `3px solid ${t.primary}` : "none",
                              outlineOffset: 2,
                            }}
                          >
                            {theme.key === t.key && <Check className="w-5 h-5 text-white drop-shadow" />}
                          </div>
                          <span className={cn("text-xs font-medium transition-colors", theme.key === t.key ? "text-gray-800" : "text-gray-400 group-hover:text-gray-600")}>
                            {t.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Preview strip */}
                    <div className="mt-4 p-3 rounded-xl border flex items-center gap-3" style={{ borderColor: theme.primary + "44" }}>
                      <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: theme.primary }} />
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: theme.primary }}>معاينة اللون الأساسي</p>
                        <p className="text-xs text-gray-400">{theme.primary}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: theme.primary }} />
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: theme.secondary }} />
                        <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ background: theme.sidebar }} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ── Font Size ── */}
                  <div className="py-2">
                    <div className="flex items-center justify-between mb-3">
                      <Label>حجم الخط</Label>
                      <span className="text-sm font-medium" style={{ color: theme.primary }}>{localFontSize[0]}px</span>
                    </div>
                    <Slider
                      value={localFontSize}
                      onValueChange={v => setLocalFontSize(v)}
                      min={12} max={18} step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-3">
                      <span>كبير — 18</span><span>صغير — 12</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => { setFontSize(localFontSize[0]); handleSave(); }}
                    className="text-white gap-2"
                    style={{ background: theme.primary }}
                  >
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