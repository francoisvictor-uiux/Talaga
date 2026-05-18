import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ClipboardList, Filter, AlertTriangle, CheckCircle, TrendingUp, Search, X } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { getStockBalances, type BackendStockBalance } from "../services/cashVoucherService";
import { getAllWarehouses, type BackendWarehouse } from "../services/warehouseService";
import { getAllItems, type BackendItem } from "../services/itemService";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Inventory() {
  const [balances, setBalances] = useState<BackendStockBalance[]>([]);
  const [warehouses, setWarehouses] = useState<BackendWarehouse[]>([]);
  const [items, setItems] = useState<BackendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");

  const loadBalances = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (warehouseFilter !== "all") params.warehouseId = warehouseFilter;
      if (itemFilter !== "all") params.itemId = itemFilter;
      setBalances(await getStockBalances(params));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getAllWarehouses(1, 200).then(l => setWarehouses(l.filter(w => w.isActive))).catch(() => {}),
      getAllItems(1, 200).then(l => setItems(l.filter(i => i.isActive))).catch(() => {}),
    ]);
    void loadBalances();
  }, []);

  const filtered = balances.filter(b => {
    if (search && !b.itemName.includes(search) && !b.customerName.includes(search)) return false;
    return true;
  });

  const pager = usePagination(filtered, 10);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim}>
        <PageHeader icon={ClipboardList} title="رصيد المخزون" subtitle={`${balances.length} سجل رصيد`} color="amber" />
      </motion.div>

      <motion.div variants={anim} className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{balances.length}</p>
            <p className="text-xs text-gray-500">أصناف في الثلاجة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{balances.reduce((s, b) => s + b.quantity, 0).toLocaleString("ar-EG")}</p>
            <p className="text-xs text-gray-500">إجمالي الكميات</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-amber-600">{(balances.reduce((s, b) => s + (b.netWeightKg || 0), 0) / 1000).toFixed(1)}</p>
            <p className="text-xs text-gray-500">الوزن الإجمالي (طن)</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="relative flex-1 min-w-44">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input placeholder="بحث بالصنف أو العميل..." className="pr-9 border-gray-200" dir="rtl"
                  value={search} onChange={e => { setSearch(e.target.value); pager.reset(); }} />
                {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3 h-3" /></button>}
              </div>
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="w-44" dir="rtl"><SelectValue placeholder="اختر الثلاجة" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الثلاجات</SelectItem>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.arName || w.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={itemFilter} onValueChange={setItemFilter}>
                <SelectTrigger className="w-44" dir="rtl"><SelectValue placeholder="اختر الصنف" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأصناف</SelectItem>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.arName || i.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={loadBalances} disabled={loading}>{loading ? "جاري التحميل..." : "تطبيق"}</Button>
              <Button size="sm" variant="outline" onClick={() => { setSearch(""); setWarehouseFilter("all"); setItemFilter("all"); }}>إعادة تعيين</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الصنف</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">العميل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الثلاجة</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">مربع التبريد</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الكمية</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الوزن (كجم)</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">آخر حركة</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.paginated.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">{loading ? "جاري التحميل..." : "لا توجد أرصدة"}</td></tr>
                  ) : (
                    pager.paginated.map((row, idx) => (
                      <tr key={row.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                        <td className="px-4 py-3 font-medium text-gray-800">{row.itemName}</td>
                        <td className="px-4 py-3 text-gray-600">{row.customerName}</td>
                        <td className="px-4 py-3 text-gray-600">{row.warehouseName}</td>
                        <td className="px-4 py-3 text-gray-600">{row.chamberName}</td>
                        <td className="px-4 py-3 font-semibold text-blue-700">{row.quantity.toLocaleString("ar-EG")} {row.unit || "طرد"}</td>
                        <td className="px-4 py-3 text-gray-600">{row.netWeightKg ? `${row.netWeightKg.toLocaleString("ar-EG")} كجم` : "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.lastMovementDate ? new Date(row.lastMovementDate).toLocaleDateString("ar-EG") : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination page={pager.page} totalPages={pager.totalPages} total={pager.total} pageSize={pager.pageSize} onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
