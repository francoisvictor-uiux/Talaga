import { useEffect, useState } from "react";
import { useSessionFilter } from "../hooks/useSessionFilter";
import { motion, AnimatePresence } from "motion/react";
import { Plus, CheckSquare, Circle, Clock, User, Search, X, Trash2 } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { getAllTasks, addTask, updateTask, deactivateTask, type BackendTask } from "../services/taskService";
import { getAllEmployees, type BackendEmployee } from "../services/employeeService";

const priorityColors: Record<string, string> = {
  "عالية": "bg-red-100 text-red-700 border-red-200",
  "متوسطة": "bg-orange-100 text-orange-700 border-orange-200",
  "منخفضة": "bg-gray-100 text-gray-600 border-gray-200",
};
const priorityDot: Record<string, string> = {
  "عالية": "bg-red-500", "متوسطة": "bg-orange-500", "منخفضة": "bg-gray-400",
};
const typeColors: Record<string, string> = {
  "مصروف": "bg-purple-100 text-purple-700",
  "مهمة": "bg-blue-100 text-blue-700",
  "تذكير": "bg-yellow-100 text-yellow-700",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function TodoList() {
  const [tasks, setTasks] = useState<BackendTask[]>([]);
  const [employees, setEmployees] = useState<BackendEmployee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter, resetFilter] = useSessionFilter<"all" | "pending" | "completed">("todo_filter", "all");
  const [search, setSearch, resetSearch] = useSessionFilter("todo_search", "");
  const [priorityFilter, setPriorityFilter, resetPriority] = useSessionFilter<"all" | "عالية" | "متوسطة" | "منخفضة">("todo_priority", "all");
  const [newTask, setNewTask] = useState({ title: "", taskType: "مهمة", priority: "متوسطة", dueDate: "", assigneeEmployeeId: "", assigneeName: "" });
  const [saving, setSaving] = useState(false);

  const reload = () => getAllTasks().then(setTasks).catch(() => {});

  useEffect(() => {
    void reload();
    getAllEmployees(1, 200).then(l => setEmployees(l.filter(e => e.isActive))).catch(() => {});
  }, []);

  const filtered = tasks.filter(t => {
    if (filter === "pending" && t.status !== "pending") return false;
    if (filter === "completed" && t.status !== "completed") return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search && !t.title.includes(search) && !(t.assigneeName || "").includes(search)) return false;
    return true;
  });

  const pending = tasks.filter(t => t.status === "pending");
  const completed = tasks.filter(t => t.status === "completed");

  const toggleTask = async (task: BackendTask) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await updateTask({ id: task.id, title: task.title, taskType: task.taskType, priority: task.priority,
        dueDate: task.dueDate ?? undefined, assigneeEmployeeId: task.assigneeEmployeeId ?? undefined,
        assigneeName: task.assigneeName ?? undefined, notes: task.notes ?? undefined,
        status: newStatus, isActive: true });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث المهمة");
    }
  };

  const handleDelete = async (task: BackendTask) => {
    try {
      await deactivateTask(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast.success(`تم حذف المهمة "${task.title}"`);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حذف المهمة");
    }
  };

  const handleAdd = async () => {
    if (!newTask.title) { toast.error("يرجى إدخال عنوان المهمة"); return; }
    setSaving(true);
    try {
      const emp = employees.find(e => e.id === newTask.assigneeEmployeeId);
      const added = await addTask({
        title: newTask.title, taskType: newTask.taskType, priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
        assigneeEmployeeId: newTask.assigneeEmployeeId || undefined,
        assigneeName: emp?.arName || emp?.fullName || undefined,
      });
      setTasks(prev => [added, ...prev]);
      setShowAdd(false);
      setNewTask({ title: "", taskType: "مهمة", priority: "متوسطة", dueDate: "", assigneeEmployeeId: "", assigneeName: "" });
      toast.success("تم إضافة المهمة بنجاح");
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة المهمة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim}>
        <PageHeader icon={CheckSquare} title="قائمة المهام"
          subtitle={`${pending.length} مهمة معلقة، ${completed.length} مكتملة`} color="pink"
          actions={<Button onClick={() => setShowAdd(true)} className="gap-2"><Plus className="w-4 h-4" />إضافة مهمة</Button>}
        />
      </motion.div>

      <motion.div variants={anim} className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المهام", value: tasks.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "معلقة", value: pending.length, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "مكتملة", value: completed.length, color: "text-green-600", bg: "bg-green-50" },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className={cn("p-4 text-center rounded-xl", s.bg)}>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={anim} className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input dir="rtl" placeholder="ابحث عن مهمة أو مسؤول..." className="pr-9 pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["all", "pending", "completed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", filter === f ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                {f === "all" ? "الكل" : f === "pending" ? "معلقة" : "مكتملة"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["all", "عالية", "متوسطة", "منخفضة"] as const).map(p => (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                  priorityFilter === p ? p === "all" ? "bg-blue-600 text-white shadow-sm" : p === "عالية" ? "bg-red-500 text-white shadow-sm" : p === "متوسطة" ? "bg-orange-500 text-white shadow-sm" : "bg-gray-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                {p !== "all" && <div className={cn("w-1.5 h-1.5 rounded-full", priorityFilter === p ? "bg-white" : priorityDot[p])} />}
                {p === "all" ? "كل الأولويات" : p}
              </button>
            ))}
          </div>
          {(search || filter !== "all" || priorityFilter !== "all") && (
            <Button size="sm" variant="outline" onClick={() => { resetSearch(); resetFilter(); resetPriority(); }}>إعادة تعيين</Button>
          )}
        </div>
      </motion.div>

      <motion.div variants={anim} className="space-y-3">
        <AnimatePresence>
          {filtered.map(task => (
            <motion.div key={task.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97, height: 0 }} transition={{ duration: 0.2 }}>
              <Card className={cn("border-0 shadow-sm hover:shadow-md transition-all duration-200", task.status === "completed" && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={task.status === "completed"} onCheckedChange={() => toggleTask(task)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("font-medium text-gray-800", task.status === "completed" && "line-through text-gray-400")}>{task.title}</p>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", typeColors[task.taskType] || "bg-blue-100 text-blue-700")}>{task.taskType}</span>
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", priorityColors[task.priority] || "bg-gray-100 text-gray-600")}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", priorityDot[task.priority] || "bg-gray-400")} />{task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        {task.dueDate && <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3.5 h-3.5" />{new Date(task.dueDate).toLocaleDateString("ar-EG")}</span>}
                        {task.assigneeName && <span className="flex items-center gap-1 text-xs text-gray-500"><User className="w-3.5 h-3.5" />{task.assigneeName}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(task)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>لا توجد مهام</p>
          </div>
        )}
      </motion.div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>إضافة مهمة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>عنوان المهمة *</Label>
              <Input placeholder="وصف المهمة" dir="rtl" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>النوع</Label>
                <Select value={newTask.taskType} onValueChange={v => setNewTask({...newTask, taskType: v})}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="مهمة">مهمة</SelectItem>
                    <SelectItem value="مصروف">مصروف</SelectItem>
                    <SelectItem value="تذكير">تذكير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select value={newTask.priority} onValueChange={v => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="عالية">عالية</SelectItem>
                    <SelectItem value="متوسطة">متوسطة</SelectItem>
                    <SelectItem value="منخفضة">منخفضة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>تاريخ الاستحقاق</Label>
                <Input type="date" dir="rtl" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>المسؤول</Label>
                <Select value={newTask.assigneeEmployeeId} onValueChange={v => setNewTask({...newTask, assigneeEmployeeId: v})}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المسؤول" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.arName || e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row-reverse">
            <Button onClick={handleAdd} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">{saving ? "جاري الإضافة..." : "إضافة"}</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
