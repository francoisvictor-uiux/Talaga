import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Edit, Trash2, Snowflake, Thermometer, Wind,
  Bell, Search, LayoutGrid, List, Package, X, Tag, Loader2,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { useConfirmDelete } from "../components/ui/ConfirmDialog";
import { SafeImage } from "../components/ui/SafeImage";
import { ImageUploader } from "../components/ui/ImageUploader";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import {
  getAllItems, getAllPackages,
  addItem as apiAddItem, editItem as apiEditItem, deleteItem as apiDeleteItem,
  addPackage as apiAddPkg, editPackage as apiEditPkg, deletePackage as apiDeletePkg,
  type BackendItem, type BackendPackage,
} from "../services/itemService";
import {
  getBrandsByItem, addBrand as apiAddBrand, editBrand as apiEditBrand, deleteBrand as apiDeleteBrand,
  type BackendBrand,
} from "../services/brandService";

/* ─── view shapes ─── */
type Item = {
  id: string;
  prefix: string;
  code: string;
  name: string;
  storageType: string;
  maxDays: number;
  alertDays: number;
  tempMin?: number;
  tempMax?: number;
  status: "active" | "inactive";
  image: string;
};
type Pkg = {
  id: string;
  code: string;
  type: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  status: "active" | "inactive";
  image: string;
};

const itemFromBackend = (i: BackendItem): Item => ({
  id: i.id,
  prefix: i.prefix ?? "",
  code: i.code,
  name: i.arName || i.name,
  storageType: i.storageType,
  maxDays: i.shelfLifeDays ?? 0,
  alertDays: i.alertDaysBeforeExpiry ?? 0,
  tempMin: i.temperatureMin ?? undefined,
  tempMax: i.temperatureMax ?? undefined,
  status: i.isActive ? "active" : "inactive",
  image: i.imageUrl ?? "",
});

const pkgFromBackend = (p: BackendPackage): Pkg => ({
  id: p.id,
  code: p.code,
  type: p.packageType ?? p.arName ?? p.name,
  weight: p.emptyWeightKg ?? 0,
  length: p.lengthCm ?? 0,
  width: p.widthCm ?? 0,
  height: p.heightCm ?? 0,
  status: p.isActive ? "active" : "inactive",
  image: p.imageUrl ?? "",
});

/* ─── storage config ─── */
const storageConfig: Record<string, { badge: string; icon: React.ElementType; grad: string }> = {
  "تجميد": { badge: "bg-blue-100 text-blue-700 border-blue-200",   icon: Snowflake,   grad: "from-blue-400 to-blue-700" },
  "تبريد": { badge: "bg-cyan-100 text-cyan-700 border-cyan-200",   icon: Thermometer, grad: "from-cyan-400 to-cyan-600" },
  "تنشير": { badge: "bg-amber-100 text-amber-700 border-amber-200", icon: Wind,        grad: "from-amber-400 to-orange-500" },
};

/* ─── package gradients ─── */
const pkgGrads: Record<string, string> = {
  "طرد":    "from-violet-400 to-violet-600",
  "شوال":   "from-green-400 to-green-600",
  "كرتونة": "from-orange-400 to-orange-600",
  "صندوق":  "from-sky-400 to-sky-600",
  "برميل":  "from-rose-400 to-rose-600",
};

const anim = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };


