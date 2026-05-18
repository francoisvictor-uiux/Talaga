import { useEffect, useRef, useState } from "react";
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
import {
  getAllSettings,
  updateSettingsBatch,
  settingsToMap,
  type SettingItem,
} from "../services/settingsService";
import { uploadImage } from "../services/fileService";
import { SafeImage } from "../components/ui/SafeImage";
import { validatePhoneOptional, PHONE_PLACEHOLDER } from "../utils/phone";

const settingsTabs = [
  { id: "company", label: "بيانات الشركة", icon: Building2 },
  { id: "notifications", label: "الإشعارات", icon: MessageCircle },
  { id: "printing", label: "إعدادات الطباعة", icon: Printer },
  { id: "backup", label: "النسخ الاحتياطي", icon: Database },
  { id: "appearance", label: "المظهر", icon: Palette },
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const asBool = (v?: string) => (v ?? "").toLowerCase() === "true";
const asInt = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { theme, fontSize, setTheme, setFontSize } = useTheme();
  const [localFontSize, setLocalFontSize] = useState([fontSize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getAllSettings();
        if (!cancelled) setValues(settingsToMap(list));
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "فشل تحميل الإعدادات");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setVal = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  const saveKeys = async (keys: string[], successMsg: string) => {
    setSaving(true);
    try {
      const items: SettingItem[] = keys.map((k) => ({ key: k, value: values[k] ?? "" }));
      const refreshed = await updateSettingsBatch(items);
      setValues((prev) => {
        const next = { ...prev };
        for (const r of refreshed) next[r.key] = r.value;
        return next;
      });
      toast.success(successMsg);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  /* ── Backup demo ── */
  const [qrSize, setQrSize] = useState([80]);
  useEffect(() => { setQrSize([asInt(values["Printing.QrSize"], 80)]); }, [values["Printing.QrSize"]]);

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
      } else {
        setBackupProgress(progress);
      }
    }, 120);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("حجم الشعار أكبر من 2 ميجا"); return; }
    try {
      const url = await uploadImage(file, "settings");
      setVal("Company.LogoUrl", url);
    } catch (err: any) {
      toast.error(err?.message ?? "تعذر رفع الصورة");
    }
  };

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
                  activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100",
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
          {loading ? (
            <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center text-sm text-gray-400">جاري التحميل...</CardContent></Card>
          ) : (
            <>
              {activeTab === "company" && (
                <motion.div key="company" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-5 space-y-5">
                      <h3 className="font-semibold text-gray-800">بيانات الشركة</h3>
                      {/* Logo */}
                      <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center overflow-hidden">
                          <span className="text-white font-bold text-xl">
                            {(values["Company.NameArabic"] || "م.ت").slice(0, 2)}
                          </span>
                          <SafeImage src={values["Company.LogoUrl"]} alt="logo" className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div>
                          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                          <Button variant="outline" className="gap-2 text-xs" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-3.5 h-3.5" />رفع شعار
                          </Button>
                          {values["Company.LogoUrl"] && (
                            <Button variant="ghost" className="gap-2 text-xs text-red-500 mr-2" onClick={() => setVal("Company.LogoUrl", "")}>
                              إزالة
                            </Button>
                          )}
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 2MB</p>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label>اسم الشركة (عربي)</Label>
                          <Input value={values["Company.NameArabic"] ?? ""} onChange={e => setVal("Company.NameArabic", e.target.value)} dir="rtl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>اسم الشركة (إنجليزي)</Label>
                          <Input value={values["Company.NameEnglish"] ?? ""} onChange={e => setVal("Company.NameEnglish", e.target.value)} dir="ltr" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>السجل التجاري</Label>
                          <Input value={values["Company.CommercialRegistry"] ?? ""} onChange={e => setVal("Company.CommercialRegistry", e.target.value)} dir="rtl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>الرقم الضريبي</Label>
                          <Input value={values["Company.TaxNumber"] ?? ""} onChange={e => setVal("Company.TaxNumber", e.target.value)} dir="rtl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>رقم الهاتف</Label>
                          <Input
                            value={values["Company.Phone"] ?? ""}
                            onChange={e => setVal("Company.Phone", e.target.value)}
                            dir="ltr" inputMode="tel" placeholder={PHONE_PLACEHOLDER}
                            className={cn("border",
                              validatePhoneOptional(values["Company.Phone"] ?? "") ? "border-red-400" : "")}
                          />
                          {validatePhoneOptional(values["Company.Phone"] ?? "") && (
                            <p className="text-[11px] text-red-500">{validatePhoneOptional(values["Company.Phone"] ?? "")}</p>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <Label>البريد الإلكتروني</Label>
                          <Input value={values["Company.Email"] ?? ""} onChange={e => setVal("Company.Email", e.target.value)} dir="ltr" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <Label>العنوان</Label>
                          <Textarea value={values["Company.Address"] ?? ""} onChange={e => setVal("Company.Address", e.target.value)} dir="rtl" className="resize-none" rows={2} />
                        </div>
                      </div>
                      <Button
                        disabled={saving}
                        onClick={() => saveKeys(
                          ["Company.NameArabic","Company.NameEnglish","Company.CommercialRegistry","Company.TaxNumber","Company.Phone","Company.Email","Company.Address","Company.LogoUrl"],
                          "تم حفظ بيانات الشركة",
                        )}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      >
                        <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ التغييرات"}
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
                          <Switch
                            checked={asBool(values["Notifications.WhatsAppEnabled"])}
                            onCheckedChange={v => setVal("Notifications.WhatsAppEnabled", v ? "true" : "false")}
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b">
                          <div>
                            <p className="text-sm font-medium text-gray-800">رقم واتساب الشركة (للإرسال)</p>
                            <p className="text-xs text-gray-500 mt-0.5">رقم الواتساب الخاص بالشركة الذي سيتم الإرسال منه</p>
                          </div>
                          <Input
                            value={values["Notifications.WhatsAppSenderPhone"] ?? ""}
                            onChange={e => setVal("Notifications.WhatsAppSenderPhone", e.target.value)}
                            dir="ltr"
                            inputMode="tel"
                            className={cn("w-48 border",
                              validatePhoneOptional(values["Notifications.WhatsAppSenderPhone"] ?? "") ? "border-red-400" : "")}
                            placeholder={PHONE_PLACEHOLDER}
                          />
                        </div>
                      </div>
                      <Button
                        disabled={saving}
                        onClick={() => saveKeys(
                          ["Notifications.WhatsAppEnabled","Notifications.WhatsAppSenderPhone"],
                          "تم حفظ إعدادات الإشعارات",
                        )}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      >
                        <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ التغييرات"}
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
                          <Select
                            value={values["Printing.PaperSize"] ?? "a4"}
                            onValueChange={v => setVal("Printing.PaperSize", v)}
                          >
                            <SelectTrigger className="w-36" dir="rtl"><SelectValue /></SelectTrigger>
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
                          <Switch
                            checked={asBool(values["Printing.LogoOnInvoice"])}
                            onCheckedChange={v => setVal("Printing.LogoOnInvoice", v ? "true" : "false")}
                          />
                        </div>
                        <div className="flex items-center justify-between py-3 border-b">
                          <div>
                            <p className="text-sm font-medium text-gray-800">رمز QR في الفاتورة</p>
                            <p className="text-xs text-gray-500 mt-0.5">إضافة رمز QR لتتبع الشحنة</p>
                          </div>
                          <Switch
                            checked={asBool(values["Printing.QrOnInvoice"])}
                            onCheckedChange={v => setVal("Printing.QrOnInvoice", v ? "true" : "false")}
                          />
                        </div>
                        <div className="py-3">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-medium text-gray-800">حجم رمز QR</p>
                            <span className="text-sm text-blue-600 font-medium">{qrSize[0]}px</span>
                          </div>
                          <Slider
                            value={qrSize}
                            onValueChange={(v) => { setQrSize(v); setVal("Printing.QrSize", String(v[0])); }}
                            min={40} max={150} step={10} className="w-full"
                          />
                        </div>
                      </div>
                      <Button
                        disabled={saving}
                        onClick={() => saveKeys(
                          ["Printing.PaperSize","Printing.LogoOnInvoice","Printing.QrOnInvoice","Printing.QrSize"],
                          "تم حفظ إعدادات الطباعة",
                        )}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      >
                        <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ التغييرات"}
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
                        <p className="text-2xl font-bold text-green-700 mt-1">—</p>
                        <p className="text-xs text-green-600 mt-0.5">سيتم تفعيله بعد ربط محرك النسخ الاحتياطي بالخادم</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                          <p className="text-sm text-gray-700">النسخ الاحتياطي التلقائي اليومي</p>
                          <Switch
                            checked={asBool(values["Backup.AutoDailyEnabled"])}
                            onCheckedChange={v => setVal("Backup.AutoDailyEnabled", v ? "true" : "false")}
                          />
                        </div>
                      </div>
                      <Button
                        disabled={saving}
                        onClick={() => saveKeys(["Backup.AutoDailyEnabled"], "تم حفظ إعدادات النسخ الاحتياطي")}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                      >
                        <Save className="w-4 h-4" />حفظ التغييرات
                      </Button>

                      {isBackingUp && (
                        <div className="space-y-2 mt-4">
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
                        variant="outline"
                        className="gap-2 w-full disabled:opacity-60"
                      >
                        <Database className="w-4 h-4" />
                        {isBackingUp ? `جاري النسخ... ${backupProgress}%` : "إنشاء نسخة احتياطية الآن (تجريبي)"}
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
                      <p className="text-xs text-gray-500">المظهر يُحفظ محلياً لكل مستخدم — لا يُخزَّن على السيرفر.</p>

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

                      <div className="py-2">
                        <div className="flex items-center justify-between mb-3">
                          <Label>حجم الخط</Label>
                          <span className="text-sm font-medium" style={{ color: theme.primary }}>{localFontSize[0]}px</span>
                        </div>
                        <Slider value={localFontSize} onValueChange={v => setLocalFontSize(v)} min={12} max={18} step={1} className="w-full" />
                        <div className="flex justify-between text-xs text-gray-400 mt-3">
                          <span>كبير — 18</span><span>صغير — 12</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => { setFontSize(localFontSize[0]); toast.success("تم تطبيق المظهر"); }}
                        className="text-white gap-2"
                        style={{ background: theme.primary }}
                      >
                        <Save className="w-4 h-4" />تطبيق
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
