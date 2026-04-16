import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, CheckSquare, Circle, Clock, User, Search, X } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { useDb } from "../context/DbContext";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

type Task = ReturnType<typeof useDb>["tasks"][0];

const priorityColors: Record<string, string> = {
  "عالية": "bg-red-100 text-red-700 border-red-200",
  "متوسطة": "bg-orange-100 text-orange-700 border-orange-200",
  "منخفضة": "bg-gray-100 text-gray-600 border-gray-200",
};

const priorityDot: Record<string, string> = {
  "عالية": "bg-red-500",
  "متوسطة": "bg-orange-500",
  "منخفضة": "bg-gray-400",
};

const typeColors: Record<string, string> = {
  "مصروف": "bg-purple-100 text-purple-700",
  "مهمة": "bg-blue-100 text-blue-700",
  "تذكير": "bg-yellow-100 text-yellow-700",
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function TodoList() {
  const { tasks: dbTasks, employees, addTask, updateTask } = useDb();
  const [tasks, setTasks] = useState(dbTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "عالية" | "متوسطة" | "منخفضة">("all");
  const [newTask, setNewTask] = useState({ title: "", type: "", priority: "", dueDate: "", assignee: "" });

  const toggleTask = (id: number) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t);
    setTasks(updated);
    const t = updated.find(task => task.id === id);
    if (t) updateTask(id, { status: t.status });
  };

  const filtered = tasks.filter(t => {
    if (filter !== "all" && (filter === "pending" ? t.status !== "pending" : t.status !== "completed")) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (search && !t.title.includes(search) && !t.assignee.includes(search)) return false;
    return true;
  });
  const pending = tasks.filter(t => t.status === "pending");
  const completed = tasks.filter(t => t.status === "completed");

  const handleAdd = () => {
    if (!newTask.title) { toast.error("يرجى إدخال عنوان المهمة"); return; }
    const task: Task = {
      id: Date.now(),
      title: newTask.title,
      type: newTask.type || "مهمة",
      priority: newTask.priority || "متوسطة",
      dueDate: newTask.dueDate || new Date().toISOString().split("T")[0],
      assignee: newTask.assignee || "أحمد محمد",
      status: "pending",
    };
    setTasks([task, ...tasks]);
    setShowAdd(false);
    setNewTask({ title: "", type: "", priority: "", dueDate: "", assignee: "" });
    toast.success("تم إضافة المهمة بنجاح");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={anim} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">قائمة المهام</h2>
          <p className="text-sm text-gray-500">{pending.length} مهمة معلقة، {completed.length} مكتملة</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="w-4 h-4" />إضافة مهمة
        </Button>
      </motion.div>

      {/* Summary */}
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

      {/* Search + Filters */}
      <motion.div variants={anim} className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            dir="rtl"
            placeholder="ابحث عن مهمة أو مسؤول..."
            className="pr-9 pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status + Priority filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["all", "pending", "completed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filter === f ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f === "all" ? "الكل" : f === "pending" ? "معلقة" : "مكتملة"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {(["all", "عالية", "متوسطة", "منخفضة"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
                  priorityFilter === p
                    ? p === "all" ? "bg-blue-600 text-white shadow-sm"
                      : p === "عالية" ? "bg-red-500 text-white shadow-sm"
                      : p === "متوسطة" ? "bg-orange-500 text-white shadow-sm"
                      : "bg-gray-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p !== "all" && <div className={cn("w-1.5 h-1.5 rounded-full", priorityFilter === p ? "bg-white" : priorityDot[p])} />}
                {p === "all" ? "كل الأولويات" : p}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tasks */}
      <motion.div variants={anim} className="space-y-3">
        <AnimatePresence>
          {filtered.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn("border-0 shadow-sm hover:shadow-md transition-all duration-200", task.status === "completed" && "opacity-60")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn("font-medium text-gray-800", task.status === "completed" && "line-through text-gray-400")}>
                          {task.title}
                        </p>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", typeColors[task.type])}>
                          {task.type}
                        </span>
                        <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", priorityColors[task.priority])}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", priorityDot[task.priority])} />
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          {task.dueDate}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <User className="w-3.5 h-3.5" />
                          {task.assignee}
                        </span>
                      </div>
                    </div>
                    {task.status === "completed" && (
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <CheckSquare className="w-3.5 h-3.5 text-green-600" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>لا توجد مهام</p>
          </div>
        )}
      </motion.div>

      {/* Add Task Dialog */}
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
                <Select onValueChange={v => setNewTask({...newTask, type: v})}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="مهمة">مهمة</SelectItem>
                    <SelectItem value="مصروف">مصروف</SelectItem>
                    <SelectItem value="تذكير">تذكير</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الأولوية</Label>
                <Select onValueChange={v => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر الأولوية" /></SelectTrigger>
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
                <Input type="date" dir="rtl" onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label>المسؤول</Label>
                <Select onValueChange={v => setNewTask({...newTask, assignee: v})}>
                  <SelectTrigger dir="rtl"><SelectValue placeholder="اختر المسؤول" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-row-reverse">
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white">إضافة</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}