import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Snowflake, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "Admin", label: "مدير النظام" },
  { value: "Manager", label: "مدير" },
  { value: "Warehouse", label: "مسؤول مخازن" },
  { value: "Accountant", label: "محاسب" },
  { value: "Viewer", label: "مشاهدة فقط" },
];

export function Register() {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [form, setForm] = useState({
    email: "",
    userName: "",
    fullName: "",
    arName: "",
    password: "",
    confirmPassword: "",
    role: "Viewer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.roles?.includes("Admin") ?? false;

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.userName || !form.fullName || !form.password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        userName: form.userName,
        fullName: form.fullName,
        arName: form.arName || undefined,
        password: form.password,
        roles: [form.role],
      });
      toast.success("تم إنشاء المستخدم بنجاح");
      navigate("/settings");
    } catch (err) {
      const message = err instanceof Error ? err.message : "فشل إنشاء المستخدم";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div dir="rtl" className="p-8 text-center">
        <p className="text-red-600">هذه الصفحة متاحة فقط لمديري النظام.</p>
        <Button className="mt-4" onClick={() => navigate("/dashboard")}>العودة للرئيسية</Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center p-6" style={{ background: "linear-gradient(135deg, #F9FAFB 0%, #DBEAFE 100%)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-3">
              <Snowflake className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">إنشاء مستخدم جديد</h1>
            <p className="text-gray-500 text-sm mt-1">تسجيل حساب موظف في النظام</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">الاسم الكامل *</Label>
                <Input id="fullName" value={form.fullName} onChange={update("fullName")} placeholder="الاسم بالإنجليزية" dir="ltr" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="arName">الاسم بالعربية</Label>
                <Input id="arName" value={form.arName} onChange={update("arName")} placeholder="اسم المستخدم بالعربية" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} placeholder="user@talaga.local" dir="ltr" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="userName">اسم المستخدم *</Label>
              <Input id="userName" value={form.userName} onChange={update("userName")} placeholder="username" dir="ltr" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role">الصلاحية *</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password">كلمة المرور *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={update("password")}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={update("confirmPassword")}
                  dir="ltr"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              يجب أن تحتوي كلمة المرور على حرف كبير أو صغير، رقم، ورمز خاص، وطولها 6 أحرف على الأقل.
            </p>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                إلغاء
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? "..." : (<><ArrowRight className="w-4 h-4 ml-1" />إنشاء الحساب</>)}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
