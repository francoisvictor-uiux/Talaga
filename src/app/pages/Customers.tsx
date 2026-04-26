import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Search, Eye, Edit, Phone, X, DollarSign,
  Camera, LayoutGrid, List, User, MapPin, FileText, Car, Trash2, Contact, Users,
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
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { useDb } from "../context/DbContext";
import { useTheme } from "../context/ThemeContext";
import {
  getAllCustomers,
  addCustomer as apiAddCustomer,
  editCustomer as apiEditCustomer,
  type BackendCustomer,
} from "../services/customerService";

import { PageHeader } from "../components/layout/PageHeader";

type CustomerView = {
  id: string;
  code: string;
  name: string;
  phone: string;
  balance: number;
  itemsStored: number;
  agent: string;
  address: string;
  taxNumber: string;
  defaultNaulage: number;
  notes: string;
  image?: string;
};

type CustomerDriver  = ReturnType<typeof useDb>["customerDrivers"][0];
type CustomerItem    = ReturnType<typeof useDb>["customerItems"][0];
type CustomerContact = ReturnType<typeof useDb>["customerContacts"][0];

const mapCustomer = (c: BackendCustomer): CustomerView => ({
  id: c.id,
  code: c.code,
  name: c.arName || c.name,
  phone: c.mobile ?? c.phone ?? "",
  balance: c.currentBalance ?? 0,
  itemsStored: 0,
  agent: "",
  address: c.address ?? "",
  taxNumber: c.taxNumber ?? "",
  defaultNaulage: 0,
  notes: c.notes ?? "",
});

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
   ImageUploader
