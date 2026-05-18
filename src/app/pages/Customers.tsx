import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Plus, Search, Eye, Edit, Phone, X, DollarSign,
  LayoutGrid, List, User, MapPin, FileText, Car, Trash2, Users, Printer, Tag, Pencil, Check, TrendingDown,
  SlidersHorizontal, Maximize2, Minimize2,
} from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { SafeImage } from "../components/ui/SafeImage";
import { ImageUploader } from "../components/ui/ImageUploader";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { useTheme } from "../context/ThemeContext";
import {
  getAllCustomers,
  addCustomer as apiAddCustomer,
  editCustomer as apiEditCustomer,
  type BackendCustomer,
} from "../services/customerService";
import { getAllMovements, type BackendMovement } from "../services/movementService";
import { getAllItems, type BackendItem } from "../services/itemService";
import {
  getCustomerContacts,
  addCustomerContact as apiAddContact,
  editCustomerContact as apiEditContact,
  deactivateCustomerContact as apiDeleteContact,
  type BackendCustomerContact,
} from "../services/customerContactService";
import {
  getCustomerDrivers,
  addCustomerDriver as apiAddDriver,
  editCustomerDriver as apiEditDriver,
  deactivateCustomerDriver as apiDeleteDriver,
  type BackendCustomerDriver,
} from "../services/customerDriverService";
import {
  getCustomerPrices,
  addCustomerPrice as apiAddPrice,
  editCustomerPrice as apiEditPrice,
  deactivateCustomerPrice as apiDeletePrice,
  type BackendCustomerPrice,
} from "../services/customerPricingService";
import {
  getCustomerNaulages,
  addCustomerNaulage as apiAddNaulage,
  editCustomerNaulage as apiEditNaulage,
  deactivateCustomerNaulage as apiDeleteNaulage,
  type BackendCustomerNaulage,
} from "../services/customerNaulageService";
import {
  PHONE_PLACEHOLDER,
  validatePhoneOptional,
  validatePhoneRequired,
  normalizePhone,
} from "../utils/phone";
import { getBrandsByItem, type BackendBrand } from "../services/brandService";
import {
  getAllCustomerTypes, addCustomerType as apiAddCustomerType, deleteCustomerType as apiDeleteCustomerType,
  type BackendCustomerType,
} from "../services/customerTypeService";

import { PageHeader } from "../components/layout/PageHeader";

type CustomerView = {
  id: string;
  code: string;
  name: string;
  phone: string;
  balance: number;
  openingBalance: number;
  itemsStored: number;
  agent: string;
  address: string;
  taxNumber: string;
  defaultNaulage: number;
  defaultNaulageUnit: string;
  notes: string;
  image?: string;
  customerType?: string;
};

const NAULAGE_UNITS = ["طرد", "شوال", "كارتونة", "صندوق", "برميل", "كيلو", "طن"] as const;
const DEFAULT_NAULAGE_UNIT = "طرد";

const mapCustomer = (c: BackendCustomer): CustomerView => ({
  id: c.id,
  code: c.code,
  name: c.arName || c.name,
  phone: c.mobile ?? c.phone ?? "",
  balance: c.currentBalance ?? 0,
  openingBalance: c.openingBalance ?? 0,
  itemsStored: 0,
  agent: "",
  address: c.address ?? "",
  taxNumber: c.taxNumber ?? "",
  defaultNaulage: 0,
  defaultNaulageUnit: DEFAULT_NAULAGE_UNIT,
  notes: c.notes ?? "",
  image: c.imageUrl ?? "",
  customerType: c.customerType ?? "",
});

/* ── driver notes encoding (national ID) ── */
function parseDriverNotes(notes?: string | null) {
  if (!notes?.startsWith("§§")) return { nationalId: "", text: notes ?? "" };
  try {
    const d = JSON.parse(notes.slice(2));
    return { nationalId: d._id ?? "", text: d._n ?? "" };
  } catch { return { nationalId: "", text: notes }; }
}
function encodeDriverNotes(nationalId: string, text: string) {
  if (!nationalId) return text || undefined;
  return "§§" + JSON.stringify({ _id: nationalId, _n: text });
}

/* ── extra metadata encoding in notes field (brand + unit) ── */
function parseExtraNotes(notes?: string | null) {
  if (!notes?.startsWith("§§")) return { brandName: "", unit: "", text: notes ?? "" };
  try {
    const d = JSON.parse(notes.slice(2));
    return { brandName: d._b ?? "", unit: d._u ?? "", text: d._n ?? "" };
  } catch { return { brandName: "", unit: "", text: notes }; }
}
function encodeExtraNotes(brandName: string, unit: string, text: string) {
  if (!brandName && !unit) return text || undefined;
  return "§§" + JSON.stringify({ _b: brandName, _u: unit, _n: text });
}

/* ── animation presets ── */
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const anim      = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

