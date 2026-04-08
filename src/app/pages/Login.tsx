import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Snowflake, Fingerprint } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    toast.success("تم تسجيل الدخول بنجاح");
    navigate("/dashboard");
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0F2044 0%, #1E3A5F 50%, #1E40AF 100%)" }}
    >
      {/* Background decorative snowflakes */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute opacity-5 text-white"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            fontSize: `${20 + Math.random() * 40}px`,
          }}
          animate={{ rotate: 360, y: [-10, 10, -10] }}
          transition={{ duration: 8 + Math.random() * 4, repeat: Infinity, ease: "linear" }}
        >
          ❄
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30 mb-4"
            >
              <Snowflake className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800">نظام إدارة مخازن التبريد</h1>
            <p className="text-gray-500 text-sm mt-1">Cold Storage Warehouse Management System</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700">اسم المستخدم</Label>
              <Input
                id="username"
                type="text"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-right border-gray-300 focus:border-blue-500 h-11"
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right border-gray-300 focus:border-blue-500 h-11 pl-10"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20"
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          {/* Biometrics */}
          <div className="mt-6 text-center">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <div className="flex-1 border-t border-gray-200" />
              <span>أو</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
            <button className="mt-4 flex items-center gap-2 mx-auto text-gray-500 hover:text-blue-600 transition-colors">
              <Fingerprint className="w-6 h-6" />
              <span className="text-sm">استخدم بصمة الوجه</span>
            </button>
          </div>
        </div>

        {/* Version */}
        <p className="text-center text-white/40 text-xs mt-4">الإصدار 2.1.0 — جميع الحقوق محفوظة © 2024</p>
      </motion.div>
    </div>
  );
}
