import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Edit,
  Trash2,
  QrCode,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Snowflake,
  Settings2,
  MapPin,
  Zap,
  LayoutGrid,
  List,
  Search,
  X,
  Eye,
  Building2,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { SearchToggle } from "../components/widgets/SearchToggle";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useDb } from "../context/DbContext";
import { useConfirmDelete } from "../components/ui/ConfirmDialog";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

const opStatusColors: Record<string, string> = {
  تشغيل: "bg-green-100 text-green-700 border-green-200",
  صيانة: "bg-orange-100 text-orange-700 border-orange-200",
  إيقاف: "bg-red-100 text-red-700 border-red-200",
};
const storageTypeColors: Record<
  string,
  { badge: string; header: string }
> = {
  تجميد: {
    badge: "bg-blue-100 text-blue-700",
    header: "bg-blue-600",
  },
  تبريد: {
    badge: "bg-cyan-100 text-cyan-700",
    header: "bg-cyan-500",
  },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const row = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const defaultWH = {
  letter: "",
  name: "",
  storageType: "",
  operationStatus: "تشغيل",
  length: "",
  width: "",
  height: "",
  capacityWeight: "",
  capacityBox: "",
  capacitySack: "",
  capacityCarton: "",
  machineType: "",
  machinePower: "",
  dailyRent: "",
  monthlyRent: "",
  notes: "",
};
const defaultCH = {
  storageType: "",
  temp: "",
  cells: "",
  length: "",
  width: "",
  height: "",
  capacityWeight: "",
  capacityBox: "",
  capacitySack: "",
  capacityCarton: "",
  notes: "",
};

export function Warehouses() {
  const { warehouses, chambers, updateWarehouse, deleteWarehouse, deleteChamber } = useDb();
  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showAddWH, setShowAddWH] = useState(false);
  const [showAddCH, setShowAddCH] = useState<number | null>(
    null,
  );
  const [newWH, setNewWH] = useState({ ...defaultWH });
  const [newCH, setNewCH] = useState({ ...defaultCH });
  const [view, setView] = useState<"grid" | "list">("list");
  const [search, setSearch] = useState("");

  /* ── Edit Warehouse State ── */
  type WHRow = (typeof warehouses)[number];
  const [editWH, setEditWH] = useState(null as WHRow | null);
  const [editWHForm, setEditWHForm] = useState({ ...defaultWH });

  const openEditWH = (wh: WHRow) => {
    setEditWH(wh);
    setEditWHForm({
      letter: wh.letter,
      name: wh.name,
      storageType: wh.storageType,
      operationStatus: wh.machineStatus,
      length: String(wh.length ?? ""),
      width: String(wh.width ?? ""),
      height: String(wh.height ?? ""),
      capacityWeight: String(wh.totalCapacity ?? ""),
      capacityBox: String(wh.capacityBox ?? ""),
      capacitySack: String(wh.capacitySack ?? ""),
      capacityCarton: String(wh.capacityCarton ?? ""),
      machineType: wh.machineType ?? "",
      machinePower: String(wh.machinePower ?? ""),
      dailyRent: String(wh.dailyRent ?? ""),
      monthlyRent: String(wh.monthlyRent ?? ""),
      notes: wh.notes ?? "",
    });
  };

  const handleSaveEditWH = () => {
    if (!editWH) return;
    if (!editWHForm.letter || !editWHForm.name) {
      toast.error("يرجى إدخال حرف الثلاجة والاسم");
      return;
    }
    updateWarehouse(editWH.id, {
      letter: editWHForm.letter,
      name: editWHForm.name,
      storageType: editWHForm.storageType,
      machineStatus: editWHForm.operationStatus,
      machineType: editWHForm.machineType,
      machinePower: Number(editWHForm.machinePower) || 0,
      dailyRent: Number(editWHForm.dailyRent) || 0,
      monthlyRent: Number(editWHForm.monthlyRent) || 0,
      notes: editWHForm.notes,
    });
    toast.success(`تم تحديث بيانات ثلاجة "${editWHForm.name}" بنجاح`);
    setEditWH(null);
  };

  const toggleExpand = (id: number) =>
    setExpanded(expanded === id ? null : id);

  const handleAddWH = () => {
    if (!newWH.letter || !newWH.name) {
      toast.error("يرجى إدخال حرف الثلاجة والاسم");
      return;
    }
    toast.success("تم إضافة الثلاجة بنجاح");
    setShowAddWH(false);
    setNewWH({ ...defaultWH });
  };
  const handleAddCH = () => {
    toast.success("تم إضافة العنبر بنجاح");
    setShowAddCH(null);
    setNewCH({ ...defaultCH });
  };

  const filtered = warehouses.filter(w =>
    w.name.includes(search) ||
    w.letter.includes(search) ||
    w.machineType.includes(search)
  );

  const totalActive = filtered.filter(
    (w) => w.machineStatus === "تشغيل",
  ).length;
  const totalMaintenance = filtered.filter(
    (w) => w.machineStatus === "صيانة",
  ).length;
  const totalCapacity = filtered.reduce(
    (s, w) => s + w.totalCapacity,
    0,
  );
  const totalOccupied = filtered.reduce(
    (s, w) => s + w.occupied,
    0,
  );
  const overallPct = Math.round(
    (totalOccupied / totalCapacity) * 100,
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={row}>
        <PageHeader
          icon={Building2}
          title="الثلاجات"
          subtitle={`إجمالي ${warehouses.length} ثلاجات — إشغال كلي ${overallPct}%`}
          color="cyan"
          actions={
            <>
              <SearchToggle view={view} setView={setView} search={search} setSearch={setSearch} placeholder="بحث باسم الثلاجة أو الحرف أو نوع الماكينة..." />
              <Button onClick={() => setShowAddWH(true)} className="gap-2">
                <Plus className="w-4 h-4" />إضافة ثلاجة
              </Button>
            </>
          }
        />
      </motion.div>

      {/* ── Summary Cards ───────────────────────────────────────────── */}
      <motion.div
        variants={row}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          {
            label: "إجمالي الثلاجات",
            value: warehouses.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "قيد التشغيل",
            value: totalActive,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "تحت الصيانة",
            value: totalMaintenance,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
          {
            label: "الطاقة الكلية",
            value: `${totalCapacity} طن`,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
        ].map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">
                {s.label}
              </p>
              <p className={cn("text-xl font-bold", s.color)}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* ── Main Content ──────────────────────────────────────────────── */}
      <motion.div variants={row}>
        {view === "grid" ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>لا توجد نتائج</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((wh) => (
                    <motion.div key={wh.id} variants={anim}>
                      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        <CardContent className="p-5">
                          <div className="text-center mb-4">
                            <div className="relative inline-block">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-xl font-bold mx-auto">
                                {wh.letter}
                              </div>
                              <div className={cn("absolute bottom-0 left-0 w-4 h-4 rounded-full border-2 border-white", wh.machineStatus === "تشغيل" ? "bg-green-500" : "bg-gray-400")} />
                            </div>
                            <h3 className="font-semibold text-gray-800 mt-3 text-sm leading-snug">{wh.name}</h3>
                            <Badge className={cn("text-xs border mt-1", opStatusColors[wh.machineStatus])}>{wh.machineStatus}</Badge>
                          </div>
                          <div className="space-y-1.5 text-xs text-gray-500 border-t pt-3">
                            <p>{wh.storageType}</p>
                            <p>{wh.machineType}</p>
                            <p className="text-green-600 font-medium">{wh.dailyRent} ج.م/يوم</p>
                          </div>
                          <div className="flex items-center justify-center gap-1 mt-4">
                            <button className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                              <Eye className="w-3.5 h-3.5" />عرض
                            </button>
                            <button
                              className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                              onClick={() => openEditWH(wh)}
                            >
                              <Edit className="w-3.5 h-3.5" />تعديل
                            </button>
                            <button
                              className="flex items-center gap-1 text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors"
                              onClick={() => { toggleExpand(wh.id); }}
                            >
                              {wh.chambers > 0 ? (
                                <MapPin className="w-3.5 h-3.5" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              عنابر ({wh.chambers})
                            </button>
                            <button
                              className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                              onClick={() =>
                                confirmDelete(wh.name, () => {
                                  deleteWarehouse(wh.id);
                                  toast.success(`تم حذف ثلاجة "${wh.name}" بنجاح`);
                                }, { title: "حذف الثلاجة", description: `سيتم حذف ثلاجة "${wh.name}" وجميع عنابرها نهائياً.` })
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />حذف
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="bg-gray-50 border-b px-4 py-2.5">
              <div
                className="grid text-xs font-semibold text-gray-500 gap-2"
                style={{
                  gridTemplateColumns:
                    "2.4fr 0.7fr 0.9fr 2fr 1.4fr 1.4fr 0.9fr 100px",
                }}
              >
                <span>الثلاجة</span>
                <span>العنابر</span>
                <span>نوع التخزين</span>
                <span>نسبة الإشغال</span>
                <span>الماكينة</span>
                <span>الإيجار يومي / شهري</span>
                <span>حالة التشغيل</span>
                <span></span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map((wh, idx) => {
              const pct = Math.round(
                (wh.occupied / wh.totalCapacity) * 100,
              );
              const isExpanded = expanded === wh.id;
              const wChambers = chambers.filter(
                (c) => c.warehouseId === wh.id,
              );
              const stColors =
                storageTypeColors[wh.storageType] ??
                storageTypeColors["تبريد"];

              return (
                <div
                  key={wh.id}
                  className={cn(
                    idx % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50/50",
                  )}
                >
                  {/* Main row */}
                  <div>
                    <div
                      className="grid items-center px-4 py-3 gap-2 hover:bg-blue-50/25 transition-colors"
                      style={{
                        gridTemplateColumns:
                          "2.4fr 0.7fr 0.9fr 2fr 1.4fr 1.4fr 0.9fr 100px",
                      }}
                    >
                      {/* Name + letter */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                            stColors.header,
                          )}
                        >
                          <span className="text-white font-bold">
                            {wh.letter}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {wh.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {wh.machineType}
                          </p>
                        </div>
                      </div>

                      {/* Chambers */}
                      <span className="text-sm text-gray-700">
                        {wh.chambers}
                      </span>

                      {/* Storage type */}
                      <Badge
                        className={cn(
                          "text-xs border-0 w-fit gap-1",
                          stColors.badge,
                        )}
                      >
                        {wh.storageType === "تجميد" ? (
                          <Snowflake className="w-3 h-3" />
                        ) : (
                          <Thermometer className="w-3 h-3" />
                        )}
                        {wh.storageType}
                      </Badge>

                      {/* Occupancy */}
                      <div className="space-y-1 pl-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {wh.occupied}/{wh.totalCapacity} طن
                          </span>
                          <span
                            className={cn(
                              "font-semibold",
                              pct > 90
                                ? "text-red-600"
                                : pct > 70
                                  ? "text-orange-500"
                                  : "text-green-600",
                            )}
                          >
                            {pct}%
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className={cn(
                            "h-2",
                            pct > 90
                              ? "[&>div]:bg-red-500"
                              : pct > 70
                                ? "[&>div]:bg-orange-400"
                                : "[&>div]:bg-green-500",
                          )}
                        />
                      </div>

                      {/* Machine */}
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {wh.machinePower} حصان
                        </span>
                      </div>

                      {/* Rent */}
                      <div>
                        <p className="text-sm text-gray-700">
                          {wh.dailyRent} ج.م
                          <span className="text-xs text-gray-400">
                            {" "}
                            / يوم
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {wh.monthlyRent} ج.م
                          <span className="text-gray-400">
                            {" "}
                            / شهر (28 يوم)
                          </span>
                        </p>
                      </div>

                      {/* Status */}
                      <Badge
                        className={cn(
                          "text-xs border w-fit",
                          opStatusColors[wh.machineStatus],
                        )}
                      >
                        {wh.machineStatus}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5">
                        <button
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                          title="تعديل"
                          onClick={() => openEditWH(wh)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                          onClick={() => toggleExpand(wh.id)}
                          title="عرض العنابر"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                          title="QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="حذف الثلاجة"
                          onClick={() =>
                            confirmDelete(wh.name, () => {
                              deleteWarehouse(wh.id);
                              if (expanded === wh.id) setExpanded(null);
                              toast.success(`تم حذف ثلاجة "${wh.name}" بنجاح`);
                            }, { title: "حذف الثلاجة", description: `سيتم حذف ثلاجة "${wh.name}" وجميع عنابرها نهائياً.` })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Expanded Chambers ─────────────────────────────── */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key="chambers"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="border-t border-blue-100 bg-gradient-to-b from-blue-50/70 to-blue-50/20 px-4 py-4"
                      >
                        {/* Chambers header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">
                              عنابر ثلاجة {wh.letter}
                            </span>
                            <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                              {wChambers.length} عنبر
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs gap-1"
                            onClick={() => setShowAddCH(wh.id)}
                          >
                            <Plus className="w-3 h-3" />
                            إضافة عنبر
                          </Button>
                        </div>

                        {wChambers.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {wChambers.map((ch) => {
                              const chPct = Math.round(
                                (ch.occupied / ch.cells) * 100,
                              );
                              const chColors =
                                storageTypeColors[
                                  ch.storageType
                                ] ?? storageTypeColors["تبريد"];
                              return (
                                <div
                                  key={ch.id}
                                  className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden"
                                >
                                  {/* Chamber top bar */}
                                  <div
                                    className={cn(
                                      "px-3 py-2 flex items-center justify-between",
                                      chColors.header,
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-bold text-sm">
                                        {ch.code}
                                      </span>
                                      <Badge className="bg-white/20 text-white border-0 text-xs">
                                        {ch.storageType}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-white/80 text-xs font-medium">
                                        {ch.temp}°م
                                      </span>
                                      <button
                                        onClick={() =>
                                          confirmDelete(ch.code, () => {
                                            deleteChamber(ch.id);
                                            toast.success(`تم حذف العنبر "${ch.code}" بنجاح`);
                                          }, { title: "حذف العنبر", description: `سيتم حذف العنبر "${ch.code}" نهائياً.` })
                                        }
                                        className="p-1 rounded bg-white/10 hover:bg-white/25 text-white/80 hover:text-white transition-colors"
                                        title="حذف العنبر"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="p-3 space-y-2.5">
                                    {/* Location tree */}
                                    <div className="flex items-center gap-1 text-xs">
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                                        {wh.letter}
                                      </span>
                                      <span className="text-gray-400">
                                        ›
                                      </span>
                                      <span
                                        className={cn(
                                          "px-1.5 py-0.5 rounded font-medium",
                                          chColors.badge,
                                        )}
                                      >
                                        {ch.code}
                                      </span>
                                      <span className="text-gray-400">
                                        ›
                                      </span>
                                      <span className="text-gray-500">
                                        {ch.cells} مربع
                                      </span>
                                    </div>

                                    {/* Dimensions */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                      <Settings2 className="w-3 h-3 flex-shrink-0 text-gray-400" />
                                      <span>
                                        {ch.length}م ×{" "}
                                        {ch.width}م ×{" "}
                                        {ch.height}م
                                      </span>
                                    </div>

                                    {/* Capacity by weight */}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-400">
                                        السعة بالوزن
                                      </span>
                                      <span className="font-semibold text-gray-700">
                                        {ch.capacityWeight} طن
                                      </span>
                                    </div>

                                    {/* Capacity by packages */}
                                    <div className="grid grid-cols-3 gap-1">
                                      {[
                                        {
                                          label: "طرد",
                                          val: ch.capacityBox,
                                        },
                                        {
                                          label: "شوال",
                                          val: ch.capacitySack,
                                        },
                                        {
                                          label: "كرتونة",
                                          val: ch.capacityCarton,
                                        },
                                      ].map((pkg) => (
                                        <div
                                          key={pkg.label}
                                          className="bg-gray-50 rounded-lg p-1.5 text-center"
                                        >
                                          <p className="text-gray-400 text-[10px] leading-none mb-0.5">
                                            {pkg.label}
                                          </p>
                                          <p className="font-semibold text-gray-700 text-xs">
                                            {pkg.val}
                                          </p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Occupancy */}
                                    <div>
                                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>
                                          {ch.occupied}/
                                          {ch.cells} مشغول
                                        </span>
                                        <span
                                          className={cn(
                                            "font-semibold",
                                            chPct > 90
                                              ? "text-red-600"
                                              : chPct > 70
                                                ? "text-orange-500"
                                                : "text-green-600",
                                          )}
                                        >
                                          {chPct}%
                                        </span>
                                      </div>
                                      <Progress
                                        value={chPct}
                                        className={cn(
                                          "h-1.5",
                                          chPct > 90
                                            ? "[&>div]:bg-red-500"
                                            : chPct > 70
                                              ? "[&>div]:bg-orange-400"
                                              : "[&>div]:bg-green-500",
                                        )}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-6">
                            لا توجد عنابر — اضغط "إضافة عنبر"
                            لإضافة أول عنبر
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Card>
        )
      }
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════
          Dialog: إضافة ثلاجة جديدة
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={showAddWH} onOpenChange={setShowAddWH}>
        <DialogContent
          dir="rtl"
          className="max-w-lg max-h-[90vh] overflow-y-auto bg-white text-right"
        >
          <DialogHeader>
            <DialogTitle>إضافة ثلاجة جديدة</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basics" className="w-full" dir="rtl">
            <TabsList
              dir="rtl"
              className="grid grid-cols-4 w-full mb-2 bg-[#f3f4f6] rounded-xl p-1 h-auto"
            >
              <TabsTrigger
                value="basics"
                className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700"
              >
                الأساسيات
              </TabsTrigger>
              <TabsTrigger
                value="capacity"
                className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700"
              >
                الأبعاد والسعة
              </TabsTrigger>
              <TabsTrigger
                value="machine"
                className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700"
              >
                الماكينة والأسعار
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700"
              >
                ملاحظات
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Basics ── */}
            <TabsContent
              value="basics"
              className="space-y-4 mt-0 pt-2"
            >
              <div className="grid grid-cols-3 gap-3">
                {/* اسم الثلاجة أولاً ← يظهر على اليمين في RTL */}
                <div className="col-span-2 space-y-1.5">
                  <Label>اسم الثلاجة *</Label>
                  <Input
                    placeholder="مثال: ثلاجة الفواكه"
                    dir="rtl"
                    className="border border-[#d1d5dc] bg-[#f9fafb]"
                    value={newWH.name}
                    onChange={(e) =>
                      setNewWH({
                        ...newWH,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                {/* حرف الثلاجة ثانياً ← يظهر على اليسار في RTL */}
                <div className="space-y-1.5">
                  <Label>حرف الثلاجة *</Label>
                  <Input
                    placeholder="A"
                    maxLength={2}
                    className="text-center uppercase border border-[#d1d5dc] bg-[#f9fafb]"
                    dir="ltr"
                    value={newWH.letter}
                    onChange={(e) =>
                      setNewWH({
                        ...newWH,
                        letter: e.target.value.toUpperCase(),
                      })
                    }
                  />
                  <p className="text-xs text-gray-400">
                    كود: F-1، F-2...
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* حالة التشغيل أولاً ← يظهر على اليمين في RTL */}
                <div className="space-y-1.5">
                  <Label>حالة التشغيل</Label>
                  <Select
                    value={newWH.operationStatus}
                    onValueChange={(v) =>
                      setNewWH({ ...newWH, operationStatus: v })
                    }
                  >
                    <SelectTrigger
                      dir="rtl"
                      className="border border-[#d1d5dc] bg-white"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="تشغيل">تشغيل</SelectItem>
                      <SelectItem value="صيانة">صيانة</SelectItem>
                      <SelectItem value="إيقاف">إيقاف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* نوع التخزين ثانياً ← يظهر على اليسار في RTL */}
                <div className="space-y-1.5">
                  <Label>نوع التخزين</Label>
                  <Select
                    onValueChange={(v) =>
                      setNewWH({ ...newWH, storageType: v })
                    }
                  >
                    <SelectTrigger
                      dir="rtl"
                      className="border border-[#d1d5dc] bg-white"
                    >
                      <SelectValue placeholder="اختر نوع التخزين" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="تجميد">تجميد</SelectItem>
                      <SelectItem value="تبريد">تبريد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Dimensions & Capacity ── */}
            <TabsContent
              value="capacity"
              className="space-y-4 mt-0 pt-2"
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  الأبعاد
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>الطول (م)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.length}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          length: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>العرض (م)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.width}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          width: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الارتفاع (م)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.height}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          height: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  السعة بالوزن
                </p>
                <div className="space-y-1.5">
                  <Label>السعة الكلية (طن)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newWH.capacityWeight}
                    onChange={(e) =>
                      setNewWH({
                        ...newWH,
                        capacityWeight: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  السعة بالعبوات
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>طرد</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.capacityBox}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          capacityBox: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>شوال</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.capacitySack}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          capacitySack: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>كرتونة</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.capacityCarton}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          capacityCarton: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Machine & Pricing ── */}
            <TabsContent
              value="machine"
              className="space-y-4 mt-0 pt-2"
            >
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  الماكينة
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>نوع الماكينة</Label>
                    <Input
                      placeholder="مثال: كمبروسور مكثف هواء"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.machineType}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          machineType: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>القدرة (حصان)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.machinePower}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          machinePower: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  أسعار الإيجار
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>الإيجار اليومي (ج.م)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.dailyRent}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          dailyRent: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-gray-400">
                      يختلف لكل عميل حسب تسعيره
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الإيجار الشهري (ج.م)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      dir="rtl"
                      className="border border-gray-300"
                      value={newWH.monthlyRent}
                      onChange={(e) =>
                        setNewWH({
                          ...newWH,
                          monthlyRent: e.target.value,
                        })
                      }
                    />
                    <p className="text-xs text-blue-500 font-medium">
                      الشهر = 28 يوم تبريد
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 4: Notes ── */}
            <TabsContent value="notes" className="mt-0 pt-2">
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea
                  placeholder="ملاحظات إضافية..."
                  dir="rtl"
                  rows={5}
                  className="resize-none border border-gray-300"
                  value={newWH.notes}
                  onChange={(e) =>
                    setNewWH({
                      ...newWH,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 justify-end mt-2">
            <Button
              onClick={handleAddWH}
              className="bg-[#155dfc] hover:bg-blue-700 text-white"
            >
              حفظ الثلاجة
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddWH(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════
          Dialog: إضافة عنبر
      ══════════════════════════════════════════════════════════════ */}
      <Dialog
        open={showAddCH !== null}
        onOpenChange={() => setShowAddCH(null)}
      >
        <DialogContent
          dir="rtl"
          className="max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              إضافة عنبر جديد
              {showAddCH &&
                (() => {
                  const wh = warehouses.find(
                    (w) => w.id === showAddCH,
                  );
                  const nextNum =
                    chambers.filter(
                      (c) => c.warehouseId === showAddCH,
                    ).length + 1;
                  return wh ? (
                    <Badge className="bg-blue-100 text-blue-700 border-0 mr-1">
                      كود: {wh.letter}-{nextNum}
                    </Badge>
                  ) : null;
                })()}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Storage type & temp */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>نوع التخزين</Label>
                <Select
                  onValueChange={(v) =>
                    setNewCH({ ...newCH, storageType: v })
                  }
                >
                  <SelectTrigger dir="rtl" className="border border-gray-300 bg-white">
                    <SelectValue placeholder="اختر نوع التخزين" />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="تجميد">تجميد</SelectItem>
                    <SelectItem value="تبريد">تبريد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>درجة الحرارة (°م)</Label>
                <Input
                  type="number"
                  placeholder="مثال: -18"
                  dir="rtl"
                  className="border border-gray-300"
                  value={newCH.temp}
                  onChange={(e) =>
                    setNewCH({ ...newCH, temp: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                الأبعاد
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>الطول (م)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newCH.length}
                    onChange={(e) =>
                      setNewCH({
                        ...newCH,
                        length: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>العرض (م)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newCH.width}
                    onChange={(e) =>
                      setNewCH({
                        ...newCH,
                        width: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>الارتفاع (م)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newCH.height}
                    onChange={(e) =>
                      setNewCH({
                        ...newCH,
                        height: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Cells & weight capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>عدد المربعات</Label>
                <Input
                  type="number"
                  placeholder="0"
                  dir="rtl"
                  className="border border-gray-300"
                  value={newCH.cells}
                  onChange={(e) =>
                    setNewCH({
                      ...newCH,
                      cells: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>السعة بالوزن (طن)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  dir="rtl"
                  className="border border-gray-300"
                  value={newCH.capacityWeight}
                  onChange={(e) =>
                    setNewCH({
                      ...newCH,
                      capacityWeight: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Capacity by packages */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                السعة بالعبوات
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>طرد</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newCH.capacityBox}
                    onChange={(e) =>
                      setNewCH({
                        ...newCH,
                        capacityBox: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>شوال</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newCH.capacitySack}
                    onChange={(e) =>
                      setNewCH({
                        ...newCH,
                        capacitySack: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>كرتونة</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    dir="rtl"
                    className="border border-gray-300"
                    value={newCH.capacityCarton}
                    onChange={(e) =>
                      setNewCH({
                        ...newCH,
                        capacityCarton: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Textarea
                placeholder="ملاحظات إضافية..."
                dir="rtl"
                rows={2}
                className="resize-none border border-gray-300"
                value={newCH.notes}
                onChange={(e) =>
                  setNewCH({ ...newCH, notes: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row-reverse">
            <Button
              onClick={handleAddCH}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              حفظ العنبر
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddCH(null)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {confirmDialog}

      {/* ══════════════════════════════════════════════════════════════
          Dialog: تعديل ثلاجة
      ══════════════════════════════════════════════════════════════ */}
      <Dialog open={!!editWH} onOpenChange={() => setEditWH(null)}>
        <DialogContent
          dir="rtl"
          className="max-w-lg max-h-[90vh] overflow-y-auto bg-white text-right"
        >
          <DialogHeader>
            <DialogTitle>تعديل ثلاجة: {editWH?.name}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basics" className="w-full" dir="rtl">
            <TabsList
              dir="rtl"
              className="grid grid-cols-4 w-full mb-2 bg-[#f3f4f6] rounded-xl p-1 h-auto"
            >
              <TabsTrigger value="basics" className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">
                الأساسيات
              </TabsTrigger>
              <TabsTrigger value="capacity" className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">
                الأبعاد والسعة
              </TabsTrigger>
              <TabsTrigger value="machine" className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">
                الماكينة والأسعار
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700">
                ملاحظات
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Basics ── */}
            <TabsContent value="basics" className="space-y-4 mt-0 pt-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>اسم الثلاجة *</Label>
                  <Input
                    dir="rtl"
                    className="border border-[#d1d5dc] bg-[#f9fafb]"
                    value={editWHForm.name}
                    onChange={(e) => setEditWHForm({ ...editWHForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>حرف الثلاجة *</Label>
                  <Input
                    maxLength={2}
                    className="text-center uppercase border border-[#d1d5dc] bg-[#f9fafb]"
                    dir="ltr"
                    value={editWHForm.letter}
                    onChange={(e) => setEditWHForm({ ...editWHForm, letter: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>حالة التشغيل</Label>
                  <Select
                    value={editWHForm.operationStatus}
                    onValueChange={(v) => setEditWHForm({ ...editWHForm, operationStatus: v })}
                  >
                    <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="تشغيل">تشغيل</SelectItem>
                      <SelectItem value="صيانة">صيانة</SelectItem>
                      <SelectItem value="إيقاف">إيقاف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>نوع التخزين</Label>
                  <Select
                    value={editWHForm.storageType}
                    onValueChange={(v) => setEditWHForm({ ...editWHForm, storageType: v })}
                  >
                    <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="تجميد">تجميد</SelectItem>
                      <SelectItem value="تبريد">تبريد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 2: Capacity ── */}
            <TabsContent value="capacity" className="space-y-4 mt-0 pt-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">الأبعاد</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{label:"الطول (م)",key:"length"},{label:"العرض (م)",key:"width"},{label:"الارتفاع (م)",key:"height"}].map(({label,key}) => (
                    <div key={key} className="space-y-1.5">
                      <Label>{label}</Label>
                      <Input type="number" placeholder="0" dir="rtl" className="border border-gray-300"
                        value={editWHForm[key as keyof typeof editWHForm]}
                        onChange={(e) => setEditWHForm({ ...editWHForm, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>السعة الكلية (طن)</Label>
                <Input type="number" placeholder="0" dir="rtl" className="border border-gray-300"
                  value={editWHForm.capacityWeight}
                  onChange={(e) => setEditWHForm({ ...editWHForm, capacityWeight: e.target.value })} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">السعة بالعبوات</p>
                <div className="grid grid-cols-3 gap-3">
                  {[{label:"طرد",key:"capacityBox"},{label:"شوال",key:"capacitySack"},{label:"كرتونة",key:"capacityCarton"}].map(({label,key}) => (
                    <div key={key} className="space-y-1.5">
                      <Label>{label}</Label>
                      <Input type="number" placeholder="0" dir="rtl" className="border border-gray-300"
                        value={editWHForm[key as keyof typeof editWHForm]}
                        onChange={(e) => setEditWHForm({ ...editWHForm, [key]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 3: Machine & Pricing ── */}
            <TabsContent value="machine" className="space-y-4 mt-0 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>نوع الماكينة</Label>
                  <Input placeholder="كمبروسور مكثف هواء" dir="rtl" className="border border-gray-300"
                    value={editWHForm.machineType}
                    onChange={(e) => setEditWHForm({ ...editWHForm, machineType: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>القدرة (حصان)</Label>
                  <Input type="number" placeholder="0" dir="rtl" className="border border-gray-300"
                    value={editWHForm.machinePower}
                    onChange={(e) => setEditWHForm({ ...editWHForm, machinePower: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>الإيجار اليومي (ج.م)</Label>
                  <Input type="number" placeholder="0.00" dir="rtl" className="border border-gray-300"
                    value={editWHForm.dailyRent}
                    onChange={(e) => setEditWHForm({ ...editWHForm, dailyRent: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الإيجار الشهري (ج.م)</Label>
                  <Input type="number" placeholder="0.00" dir="rtl" className="border border-gray-300"
                    value={editWHForm.monthlyRent}
                    onChange={(e) => setEditWHForm({ ...editWHForm, monthlyRent: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            {/* ── Tab 4: Notes ── */}
            <TabsContent value="notes" className="mt-0 pt-2">
              <div className="space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea
                  placeholder="ملاحظات إضافية..."
                  dir="rtl"
                  rows={5}
                  className="resize-none border border-gray-300"
                  value={editWHForm.notes}
                  onChange={(e) => setEditWHForm({ ...editWHForm, notes: e.target.value })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEditWH} className="bg-[#155dfc] hover:bg-blue-700 text-white">
              حفظ التعديلات
            </Button>
            <Button variant="outline" onClick={() => setEditWH(null)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}