══════════════════════════════════════════════════════════ */
function ImageUploader({
  value, onChange, label,
}: { value: string; onChange: (v: string) => void; label: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange(URL.createObjectURL(file));
  };
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        onClick={() => ref.current?.click()}
        className="relative w-full h-28 rounded-xl border-2 border-dashed border-[#d1d5dc] bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer hover:border-[#155dfc] hover:bg-blue-50/30 transition-all group overflow-hidden"
      >
        {value ? (
          <>
            <img src={value} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-white text-xs">تغيير الصورة</span>
            </div>
          </>
        ) : (
          <>
            <Camera className="w-7 h-7 text-gray-300 mb-1.5 group-hover:text-[#155dfc] transition-colors" />
            <span className="text-xs text-gray-400 group-hover:text-[#155dfc] transition-colors">انقر لرفع صورة للعميل</span>
            <span className="text-[10px] text-gray-300 mt-0.5">PNG · JPG · حتى 2 ميجا</span>
          </>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
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
   CustomerAvatar
══════════════════════════════════════════════════════════ */
function CustomerAvatar({ c, size = "sm" }: { c: CustomerView; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "w-16 h-16 text-2xl" : "w-9 h-9 text-sm";
  if (c.image) {
    return <img src={c.image} alt={c.name} className={cn(dim, "rounded-full object-cover flex-shrink-0")} />;
  }
  return (
    <div className={cn(dim, "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br", avatarGrad(c.name))}>
      {c.name.charAt(0)}
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
        <div className={cn("relative h-24 flex-shrink-0 flex items-end justify-center pb-0", c.image ? "" : `bg-gradient-to-br ${grad} opacity-90`)}>
          {c.image && (
            <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-black/20" />
          <span className="absolute top-2 right-2 font-mono text-[10px] bg-white/90 backdrop-blur-sm text-blue-700 px-2 py-0.5 rounded z-10">
            {c.code}
          </span>
        </div>

        {/* Avatar overlapping banner */}
        <div className="flex justify-center -mt-6 z-10 relative px-4">
          <div className={cn("w-12 h-12 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-white flex-shrink-0 bg-gradient-to-br overflow-hidden", c.image ? "" : grad)}>
            {c.image
              ? <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
              : <span className="text-lg">{c.name.charAt(0)}</span>
            }
          </div>
        </div>

        <CardContent className="p-4 flex flex-col flex-1 pt-2 text-center">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight mb-0.5">{c.name}</h3>
          <p className="text-xs text-gray-400 mb-3">{c.agent}</p>

          <div className="space-y-1.5 text-xs border-t pt-3 flex-1 text-right">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{c.phone}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>الأصناف المخزنة</span>
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
   Main Component
══════════════════════════════════════════════════════════ */
export function Customers() {
  const {
    customerDrivers, customerPricing, customerItems, customerContacts, items,
    updateCustomerItem, addCustomerItem, deleteCustomerItem, updateCustomerDriver,
    addCustomerContact, updateCustomerContact, deleteCustomerContact,
  } = useDb();
  const { theme } = useTheme();

  /* ── API-backed customer list ── */
  const [rawCustomers, setRawCustomers] = useState<BackendCustomer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

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

  useEffect(() => { void reloadCustomers(); }, []);

  const customers = useMemo<CustomerView[]>(
    () => rawCustomers.filter(c => c.isActive).map(mapCustomer),
    [rawCustomers],
  );

  const [view, setView]                     = useState<"grid" | "list">("list");
  const [search, setSearch]                 = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerView | null>(null);
  const [showAdd, setShowAdd]               = useState(false);

  /* ── Edit Customer State ── */
  const [editCustomer, setEditCustomer]     = useState<CustomerView | null>(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    code: "", name: "", phone: "", agent: "", address: "",
    taxNumber: "", defaultNaulage: "", notes: "", image: "",
  });

  /* ── Edit Naulage State ── */
  const [editNaulage, setEditNaulage]       = useState<CustomerItem | null>(null);
  const [editNaulageVal, setEditNaulageVal] = useState("");

  /* ── Edit Driver State ── */
  const [editDriver, setEditDriver]         = useState<CustomerDriver | null>(null);
  const [editDriverForm, setEditDriverForm] = useState({ name: "", phone: "", plate: "" });

  /* ── Contacts State ── */
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact]         = useState({ name: "", phone: "", role: "" });
  const [editContact, setEditContact]       = useState<CustomerContact | null>(null);
  const [editContactForm, setEditContactForm] = useState({ name: "", phone: "", role: "" });

  const [newCustomer, setNewCustomer]       = useState({
    code: "", name: "", phone: "", agent: "", address: "",
    taxNumber: "", defaultNaulage: "", notes: "", image: "",
  });
  const [newContacts, setNewContacts] = useState<{name: string; phone: string; role: string}[]>([]);
  const [newContactForm, setNewContactForm] = useState({ name: "", phone: "", role: "" });

  /* ── Add Naulage (Add Dialog) ── */
  const [newNaulages, setNewNaulages] = useState<{itemName: string; naulage: string}[]>([]);
  const [newNaulageForm, setNewNaulageForm] = useState({ itemName: "", naulage: "" });

  /* ── Add Naulage (View Dialog) ── */
  const [showAddNaulage, setShowAddNaulage] = useState(false);
  const [addNaulageForm, setAddNaulageForm] = useState({ itemName: "", naulage: "" });

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.code.includes(search) || c.phone.includes(search)
  );

  const pager = usePagination(filtered, view === "grid" ? 12 : 10);

  /* ── Handlers ── */
  const handleSave = async () => {
    if (!newCustomer.name) { toast.error("يرجى إدخال اسم العميل"); return; }
    try {
      const created = await apiAddCustomer({
        code: newCustomer.code || `C${String(rawCustomers.length + 1).padStart(3, "0")}`,
        name: newCustomer.name,
        arName: newCustomer.name,
        phone: newCustomer.phone || undefined,
        mobile: newCustomer.phone || undefined,
        address: newCustomer.address || undefined,
        taxNumber: newCustomer.taxNumber || undefined,
        notes: newCustomer.notes || undefined,
        openingBalance: 0,
      });
      newContacts.forEach(ct => addCustomerContact({ ...ct, customerId: created.id as any }));
      newNaulages.forEach(n => addCustomerItem({ customerId: created.id as any, itemName: n.itemName, naulage: Number(n.naulage) || 0 }));
      const parts = [];
      if (newContacts.length) parts.push(`${newContacts.length} جهة اتصال`);
      if (newNaulages.length) parts.push(`${newNaulages.length} نولون`);
      toast.success(`تم إضافة العميل "${newCustomer.name}" بنجاح${parts.length ? ` مع ${parts.join(" و ")}` : ""}`);
      setShowAdd(false);
      setNewCustomer({ code: "", name: "", phone: "", agent: "", address: "", taxNumber: "", defaultNaulage: "", notes: "", image: "" });
      setNewContacts([]);
      setNewContactForm({ name: "", phone: "", role: "" });
      setNewNaulages([]);
      setNewNaulageForm({ itemName: "", naulage: "" });
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
      notes: c.notes ?? "",
      image: c.image ?? "",
    });
  };

  const handleSaveEditCustomer = async () => {
    if (!editCustomer) return;
    if (!editCustomerForm.name) { toast.error("يرجى إدخال اسم العميل"); return; }
    try {
      await apiEditCustomer({
        id: editCustomer.id,
        code: editCustomerForm.code,
        name: editCustomerForm.name,
        arName: editCustomerForm.name,
        phone: editCustomerForm.phone || undefined,
        mobile: editCustomerForm.phone || undefined,
        address: editCustomerForm.address || undefined,
        taxNumber: editCustomerForm.taxNumber || undefined,
        notes: editCustomerForm.notes || undefined,
        isActive: true,
      });
      if (selectedCustomer && selectedCustomer.id === editCustomer.id) {
        setSelectedCustomer(c => c ? {
          ...c,
          ...editCustomerForm,
          defaultNaulage: Number(editCustomerForm.defaultNaulage) || 0,
        } : c);
      }
      toast.success(`تم تحديث بيانات "${editCustomerForm.name}" بنجاح`);
      setEditCustomer(null);
      await reloadCustomers();
    } catch (err: any) {
      toast.error(err?.message ?? "فشل تحديث العميل");
    }
  };

  const openEditNaulage = (ci: CustomerItem) => {
    setEditNaulage(ci);
    setEditNaulageVal(String(ci.naulage));
  };

  const handleSaveNaulage = () => {
    if (!editNaulage) return;
    updateCustomerItem(editNaulage.id, { naulage: Number(editNaulageVal) || 0 });
    toast.success(`تم تحديث نولون "${editNaulage.itemName}"`);
    setEditNaulage(null);
  };

  const openEditDriver = (d: CustomerDriver) => {
    setEditDriver(d);
    setEditDriverForm({ name: d.name, phone: d.phone, plate: d.plate });
  };

  const handleSaveDriver = () => {
    if (!editDriver) return;
    if (!editDriverForm.name) { toast.error("يرجى إدخال اسم السائق"); return; }
    updateCustomerDriver(editDriver.id, {
      name: editDriverForm.name,
      phone: editDriverForm.phone,
      plate: editDriverForm.plate,
    });
    toast.success(`تم تحديث بيانات السائق "${editDriverForm.name}"`);
    setEditDriver(null);
  };

  const handleAddContact = () => {
    if (!selectedCustomer) return;
    if (!newContact.name || !newContact.phone) { toast.error("يرجى إدخال الاسم والهاتف"); return; }
    addCustomerContact({ customerId: selectedCustomer.id as any, name: newContact.name, phone: newContact.phone, role: newContact.role });
    toast.success(`تم إضافة جهة الاتصال "${newContact.name}"`);
    setNewContact({ name: "", phone: "", role: "" });
    setShowAddContact(false);
  };

  const openEditContact = (c: CustomerContact) => {
    setEditContact(c);
    setEditContactForm({ name: c.name, phone: c.phone, role: c.role });
  };

  const handleSaveContact = () => {
    if (!editContact) return;
    if (!editContactForm.name || !editContactForm.phone) { toast.error("يرجى إدخال الاسم والهاتف"); return; }
    updateCustomerContact(editContact.id, editContactForm);
    toast.success(`تم تحديث جهة الاتصال "${editContactForm.name}"`);
    setEditContact(null);
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
      <motion.div variants={anim} className="flex items-center gap-2 flex-wrap">
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
        <ViewToggle view={view} setView={v => { setView(v); pager.reset(); }} />
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
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الاصناف المخزنة</th>
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
        <DialogContent className="max-w-3xl w-full p-0" dir="rtl">
          {selectedCustomer && (
            <>
              {/* Hero header */}
              <div className={cn("relative h-28 flex-shrink-0 bg-gradient-to-br", avatarGrad(selectedCustomer.name))}>
                {(selectedCustomer as any).image && (
                  <img src={(selectedCustomer as any).image} alt={selectedCustomer.name} className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-0 right-0 left-0 px-6 pb-4 flex items-end gap-4">
                  <div className={cn("w-16 h-16 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center font-bold text-white text-2xl overflow-hidden bg-gradient-to-br flex-shrink-0", (selectedCustomer as any).image ? "" : avatarGrad(selectedCustomer.name))}>
                    {(selectedCustomer as any).image
                      ? <img src={(selectedCustomer as any).image} alt={selectedCustomer.name} className="w-full h-full object-cover" />
                      : selectedCustomer.name.charAt(0)
                    }
                  </div>
                  <div className="pb-1">
                    <h2 className="text-white font-bold text-lg leading-tight drop-shadow">{selectedCustomer.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] bg-white/20 text-white px-2 py-0.5 rounded">{selectedCustomer.code}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded", selectedCustomer.balance >= 0 ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white")}>
                        {selectedCustomer.balance >= 0 ? "+" : ""}{selectedCustomer.balance.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats bar */}
              <div className="grid grid-cols-3 divide-x divide-x-reverse border-b bg-gray-50/60">
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">الأصناف المخزنة</p>
                  <p className="text-lg font-bold text-gray-800">{selectedCustomer.itemsStored} <span className="text-xs font-normal text-gray-500">طرد</span></p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">النولون الافتراضي</p>
                  <p className="text-lg font-bold text-amber-600">{selectedCustomer.defaultNaulage} <span className="text-xs font-normal text-gray-500">ج.م/طرد</span></p>
                </div>
                <div className="px-5 py-3 text-center">
                  <p className="text-xs text-gray-400">المندوب</p>
                  <p className="text-sm font-semibold text-gray-700 truncate">{selectedCustomer.agent || "—"}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="p-5">
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
                      {customerContacts.filter(c => String(c.customerId) === selectedCustomer.id).map(ct => (
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
                            <button className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" onClick={() => { deleteCustomerContact(ct.id); toast.success(`تم حذف جهة الاتصال "${ct.name}"`); }}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {customerContacts.filter(c => String(c.customerId) === selectedCustomer.id).length === 0 && (
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
                              <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-300" dir="rtl"
                                placeholder="01XXXXXXXXX" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
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
                          <span className="text-xs text-amber-700">افتراضي: <strong>{selectedCustomer.defaultNaulage} ج.م/طرد</strong></span>
                        </div>
                      </div>
                      {customerItems.filter(ci => String(ci.customerId) === selectedCustomer.id).length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-amber-50 rounded">
                              <th className="text-right p-2.5 text-xs text-gray-500">الصنف</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">النولون (ج.م/طرد)</th>
                              <th className="text-right p-2.5 text-xs text-gray-500">إجراء</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerItems.filter(ci => String(ci.customerId) === selectedCustomer.id).map(ci => (
                              <tr key={ci.id} className="border-b hover:bg-gray-50/50">
                                <td className="p-2.5 font-medium">{ci.itemName}</td>
                                <td className="p-2.5"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">{ci.naulage} ج.م</span></td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-1">
                                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" onClick={() => openEditNaulage(ci)}>
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1 text-red-400 hover:bg-red-50 rounded" onClick={() => { deleteCustomerItem(ci.id); toast.success(`تم حذف نولون "${ci.itemName}"`); }}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8 bg-gray-50 rounded-xl">لا توجد نولونات خاصة — يُطبق النولون الافتراضي</p>
                      )}

                      {/* Add naulage inline form */}
                      {showAddNaulage ? (
                        <div className="border border-dashed border-amber-300 rounded-xl p-4 bg-amber-50/30 space-y-3">
                          <p className="text-xs font-semibold text-amber-700">إضافة نولون لصنف جديد</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">الصنف *</Label>
                              <Select
                                value={addNaulageForm.itemName}
                                onValueChange={v => setAddNaulageForm({ ...addNaulageForm, itemName: v })}
                              >
                                <SelectTrigger dir="rtl"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                                <SelectContent dir="rtl">
                                  {items.map(item => (
                                    <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">النولون (ج.م/طرد) *</Label>
                              <Input
                                type="number" dir="rtl" placeholder="0"
                                value={addNaulageForm.naulage}
                                onChange={e => setAddNaulageForm({ ...addNaulageForm, naulage: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!selectedCustomer) return;
                                if (!addNaulageForm.itemName || !addNaulageForm.naulage) { toast.error("الصنف والنولون مطلوبان"); return; }
                                if (customerItems.some(ci => String(ci.customerId) === selectedCustomer.id && ci.itemName === addNaulageForm.itemName)) { toast.error("هذا الصنف مضاف بالفعل"); return; }
                                addCustomerItem({ customerId: selectedCustomer.id as any, itemName: addNaulageForm.itemName, naulage: Number(addNaulageForm.naulage) || 0 });
                                toast.success(`تم إضافة نولون "${addNaulageForm.itemName}"`);
                                setAddNaulageForm({ itemName: "", naulage: "" });
                                setShowAddNaulage(false);
                              }}
                              className="flex-1 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors font-medium"
                            >
                              حفظ
                            </button>
                            <button
                              onClick={() => { setShowAddNaulage(false); setAddNaulageForm({ itemName: "", naulage: "" }); }}
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
                    <div className="space-y-2">
                      {customerPricing.filter(p => String(p.customerId) === selectedCustomer.id).length > 0 ? (
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50 rounded"><th className="text-right p-2.5 text-xs text-gray-500">الصنف</th><th className="text-right p-2.5 text-xs text-gray-500">سعر اليوم</th><th className="text-right p-2.5 text-xs text-gray-500">سعر الشهر</th></tr></thead>
                          <tbody>
                            {customerPricing.filter(p => String(p.customerId) === selectedCustomer.id).map(p => (
                              <tr key={p.id} className="border-b"><td className="p-2.5">{p.itemName}</td><td className="p-2.5">{p.pricePerDay} ج.م</td><td className="p-2.5">{p.pricePerMonth} ج.م</td></tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p className="text-sm text-gray-500 text-center py-10 bg-gray-50 rounded-xl">لا توجد أسعار مخصصة</p>}
                    </div>
                  </TabsContent>

                  {/* ── Drivers Tab ── */}
                  <TabsContent value="drivers">
                    <div className="space-y-2">
                      {customerDrivers.filter(d => String(d.customerId) === selectedCustomer.id).map(d => (
                        <div key={d.id} className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm text-blue-700 font-bold flex-shrink-0">{d.name.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{d.phone}</span>
                              <span className="text-xs text-gray-500 flex items-center gap-1"><Car className="w-3 h-3" />{d.plate}</span>
                            </div>
                          </div>
                          <button
                            className="p-1.5 text-gray-400 hover:bg-gray-200 rounded-lg transition-colors"
                            onClick={() => openEditDriver(d)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {customerDrivers.filter(d => String(d.customerId) === selectedCustomer.id).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-10 bg-gray-50 rounded-xl">لا يوجد سائقون مسجلون</p>
                      )}
                      <button className="flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 text-sm font-medium px-3 py-2 rounded-xl border border-dashed border-blue-300 w-full justify-center mt-2">
                        <Plus className="w-3.5 h-3.5" />إضافة سائق جديد
                      </button>
                    </div>
                  </TabsContent>

                  {/* ── Statement Tab ── */}
                  <TabsContent value="statement">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={cn("rounded-xl p-4 text-center", selectedCustomer.balance >= 0 ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100")}>
                          <p className="text-xs text-gray-500 mb-1">الرصيد الحالي</p>
                          <p className={cn("text-2xl font-bold", selectedCustomer.balance >= 0 ? "text-green-600" : "text-red-600")}>
                            {selectedCustomer.balance.toLocaleString()} ج.م
                          </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                          <p className="text-xs text-gray-500 mb-1">الأصناف المخزنة</p>
                          <p className="text-2xl font-bold text-blue-600">{selectedCustomer.itemsStored}</p>
                          <p className="text-xs text-gray-400">طرد</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">سيتم عرض كشف الحساب التفصيلي هنا</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════ Add Customer Dialog ══════════ */}
      <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) { setNewContacts([]); setNewContactForm({ name: "", phone: "", role: "" }); setNewNaulages([]); setNewNaulageForm({ itemName: "", naulage: "" }); } }}>
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
              <ImageUploader label="صورة العميل" value={newCustomer.image} onChange={v => setNewCustomer({ ...newCustomer, image: v })} />
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
                  <Input placeholder="01XXXXXXXXX" dir="rtl" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
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
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">{n.naulage} ج.م / طرد</span>
                    </div>
                    <button onClick={() => setNewNaulages(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add form */}
                <div className="border border-dashed border-amber-200 rounded-xl p-3 space-y-3 bg-amber-50/30">
                  <p className="text-xs font-semibold text-amber-700">إضافة نولون لصنف</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">الصنف *</Label>
                      <Select
                        value={newNaulageForm.itemName}
                        onValueChange={v => setNewNaulageForm({ ...newNaulageForm, itemName: v })}
                      >
                        <SelectTrigger dir="rtl"><SelectValue placeholder="اختر صنف" /></SelectTrigger>
                        <SelectContent dir="rtl">
                          {items.map(item => (
                            <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">النولون (ج.م/طرد) *</Label>
                      <Input
                        type="number" placeholder="0" dir="rtl"
                        value={newNaulageForm.naulage}
                        onChange={e => setNewNaulageForm({ ...newNaulageForm, naulage: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      if (!newNaulageForm.itemName || !newNaulageForm.naulage) { toast.error("الصنف والنولون مطلوبان"); return; }
                      if (newNaulages.some(n => n.itemName === newNaulageForm.itemName)) { toast.error("هذا الصنف مضاف بالفعل"); return; }
                      setNewNaulages(prev => [...prev, { ...newNaulageForm }]);
                      setNewNaulageForm({ itemName: "", naulage: "" });
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
                    <Input placeholder="01XXXXXXXXX" dir="rtl" value={newContactForm.phone} onChange={e => setNewContactForm({ ...newContactForm, phone: e.target.value })} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">الوظيفة / الصفة</Label>
                    <Input placeholder="مثال: مدير المشتريات" dir="rtl" value={newContactForm.role} onChange={e => setNewContactForm({ ...newContactForm, role: e.target.value })} />
                  </div>
                </div>
                <Button size="sm" className="w-full gap-1.5" onClick={() => {
                  if (!newContactForm.name || !newContactForm.phone) { toast.error("الاسم والهاتف مطلوبان"); return; }
                  setNewContacts(prev => [...prev, { ...newContactForm }]);
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
                <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.phone} onChange={e => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })} />
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
                <Label className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-amber-600" />النولون الافتراضي (ج.م/طرد)</Label>
                <Input type="number" dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                  value={editCustomerForm.defaultNaulage} onChange={e => setEditCustomerForm({ ...editCustomerForm, defaultNaulage: e.target.value })} />
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

      {/* ══════════ Edit Naulage Dialog ══════════ */}
      <Dialog open={!!editNaulage} onOpenChange={() => setEditNaulage(null)}>
        <DialogContent dir="rtl" className="max-w-sm bg-white">
          <DialogHeader><DialogTitle>تعديل النولون: {editNaulage?.itemName}</DialogTitle></DialogHeader>
          <div className="py-3 space-y-3">
            <div className="space-y-1.5">
              <Label>النولون (ج.م/طرد)</Label>
              <Input
                type="number"
                dir="rtl"
                className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={editNaulageVal}
                onChange={e => setEditNaulageVal(e.target.value)}
              />
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
              <input className="w-full px-3 py-2 text-sm border border-[#d1d5dc] rounded-lg bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-blue-300" dir="rtl"
                value={editContactForm.phone} onChange={e => setEditContactForm({ ...editContactForm, phone: e.target.value })} />
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
              <Label>رقم الهاتف</Label>
              <Input dir="rtl" className="border border-[#d1d5dc] bg-[#f9fafb]"
                value={editDriverForm.phone} onChange={e => setEditDriverForm({ ...editDriverForm, phone: e.target.value })} />
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