/* ── gradient palette per first letter (deterministic) ── */
const AVATAR_GRADS = [
  "from-blue-400 to-blue-700",
  "from-violet-400 to-violet-700",
  "from-emerald-400 to-emerald-700",
  "from-rose-400 to-rose-600",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-cyan-700",
  "from-pink-400 to-pink-700",
  "from-indigo-400 to-indigo-700",
];
function avatarGrad(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_GRADS[code % AVATAR_GRADS.length];
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
   CustomerAvatar
══════════════════════════════════════════════════════════ */
function CustomerAvatar({ c, size = "sm" }: { c: CustomerView; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16 text-2xl" : "w-9 h-9 text-sm";
  return (
    <div className={cn(dim, "relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br", avatarGrad(c.name))}>
      <span>{c.name.charAt(0)}</span>
      <SafeImage src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PhoneInput — Input with Egyptian-mobile inline validation
══════════════════════════════════════════════════════════ */
function PhoneInput({
  value,
  onChange,
  required = false,
  placeholder = PHONE_PLACEHOLDER,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [touched, setTouched] = useState(false);
  const error = touched
    ? (required ? validatePhoneRequired(value) : validatePhoneOptional(value))
    : null;
  return (
    <div className="space-y-1">
      <Input
        dir="ltr"
        inputMode="tel"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={cn(
          "border bg-[#f9fafb]",
          error ? "border-red-400 focus-visible:ring-red-300" : "border-[#d1d5dc]",
          className,
        )}
      />
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CustomerCard
══════════════════════════════════════════════════════════ */
function CustomerCard({
  c, onView, onEdit,
}: { c: CustomerView; onView: (c: CustomerView) => void; onEdit: (c: CustomerView) => void }) {
  const grad = avatarGrad(c.name);
  return (
    <motion.div variants={anim} className="h-full">
      <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden h-full flex flex-col">
        {/* Header banner */}
        <div className={cn("relative h-24 flex-shrink-0 flex items-end justify-center pb-0 bg-gradient-to-br opacity-90", grad)}>
          <SafeImage src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
          <span className="absolute top-2 right-2 font-mono text-[10px] bg-white/90 backdrop-blur-sm text-blue-700 px-2 py-0.5 rounded z-10">
            {c.code}
          </span>
        </div>

        {/* Avatar overlapping banner */}
        <div className="flex justify-center -mt-6 z-10 relative px-4">
          <div className={cn("relative w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br overflow-hidden", grad)}>
            <span className="text-lg">{c.name.charAt(0)}</span>
            <SafeImage src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1 pt-2 text-center">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-0.5">{c.name}</h3>
          <div className="flex items-center justify-center gap-1.5 mb-1 flex-wrap">
            {(c as any).customerType && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-0.5">
                <Tag className="w-2.5 h-2.5" />{(c as any).customerType}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">{c.agent}</p>

          <div className="space-y-1.5 text-xs border-t pt-3 flex-1 text-right">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{c.phone}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>الأصناف الثلاجةة</span>
              <span className="font-medium text-gray-700">{c.itemsStored} طرد</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الرصيد</span>
              <span className={cn("font-semibold", c.balance >= 0 ? "text-green-600" : "text-red-500")}>
                {c.balance.toLocaleString("ar-EG")} ج.م
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t">
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
              onClick={() => onView(c)}
            >
              <Eye className="w-3.5 h-3.5" />عرض
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors font-medium"
              onClick={() => onEdit(c)}
            >
              <Edit className="w-3.5 h-3.5" />تعديل
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   Movement detail row (used inside the view-movement dialog)
══════════════════════════════════════════════════════════ */
function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={cn("text-gray-800 text-sm", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════ */
export function Customers() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  /* ── API-backed customer list ── */
  const [rawCustomers, setRawCustomers] = useState<BackendCustomer[]>([]);
  const [, setLoadingCustomers] = useState(false);

  /* ── Items list (for selects) ── */
  const [items, setItems] = useState<BackendItem[]>([]);

  /* ── Customer types ── */
  const [customerTypes, setCustomerTypes] = useState<BackendCustomerType[]>([]);
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");

  const reloadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const list = await getAllCustomers(1, 100);
      setRawCustomers(list);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل العملاء");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const reloadItems = async () => {
    try {
      const list = await getAllItems(1, 200);
      setItems(list.filter(i => i.isActive));
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحميل الأصناف");
    }
  };

  const reloadCustomerTypes = async () => {
    try { setCustomerTypes(await getAllCustomerTypes()); } catch { /* silent */ }
  };

  const handleAddCustomerType = async (onAdded: (name: string) => void) => {
    if (!newTypeName.trim()) { toast.error("يرجى إدخال اسم النوع"); return; }
    try {
      const added = await apiAddCustomerType(newTypeName.trim());
      setCustomerTypes(prev => [...prev, added]);
      onAdded(added.name);
      setNewTypeName("");
      setShowAddTypeForm(false);
      toast.success(`تم إضافة النوع "${added.name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة النوع");
    }
  };

  const handleDeleteCustomerType = async (t: BackendCustomerType) => {
    try {
      await apiDeleteCustomerType(t.id);
      setCustomerTypes(prev => prev.filter(x => x.id !== t.id));
      toast.success(`تم حذف النوع "${t.name}"`);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حذف النوع");
    }
  };

  useEffect(() => {
    void reloadCustomers();
    void reloadItems();
    void reloadCustomerTypes();
    getAllMovements({ pageSize: 500 })
      .then(list => setAllMovements(list.filter(m => m.isActive)))
      .catch(() => {});
  }, []);

  const customers = useMemo<CustomerView[]>(
    () => rawCustomers.filter(c => c.isActive).map(mapCustomer),
    [rawCustomers],
  );

  /* All movements loaded once for item/brand filter mapping */
  const [allMovements, setAllMovements] = useState<BackendMovement[]>([]);

  /* Build customer→items and customer→brands maps from all movements */
  const { custItemMap, custBrandMap, filterItemOpts, filterBrandOpts } = useMemo(() => {
    const ciMap = new Map<string, Set<string>>();   // customerId → itemIds
    const cbMap = new Map<string, Set<string>>();   // customerId → brandKey
    const itemNames = new Map<string, string>();     // itemId → name
    const brandNames = new Map<string, string>();    // brandId|name → display name

    for (const m of allMovements) {
      const cid = m.customerId;
      if (!cid) continue;
      if (!ciMap.has(cid)) ciMap.set(cid, new Set());
      if (!cbMap.has(cid)) cbMap.set(cid, new Set());
      if (m.itemId) {
        ciMap.get(cid)!.add(m.itemId);
        itemNames.set(m.itemId, m.itemArName || m.itemName || m.itemId);
      }
      const bKey = m.brandId || m.brandName;
      if (bKey) {
        cbMap.get(cid)!.add(bKey);
        brandNames.set(bKey, m.brandName || bKey);
      }
    }
    return {
      custItemMap: ciMap,
      custBrandMap: cbMap,
      filterItemOpts: [...itemNames.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "ar")),
      filterBrandOpts: [...brandNames.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "ar")),
    };
  }, [allMovements]);

  const [view, setView]                     = useState<"grid" | "list">("list");
  const [search, setSearch]                 = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);
  const [showAdd, setShowAdd]               = useState(false);

  /* ── Filters ── */
  const [showFilters, setShowFilters]       = useState(false);
  const [balanceFilter, setBalanceFilter]   = useState<"all" | "positive" | "negative">("all");
  const [typeFilter, setTypeFilter]         = useState("all");
  const [itemFilter, setItemFilter]         = useState("all");
  const [brandFilter, setBrandFilter]       = useState("all");

  const clearFilters = () => {
    setBalanceFilter("all"); setTypeFilter("all"); setItemFilter("all"); setBrandFilter("all");
  };
  const activeFilterCount = [balanceFilter !== "all", typeFilter !== "all", itemFilter !== "all", brandFilter !== "all"].filter(Boolean).length;

  /* ── Per-customer sub-entity state (loaded from API when a customer is opened) ── */
  const [contacts, setContacts] = useState<BackendCustomerContact[]>([]);
  const [drivers, setDrivers]   = useState<BackendCustomerDriver[]>([]);
  const [pricing, setPricing]   = useState<BackendCustomerPrice[]>([]);
  const [naulages, setNaulages] = useState<BackendCustomerNaulage[]>([]);
  const [loadingTabs, setLoadingTabs] = useState(false);

  const reloadCustomerSubEntities = async (customerId: string) => {
    setLoadingTabs(true);
    try {
      const [c, d, p, n] = await Promise.all([
        getCustomerContacts(customerId).catch(() => [] as BackendCustomerContact[]),
        getCustomerDrivers(customerId).catch(()  => [] as BackendCustomerDriver[]),
        getCustomerPrices(customerId).catch(()   => [] as BackendCustomerPrice[]),
        getCustomerNaulages(customerId).catch(() => [] as BackendCustomerNaulage[]),
      ]);
      setContacts(c.filter(x => x.isActive));
      setDrivers(d.filter(x => x.isActive));
      setPricing(p.filter(x => x.isActive));
      setNaulages(n.filter(x => x.isActive));
    } finally {
      setLoadingTabs(false);
    }
  };

  /* ── Edit Customer State ── */
  const [editCustomer, setEditCustomer]     = useState<CustomerView | null>(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    code: "", name: "", phone: "", agent: "", address: "",
    taxNumber: "", defaultNaulage: "", defaultNaulageUnit: DEFAULT_NAULAGE_UNIT, notes: "", image: "", customerType: "",
  });

  /* ── Edit Naulage State ── */
  const [editNaulage, setEditNaulage]       = useState<BackendCustomerNaulage | null>(null);
  const [editNaulageVal, setEditNaulageVal] = useState("");
  const [editNaulageUnit, setEditNaulageUnit] = useState<string>(DEFAULT_NAULAGE_UNIT);

  /* ── Edit Driver State ── */
  const [editDriver, setEditDriver]         = useState<BackendCustomerDriver | null>(null);
  const [editDriverForm, setEditDriverForm] = useState({ name: "", phone: "", plate: "", nationalId: "" });

  /* ── Contacts State ── */
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact]         = useState({ name: "", phone: "", role: "" });
  const [editContact, setEditContact]       = useState<BackendCustomerContact | null>(null);
  const [editContactForm, setEditContactForm] = useState({ name: "", phone: "", role: "" });

  const [newCustomer, setNewCustomer]       = useState({
    code: "", name: "", phone: "", agent: "", address: "",
    taxNumber: "", defaultNaulage: "", defaultNaulageUnit: DEFAULT_NAULAGE_UNIT, notes: "", image: "", customerType: "",
  });
  const [newContacts, setNewContacts] = useState<{name: string; phone: string; role: string}[]>([]);
  const [newContactForm, setNewContactForm] = useState({ name: "", phone: "", role: "" });

  /* ── Add Naulage (Add Dialog) ── */
  const [newNaulages, setNewNaulages] = useState<{itemName: string; itemId?: string; naulage: string; naulageUnit: string}[]>([]);
  const [newNaulageForm, setNewNaulageForm] = useState({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT });

  /* ── Add Naulage (View Dialog) ── */
  const [showAddNaulage, setShowAddNaulage] = useState(false);
  const [addNaulageForm, setAddNaulageForm] = useState({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });

  /* ── Statement (Account history) ── */
  const [customerMovements, setCustomerMovements] = useState<BackendMovement[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  /* ── Opening balance inline edit ── */
  const [editingOpeningBal, setEditingOpeningBal] = useState(false);
  const [openingBalInput, setOpeningBalInput] = useState("");
  const [savingOpeningBal, setSavingOpeningBal] = useState(false);

  const handleSaveOpeningBalance = async () => {
    if (!selectedCustomer) return;
    const raw = rawCustomers.find(c => c.id === selectedCustomer.id);
    if (!raw) return;
    setSavingOpeningBal(true);
    try {
      await apiEditCustomer({
        id: raw.id, code: raw.code, name: raw.name, arName: raw.arName ?? raw.name,
        customerType: raw.customerType ?? undefined,
        taxNumber: raw.taxNumber ?? undefined, commercialRegister: raw.commercialRegister ?? undefined,
        phone: raw.phone ?? undefined, mobile: raw.mobile ?? undefined, email: raw.email ?? undefined,
        address: raw.address ?? undefined, city: raw.city ?? undefined, country: raw.country ?? undefined,
        creditLimit: raw.creditLimit ?? undefined, notes: raw.notes ?? undefined, imageUrl: raw.imageUrl ?? undefined,
        openingBalance: Number(openingBalInput) || 0,
        isActive: raw.isActive,
      });
      toast.success("تم حفظ الرصيد الافتتاحي");
      setEditingOpeningBal(false);
      await reloadCustomers();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل حفظ الرصيد");
    } finally {
      setSavingOpeningBal(false);
    }
  };

  /* ── Navigate to movement detail page ── */
  const goToMovement = (m: BackendMovement) => navigate(`/movements/${m.id}`);

  /* ── Statement fullscreen ── */
  const [showStatementFull, setShowStatementFull] = useState(false);

  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerMovements([]);
      setContacts([]); setDrivers([]); setPricing([]); setNaulages([]);
      setSharedAddItemId(""); setSharedAddBrands([]); setSharedAddBrandId(""); setSharedAddBrandName(""); setSharedAddUnit(DEFAULT_NAULAGE_UNIT);
      setShowAddNaulage(false); setShowAddPrice(false);
      setAddNaulageForm({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });
      setAddPriceForm({ itemName: "", itemId: "", pricePerDay: "", pricePerMonth: "", priceUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });
      return;
    }
    let cancelled = false;
    setLoadingStatement(true);
    (async () => {
      try {
        const list = await getAllMovements({ customerId: selectedCustomer.id, pageSize: 200 });
        if (!cancelled) setCustomerMovements(list);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "فشل تحميل حركات العميل");
      } finally {
        if (!cancelled) setLoadingStatement(false);
      }
    })();
    void reloadCustomerSubEntities(selectedCustomer.id);
    return () => { cancelled = true; };
  }, [selectedCustomer?.id]);

  const statementTotals = useMemo(() => {
    let incomingQty = 0, outgoingQty = 0, incomingWeight = 0, outgoingWeight = 0;
    let runningBalance = selectedCustomer?.openingBalance ?? 0;
    let totalFees = 0;

    const sorted = [...customerMovements]
      .filter(m => m.isActive)
      .sort((a, b) => new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime());

    const rows = sorted.map(m => {
      const fee = ((m.naulagePerUnit ?? 0) * (m.quantity ?? 0))
        + (m.openingFee ?? 0)
        + (m.preCoolingFee ?? 0);
      totalFees += fee;
      runningBalance -= fee;
      if (m.movementType === "Incoming") {
        incomingQty += m.quantity ?? 0;
        incomingWeight += m.netWeightKg ?? 0;
      } else if (m.movementType === "Outgoing") {
        outgoingQty += m.quantity ?? 0;
        outgoingWeight += m.netWeightKg ?? 0;
      }
      return { m, fee, balance: runningBalance };
    });

    return {
      rows,
      incomingQty, outgoingQty, incomingWeight, outgoingWeight,
      storedQty: Math.max(0, incomingQty - outgoingQty),
      storedWeight: Math.max(0, incomingWeight - outgoingWeight),
      totalFees,
      currentBalance: (selectedCustomer?.openingBalance ?? 0) - totalFees,
    };
  }, [customerMovements, selectedCustomer?.openingBalance]);

  /* ── Special Pricing (View Dialog) ── */
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [addPriceForm, setAddPriceForm] = useState({ itemName: "", itemId: "", pricePerDay: "", pricePerMonth: "", priceUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });
  const [editPrice, setEditPrice] = useState<BackendCustomerPrice | null>(null);
  const [editPriceForm, setEditPriceForm] = useState({ itemName: "", itemId: "", pricePerDay: "", pricePerMonth: "", priceUnit: DEFAULT_NAULAGE_UNIT });

  /* ── Shared item + brand + unit between naulage & pricing add forms ── */
  const [sharedAddItemId, setSharedAddItemId] = useState("");
  const [sharedAddBrands, setSharedAddBrands] = useState<BackendBrand[]>([]);
  const [sharedAddBrandId, setSharedAddBrandId] = useState("");
  const [sharedAddBrandName, setSharedAddBrandName] = useState("");
  const [sharedAddUnit, setSharedAddUnit] = useState(DEFAULT_NAULAGE_UNIT);
  const [loadingSharedBrands, setLoadingSharedBrands] = useState(false);

  /* ── Edit naulage brand ── */
  const [editNaulageBrands, setEditNaulageBrands] = useState<BackendBrand[]>([]);
  const [editNaulageBrandId, setEditNaulageBrandId] = useState("");
  const [editNaulageBrandName, setEditNaulageBrandName] = useState("");
  const [loadingEditNaulageBrands, setLoadingEditNaulageBrands] = useState(false);

  /* ── Edit price brand ── */
  const [editPriceBrands, setEditPriceBrands] = useState<BackendBrand[]>([]);
  const [editPriceBrandId, setEditPriceBrandId] = useState("");
  const [editPriceBrandName, setEditPriceBrandName] = useState("");
  const [loadingEditPriceBrands, setLoadingEditPriceBrands] = useState(false);

  const loadSharedBrands = async (itemId: string) => {
    if (!itemId) { setSharedAddBrands([]); return; }
    setLoadingSharedBrands(true);
    try { setSharedAddBrands(await getBrandsByItem(itemId)); }
    catch { setSharedAddBrands([]); }
    finally { setLoadingSharedBrands(false); }
  };

  const handleSharedItemChange = (newItemId: string, newItemName: string, fromTab: "naulage" | "pricing") => {
    if (newItemId === sharedAddItemId) return;
    const otherIsOpen = fromTab === "naulage" ? showAddPrice : showAddNaulage;
    const otherHasDiff = otherIsOpen && sharedAddItemId && sharedAddItemId !== newItemId;
    if (otherHasDiff) {
      const otherLabel = fromTab === "naulage" ? "الأسعار" : "النولون";
      if (!window.confirm(`تغيير الصنف سيؤثر أيضاً على نموذج ${otherLabel}.\nهل تريد المتابعة؟`)) return;
    }
    setSharedAddItemId(newItemId);
    setSharedAddBrandId("");
    setSharedAddBrandName("");
    setSharedAddUnit(DEFAULT_NAULAGE_UNIT);
    setAddNaulageForm(prev => ({ ...prev, itemId: newItemId, itemName: newItemName, brandId: "", brandName: "", naulageUnit: DEFAULT_NAULAGE_UNIT }));
    setAddPriceForm(prev => ({ ...prev, itemId: newItemId, itemName: newItemName, brandId: "", brandName: "", priceUnit: DEFAULT_NAULAGE_UNIT }));
    void loadSharedBrands(newItemId);
  };

  const handleSharedUnitChange = (newUnit: string, fromTab: "naulage" | "pricing") => {
    if (newUnit === sharedAddUnit) return;
    const otherIsOpen = fromTab === "naulage" ? showAddPrice : showAddNaulage;
    const currentOtherUnit = fromTab === "naulage" ? addPriceForm.priceUnit : addNaulageForm.naulageUnit;
    if (otherIsOpen && currentOtherUnit !== newUnit) {
      const otherLabel = fromTab === "naulage" ? "الأسعار" : "النولون";
      if (!window.confirm(`تغيير الوحدة إلى "${newUnit}" سيؤثر أيضاً على نموذج ${otherLabel}.\nهل تريد المتابعة؟`)) return;
    }
    setSharedAddUnit(newUnit);
    setAddNaulageForm(prev => ({ ...prev, naulageUnit: newUnit }));
    setAddPriceForm(prev => ({ ...prev, priceUnit: newUnit }));
  };

  const openEditPrice = (p: BackendCustomerPrice) => {
    setEditPrice(p);
    const { unit, brandName } = parseExtraNotes(p.notes);
    setEditPriceForm({
      itemName: p.itemName,
      itemId: p.itemId ?? "",
      pricePerDay: String(p.pricePerDay ?? ""),
      pricePerMonth: String(p.pricePerMonth ?? ""),
      priceUnit: unit || DEFAULT_NAULAGE_UNIT,
    });
    setEditPriceBrandId("");
    setEditPriceBrandName(brandName);
    setEditPriceBrands([]);
    if (p.itemId) {
      setLoadingEditPriceBrands(true);
      getBrandsByItem(p.itemId).then(brands => {
        setEditPriceBrands(brands);
        const found = brands.find(b => b.name === brandName);
        if (found) setEditPriceBrandId(found.id);
      }).catch(() => setEditPriceBrands([])).finally(() => setLoadingEditPriceBrands(false));
    }
  };

  const handleSaveEditPrice = async () => {
    if (!editPrice || !selectedCustomer) return;
    if (!editPriceForm.itemName) { toast.error("اختر الصنف"); return; }
    try {
      await apiEditPrice({
        id: editPrice.id,
        customerId: selectedCustomer.id,
        itemId: editPriceForm.itemId || undefined,
        itemName: editPriceForm.itemName,
        pricePerDay: Number(editPriceForm.pricePerDay) || 0,
        pricePerMonth: Number(editPriceForm.pricePerMonth) || 0,
        notes: encodeExtraNotes(editPriceBrandName, editPriceForm.priceUnit, ""),
        isActive: true,
      });
      toast.success(`تم تحديث سعر "${editPriceForm.itemName}"`);
      setEditPrice(null);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث السعر");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
      if (balanceFilter === "positive" && c.balance < 0) return false;
      if (balanceFilter === "negative" && c.balance >= 0) return false;
      if (typeFilter !== "all" && (c.customerType ?? "") !== typeFilter) return false;
      if (itemFilter !== "all" && !custItemMap.get(c.id)?.has(itemFilter)) return false;
      if (brandFilter !== "all" && !custBrandMap.get(c.id)?.has(brandFilter)) return false;
      return true;
    });
  }, [customers, search, balanceFilter, typeFilter, itemFilter, brandFilter, custItemMap, custBrandMap]);

  const pager = usePagination(filtered, view === "grid" ? 12 : 10);

  /* ── Handlers ── */
  const handleSave = async () => {
    if (!newCustomer.name) { toast.error("يرجى إدخال اسم العميل"); return; }
    const phoneErr = validatePhoneOptional(newCustomer.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    for (const ct of newContacts) {
      const e = validatePhoneRequired(ct.phone);
      if (e) { toast.error(`جهة الاتصال "${ct.name}": ${e}`); return; }
    }
    try {
      const normalizedPhone = newCustomer.phone ? normalizePhone(newCustomer.phone) : undefined;
      const created = await apiAddCustomer({
        code: newCustomer.code || `C${String(rawCustomers.length + 1).padStart(3, "0")}`,
        name: newCustomer.name,
        arName: newCustomer.name,
        phone: normalizedPhone,
        mobile: normalizedPhone,
        address: newCustomer.address || undefined,
        taxNumber: newCustomer.taxNumber || undefined,
        notes: newCustomer.notes || undefined,
        imageUrl: newCustomer.image || undefined,
        customerType: newCustomer.customerType || undefined,
        openingBalance: 0,
      });
      await Promise.all(newContacts.map(ct =>
        apiAddContact({
          customerId: created.id,
          name: ct.name,
          phone: normalizePhone(ct.phone),
          role: ct.role || undefined,
        })
      ));
      await Promise.all(newNaulages.map(n =>
        apiAddNaulage({
          customerId: created.id,
          itemId: n.itemId || undefined,
          itemName: n.itemName,
          naulage: Number(n.naulage) || 0,
          naulageUnit: n.naulageUnit || DEFAULT_NAULAGE_UNIT,
        })
      ));
      const parts = [];
      if (newContacts.length) parts.push(`${newContacts.length} جهة اتصال`);
      if (newNaulages.length) parts.push(`${newNaulages.length} نولون`);
      toast.success(`تم إضافة العميل "${newCustomer.name}" بنجاح${parts.length ? ` مع ${parts.join(" و ")}` : ""}`);
      setShowAdd(false);
      setNewCustomer({ code: "", name: "", phone: "", agent: "", address: "", taxNumber: "", defaultNaulage: "", defaultNaulageUnit: DEFAULT_NAULAGE_UNIT, notes: "", image: "", customerType: "" });
      setNewContacts([]);
      setNewContactForm({ name: "", phone: "", role: "" });
      setNewNaulages([]);
      setNewNaulageForm({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT });
      await reloadCustomers();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة العميل");
    }
  };

  const openEditCustomer = (c: CustomerView) => {
    setEditCustomer(c);
    setEditCustomerForm({
      code: c.code,
      name: c.name,
      phone: c.phone,
      agent: c.agent,
      address: c.address ?? "",
      taxNumber: c.taxNumber ?? "",
      defaultNaulage: String(c.defaultNaulage ?? ""),
      defaultNaulageUnit: c.defaultNaulageUnit || DEFAULT_NAULAGE_UNIT,
      notes: c.notes ?? "",
      image: c.image ?? "",
      customerType: c.customerType ?? "",
    });
  };

  const handleSaveEditCustomer = async () => {
    if (!editCustomer) return;
    if (!editCustomerForm.name) { toast.error("يرجى إدخال اسم العميل"); return; }
    const phoneErr = validatePhoneOptional(editCustomerForm.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    try {
      const normalizedPhone = editCustomerForm.phone ? normalizePhone(editCustomerForm.phone) : undefined;
      await apiEditCustomer({
        id: editCustomer.id,
        code: editCustomerForm.code,
        name: editCustomerForm.name,
        arName: editCustomerForm.name,
        phone: normalizedPhone,
        mobile: normalizedPhone,
        address: editCustomerForm.address || undefined,
        taxNumber: editCustomerForm.taxNumber || undefined,
        notes: editCustomerForm.notes || undefined,
        imageUrl: editCustomerForm.image || undefined,
        customerType: editCustomerForm.customerType || undefined,
        isActive: true,
      });
      if (selectedCustomer && selectedCustomer.id === editCustomer.id) {
        setSelectedCustomer(c => c ? {
          ...c,
          ...editCustomerForm,
          phone: normalizedPhone ?? "",
          defaultNaulage: Number(editCustomerForm.defaultNaulage) || 0,
          defaultNaulageUnit: editCustomerForm.defaultNaulageUnit || DEFAULT_NAULAGE_UNIT,
        } : c);
      }
      toast.success(`تم تحديث بيانات "${editCustomerForm.name}" بنجاح`);
      setEditCustomer(null);
      await reloadCustomers();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث العميل");
    }
  };

  const openEditNaulage = (ci: BackendCustomerNaulage) => {
    setEditNaulage(ci);
    setEditNaulageVal(String(ci.naulage));
    setEditNaulageUnit(ci.naulageUnit || DEFAULT_NAULAGE_UNIT);
    const { brandName } = parseExtraNotes(ci.notes);
    setEditNaulageBrandId("");
    setEditNaulageBrandName(brandName);
    setEditNaulageBrands([]);
    if (ci.itemId) {
      setLoadingEditNaulageBrands(true);
      getBrandsByItem(ci.itemId).then(brands => {
        setEditNaulageBrands(brands);
        const found = brands.find(b => b.name === brandName);
        if (found) setEditNaulageBrandId(found.id);
      }).catch(() => setEditNaulageBrands([])).finally(() => setLoadingEditNaulageBrands(false));
    }
  };

  const handleSaveNaulage = async () => {
    if (!editNaulage || !selectedCustomer) return;
    try {
      await apiEditNaulage({
        id: editNaulage.id,
        customerId: selectedCustomer.id,
        itemId: editNaulage.itemId ?? undefined,
        itemName: editNaulage.itemName,
        naulage: Number(editNaulageVal) || 0,
        naulageUnit: editNaulageUnit || DEFAULT_NAULAGE_UNIT,
        notes: encodeExtraNotes(editNaulageBrandName, "", ""),
        isActive: true,
      });
      toast.success(`تم تحديث نولون "${editNaulage.itemName}"`);
      setEditNaulage(null);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث النولون");
    }
  };

  const handleDeleteNaulage = async (n: BackendCustomerNaulage) => {
    if (!selectedCustomer) return;
    try {
      await apiDeleteNaulage(n.id);
      toast.success(`تم حذف نولون "${n.itemName}"`);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  };

  const openEditDriver = (d: BackendCustomerDriver) => {
    setEditDriver(d);
    setEditDriverForm({ name: d.name, phone: d.phone ?? "", plate: d.plate, nationalId: d.nationalId ?? "" });
  };

  const handleSaveDriver = async () => {
    if (!editDriver || !selectedCustomer) return;
    if (!editDriverForm.name) { toast.error("يرجى إدخال اسم السائق"); return; }
    if (!editDriverForm.plate) { toast.error("يرجى إدخال رقم السيارة"); return; }
    const phoneErr = validatePhoneOptional(editDriverForm.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    try {
      await apiEditDriver({
        id: editDriver.id,
        customerId: selectedCustomer.id,
        name: editDriverForm.name,
        phone: editDriverForm.phone ? normalizePhone(editDriverForm.phone) : undefined,
        plate: editDriverForm.plate,
        nationalId: editDriverForm.nationalId || undefined,
        isActive: true,
      });
      toast.success(`تم تحديث بيانات السائق "${editDriverForm.name}"`);
      setEditDriver(null);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث السائق");
    }
  };

  const handleDeleteDriver = async (d: BackendCustomerDriver) => {
    if (!selectedCustomer) return;
    try {
      await apiDeleteDriver(d.id);
      toast.success(`تم حذف السائق "${d.name}"`);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  };

  /* ── Add Driver (View Dialog) ── */
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({ name: "", phone: "", plate: "", nationalId: "" });

  const handleAddDriverInView = async () => {
    if (!selectedCustomer) return;
    if (!addDriverForm.name) { toast.error("يرجى إدخال اسم السائق"); return; }
    if (!addDriverForm.plate) { toast.error("يرجى إدخال رقم السيارة"); return; }
    const phoneErr = validatePhoneOptional(addDriverForm.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    try {
      await apiAddDriver({
        customerId: selectedCustomer.id,
        name: addDriverForm.name,
        phone: addDriverForm.phone ? normalizePhone(addDriverForm.phone) : undefined,
        plate: addDriverForm.plate,
        nationalId: addDriverForm.nationalId || undefined,
      });
      toast.success(`تم إضافة السائق "${addDriverForm.name}"`);
      setAddDriverForm({ name: "", phone: "", plate: "", nationalId: "" });
      setShowAddDriver(false);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة السائق");
    }
  };

  const handleAddContact = async () => {
    if (!selectedCustomer) return;
    if (!newContact.name) { toast.error("يرجى إدخال الاسم"); return; }
    const phoneErr = validatePhoneRequired(newContact.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    try {
      await apiAddContact({
        customerId: selectedCustomer.id,
        name: newContact.name,
        phone: normalizePhone(newContact.phone),
        role: newContact.role || undefined,
      });
      toast.success(`تم إضافة جهة الاتصال "${newContact.name}"`);
      setNewContact({ name: "", phone: "", role: "" });
      setShowAddContact(false);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل إضافة جهة الاتصال");
    }
  };

  const openEditContact = (c: BackendCustomerContact) => {
    setEditContact(c);
    setEditContactForm({ name: c.name, phone: c.phone, role: c.role ?? "" });
  };

  const handleSaveContact = async () => {
    if (!editContact || !selectedCustomer) return;
    if (!editContactForm.name) { toast.error("يرجى إدخال الاسم"); return; }
    const phoneErr = validatePhoneRequired(editContactForm.phone);
    if (phoneErr) { toast.error(phoneErr); return; }
    try {
      await apiEditContact({
        id: editContact.id,
        customerId: selectedCustomer.id,
        name: editContactForm.name,
        phone: normalizePhone(editContactForm.phone),
        role: editContactForm.role || undefined,
        isActive: true,
      });
      toast.success(`تم تحديث جهة الاتصال "${editContactForm.name}"`);
      setEditContact(null);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث جهة الاتصال");
    }
  };

  const handleDeleteContact = async (c: BackendCustomerContact) => {
    if (!selectedCustomer) return;
    try {
      await apiDeleteContact(c.id);
      toast.success(`تم حذف جهة الاتصال "${c.name}"`);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  };

  const handleDeletePrice = async (p: BackendCustomerPrice) => {
    if (!selectedCustomer) return;
    try {
      await apiDeletePrice(p.id);
      toast.success(`تم حذف سعر "${p.itemName}"`);
      await reloadCustomerSubEntities(selectedCustomer.id);
    } catch (err: any) {
      toast.error(err?.message ?? "فشل الحذف");
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* ── Header ── */}
      <motion.div variants={anim}>
        <PageHeader
          icon={Users}
          title="إدارة العملاء"
          subtitle={`${customers.length} عملاء مسجلين`}
          color="emerald"
          actions={
            <Button onClick={() => setShowAdd(true)} className="text-white gap-2" style={{ background: theme.primary }}>
              <Plus className="w-4 h-4" />إضافة عميل
            </Button>
          }
        />
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div variants={anim} className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="بحث بالاسم أو الكود أو الهاتف..."
              className="pr-9 bg-white border-gray-200"
              value={search}
              onChange={e => { setSearch(e.target.value); pager.reset(); }}
              dir="rtl"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              "flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-colors",
              showFilters || activeFilterCount > 0
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            فلترة
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          <ViewToggle view={view} setView={v => { setView(v); pager.reset(); }} />
        </div>

        {/* ── Filter row ── */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap p-3 bg-blue-50/60 border border-blue-100 rounded-xl"
            dir="rtl"
          >
            {/* Balance filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">الرصيد:</span>
              <Select value={balanceFilter} onValueChange={v => { setBalanceFilter(v as any); pager.reset(); }}>
                <SelectTrigger className="h-8 text-xs w-32 bg-white border-gray-200" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="positive"><span className="text-green-600">موجب ▲</span></SelectItem>
                  <SelectItem value="negative"><span className="text-red-600">سالب ▼</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">النوع:</span>
              <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); pager.reset(); }}>
                <SelectTrigger className="h-8 text-xs w-36 bg-white border-gray-200" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">الكل</SelectItem>
                  {customerTypes.map(t => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">الصنف:</span>
              <Select value={itemFilter} onValueChange={v => { setItemFilter(v); pager.reset(); }}>
                <SelectTrigger className="h-8 text-xs w-40 bg-white border-gray-200" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">الكل</SelectItem>
                  {filterItemOpts.map(i => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 whitespace-nowrap">الماركة:</span>
              <Select value={brandFilter} onValueChange={v => { setBrandFilter(v); pager.reset(); }}>
                <SelectTrigger className="h-8 text-xs w-36 bg-white border-gray-200" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">الكل</SelectItem>
                  {filterBrandOpts.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { clearFilters(); pager.reset(); }}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors border border-red-200"
              >
                <X className="w-3 h-3" />مسح الفلاتر
              </button>
            )}

            <span className="mr-auto text-xs text-gray-400">{filtered.length} نتيجة</span>
          </motion.div>
        )}
      </motion.div>

      <p className="text-xs text-gray-400">
        {filtered.length} عميل {search ? "— نتائج البحث" : "مسجل"}
      </p>

      {/* ══════════ GRID VIEW ══════════ */}
      {view === "grid" && (
        <motion.div variants={anim}>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              {pager.paginated.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>لا توجد نتائج للبحث</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {pager.paginated.map(c => (
                    <CustomerCard
                      key={c.id}
                      c={c as any}
                      onView={setSelectedCustomer}
                      onEdit={openEditCustomer}
                    />
                  ))}
                </div>
              )}
            </CardContent>
            <Pagination
              page={pager.page} totalPages={pager.totalPages}
              total={pager.total} pageSize={pager.pageSize}
              onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
            />
          </Card>
        </motion.div>
      )}

      {/* ══════════ LIST VIEW ══════════ */}
      {view === "list" && (
        <motion.div variants={anim}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">كود العميل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">اسم العميل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الهاتف</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الرصيد</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الاصناف الثلاجةة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">المندوب</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        لا توجد نتائج
                      </td>
                    </tr>
                  ) : (
                    pager.paginated.map((c, idx) => (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.04 }}
                        className={cn("border-b hover:bg-blue-50/30 transition-colors cursor-pointer", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}
                      >
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-600">{c.code}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <CustomerAvatar c={c as any} size="sm" />
                            <span className="font-medium text-gray-800">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{c.phone}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={cn("font-semibold", c.balance >= 0 ? "text-green-600" : "text-red-600")}>
                            {c.balance.toLocaleString("ar-EG")} ج.م
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">{c.itemsStored} طرد</td>
                        <td className="px-4 py-3.5 text-gray-600">{c.agent}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              onClick={() => setSelectedCustomer(c)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                              onClick={() => openEditCustomer(c)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pager.page} totalPages={pager.totalPages}
              total={pager.total} pageSize={pager.pageSize}
              onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
            />
          </Card>
        </motion.div>
      )}

      {/* ══════════ Customer Detail Dialog ══════════ */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-6xl w-[95vw] p-0 overflow-hidden max-h-[92vh] flex flex-col" dir="rtl">
          {selectedCustomer && (
            <>
              {/* Hero header */}
              <div className={cn("relative h-28 flex-shrink-0 bg-gradient-to-br", avatarGrad(selectedCustomer.name))}>
                <SafeImage src={(selectedCustomer as any).image} alt={selectedCustomer.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-0 right-0 left-0 px-6 pb-4 flex items-end gap-4">
                  <div className={cn("relative w-16 h-16 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center font-bold text-white text-2xl overflow-hidden bg-gradient-to-br flex-shrink-0", avatarGrad(selectedCustomer.name))}>
                    <span>{selectedCustomer.name.charAt(0)}</span>
                    <SafeImage src={(selectedCustomer as any).image} alt={selectedCustomer.name} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                  <div className="pb-1">
                    <h2 className="text-white font-bold text-lg leading-tight drop-shadow">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-mono text-[11px] bg-white/20 text-white px-2 py-0.5 rounded">{selectedCustomer.code}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", selectedCustomer.balance >= 0 ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white")}>
                        {selectedCustomer.balance >= 0 ? "+" : ""}{selectedCustomer.balance.toLocaleString()} ج.م
                      </span>
                      {selectedCustomer.customerType && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-500/80 text-white flex items-center gap-1">
                          <Tag className="w-3 h-3" />{selectedCustomer.customerType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse border-b bg-gray-50/60">
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">الأصناف الثلاجةة</p>
                  <p className="text-lg font-bold text-gray-800">{statementTotals.storedQty.toLocaleString()} <span className="text-xs font-normal text-gray-500">طرد</span></p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">النولون الافتراضي</p>
                  <p className="text-lg font-bold text-amber-600">{selectedCustomer.defaultNaulage} <span className="text-xs font-normal text-gray-500">ج.م / {selectedCustomer.defaultNaulageUnit || DEFAULT_NAULAGE_UNIT}</span></p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">المندوب</p>
                  <p className="text-sm font-semibold text-gray-700 truncate">{selectedCustomer.agent || "—"}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="p-5 overflow-y-auto">
                <Tabs defaultValue="basic" dir="rtl">
                  <TabsList dir="rtl" className="w-full bg-[#f3f4f6] rounded-xl p-1 h-auto mb-5">
                    {[
                      { value: "basic",     label: "البيانات" },
                      { value: "contacts",  label: "جهات الاتصال" },
                      { value: "naulage",   label: "النولون" },
                      { value: "pricing",   label: "الأسعار" },
                      { value: "drivers",   label: "السائقون" },
                      { value: "statement", label: "كشف الحساب" },
                    ].map(t => (
                      <TabsTrigger key={t.value} value={t.value}
                        className="flex-1 text-xs rounded-xl data-[state=active]:bg-[#155dfc] data-[state=active]:text-white data-[state=active]:shadow-none text-gray-600">
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* ── Basic Tab ── */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3.5 space-y-0.5">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />رقم الهاتف</p>
                        <p className="text-sm font-semibold text-gray-800">{selectedCustomer.phone || "—"}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3.5 space-y-0.5">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" />الرقم الضريبي</p>
                        <p className="text-sm font-semibold font-mono text-gray-800">{selectedCustomer.taxNumber || "—"}</p>
                      </div>
                      <div className="col-span-2 bg-gray-50 rounded-xl p-3.5 space-y-0.5">
                        <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />العنوان</p>
                        <p className="text-sm font-medium text-gray-800">{selectedCustomer.address || "—"}</p>
                      </div>
                      {selectedCustomer.notes && (
                        <div className="col-span-2 bg-amber-50 border border-amber-100 rounded-xl p-3.5 space-y-0.5">
                          <p className="text-[11px] text-amber-600">ملاحظات</p>
                          <p className="text-sm text-gray-700">{selectedCustomer.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-[#155dfc] hover:bg-blue-700 text-white gap-1.5 flex-1"
                        onClick={() => openEditCustomer(selectedCustomer)}
                      >
                        <Edit className="w-3.5 h-3.5" />تعديل البيانات
                      </Button>
                    </div>
                  </TabsContent>

                  {/* ── Contacts Tab ── */}
                  <TabsContent value="contacts">
                    <div className="space-y-2">
                      {loadingTabs && contacts.length === 0 && (
                        <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">جاري التحميل...</p>
                      )}
                      {contacts.map(ct => (
                        <div key={ct.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-sm text-purple-700 font-bold flex-shrink-0">
                            {ct.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{ct.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{ct.phone}</span>
                              {ct.role && <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{ct.role}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors" onClick={() => openEditContact(ct)}>
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDeleteContact(ct)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {!loadingTabs && contacts.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-10 bg-gray-50 rounded-xl">لا توجد جهات اتصال مضافة</p>
                      )}

                      {/* Add contact inline form */}
                      {showAddContact ? (
                        <div className="border border-dashed border-purple-300 rounded-xl p-4 bg-purple-50/30 space-y-3">
                          <p className="text-xs font-semibold text-purple-700">إضافة جهة اتصال جديدة</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">الاسم *</Label>
                              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300" dir="rtl"
                                placeholder="اسم جهة الاتصال" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">الهاتف *</Label>
                              <PhoneInput required value={newContact.phone} onChange={v => setNewContact({ ...newContact, phone: v })} />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">الوظيفة / الصفة</Label>
                              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300" dir="rtl"
                                placeholder="مثال: مدير المشتريات" value={newContact.role} onChange={e => setNewContact({ ...newContact, role: e.target.value })} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleAddContact} className="flex-1 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors font-medium">حفظ</button>
                            <button onClick={() => { setShowAddContact(false); setNewContact({ name: "", phone: "", role: "" }); }} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowAddContact(true)} className="flex items-center gap-1.5 text-purple-600 hover:bg-purple-50 text-sm font-medium px-3 py-2 rounded-xl border border-dashed border-purple-300 w-full justify-center mt-2">
                          <Plus className="w-3.5 h-3.5" />إضافة جهة اتصال
                        </button>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Naulage Tab ── */}
                  <TabsContent value="naulage">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">نولون التداول لكل صنف</p>
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-amber-700">افتراضي: <strong>{selectedCustomer.defaultNaulage} ج.م / {selectedCustomer.defaultNaulageUnit || DEFAULT_NAULAGE_UNIT}</strong></span>
                        </div>
                      </div>
                      {naulages.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-amber-50 rounded">
                              <th className="text-right p-2.5 text-xs text-gray-500">الصنف</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الماركة</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">النولون</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الوحدة</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">إجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {naulages.map(ci => {
                              const { brandName } = parseExtraNotes(ci.notes);
                              return (
                                <tr key={ci.id} className="border-b hover:bg-gray-50/50">
                                  <td className="p-2.5 font-medium">{ci.itemName}</td>
                                  <td className="p-2.5">
                                    {brandName ? <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{brandName}</span> : <span className="text-gray-300 text-xs">—</span>}
                                  </td>
                                  <td className="p-2.5"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">{ci.naulage} ج.م</span></td>
                                  <td className="p-2.5"><span className="text-xs text-gray-600">/ {ci.naulageUnit || DEFAULT_NAULAGE_UNIT}</span></td>
                                  <td className="p-2.5">
                                    <div className="flex items-center gap-1">
                                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={() => openEditNaulage(ci)}>
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button className="p-1 text-red-400 hover:bg-red-50 rounded" onClick={() => handleDeleteNaulage(ci)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">{loadingTabs ? "جاري التحميل..." : "لا توجد نولونات خاصة — يُطبق النولون الافتراضي"}</p>
                      )}

                      {/* Add naulage inline form */}
                      {showAddNaulage ? (
                        <div className="border border-dashed border-amber-300 rounded-xl p-4 bg-amber-50/30 space-y-3">
                          <p className="text-xs font-semibold text-amber-700">إضافة نولون لصنف جديد</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">الصنف *</Label>
                              <Select
                                value={addNaulageForm.itemId}
                                onValueChange={v => {
                                  const it = items.find(i => i.id === v);
                                  handleSharedItemChange(v, it ? (it.arName ?? it.name) : "", "naulage");
                                }}
                              >
                                <SelectTrigger dir="rtl"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                                <SelectContent dir="rtl">
                                  {items.map(item => (
                                    <SelectItem key={item.id} value={item.id}>{item.arName ?? item.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">الماركة</Label>
                              <Select
                                value={sharedAddBrandId}
                                onValueChange={v => {
                                  const br = sharedAddBrands.find(b => b.id === v);
                                  const brName = br?.name ?? "";
                                  if (showAddPrice && addPriceForm.brandName !== brName) {
                                    if (!window.confirm(`تغيير الماركة إلى "${brName || "بدون ماركة"}" سيؤثر أيضاً على نموذج الأسعار.\nهل تريد المتابعة؟`)) return;
                                  }
                                  setSharedAddBrandId(v);
                                  setSharedAddBrandName(brName);
                                  setAddNaulageForm(prev => ({ ...prev, brandId: v, brandName: brName }));
                                  setAddPriceForm(prev => ({ ...prev, brandId: v, brandName: brName }));
                                }}
                                disabled={!addNaulageForm.itemId || loadingSharedBrands}
                              >
                                <SelectTrigger dir="rtl">
                                  <SelectValue placeholder={loadingSharedBrands ? "جاري التحميل..." : sharedAddBrands.length === 0 && addNaulageForm.itemId ? "لا توجد ماركات" : "اختر ماركة (اختياري)"} />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {sharedAddBrands.map(br => (
                                    <SelectItem key={br.id} value={br.id}>{br.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">النولون (ج.م) *</Label>
                              <Input
                                type="number" dir="rtl" placeholder="0"
                                value={addNaulageForm.naulage}
                                onChange={e => setAddNaulageForm({ ...addNaulageForm, naulage: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">الوحدة</Label>
                              <Select
                                value={addNaulageForm.naulageUnit}
                                onValueChange={v => handleSharedUnitChange(v, "naulage")}
                              >
                                <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                                <SelectContent dir="rtl">
                                  {NAULAGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!selectedCustomer) return;
                                if (!addNaulageForm.itemName || !addNaulageForm.naulage) { toast.error("الصنف والنولون مطلوبان"); return; }
                                if (naulages.some(ci => ci.itemName === addNaulageForm.itemName && parseExtraNotes(ci.notes).brandName === addNaulageForm.brandName)) { toast.error("هذا الصنف والماركة مضافان بالفعل"); return; }
                                try {
                                  await apiAddNaulage({
                                    customerId: selectedCustomer.id,
                                    itemId: addNaulageForm.itemId || undefined,
                                    itemName: addNaulageForm.itemName,
                                    naulage: Number(addNaulageForm.naulage) || 0,
                                    naulageUnit: addNaulageForm.naulageUnit || DEFAULT_NAULAGE_UNIT,
                                    notes: encodeExtraNotes(addNaulageForm.brandName, "", ""),
                                  });
                                  toast.success(`تم إضافة نولون "${addNaulageForm.itemName}"${addNaulageForm.brandName ? ` - ${addNaulageForm.brandName}` : ""}`);
                                  setAddNaulageForm({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });
                                  setShowAddNaulage(false);
                                  await reloadCustomerSubEntities(selectedCustomer.id);
                                } catch (err: any) {
                                  toast.error(err?.message ?? "فشل إضافة النولون");
                                }
                              }}
                              className="flex-1 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-medium"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => { setShowAddNaulage(false); setAddNaulageForm({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" }); }}
                              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddNaulage(true)}
                          className="flex items-center gap-1.5 text-amber-700 hover:bg-amber-50 text-sm font-medium px-3 py-2 rounded-xl border border-dashed border-amber-300 w-full justify-center mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />إضافة نولون لصنف جديد
                        </button>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Pricing Tab ── */}
                  <TabsContent value="pricing">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">سعر خاص لكل صنف</p>
                        <span className="text-xs text-gray-400">
                          {pricing.length} سعر مخصص
                        </span>
                      </div>

                      {pricing.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-emerald-50 rounded">
                              <th className="text-right p-2.5 text-xs text-gray-500">الصنف</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الماركة</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">سعر اليوم</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">سعر الشهر</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">الوحدة</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">إجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pricing.map(p => {
                              const { brandName, unit } = parseExtraNotes(p.notes);
                              return (
                                <tr key={p.id} className="border-b hover:bg-gray-50/50">
                                  <td className="p-2.5 font-medium">{p.itemName}</td>
                                  <td className="p-2.5">
                                    {brandName ? <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded">{brandName}</span> : <span className="text-gray-300 text-xs">—</span>}
                                  </td>
                                  <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">{p.pricePerDay} ج.م</span></td>
                                  <td className="p-2.5"><span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">{p.pricePerMonth} ج.م</span></td>
                                  <td className="p-2.5"><span className="text-xs text-gray-600">/ {unit || DEFAULT_NAULAGE_UNIT}</span></td>
                                  <td className="p-2.5">
                                    <div className="flex items-center gap-1">
                                      <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={() => openEditPrice(p)}>
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        className="p-1 text-red-400 hover:bg-red-50 rounded"
                                        onClick={() => handleDeletePrice(p)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">{loadingTabs ? "جاري التحميل..." : "لا توجد أسعار مخصصة لهذا العميل"}</p>
                      )}

                      {/* Add price inline form */}
                      {showAddPrice ? (
                        <div className="border border-dashed border-emerald-300 rounded-xl p-4 bg-emerald-50/30 space-y-3">
                          <p className="text-xs font-semibold text-emerald-700">إضافة سعر خاص لصنف</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">الصنف *</Label>
                              <Select
                                value={addPriceForm.itemId}
                                onValueChange={v => {
                                  const it = items.find(i => i.id === v);
                                  handleSharedItemChange(v, it ? (it.arName ?? it.name) : "", "pricing");
                                }}
                              >
                                <SelectTrigger dir="rtl"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                                <SelectContent dir="rtl">
                                  {items.map(item => (
                                    <SelectItem key={item.id} value={item.id}>{item.arName ?? item.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">الماركة</Label>
                              <Select
                                value={sharedAddBrandId}
                                onValueChange={v => {
                                  const br = sharedAddBrands.find(b => b.id === v);
                                  const brName = br?.name ?? "";
                                  if (showAddNaulage && addNaulageForm.brandName !== brName) {
                                    if (!window.confirm(`تغيير الماركة إلى "${brName || "بدون ماركة"}" سيؤثر أيضاً على نموذج النولون.\nهل تريد المتابعة؟`)) return;
                                  }
                                  setSharedAddBrandId(v);
                                  setSharedAddBrandName(brName);
                                  setAddNaulageForm(prev => ({ ...prev, brandId: v, brandName: brName }));
                                  setAddPriceForm(prev => ({ ...prev, brandId: v, brandName: brName }));
                                }}
                                disabled={!addPriceForm.itemId || loadingSharedBrands}
                              >
                                <SelectTrigger dir="rtl">
                                  <SelectValue placeholder={loadingSharedBrands ? "جاري التحميل..." : sharedAddBrands.length === 0 && addPriceForm.itemId ? "لا توجد ماركات" : "اختر ماركة (اختياري)"} />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                  {sharedAddBrands.map(br => (
                                    <SelectItem key={br.id} value={br.id}>{br.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">سعر اليوم (ج.م)</Label>
                              <Input
                                type="number" dir="rtl" placeholder="0"
                                value={addPriceForm.pricePerDay}
                                onChange={e => setAddPriceForm({ ...addPriceForm, pricePerDay: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">سعر الشهر (ج.م)</Label>
                              <Input
                                type="number" dir="rtl" placeholder="0"
                                value={addPriceForm.pricePerMonth}
                                onChange={e => setAddPriceForm({ ...addPriceForm, pricePerMonth: e.target.value })}
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs">الوحدة</Label>
                              <Select
                                value={addPriceForm.priceUnit}
                                onValueChange={v => handleSharedUnitChange(v, "pricing")}
                              >
                                <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                                <SelectContent dir="rtl">
                                  {NAULAGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (!selectedCustomer) return;
                                if (!addPriceForm.itemName) { toast.error("اختر الصنف"); return; }
                                if (!addPriceForm.pricePerDay && !addPriceForm.pricePerMonth) { toast.error("أدخل سعر اليوم أو الشهر"); return; }
                                try {
                                  await apiAddPrice({
                                    customerId: selectedCustomer.id,
                                    itemId: addPriceForm.itemId || undefined,
                                    itemName: addPriceForm.itemName,
                                    pricePerDay: Number(addPriceForm.pricePerDay) || 0,
                                    pricePerMonth: Number(addPriceForm.pricePerMonth) || 0,
                                    notes: encodeExtraNotes(addPriceForm.brandName, addPriceForm.priceUnit, ""),
                                  });
                                  toast.success(`تم إضافة سعر "${addPriceForm.itemName}"${addPriceForm.brandName ? ` - ${addPriceForm.brandName}` : ""}`);
                                  setAddPriceForm({ itemName: "", itemId: "", pricePerDay: "", pricePerMonth: "", priceUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" });
                                  setShowAddPrice(false);
                                  await reloadCustomerSubEntities(selectedCustomer.id);
                                } catch (err: any) {
                                  toast.error(err?.message ?? "فشل إضافة السعر");
                                }
                              }}
                              className="flex-1 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => { setShowAddPrice(false); setAddPriceForm({ itemName: "", itemId: "", pricePerDay: "", pricePerMonth: "", priceUnit: DEFAULT_NAULAGE_UNIT, brandId: "", brandName: "" }); }}
                              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddPrice(true)}
                          className="flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-50 text-sm font-medium px-3 py-2 rounded-xl border border-dashed border-emerald-300 w-full justify-center mt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />إضافة سعر خاص لصنف جديد
                        </button>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Drivers Tab ── */}
                  <TabsContent value="drivers">
                    <div className="space-y-2">
                      {drivers.map(d => {
                        const nationalId = d.nationalId ?? "";
                        return (
                        <div key={d.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm text-blue-700 font-bold flex-shrink-0">{d.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone || "—"}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Car className="w-3 h-3" />{d.plate}</span>
                              {nationalId && (
                                <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                                  <FileText className="w-3 h-3" />{nationalId}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            onClick={() => openEditDriver(d)}
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            onClick={() => handleDeleteDriver(d)}
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        );
                      })}
                      {drivers.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">{loadingTabs ? "جاري التحميل..." : "لا يوجد سائقون مسجلون"}</p>
                      )}
                      {showAddDriver ? (
                        <div className="border border-dashed border-blue-300 rounded-xl p-4 bg-blue-50/30 space-y-3">
                          <p className="text-xs font-semibold text-blue-700">إضافة سائق جديد</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">اسم السائق *</Label>
                              <Input dir="rtl" placeholder="اسم السائق"
                                value={addDriverForm.name}
                                onChange={e => setAddDriverForm({ ...addDriverForm, name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">الرقم القومي</Label>
                              <Input dir="ltr" inputMode="numeric" maxLength={14} placeholder="12345678901234"
                                value={addDriverForm.nationalId}
                                onChange={e => setAddDriverForm({ ...addDriverForm, nationalId: e.target.value.replace(/\D/g, "").slice(0, 14) })}
                                className={cn(addDriverForm.nationalId && addDriverForm.nationalId.length !== 14 ? "border-amber-400 focus:border-amber-500 focus:ring-amber-200" : "")} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">رقم السيارة *</Label>
                              <Input dir="rtl" placeholder="أ ب ج 1234"
                                value={addDriverForm.plate}
                                onChange={e => setAddDriverForm({ ...addDriverForm, plate: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">الهاتف</Label>
                              <PhoneInput value={addDriverForm.phone} onChange={v => setAddDriverForm({ ...addDriverForm, phone: v })} />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddDriverInView}
                              className="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => { setShowAddDriver(false); setAddDriverForm({ name: "", phone: "", plate: "", nationalId: "" }); }}
                              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddDriver(true)}
                          className="flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 text-sm font-medium px-3 py-2 rounded-xl border border-dashed border-blue-300 w-full justify-center mt-2"
                        >
                          <Plus className="w-3.5 h-3.5" />إضافة سائق جديد
                        </button>
                      )}
                    </div>
                  </TabsContent>

                  {/* ── Statement Tab ── */}
                  <TabsContent value="statement">
                    <div className="space-y-3">

                      {/* ── Summary cards ── */}
                      <div className="grid grid-cols-3 gap-3">
                        {/* Opening balance card with inline edit */}
                        <div className="rounded-xl p-3 bg-gray-50 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">الرصيد الافتتاحي</p>
                            {!editingOpeningBal && (
                              <button
                                onClick={() => { setOpeningBalInput(String(selectedCustomer.openingBalance)); setEditingOpeningBal(true); }}
                                className="p-0.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                                title="تعديل الرصيد الافتتاحي"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          {editingOpeningBal ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                dir="rtl"
                                value={openingBalInput}
                                onChange={e => setOpeningBalInput(e.target.value)}
                                className="w-full h-7 rounded-md border border-blue-300 bg-white px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                                placeholder="0"
                                autoFocus
                              />
                              <button
                                onClick={handleSaveOpeningBalance}
                                disabled={savingOpeningBal}
                                className="p-1 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex-shrink-0"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingOpeningBal(false)}
                                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <p className={cn("text-xl font-bold", selectedCustomer.openingBalance >= 0 ? "text-gray-700" : "text-red-600")}>
                              {selectedCustomer.openingBalance.toLocaleString("ar-EG")} ج.م
                            </p>
                          )}
                        </div>

                        {/* Total fees card */}
                        <div className="rounded-xl p-3 bg-orange-50 border border-orange-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <TrendingDown className="w-3 h-3 text-orange-500" />إجمالي الرسوم
                          </p>
                          <p className="text-xl font-bold text-orange-600">
                            {statementTotals.totalFees.toLocaleString("ar-EG")} ج.م
                          </p>
                        </div>

                        {/* Current balance card */}
                        <div className={cn("rounded-xl p-3 text-center border", statementTotals.currentBalance >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-200")}>
                          <p className="text-xs text-gray-500 mb-1">الرصيد الحالي</p>
                          <p className={cn("text-xl font-bold", statementTotals.currentBalance >= 0 ? "text-green-600" : "text-red-600")}>
                            {statementTotals.currentBalance.toLocaleString("ar-EG")} ج.م
                          </p>
                          {statementTotals.currentBalance < 0 && (
                            <p className="text-[10px] text-red-500 mt-0.5">مديونية</p>
                          )}
                        </div>
                      </div>

                      {/* ── Inventory summary ── */}
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                        <p className="text-xs text-gray-500">الأصناف الثلاجةة</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-green-700 font-medium">وارد {statementTotals.incomingQty.toLocaleString()} طرد</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-red-700 font-medium">منصرف {statementTotals.outgoingQty.toLocaleString()} طرد</span>
                          <span className="text-gray-300">|</span>
                          <span className="text-blue-700 font-bold">{statementTotals.storedQty.toLocaleString()} طرد رصيد</span>
                        </div>
                      </div>

                      {/* ── Movements table ── */}
                      {loadingStatement ? (
                        <p className="text-sm text-gray-400 text-center py-8 bg-gray-50 rounded-xl">جاري التحميل...</p>
                      ) : statementTotals.rows.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">لا توجد حركات لهذا العميل</p>
                      ) : (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                            <span className="text-xs font-medium text-gray-600">{statementTotals.rows.length} حركة</span>
                            <button
                              onClick={() => setShowStatementFull(true)}
                              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                              title="فتح بشاشة كاملة"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />شاشة كاملة
                            </button>
                          </div>
                          <div className="overflow-x-auto max-h-[340px]">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                  <th className="text-right p-2.5 text-xs text-gray-500 whitespace-nowrap">التاريخ</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500 whitespace-nowrap">رقم الحركة</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500">النوع</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500">الصنف</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500">من / إلى</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500">الكمية</th>
                                  <th className="text-right p-2.5 text-xs text-orange-600 whitespace-nowrap">الرسوم (ج.م)</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500 whitespace-nowrap">الرصيد الجاري</th>
                                  <th className="text-right p-2.5 text-xs text-gray-500">إجراء</th>
                                </tr>
                              </thead>
                              <tbody>
                                {/* Opening balance row */}
                                <tr className="border-b bg-gray-50/80">
                                  <td colSpan={6} className="p-2.5 text-xs font-medium text-gray-600">رصيد افتتاحي</td>
                                  <td className="p-2.5 text-xs text-gray-400">—</td>
                                  <td className="p-2.5">
                                    <span className={cn("text-sm font-bold", selectedCustomer.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                                      {selectedCustomer.openingBalance.toLocaleString("ar-EG")} ج.م
                                    </span>
                                  </td>
                                  <td />
                                </tr>
                                {statementTotals.rows.map(({ m, fee, balance }) => {
                                  const typeStyle = m.movementType === "Incoming" ? "bg-green-100 text-green-700"
                                    : m.movementType === "Outgoing" ? "bg-red-100 text-red-700"
                                    : "bg-orange-100 text-orange-700";
                                  const typeLabel = m.movementType === "Incoming" ? "وارد"
                                    : m.movementType === "Outgoing" ? "منصرف" : "تحويل";
                                  const flow = m.movementType === "Incoming"
                                    ? `إلى ${m.toWarehouseName ?? "—"}${m.toChamberName ? ` / ${m.toChamberName}` : ""}`
                                    : m.movementType === "Outgoing"
                                      ? `من ${m.fromWarehouseName ?? "—"}${m.fromChamberName ? ` / ${m.fromChamberName}` : ""}`
                                      : `${m.fromWarehouseName ?? "—"} → ${m.toWarehouseName ?? "—"}`;
                                  return (
                                    <tr key={m.id} className={cn("border-b hover:bg-gray-50/50", balance < 0 && "bg-red-50/30")}>
                                      <td className="p-2.5 text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(m.movementDate).toLocaleDateString("ar-EG")}
                                      </td>
                                      <td className="p-2.5 font-mono text-xs">{m.movementNumber}</td>
                                      <td className="p-2.5">
                                        <span className={cn("px-2 py-0.5 rounded text-xs font-medium", typeStyle)}>{typeLabel}</span>
                                      </td>
                                      <td className="p-2.5 text-xs">{m.itemArName ?? m.itemName ?? "—"}</td>
                                      <td className="p-2.5 text-xs text-gray-600">{flow}</td>
                                      <td className="p-2.5 text-xs font-semibold">{(m.quantity ?? 0).toLocaleString()} {m.unit ?? "طرد"}</td>
                                      <td className="p-2.5 text-xs text-orange-600 font-medium">
                                        {fee > 0 ? `−${fee.toLocaleString("ar-EG")}` : "—"}
                                      </td>
                                      <td className="p-2.5">
                                        <span className={cn("text-sm font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>
                                          {balance.toLocaleString("ar-EG")} ج.م
                                        </span>
                                      </td>
                                      <td className="p-2.5">
                                        <button
                                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                          onClick={() => goToMovement(m)}
                                          title="فتح صفحة الحركة"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {/* Footer */}
                          <div className="grid grid-cols-3 divide-x divide-x-reverse bg-gray-50/60 border-t text-center text-xs">
                            <div className="p-2">
                              <span className="text-gray-500">إجمالي الرسوم: </span>
                              <span className="font-semibold text-orange-600">{statementTotals.totalFees.toLocaleString("ar-EG")} ج.م</span>
                            </div>
                            <div className="p-2">
                              <span className="text-gray-500">وارد: </span>
                              <span className="font-semibold text-green-700">{statementTotals.incomingQty.toLocaleString()} طرد</span>
                              <span className="mx-1 text-gray-300">|</span>
                              <span className="text-gray-500">منصرف: </span>
                              <span className="font-semibold text-red-700">{statementTotals.outgoingQty.toLocaleString()} طرد</span>
                            </div>
                            <div className="p-2">
                              <span className="text-gray-500">الرصيد الختامي: </span>
                              <span className={cn("font-bold", statementTotals.currentBalance >= 0 ? "text-green-700" : "text-red-700")}>
                                {statementTotals.currentBalance.toLocaleString("ar-EG")} ج.م
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>


      {/* ══════════ Statement Fullscreen Dialog ══════════ */}
      {selectedCustomer && (
        <Dialog open={showStatementFull} onOpenChange={setShowStatementFull}>
          <DialogContent dir="rtl" className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 !p-0 !gap-0 flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{selectedCustomer.name}</h2>
                  <p className="text-xs text-gray-500">كشف الحساب الكامل</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={cn("font-bold text-base", statementTotals.currentBalance >= 0 ? "text-green-600" : "text-red-600")}>
                  {statementTotals.currentBalance.toLocaleString("ar-EG")} ج.م
                </span>
                <span className="text-gray-400">الرصيد الحالي</span>
                <button onClick={() => setShowStatementFull(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Summary strip */}
            <div className="flex items-center gap-6 px-5 py-2.5 border-b bg-white flex-shrink-0 text-xs flex-wrap">
              <span className="text-gray-500">رصيد افتتاحي: <strong className={cn(selectedCustomer.openingBalance >= 0 ? "text-gray-700" : "text-red-600")}>{selectedCustomer.openingBalance.toLocaleString("ar-EG")} ج.م</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">إجمالي الرسوم: <strong className="text-orange-600">{statementTotals.totalFees.toLocaleString("ar-EG")} ج.م</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">وارد: <strong className="text-green-700">{statementTotals.incomingQty.toLocaleString()} طرد</strong></span>
              <span className="text-gray-500">منصرف: <strong className="text-red-700">{statementTotals.outgoingQty.toLocaleString()} طرد</strong></span>
              <span className="text-gray-500">رصيد ثلاجة: <strong className="text-blue-700">{statementTotals.storedQty.toLocaleString()} طرد</strong></span>
            </div>

            {/* Full table */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-right p-3 text-xs text-gray-500 whitespace-nowrap">#</th>
                      <th className="text-right p-3 text-xs text-gray-500 whitespace-nowrap">التاريخ</th>
                      <th className="text-right p-3 text-xs text-gray-500 whitespace-nowrap">رقم الحركة</th>
                      <th className="text-right p-3 text-xs text-gray-500">النوع</th>
                      <th className="text-right p-3 text-xs text-gray-500">الصنف</th>
                      <th className="text-right p-3 text-xs text-gray-500">من / إلى</th>
                      <th className="text-right p-3 text-xs text-gray-500">الكمية</th>
                      <th className="text-right p-3 text-xs text-gray-500">الوزن</th>
                      <th className="text-right p-3 text-xs text-gray-500">السائق / السيارة</th>
                      <th className="text-right p-3 text-xs text-orange-600 whitespace-nowrap">الرسوم (ج.م)</th>
                      <th className="text-right p-3 text-xs text-gray-500 whitespace-nowrap">الرصيد الجاري</th>
                      <th className="text-right p-3 text-xs text-gray-500">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Opening balance row */}
                    <tr className="border-b bg-blue-50/40">
                      <td className="p-3 text-xs text-gray-400">—</td>
                      <td colSpan={8} className="p-3 text-xs font-semibold text-gray-700">رصيد افتتاحي</td>
                      <td className="p-3 text-xs text-gray-400">—</td>
                      <td className="p-3">
                        <span className={cn("font-bold", selectedCustomer.openingBalance >= 0 ? "text-green-600" : "text-red-600")}>
                          {selectedCustomer.openingBalance.toLocaleString("ar-EG")} ج.م
                        </span>
                      </td>
                      <td />
                    </tr>
                    {statementTotals.rows.map(({ m, fee, balance }, idx) => {
                      const typeStyle = m.movementType === "Incoming" ? "bg-green-100 text-green-700"
                        : m.movementType === "Outgoing" ? "bg-red-100 text-red-700"
                        : "bg-orange-100 text-orange-700";
                      const typeLabel = m.movementType === "Incoming" ? "وارد"
                        : m.movementType === "Outgoing" ? "منصرف" : "تحويل";
                      const flow = m.movementType === "Incoming"
                        ? `إلى ${m.toWarehouseName ?? "—"}${m.toChamberName ? ` / ${m.toChamberName}` : ""}`
                        : m.movementType === "Outgoing"
                          ? `من ${m.fromWarehouseName ?? "—"}${m.fromChamberName ? ` / ${m.fromChamberName}` : ""}`
                          : `${m.fromWarehouseName ?? "—"} → ${m.toWarehouseName ?? "—"}`;
                      return (
                        <tr key={m.id} className={cn("border-b hover:bg-gray-50/60 transition-colors", balance < 0 && "bg-red-50/30")}>
                          <td className="p-3 text-xs text-gray-400">{idx + 1}</td>
                          <td className="p-3 text-xs text-gray-500 whitespace-nowrap">{new Date(m.movementDate).toLocaleDateString("ar-EG")}</td>
                          <td className="p-3 font-mono text-xs">{m.movementNumber}</td>
                          <td className="p-3"><span className={cn("px-2 py-0.5 rounded text-xs font-medium", typeStyle)}>{typeLabel}</span></td>
                          <td className="p-3 text-xs">{m.itemArName ?? m.itemName ?? "—"}</td>
                          <td className="p-3 text-xs text-gray-600">{flow}</td>
                          <td className="p-3 text-xs font-semibold">{(m.quantity ?? 0).toLocaleString()} {m.unit ?? "طرد"}</td>
                          <td className="p-3 text-xs text-gray-600">{m.netWeightKg ? `${m.netWeightKg.toLocaleString()} كجم` : "—"}</td>
                          <td className="p-3 text-xs text-gray-600">{m.driverName ?? "—"}{m.vehiclePlate ? ` / ${m.vehiclePlate}` : ""}</td>
                          <td className="p-3 text-xs text-orange-600 font-medium">{fee > 0 ? `−${fee.toLocaleString("ar-EG")}` : "—"}</td>
                          <td className="p-3">
                            <span className={cn("font-bold", balance >= 0 ? "text-green-600" : "text-red-600")}>
                              {balance.toLocaleString("ar-EG")} ج.م
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              onClick={() => { setShowStatementFull(false); goToMovement(m); }}
                              title="فتح صفحة الحركة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse bg-gray-50 border-t text-center text-xs flex-shrink-0">
                <div className="p-2.5">
                  <span className="text-gray-500">إجمالي الرسوم: </span>
                  <span className="font-semibold text-orange-600">{statementTotals.totalFees.toLocaleString("ar-EG")} ج.م</span>
                </div>
                <div className="p-2.5">
                  <span className="text-gray-500">وارد: </span>
                  <span className="font-semibold text-green-700">{statementTotals.incomingQty.toLocaleString()} طرد </span>
                  <span className="text-gray-300 mx-1">|</span>
                  <span className="text-gray-500">منصرف: </span>
                  <span className="font-semibold text-red-700">{statementTotals.outgoingQty.toLocaleString()} طرد</span>
                </div>
                <div className="p-2.5">
                  <span className="text-gray-500">الرصيد الختامي: </span>
                  <span className={cn("font-bold", statementTotals.currentBalance >= 0 ? "text-green-700" : "text-red-700")}>
                    {statementTotals.currentBalance.toLocaleString("ar-EG")} ج.م
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ══════════ Add Customer Dialog ══════════ */}
      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) { setNewContacts([]); setNewContactForm({ name: "", phone: "", role: "" }); setNewNaulages([]); setNewNaulageForm({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT }); } }}>
        <DialogContent dir="rtl" className="max-w-xl bg-white">
          <DialogHeader><DialogTitle>إضافة عميل جديد</DialogTitle></DialogHeader>

          <Tabs defaultValue="basic" dir="rtl" className="mt-1">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">البيانات الأساسية</TabsTrigger>
              <TabsTrigger value="naulage" className="flex-1">
                النولون
                {newNaulages.length > 0 && <span className="mr-1.5 bg-amber-600 text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center">{newNaulages.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex-1">
                جهات الاتصال
                {newContacts.length > 0 && <span className="mr-1.5 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 inline-flex items-center justify-center">{newContacts.length}</span>}
              </TabsTrigger>
            </TabsList>

            {/* ── البيانات الأساسية ── */}
            <TabsContent value="basic" className="space-y-4 pt-3">
              <ImageUploader label="صورة العميل" folder="customers" hint="انقر لرفع صورة للعميل" value={newCustomer.image} onChange={v => setNewCustomer({ ...newCustomer, image: v })} />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>كود العميل</Label>
                  <Input placeholder="C007" dir="rtl" value={newCustomer.code} onChange={e => setNewCustomer({ ...newCustomer, code: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>اسم العميل <span className="text-red-500">*</span></Label>
                  <Input placeholder="اسم الشركة أو المؤسسة" dir="rtl" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>رقم الهاتف</Label>
                  <PhoneInput value={newCustomer.phone} onChange={v => setNewCustomer({ ...newCustomer, phone: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label>المندوب</Label>
                  <Input placeholder="اسم المندوب" dir="rtl" value={newCustomer.agent} onChange={e => setNewCustomer({ ...newCustomer, agent: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>العنوان</Label>
                  <Input placeholder="المحافظة - الحي" dir="rtl" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>الرقم الضريبي</Label>
                  <Input placeholder="XXXXXXXXX" dir="rtl" value={newCustomer.taxNumber} onChange={e => setNewCustomer({ ...newCustomer, taxNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-violet-500" />نوع العميل</Label>
                  <div className="flex gap-2">
                    <Select value={newCustomer.customerType} onValueChange={v => setNewCustomer({ ...newCustomer, customerType: v })}>
                      <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] flex-1"><SelectValue placeholder="اختر النوع (اختياري)" /></SelectTrigger>
                      <SelectContent dir="rtl">
                        {customerTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <button onClick={() => { setShowAddTypeForm(true); setNewTypeName(""); }} className="p-2 border border-dashed border-violet-400 text-violet-600 rounded-lg hover:bg-violet-50 transition-colors" title="إضافة نوع جديد">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {showAddTypeForm && (
                    <div className="flex gap-2 mt-1">
                      <Input dir="rtl" placeholder="اسم النوع الجديد..." value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") void handleAddCustomerType(name => setNewCustomer(p => ({ ...p, customerType: name }))); }}
                        className="border border-violet-300 bg-violet-50/30 flex-1 text-sm h-8" />
                      <button onClick={() => handleAddCustomerType(name => setNewCustomer(p => ({ ...p, customerType: name })))}
                        className="px-3 h-8 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors">حفظ</button>
                      <button onClick={() => setShowAddTypeForm(false)} className="px-3 h-8 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
                    </div>
                  )}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>ملاحظات</Label>
                  <Textarea placeholder="ملاحظات إضافية..." dir="rtl" className="resize-none" rows={2} value={newCustomer.notes} onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })} />
                </div>
              </div>
            </TabsContent>

            {/* ── النولون ── */}
            <TabsContent value="naulage" className="pt-3 space-y-4">
              {/* Item-specific Naulages */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">نولون لكل صنف</p>

                {newNaulages.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-xl">لا توجد نولونات خاصة — يُطبق النولون الافتراضي</p>
                )}
                {newNaulages.map((n, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{n.itemName}</span>
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">{n.naulage} ج.م / {n.naulageUnit || DEFAULT_NAULAGE_UNIT}</span>
                    </div>
                    <button onClick={() => setNewNaulages(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add form */}
                <div className="border border-dashed border-amber-200 rounded-xl p-3 space-y-3 bg-amber-50/30">
                  <p className="text-xs font-semibold text-amber-700">إضافة نولون لصنف</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">الصنف *</Label>
                      <Select
                        value={newNaulageForm.itemId}
                        onValueChange={v => {
                          const it = items.find(i => i.id === v);
                          setNewNaulageForm({ ...newNaulageForm, itemId: v, itemName: it ? (it.arName ?? it.name) : "" });
                        }}
                      >
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.arName ?? item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">النولون (ج.م) *</Label>
                      <Input
                        type="number" placeholder="0" dir="rtl"
                        value={newNaulageForm.naulage}
                        onChange={e => setNewNaulageForm({ ...newNaulageForm, naulage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">الوحدة</Label>
                      <Select
                        value={newNaulageForm.naulageUnit}
                        onValueChange={v => setNewNaulageForm({ ...newNaulageForm, naulageUnit: v })}
                      >
                        <SelectTrigger dir="rtl"><SelectValue /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {NAULAGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      if (!newNaulageForm.itemName || !newNaulageForm.naulage) { toast.error("الصنف والنولون مطلوبان"); return; }
                      if (newNaulages.some(n => n.itemName === newNaulageForm.itemName)) { toast.error("هذا الصنف مضاف بالفعل"); return; }
                      setNewNaulages(prev => [...prev, { ...newNaulageForm }]);
                      setNewNaulageForm({ itemName: "", itemId: "", naulage: "", naulageUnit: DEFAULT_NAULAGE_UNIT });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />إضافة
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ── جهات الاتصال ── */}
            <TabsContent value="contacts" className="pt-3 space-y-3">
              {newContacts.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">لا توجد جهات اتصال بعد</p>
              )}
              {newContacts.map((ct, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs text-purple-700 font-bold flex-shrink-0">{ct.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{ct.name}</p>
                    <p className="text-xs text-gray-500">{ct.phone}{ct.role ? ` · ${ct.role}` : ""}</p>
                  </div>
                  <button onClick={() => setNewContacts(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="border border-dashed border-purple-200 rounded-xl p-3 space-y-3 bg-purple-50/30">
                <p className="text-xs font-semibold text-purple-700">إضافة جهة اتصال</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">الاسم *</Label>
                    <Input placeholder="اسم جهة الاتصال" dir="rtl" value={newContactForm.name} onChange={e => setNewContactForm({ ...newContactForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الهاتف *</Label>
                    <PhoneInput required value={newContactForm.phone} onChange={v => setNewContactForm({ ...newContactForm, phone: v })} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">الوظيفة / الصفة</Label>
                    <Input placeholder="مثال: مدير المشتريات" dir="rtl" value={newContactForm.role} onChange={e => setNewContactForm({ ...newContactForm, role: e.target.value })} />
                  </div>
                </div>
                <Button size="sm" className="w-full gap-1.5" onClick={() => {
                  if (!newContactForm.name) { toast.error("الاسم مطلوب"); return; }
                  const e = validatePhoneRequired(newContactForm.phone);
                  if (e) { toast.error(e); return; }
                  setNewContacts(prev => [...prev, { ...newContactForm, phone: normalizePhone(newContactForm.phone) }]);
                  setNewContactForm({ name: "", phone: "", role: "" });
                }}>
                  <Plus className="w-3.5 h-3.5" />إضافة جهة الاتصال
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSave}>حفظ العميل</Button>
            <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ Edit Customer Dialog ══════════ */}
      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent dir="rtl" className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>تعديل بيانات العميل</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <ImageUploader
              label="صورة العميل"
              folder="customers"
              hint="انقر لرفع صورة للعميل"
              value={editCustomerForm.image}
              onChange={v => setEditCustomerForm({ ...editCustomerForm, image: v })}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>كود العميل</Label>
                <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.code} onChange={e => setEditCustomerForm({ ...editCustomerForm, code: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>اسم العميل <span className="text-red-500">*</span></Label>
                <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.name} onChange={e => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>رقم الهاتف</Label>
                <PhoneInput value={editCustomerForm.phone} onChange={v => setEditCustomerForm({ ...editCustomerForm, phone: v })} />
              </div>
              <div className="space-y-1.5">
                <Label>المندوب</Label>
                <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.agent} onChange={e => setEditCustomerForm({ ...editCustomerForm, agent: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>العنوان</Label>
                <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.address} onChange={e => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>الرقم الضريبي</Label>
                <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.taxNumber} onChange={e => setEditCustomerForm({ ...editCustomerForm, taxNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-violet-500" />نوع العميل</Label>
                <div className="flex gap-2">
                  <Select value={editCustomerForm.customerType} onValueChange={v => setEditCustomerForm({ ...editCustomerForm, customerType: v })}>
                    <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] flex-1"><SelectValue placeholder="اختر النوع (اختياري)" /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {customerTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <button onClick={() => { setShowAddTypeForm(true); setNewTypeName(""); }} className="p-2 border border-dashed border-violet-400 text-violet-600 rounded-lg hover:bg-violet-50 transition-colors" title="إضافة نوع جديد">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {showAddTypeForm && (
                  <div className="flex gap-2 mt-1">
                    <Input dir="rtl" placeholder="اسم النوع الجديد..." value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") void handleAddCustomerType(name => setEditCustomerForm(p => ({ ...p, customerType: name }))); }}
                      className="border border-violet-300 bg-violet-50/30 flex-1 text-sm h-8" />
                    <button onClick={() => handleAddCustomerType(name => setEditCustomerForm(p => ({ ...p, customerType: name })))}
                      className="px-3 h-8 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors">حفظ</button>
                    <button onClick={() => setShowAddTypeForm(false)} className="px-3 h-8 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50 transition-colors">إلغاء</button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-amber-600" />النولون الافتراضي (ج.م)</Label>
                <div className="flex gap-2">
                  <Input type="number" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] flex-1"
                    value={editCustomerForm.defaultNaulage} onChange={e => setEditCustomerForm({ ...editCustomerForm, defaultNaulage: e.target.value })} />
                  <Select
                    value={editCustomerForm.defaultNaulageUnit}
                    onValueChange={v => setEditCustomerForm({ ...editCustomerForm, defaultNaulageUnit: v })}
                  >
                    <SelectTrigger dir="rtl" className="w-28 border border-[#d1d5dc] bg-[#f9fafb]"><SelectValue /></SelectTrigger>
                    <SelectContent dir="rtl">
                      {NAULAGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>ملاحظات</Label>
                <Textarea dir="rtl" className="resize-none border border-[#d1d5dc] bg-[#f9fafb]" rows={2}
                  value={editCustomerForm.notes} onChange={e => setEditCustomerForm({ ...editCustomerForm, notes: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end mt-2">
            <Button onClick={handleSaveEditCustomer} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ التعديلات</Button>
            <Button variant="outline" onClick={() => setEditCustomer(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ Edit Special Price Dialog ══════════ */}
      <Dialog open={!!editPrice} onOpenChange={() => setEditPrice(null)}>
        <DialogContent dir="rtl" className="max-w-md bg-white">
          <DialogHeader><DialogTitle>تعديل السعر الخاص</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>الصنف *</Label>
                <Select value={editPriceForm.itemId} onValueChange={v => {
                  const it = items.find(i => i.id === v);
                  const newName = it ? (it.arName ?? it.name) : editPriceForm.itemName;
                  setEditPriceForm({ ...editPriceForm, itemId: v, itemName: newName });
                  setEditPriceBrandId(""); setEditPriceBrandName(""); setEditPriceBrands([]);
                  if (v) {
                    setLoadingEditPriceBrands(true);
                    getBrandsByItem(v).then(brands => { setEditPriceBrands(brands); }).catch(() => setEditPriceBrands([])).finally(() => setLoadingEditPriceBrands(false));
                  }
                }}>
                  <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"><SelectValue placeholder={editPriceForm.itemName || "اختر صنف"} /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {items.map(item => <SelectItem key={item.id} value={item.id}>{item.arName ?? item.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الماركة</Label>
                <Select
                  value={editPriceBrandId}
                  onValueChange={v => {
                    const br = editPriceBrands.find(b => b.id === v);
                    setEditPriceBrandId(v === "__none__" ? "" : v);
                    setEditPriceBrandName(v === "__none__" ? "" : (br?.name ?? ""));
                  }}
                  disabled={loadingEditPriceBrands || editPriceBrands.length === 0}
                >
                  <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]">
                    <SelectValue placeholder={
                      loadingEditPriceBrands ? "جاري التحميل..." :
                      editPriceBrands.length === 0 ? (editPriceForm.itemId ? "لا توجد ماركات" : "اختر الصنف أولاً") :
                      "اختر ماركة (اختياري)"
                    } />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="__none__">بدون ماركة</SelectItem>
                    {editPriceBrands.map(br => (
                      <SelectItem key={br.id} value={br.id}>{br.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editPriceBrandName && !editPriceBrandId && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    الماركة المحفوظة: <strong>{editPriceBrandName}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>سعر اليوم (ج.م)</Label>
                <Input type="number" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editPriceForm.pricePerDay}
                  onChange={e => setEditPriceForm({ ...editPriceForm, pricePerDay: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>سعر الشهر (ج.م)</Label>
                <Input type="number" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editPriceForm.pricePerMonth}
                  onChange={e => setEditPriceForm({ ...editPriceForm, pricePerMonth: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>الوحدة</Label>
              <Select value={editPriceForm.priceUnit} onValueChange={v => setEditPriceForm({ ...editPriceForm, priceUnit: v })}>
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"><SelectValue /></SelectTrigger>
                <SelectContent dir="rtl">
                  {NAULAGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end">
            <Button onClick={handleSaveEditPrice} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setEditPrice(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ Edit Naulage Dialog ══════════ */}
      <Dialog open={!!editNaulage} onOpenChange={() => setEditNaulage(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تعديل النولون: {editNaulage?.itemName}</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <Label>الماركة</Label>
              <Select
                value={editNaulageBrandId}
                onValueChange={v => {
                  const br = editNaulageBrands.find(b => b.id === v);
                  setEditNaulageBrandId(v);
                  setEditNaulageBrandName(br?.name ?? "");
                }}
                disabled={loadingEditNaulageBrands || editNaulageBrands.length === 0}
              >
                <SelectTrigger dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]">
                  <SelectValue placeholder={
                    loadingEditNaulageBrands ? "جاري التحميل..." :
                    editNaulageBrands.length === 0 ? (editNaulage?.itemId ? "لا توجد ماركات لهذا الصنف" : "لا يوجد صنف مرتبط") :
                    "اختر ماركة (اختياري)"
                  } />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="__none__">بدون ماركة</SelectItem>
                  {editNaulageBrands.map(br => (
                    <SelectItem key={br.id} value={br.id}>{br.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editNaulageBrandName && !editNaulageBrandId && (
                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  الماركة المحفوظة: <strong>{editNaulageBrandName}</strong> — اختر من القائمة للتحديث
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>النولون (ج.م)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  dir="rtl"
                  className="border border-[#d1d5dc] bg-[#f9fafb] flex-1"
                  value={editNaulageVal}
                  onChange={e => setEditNaulageVal(e.target.value)}
                />
                <Select value={editNaulageUnit} onValueChange={setEditNaulageUnit}>
                  <SelectTrigger dir="rtl" className="w-28 border border-[#d1d5dc] bg-[#f9fafb]"><SelectValue /></SelectTrigger>
                  <SelectContent dir="rtl">
                    {NAULAGE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end">
            <Button onClick={handleSaveNaulage} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setEditNaulage(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ Edit Contact Dialog ══════════ */}
      <Dialog open={!!editContact} onOpenChange={() => setEditContact(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تعديل جهة الاتصال</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <Label>الاسم <span className="text-red-500">*</span></Label>
              <input className="w-full px-3 py-2 text-sm border border-[#d1d5dc] rounded-lg bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-blue-300" dir="rtl"
                value={editContactForm.name} onChange={e => setEditContactForm({ ...editContactForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>الهاتف <span className="text-red-500">*</span></Label>
              <PhoneInput required value={editContactForm.phone} onChange={v => setEditContactForm({ ...editContactForm, phone: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>الوظيفة / الصفة</Label>
              <input className="w-full px-3 py-2 text-sm border border-[#d1d5dc] rounded-lg bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-blue-300" dir="rtl"
                value={editContactForm.role} onChange={e => setEditContactForm({ ...editContactForm, role: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end">
            <Button onClick={handleSaveContact} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setEditContact(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ Edit Driver Dialog ══════════ */}
      <Dialog open={!!editDriver} onOpenChange={() => setEditDriver(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تعديل بيانات السائق</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <Label>اسم السائق <span className="text-red-500">*</span></Label>
              <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={editDriverForm.name} onChange={e => setEditDriverForm({ ...editDriverForm, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-blue-500" />الرقم القومي</Label>
              <Input
                dir="ltr" inputMode="numeric" maxLength={14} placeholder="12345678901234"
                className={cn("border bg-[#f9fafb] font-mono", editDriverForm.nationalId && editDriverForm.nationalId.length !== 14 ? "border-amber-400" : "border-[#d1d5dc]")}
                value={editDriverForm.nationalId}
                onChange={e => setEditDriverForm({ ...editDriverForm, nationalId: e.target.value.replace(/\D/g, "").slice(0, 14) })}
              />
              {editDriverForm.nationalId && editDriverForm.nationalId.length !== 14 && (
                <p className="text-xs text-amber-600">الرقم القومي يجب أن يكون 14 رقماً ({editDriverForm.nationalId.length}/14)</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>رقم الهاتف</Label>
              <PhoneInput value={editDriverForm.phone} onChange={v => setEditDriverForm({ ...editDriverForm, phone: v })} />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1"><Car className="w-3.5 h-3.5 text-gray-500" />لوحة السيارة</Label>
              <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb] font-mono"
                value={editDriverForm.plate} onChange={e => setEditDriverForm({ ...editDriverForm, plate: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2 justify-end">
            <Button onClick={handleSaveDriver} className="bg-[#155dfc] hover:bg-blue-700 text-white">حفظ</Button>
            <Button variant="outline" onClick={() => setEditDriver(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