/* ══════════════════════════════════════════════════════════
   ItemCard
══════════════════════════════════════════════════════════ */
function ItemCard({ it, onDelete, onEdit, onBrands }: { it: Item; onDelete: (it: Item) => void; onEdit: (it: Item) => void; onBrands: (it: Item) => void }) {
  const cfg = storageConfig[it.storageType] ?? storageConfig["تبريد"];
  const Icon = cfg.icon;
  const alertDay = it.maxDays - it.alertDays;
  return (
    <motion.div variants={anim} className="h-full">
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Image / Avatar */}
        <div className={cn("relative h-36 flex-shrink-0 flex items-center justify-center bg-gradient-to-br", cfg.grad)}>
          <span className="text-white text-5xl font-black opacity-80 select-none">{it.prefix}</span>
          <SafeImage src={it.image} alt={it.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-2 right-2">
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-white/90 backdrop-blur-sm", cfg.badge)}>
              <Icon className="w-3 h-3" />{it.storageType}
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", it.status === "active" ? "bg-green-500 text-white" : "bg-gray-400 text-white")}>
              {it.status === "active" ? "نشط" : "غير نشط"}
            </span>
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4 flex flex-col flex-1">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-800 mb-0.5">{it.name}</h3>
            <span className="font-mono text-xs bg-gray-100 text-blue-700 px-2 py-0.5 rounded">{it.code}</span>
          </div>
          <div className="space-y-1.5 text-xs text-gray-500 border-t pt-3 flex-1">
            <div className="flex justify-between">
              <span>فترة التخزين</span>
              <span className="font-medium text-gray-700">{it.maxDays} يوم</span>
            </div>
            <div className="flex justify-between items-center text-orange-600">
              <span className="flex items-center gap-1"><Bell className="w-3 h-3" />تنبيه بعد</span>
              <span className="font-medium">{alertDay} يوم</span>
            </div>
            {(it.tempMin != null || it.tempMax != null) && (
              <div className="flex justify-between items-center text-blue-600">
                <span className="flex items-center gap-1"><Thermometer className="w-3 h-3" />نطاق الحرارة</span>
                <span className="font-medium font-mono">
                  {it.tempMin != null ? `${it.tempMin}°` : "—"} ~ {it.tempMax != null ? `${it.tempMax}°` : "—"}م
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
            <button
              className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
              onClick={() => onBrands(it)}
              title="ماركات الصنف"
            >
              <Tag className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => onEdit(it)}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => onDelete(it)}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PackageCard
══════════════════════════════════════════════════════════ */
function PackageCard({ pkg, onDelete, onEdit }: { pkg: Pkg; onDelete: (pkg: Pkg) => void; onEdit: (pkg: Pkg) => void }) {
  const grad = pkgGrads[pkg.type] ?? "from-gray-400 to-gray-600";
  return (
    <motion.div variants={anim} className="h-full">
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        <div className={cn("relative h-36 flex-shrink-0 flex items-center justify-center bg-gradient-to-br", grad)}>
          <div className="flex flex-col items-center gap-1">
            <Package className="w-10 h-10 text-white/80" />
            <span className="text-white text-sm font-semibold opacity-80">{pkg.type}</span>
          </div>
          <SafeImage src={pkg.image} alt={pkg.type} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute top-2 right-2">
            <span className="font-mono text-[10px] bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded">
              {pkg.code}
            </span>
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-gray-800 mb-3">{pkg.type}</h3>
          <div className="space-y-1.5 text-xs text-gray-500 border-t pt-3 flex-1">
            <div className="flex justify-between">
              <span>الوزن</span>
              <span className="font-medium text-gray-700">{pkg.weight} كجم</span>
            </div>
            <div className="flex justify-between">
              <span>الأبعاد</span>
              <span className="font-medium text-gray-700 font-mono">{pkg.length}×{pkg.width}×{pkg.height} سم</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
            <button
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              onClick={() => onEdit(pkg)}
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => onDelete(pkg)}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   ViewToggle
══════════════════════════════════════════════════════════ */
function ViewToggle({ view, setView }: { view: "grid" | "list"; setView: (v: "grid" | "list") => void }) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setView("grid")}
        className={cn("p-2 transition-colors", view === "grid" ? "bg-[#155dfc] text-white" : "text-gray-500 hover:bg-gray-50")}
        title="عرض كروت"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setView("list")}
        className={cn("p-2 transition-colors", view === "list" ? "bg-[#155dfc] text-white" : "text-gray-500 hover:bg-gray-50")}
        title="عرض جدول"
      >
        <List className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════ */
export function Items() {
  const [rawItems, setRawItems] = useState<BackendItem[]>([]);
  const [rawPkgs, setRawPkgs] = useState<BackendPackage[]>([]);
  const items = useMemo(() => rawItems.map(itemFromBackend), [rawItems]);
  const packages = useMemo(() => rawPkgs.map(pkgFromBackend), [rawPkgs]);

  const reload = async () => {
    try {
      const [its, pks] = await Promise.all([getAllItems(1, 200), getAllPackages(1, 200)]);
      setRawItems(its);
      setRawPkgs(pks);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل البيانات");
    }
  };
  useEffect(() => { void reload(); }, []);

  const { theme } = useTheme();
  const [itemView, setItemView] = useState<"grid" | "list">("grid");
  const [pkgView,  setPkgView]  = useState<"grid" | "list">("grid");
  const [itemSearch, setItemSearch] = useState("");
  const [pkgSearch,  setPkgSearch]  = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPkg,  setShowAddPkg]  = useState(false);

  /* Edit state — Items */
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editItemForm, setEditItemForm] = useState({ prefix: "", code: "", name: "", storageType: "", maxDays: "", alertDays: "", tempMin: "", tempMax: "", image: "" });

  /* Edit state — Packages */
  const [editPkg, setEditPkg] = useState<Pkg | null>(null);
  const [editPkgForm, setEditPkgForm] = useState({ code: "", type: "", weight: "", length: "", width: "", height: "", image: "" });

  const [newItem, setNewItem] = useState({ prefix: "", code: "", name: "", storageType: "", maxDays: "", alertDays: "", tempMin: "", tempMax: "", image: "" });
  const [newPkg,  setNewPkg]  = useState({ code: "", type: "", weight: "", length: "", width: "", height: "", image: "" });

  /* Brands state */
  const [brandsItem, setBrandsItem] = useState<Item | null>(null);
  const [brands, setBrands] = useState<BackendBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: "", code: "", notes: "" });
  const [editingBrand, setEditingBrand] = useState<BackendBrand | null>(null);
  const [editBrandForm, setEditBrandForm] = useState({ name: "", code: "", notes: "" });

  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  /* Filtered lists */
  const filteredItems = items.filter(it =>
    it.name.includes(itemSearch) || it.code.includes(itemSearch) ||
    it.prefix.includes(itemSearch) || it.storageType.includes(itemSearch)
  );
  const filteredPkgs = packages.filter(p =>
    p.code.includes(pkgSearch) || p.type.includes(pkgSearch)
  );

  /* Pagination */
  const itemsPager = usePagination(filteredItems, 8);
  const pkgsPager  = usePagination(filteredPkgs, 8);

  /* Open edit — Item */
  const openEditItem = (it: Item) => {
    setEditItem(it);
    setEditItemForm({
      prefix: it.prefix,
      code: it.code,
      name: it.name,
      storageType: it.storageType,
      maxDays: String(it.maxDays),
      alertDays: String(it.alertDays),
      tempMin: it.tempMin != null ? String(it.tempMin) : "",
      tempMax: it.tempMax != null ? String(it.tempMax) : "",
      image: it.image ?? "",
    });
  };

  /* Open edit — Package */
  const openEditPkg = (pkg: Pkg) => {
    setEditPkg(pkg);
    setEditPkgForm({
      code: pkg.code,
      type: pkg.type,
      weight: String(pkg.weight),
      length: String(pkg.length),
      width: String(pkg.width),
      height: String(pkg.height),
      image: pkg.image ?? "",
    });
  };

  const num = (v: string) => v === "" || v == null ? undefined : Number(v);

  /* Save edit — Item */
  const handleSaveEditItem = async () => {
    if (!editItem) return;
    if (!editItemForm.name || !editItemForm.storageType) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    try {
      await apiEditItem({
        id: editItem.id,
        code: editItemForm.code || editItem.code,
        prefix: editItemForm.prefix,
        name: editItemForm.name,
        arName: editItemForm.name,
        storageType: editItemForm.storageType,
        shelfLifeDays: num(editItemForm.maxDays),
        alertDaysBeforeExpiry: num(editItemForm.alertDays),
        temperatureMin: num(editItemForm.tempMin),
        temperatureMax: num(editItemForm.tempMax),
        imageUrl: editItemForm.image || undefined,
        isActive: true,
      });
      toast.success(`تم تحديث الصنف "${editItemForm.name}" بنجاح`);
      setEditItem(null);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل التحديث");
    }
  };

  /* Save edit — Package */
  const handleSaveEditPkg = async () => {
    if (!editPkg) return;
    if (!editPkgForm.type) { toast.error("يرجى اختيار نوع العبوة"); return; }
    try {
      await apiEditPkg({
        id: editPkg.id,
        code: editPkgForm.code || editPkg.code,
        name: editPkgForm.type,
        arName: editPkgForm.type,
        packageType: editPkgForm.type,
        emptyWeightKg: num(editPkgForm.weight),
        lengthCm: num(editPkgForm.length),
        widthCm: num(editPkgForm.width),
        heightCm: num(editPkgForm.height),
        imageUrl: editPkgForm.image || undefined,
        isActive: true,
      });
      toast.success(`تم تحديث العبوة "${editPkgForm.type}" بنجاح`);
      setEditPkg(null);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل التحديث");
    }
  };

  /* Add Item */
  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.storageType) { toast.error("يرجى تعبئة الحقول الإلزامية"); return; }
    try {
      await apiAddItem({
        code: newItem.code || `${newItem.prefix}-${String(items.length + 1).padStart(3, "0")}`,
        prefix: newItem.prefix,
        name: newItem.name,
        arName: newItem.name,
        storageType: newItem.storageType,
        shelfLifeDays: num(newItem.maxDays) ?? 30,
        alertDaysBeforeExpiry: num(newItem.alertDays) ?? 3,
        temperatureMin: num(newItem.tempMin),
        temperatureMax: num(newItem.tempMax),
        imageUrl: newItem.image || undefined,
      });
      toast.success(`تم إضافة الصنف "${newItem.name}" بنجاح`);
      setShowAddItem(false);
      setNewItem({ prefix: "", code: "", name: "", storageType: "", maxDays: "", alertDays: "", tempMin: "", tempMax: "", image: "" });
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الإضافة");
    }
  };

  /* Add Package */
  const handleSavePkg = async () => {
    if (!newPkg.type) { toast.error("يرجى اختيار نوع العبوة"); return; }
    try {
      await apiAddPkg({
        code: newPkg.code || `P${String(packages.length + 1).padStart(3, "0")}`,
        name: newPkg.type,
        arName: newPkg.type,
        packageType: newPkg.type,
        emptyWeightKg: num(newPkg.weight) ?? 0,
        lengthCm: num(newPkg.length) ?? 0,
        widthCm: num(newPkg.width) ?? 0,
        heightCm: num(newPkg.height) ?? 0,
        imageUrl: newPkg.image || undefined,
      });
      toast.success(`تم إضافة العبوة "${newPkg.type}" بنجاح`);
      setShowAddPkg(false);
      setNewPkg({ code: "", type: "", weight: "", length: "", width: "", height: "", image: "" });
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الإضافة");
    }
  };

  /* Delete handlers */
  const handleDeleteItem = async (it: Item) => {
    try {
      await apiDeleteItem(it.id);
      toast.success(`تم حذف "${it.name}"`);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  };
  const handleDeletePkg = async (pkg: Pkg) => {
    try {
      await apiDeletePkg(pkg.id);
      toast.success(`تم حذف عبوة "${pkg.type}"`);
      await reload();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  };

  /* ── Brands handlers ── */
  const loadBrands = async (itemId: string) => {
    setBrandsLoading(true);
    try {
      setBrands(await getBrandsByItem(itemId));
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل الماركات");
    } finally {
      setBrandsLoading(false);
    }
  };

  const openBrands = (it: Item) => {
    setBrandsItem(it);
    setBrandSearch("");
    void loadBrands(it.id);
  };

  const handleSaveNewBrand = async () => {
    if (!brandsItem) return;
    if (!newBrand.name.trim()) { toast.error("يرجى إدخال اسم الماركة"); return; }
    try {
      await apiAddBrand({ itemId: brandsItem.id, name: newBrand.name.trim(), code: newBrand.code || undefined, notes: newBrand.notes || undefined });
      toast.success(`تم إضافة ماركة "${newBrand.name}" بنجاح`);
      setShowAddBrand(false);
      setNewBrand({ name: "", code: "", notes: "" });
      void loadBrands(brandsItem.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة الماركة");
    }
  };

  const openEditBrand = (brand: BackendBrand) => {
    setEditingBrand(brand);
    setEditBrandForm({ name: brand.name, code: brand.code ?? "", notes: brand.notes ?? "" });
  };

  const handleSaveEditBrand = async () => {
    if (!editingBrand || !brandsItem) return;
    if (!editBrandForm.name.trim()) { toast.error("يرجى إدخال اسم الماركة"); return; }
    try {
      await apiEditBrand({ id: editingBrand.id, itemId: brandsItem.id, name: editBrandForm.name.trim(), code: editBrandForm.code || undefined, notes: editBrandForm.notes || undefined, isActive: true });
      toast.success(`تم تحديث الماركة "${editBrandForm.name}" بنجاح`);
      setEditingBrand(null);
      void loadBrands(brandsItem.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث الماركة");
    }
  };

  const handleDeleteBrand = async (brand: BackendBrand) => {
    try {
      await apiDeleteBrand(brand.id);
      toast.success(`تم حذف ماركة "${brand.name}"`);
      void loadBrands(brandsItem!.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حذف الماركة");
    }
  };

  const filteredBrands = brands.filter(b =>
    !brandSearch || b.name.includes(brandSearch) || (b.code ?? "").includes(brandSearch)
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <Tabs defaultValue="items" dir="rtl">
        {/* ─── Tab Header ─── */}
        <motion.div variants={anim} className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList dir="rtl" className="bg-[#f3f4f6] rounded-xl p-1 h-auto">
            <TabsTrigger value="items" className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700 px-5">
              الأصناف
            </TabsTrigger>
            <TabsTrigger value="packages" className="rounded-xl text-sm data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-700 px-5">
              العبوات
            </TabsTrigger>
          </TabsList>
        </motion.div>

        {/* ══════════════════ ITEMS TAB ══════════════════ */}
        <TabsContent value="items">
          <motion.div variants={anim} className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="بحث بالاسم أو الكود أو نوع التخزين..."
                  className="pr-9 bg-white border-gray-200"
                  value={itemSearch}
                  onChange={e => { setItemSearch(e.target.value); itemsPager.reset(); }}
                  dir="rtl"
                />
                {itemSearch && (
                  <button onClick={() => setItemSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <ViewToggle view={itemView} setView={setItemView} />
              <Button onClick={() => setShowAddItem(true)} size="sm" className="bg-[#155dfc] hover:bg-blue-700 text-white gap-1">
                <Plus className="w-3.5 h-3.5" />إضافة صنف
              </Button>
            </div>

            {/* Count info */}
            <p className="text-xs text-gray-400">
              {filteredItems.length} صنف {itemSearch ? "— نتائج البحث" : "مسجل"}
            </p>

            {/* ─── GRID view ─── */}
            {itemView === "grid" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {itemsPager.paginated.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>لا توجد نتائج للبحث</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {itemsPager.paginated.map(it => (
                        <ItemCard
                          key={it.id}
                          it={it}
                          onEdit={openEditItem}
                          onBrands={openBrands}
                          onDelete={it => confirmDelete(it.name, () => { void handleDeleteItem(it); })}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
                <Pagination
                  page={itemsPager.page} totalPages={itemsPager.totalPages}
                  total={itemsPager.total} pageSize={itemsPager.pageSize}
                  onPageChange={itemsPager.changePage} onPageSizeChange={itemsPager.changePageSize}
                />
              </Card>
            )}

            {/* ─── LIST view ─── */}
            {itemView === "list" && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الصنف</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الكود</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">احتياج التخزين</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">فترة التخزين</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">التنبيه</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsPager.paginated.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-gray-400">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            لا توجد نتائج
                          </td>
                        </tr>
                      ) : (
                        itemsPager.paginated.map((it, idx) => {
                          const cfg = storageConfig[it.storageType] ?? storageConfig["تبريد"];
                          const Icon = cfg.icon;
                          return (
                            <motion.tr
                              key={it.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.03 }}
                              className={cn("border-b hover:bg-blue-50/20 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  {/* Thumbnail */}
                                  <div className={cn("relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br text-white font-bold text-sm", cfg.grad)}>
                                    <span>{it.prefix}</span>
                                    <SafeImage src={it.image} alt={it.name} className="absolute inset-0 w-full h-full object-cover" />
                                  </div>
                                  <span className="font-medium text-gray-800">{it.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs bg-gray-100 text-blue-700 px-2 py-0.5 rounded">{it.code}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", cfg.badge)}>
                                  <Icon className="w-3 h-3" />{it.storageType}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{it.maxDays} يوم</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-orange-600">
                                  <Bell className="w-3 h-3" />
                                  <span className="text-xs">بعد {it.maxDays - it.alertDays} يوم</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("px-2 py-0.5 rounded-full text-xs", it.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                                  {it.status === "active" ? "نشط" : "غير نشط"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                                    onClick={() => openBrands(it)}
                                    title="ماركات الصنف"
                                  >
                                    <Tag className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    onClick={() => openEditItem(it)}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => confirmDelete(it.name, () => { void handleDeleteItem(it); })}><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={itemsPager.page} totalPages={itemsPager.totalPages}
                  total={itemsPager.total} pageSize={itemsPager.pageSize}
                  onPageChange={itemsPager.changePage} onPageSizeChange={itemsPager.changePageSize}
                />
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ══════════════════ PACKAGES TAB ══════════════════ */}
        <TabsContent value="packages">
          <motion.div variants={anim} className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="بحث بالكود أو نوع العبوة..."
                  className="pr-9 bg-white border-gray-200"
                  value={pkgSearch}
                  onChange={e => { setPkgSearch(e.target.value); pkgsPager.reset(); }}
                  dir="rtl"
                />
                {pkgSearch && (
                  <button onClick={() => setPkgSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <ViewToggle view={pkgView} setView={setPkgView} />
              <Button onClick={() => setShowAddPkg(true)} size="sm" className="bg-[#155dfc] hover:bg-blue-700 text-white gap-1">
                <Plus className="w-3.5 h-3.5" />إضافة عبوة
              </Button>
            </div>

            <p className="text-xs text-gray-400">
              {filteredPkgs.length} نوع عبوة {pkgSearch ? "— نتائج البحث" : "مسجل"}
            </p>

            {/* ─── GRID view ─── */}
            {pkgView === "grid" && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  {pkgsPager.paginated.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>لا توجد نتائج</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {pkgsPager.paginated.map(pkg => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          onEdit={openEditPkg}
                          onDelete={pkg => confirmDelete(pkg.type, () => { void handleDeletePkg(pkg); })}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
                <Pagination
                  page={pkgsPager.page} totalPages={pkgsPager.totalPages}
                  total={pkgsPager.total} pageSize={pkgsPager.pageSize}
                  onPageChange={pkgsPager.changePage} onPageSizeChange={pkgsPager.changePageSize}
                />
              </Card>
            )}

            {/* ─── LIST view ─── */}
            {pkgView === "list" && (
              <Card className="border-0 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">العبوة</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الكود</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الوزن</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الأبعاد (ط × ع × ا) سم</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pkgsPager.paginated.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-gray-400">لا توجد نتائج</td>
                        </tr>
                      ) : (
                        pkgsPager.paginated.map((pkg, idx) => {
                          const grad = pkgGrads[pkg.type] ?? "from-gray-400 to-gray-600";
                          return (
                            <tr key={pkg.id} className={cn("border-b hover:bg-blue-50/20 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={cn("relative w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br", grad)}>
                                    <Package className="w-4 h-4 text-white" />
                                    <SafeImage src={pkg.image} alt={pkg.type} className="absolute inset-0 w-full h-full object-cover" />
                                  </div>
                                  <span className="font-medium text-gray-800">{pkg.type}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-xs bg-gray-100 text-blue-700 px-2 py-0.5 rounded">{pkg.code}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">{pkg.weight} <span className="text-gray-400 text-xs">كجم</span></td>
                              <td className="px-4 py-3">
                                <span className="font-mono text-gray-700">{pkg.length}×{pkg.width}×{pkg.height}</span>
                                <span className="text-gray-400 text-xs mr-1">سم</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    onClick={() => openEditPkg(pkg)}
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" onClick={() => confirmDelete(pkg.type, () => { void handleDeletePkg(pkg); })}><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={pkgsPager.page} totalPages={pkgsPager.totalPages}
                  total={pkgsPager.total} pageSize={pkgsPager.pageSize}
                  onPageChange={pkgsPager.changePage} onPageSizeChange={pkgsPager.changePageSize}
                />
              </Card>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Confirm delete dialog */}
      {confirmDialog}

      {/* ══════════════════ ADD ITEM DIALOG ══════════════════ */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>إضافة صنف جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <ImageUploader label="صورة الصنف" folder="items" value={newItem.image} onChange={v => setNewItem({ ...newItem, image: v })} />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>حرف الكود <span className="text-red-500">*</span></Label>
                <Input placeholder="ج" value={newItem.prefix}
                  onChange={e => { const v = e.target.value; setNewItem({ ...newItem, prefix: v, code: v ? `${v}-001` : "" }); }}
                  dir="rtl" maxLength={3} className="border border-[#d1d5dc] bg-[#f9fafb] text-center" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>كود الصنف</Label>
                <Input placeholder="ج-001" value={newItem.code} onChange={e => setNewItem({ ...newItem, code: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>اسم الصنف <span className="text-red-500">*</span></Label>
              <Input placeholder="مثال: جبنة رومي" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="space-y-1.5">
              <Label>احتياج التخزين <span className="text-red-500">*</span></Label>
              <Select onValueChange={v => setNewItem({ ...newItem, storageType: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر نوع التخزين" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="تبريد"><div className="flex items-center gap-2"><Thermometer className="w-3.5 h-3.5 text-cyan-600" />تبريد</div></SelectItem>
                  <SelectItem value="تجميد"><div className="flex items-center gap-2"><Snowflake className="w-3.5 h-3.5 text-blue-600" />تجميد</div></SelectItem>
                  <SelectItem value="تنشير"><div className="flex items-center gap-2"><Wind className="w-3.5 h-3.5 text-amber-600" />تنشير</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>فترة التخزين (يوم)</Label>
                <Input type="number" placeholder="0" value={newItem.maxDays} onChange={e => setNewItem({ ...newItem, maxDays: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Bell className="w-3 h-3 text-orange-500" />تنبيه بعد (يوم)</Label>
                <Input type="number" placeholder="0" value={newItem.alertDays} onChange={e => setNewItem({ ...newItem, alertDays: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
            </div>
            {newItem.maxDays && newItem.alertDays && (
              <p className="text-xs text-orange-600 flex items-center gap-1 bg-orange-50 px-3 py-2 rounded-lg">
                <Bell className="w-3 h-3 flex-shrink-0" />
                سيتم إرسال تنبيه بعد <strong>{Number(newItem.maxDays) - Number(newItem.alertDays)}</strong> يوم من تاريخ الإيداع
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" />درجة حرارة دنيا (°م)</Label>
                <Input type="number" placeholder="-18" value={newItem.tempMin} onChange={e => setNewItem({ ...newItem, tempMin: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-red-500" />درجة حرارة قصوى (°م)</Label>
                <Input type="number" placeholder="-15" value={newItem.tempMax} onChange={e => setNewItem({ ...newItem, tempMax: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
            </div>
            {(newItem.tempMin || newItem.tempMax) && (
              <p className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                <Thermometer className="w-3 h-3 flex-shrink-0" />
                نطاق درجة الحرارة المقبول: <strong>{newItem.tempMin || "—"}°م</strong> إلى <strong>{newItem.tempMax || "—"}°م</strong>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveItem} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddItem(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ EDIT ITEM DIALOG ══════════════════ */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>تعديل الصنف: {editItem?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <ImageUploader label="صورة الصنف" folder="items" value={editItemForm.image} onChange={v => setEditItemForm({ ...editItemForm, image: v })} />
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>حرف الكود</Label>
                <Input value={editItemForm.prefix}
                  onChange={e => setEditItemForm({ ...editItemForm, prefix: e.target.value })}
                  dir="rtl" maxLength={3} className="border border-[#d1d5dc] bg-[#f9fafb] text-center" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>كود الصنف</Label>
                <Input value={editItemForm.code}
                  onChange={e => setEditItemForm({ ...editItemForm, code: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>اسم الصنف <span className="text-red-500">*</span></Label>
              <Input value={editItemForm.name}
                onChange={e => setEditItemForm({ ...editItemForm, name: e.target.value })}
                dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="space-y-1.5">
              <Label>احتياج التخزين <span className="text-red-500">*</span></Label>
              <Select value={editItemForm.storageType} onValueChange={v => setEditItemForm({ ...editItemForm, storageType: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="تبريد"><div className="flex items-center gap-2"><Thermometer className="w-3.5 h-3.5 text-cyan-600" />تبريد</div></SelectItem>
                  <SelectItem value="تجميد"><div className="flex items-center gap-2"><Snowflake className="w-3.5 h-3.5 text-blue-600" />تجميد</div></SelectItem>
                  <SelectItem value="تنشير"><div className="flex items-center gap-2"><Wind className="w-3.5 h-3.5 text-amber-600" />تنشير</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>فترة التخزين (يوم)</Label>
                <Input type="number" value={editItemForm.maxDays}
                  onChange={e => setEditItemForm({ ...editItemForm, maxDays: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Bell className="w-3 h-3 text-orange-500" />تنبيه بعد (يوم)</Label>
                <Input type="number" value={editItemForm.alertDays}
                  onChange={e => setEditItemForm({ ...editItemForm, alertDays: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
            </div>
            {editItemForm.maxDays && editItemForm.alertDays && (
              <p className="text-xs text-orange-600 flex items-center gap-1 bg-orange-50 px-3 py-2 rounded-lg">
                <Bell className="w-3 h-3 flex-shrink-0" />
                سيتم إرسال تنبيه بعد <strong>{Number(editItemForm.maxDays) - Number(editItemForm.alertDays)}</strong> يوم من تاريخ الإيداع
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" />درجة حرارة دنيا (°م)</Label>
                <Input type="number" placeholder="-18" value={editItemForm.tempMin}
                  onChange={e => setEditItemForm({ ...editItemForm, tempMin: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-red-500" />درجة حرارة قصوى (°م)</Label>
                <Input type="number" placeholder="-15" value={editItemForm.tempMax}
                  onChange={e => setEditItemForm({ ...editItemForm, tempMax: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
              </div>
            </div>
            {(editItemForm.tempMin || editItemForm.tempMax) && (
              <p className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-lg">
                <Thermometer className="w-3 h-3 flex-shrink-0" />
                نطاق درجة الحرارة المقبول: <strong>{editItemForm.tempMin || "—"}°م</strong> إلى <strong>{editItemForm.tempMax || "—"}°م</strong>
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEditItem} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditItem(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ ADD PACKAGE DIALOG ══════════════════ */}
      <Dialog open={showAddPkg} onOpenChange={setShowAddPkg}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>إضافة عبوة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <ImageUploader label="صورة العبوة" folder="packages" value={newPkg.image} onChange={v => setNewPkg({ ...newPkg, image: v })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>كود العبوة</Label>
                <Input placeholder="P006" value={newPkg.code} onChange={e => setNewPkg({ ...newPkg, code: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>اسم العبوة <span className="text-red-500">*</span></Label>
                <Select onValueChange={v => setNewPkg({ ...newPkg, type: v })}>
                  <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {["طرد", "شوال", "كرتونة", "صندوق", "برميل"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الوزن (كجم)</Label>
              <Input type="number" placeholder="0" value={newPkg.weight} onChange={e => setNewPkg({ ...newPkg, weight: e.target.value })}
                dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="space-y-1.5">
              <Label>الأبعاد (سم)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "الطول", key: "length" },
                  { label: "العرض", key: "width" },
                  { label: "الارتفاع", key: "height" },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <span className="text-xs text-gray-500 block text-center">{label}</span>
                    <Input type="number" placeholder="0"
                      value={newPkg[key as keyof typeof newPkg]}
                      onChange={e => setNewPkg({ ...newPkg, [key]: e.target.value })}
                      dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] text-center" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSavePkg} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddPkg(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ BRANDS DIALOG ══════════════════ */}
      <Dialog open={!!brandsItem} onOpenChange={open => { if (!open) setBrandsItem(null); }}>
        <DialogContent dir="rtl" className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-600" />
              ماركات الصنف: {brandsItem?.name}
            </DialogTitle>
          </DialogHeader>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="بحث بالاسم أو الكود..."
                className="pr-9 bg-white border-gray-200 h-8 text-sm"
                value={brandSearch}
                onChange={e => setBrandSearch(e.target.value)}
                dir="rtl"
              />
            </div>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white gap-1 h-8"
              onClick={() => {
                const prefix = brandsItem?.prefix || brandsItem?.code?.split("-")[0] || "";
                const seq = String(brands.length + 1).padStart(3, "0");
                const autoCode = prefix ? `${prefix}-BR-${seq}` : `BR-${seq}`;
                setNewBrand({ name: "", code: autoCode, notes: "" });
                setShowAddBrand(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />إضافة ماركة
            </Button>
          </div>

          {/* Brands table */}
          <div className="border rounded-xl overflow-hidden">
            {brandsLoading ? (
              <div className="flex items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin ml-2" />جاري التحميل...
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">#</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">اسم الماركة</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">الكود</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">ملاحظات</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        <Tag className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p>{brandSearch ? "لا توجد نتائج" : "لا توجد ماركات مضافة بعد"}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((brand, idx) => (
                      <tr key={brand.id} className={cn("border-b last:border-0 hover:bg-violet-50/20 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                        <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-800">{brand.name}</td>
                        <td className="px-4 py-2.5">
                          {brand.code ? (
                            <span className="font-mono text-xs bg-gray-100 text-violet-700 px-2 py-0.5 rounded">{brand.code}</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{brand.notes || "—"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              onClick={() => openEditBrand(brand)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              onClick={() => confirmDelete(brand.name, () => { void handleDeleteBrand(brand); })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <DialogFooter className="mt-1">
            <Button variant="outline" onClick={() => setBrandsItem(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ ADD BRAND DIALOG ══════════════════ */}
      <Dialog open={showAddBrand} onOpenChange={setShowAddBrand}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>إضافة ماركة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>اسم الماركة <span className="text-red-500">*</span></Label>
              <Input
                placeholder="مثال: ماركة النيل"
                value={newBrand.name}
                onChange={e => setNewBrand({ ...newBrand, name: e.target.value })}
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الكود</Label>
              <Input
                placeholder="مثال: BR-001"
                value={newBrand.code}
                onChange={e => setNewBrand({ ...newBrand, code: e.target.value })}
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input
                placeholder="ملاحظات اختيارية..."
                value={newBrand.notes}
                onChange={e => setNewBrand({ ...newBrand, notes: e.target.value })}
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveNewBrand} className="bg-violet-600 hover:bg-violet-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setShowAddBrand(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ EDIT BRAND DIALOG ══════════════════ */}
      <Dialog open={!!editingBrand} onOpenChange={open => { if (!open) setEditingBrand(null); }}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تعديل الماركة: {editingBrand?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>اسم الماركة <span className="text-red-500">*</span></Label>
              <Input
                value={editBrandForm.name}
                onChange={e => setEditBrandForm({ ...editBrandForm, name: e.target.value })}
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>الكود</Label>
              <Input
                value={editBrandForm.code}
                onChange={e => setEditBrandForm({ ...editBrandForm, code: e.target.value })}
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb] font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>ملاحظات</Label>
              <Input
                value={editBrandForm.notes}
                onChange={e => setEditBrandForm({ ...editBrandForm, notes: e.target.value })}
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEditBrand} className="bg-violet-600 hover:bg-violet-700 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditingBrand(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ EDIT PACKAGE DIALOG ══════════════════ */}
      <Dialog open={!!editPkg} onOpenChange={() => setEditPkg(null)}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>تعديل العبوة: {editPkg?.type}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <ImageUploader label="صورة العبوة" folder="packages" value={editPkgForm.image} onChange={v => setEditPkgForm({ ...editPkgForm, image: v })} />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>كود العبوة</Label>
                <Input value={editPkgForm.code}
                  onChange={e => setEditPkgForm({ ...editPkgForm, code: e.target.value })}
                  dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>نوع العبوة <span className="text-red-500">*</span></Label>
                <Select value={editPkgForm.type} onValueChange={v => setEditPkgForm({ ...editPkgForm, type: v })}>
                  <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {["طرد", "شوال", "كرتونة", "صندوق", "برميل"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الوزن (كجم)</Label>
              <Input type="number" value={editPkgForm.weight}
                onChange={e => setEditPkgForm({ ...editPkgForm, weight: e.target.value })}
                dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]" />
            </div>
            <div className="space-y-1.5">
              <Label>الأبعاد (سم)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "الطول", key: "length" },
                  { label: "العرض", key: "width" },
                  { label: "الارتفاع", key: "height" },
                ].map(({ label, key }) => (
                  <div key={key} className="space-y-1">
                    <span className="text-xs text-gray-500 block text-center">{label}</span>
                    <Input type="number"
                      value={editPkgForm[key as keyof typeof editPkgForm]}
                      onChange={e => setEditPkgForm({ ...editPkgForm, [key]: e.target.value })}
                      dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] text-center" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEditPkg} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditPkg(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}