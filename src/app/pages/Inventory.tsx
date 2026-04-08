import { useState } from "react";
import { motion } from "motion/react";
import { ClipboardList, Filter, Play, AlertTriangle, CheckCircle, TrendingUp, Search, X } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { inventory, customers, warehouses, items } from "../data/mockData";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";

const diffBadge: Record<string, string> = {
  "مطابق": "bg-green-100 text-green-700 border-green-200",
  "عجز": "bg-red-100 text-red-700 border-red-200",
  "زيادة": "bg-orange-100 text-orange-700 border-orange-200",
};

const diffIcon = {
  "مطابق": CheckCircle,
  "عجز": AlertTriangle,
  "زيادة": TrendingUp,
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function Inventory() {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");

  const filtered = inventory.filter(i => {
    const matchSearch = i.item.includes(search) || i.customer.includes(search);
    const matchWarehouse = warehouseFilter === "all";
    const matchItem = itemFilter === "all" || i.item.includes(itemFilter);
    return matchSearch && matchWarehouse && matchItem;
  });

  const pager = usePagination(filtered, 10);

  const summaryData = {
    matching: inventory.filter(i => i.status === "مطابق").length,
    deficit: inventory.filter(i => i.status === "عجز").length,
    surplus: inventory.filter(i => i.status === "زيادة").length,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={anim} className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">الجرد والتسويات</h2>
          <p className="text-sm text-gray-500">آخر جرد: يناير 2024</p>
        </div>
        <Button onClick={() => toast.info("جاري تحضير نموذج الجرد...")} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Play className="w-4 h-4" />بدء جرد جديد
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={anim} className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{summaryData.matching}</p>
            <p className="text-xs text-gray-500">مطابق</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{summaryData.deficit}</p>
            <p className="text-xs text-gray-500">عجز</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{summaryData.surplus}</p>
            <p className="text-xs text-gray-500">زيادة</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
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
              <Select onValueChange={v => setWarehouseFilter(v)}>
                <SelectTrigger className="w-44" dir="rtl"><SelectValue placeholder="اختر المخزن" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل المخازن</SelectItem>
                  {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select onValueChange={v => setItemFilter(v)}>
                <SelectTrigger className="w-44" dir="rtl"><SelectValue placeholder="اختر الصنف" /></SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كل الأصناف</SelectItem>
                  {items.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => pager.reset()}>تطبيق</Button>
              <Button size="sm" variant="outline" onClick={() => { setSearch(""); setWarehouseFilter("all"); setItemFilter("all"); }}>إعادة تعيين</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Inventory Table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الصنف</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">العميل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الرصيد النظري</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الجرد الفعلي</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الفرق</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.paginated.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">لا توجد نتائج</td></tr>
                  ) : (
                    pager.paginated.map((row, idx) => {
                      const Icon = diffIcon[row.status] ?? CheckCircle;
                      return (
                        <tr key={row.id} className={cn("border-b hover:bg-gray-50/50 transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}>
                          <td className="px-4 py-3 font-medium text-gray-800">{row.item}</td>
                          <td className="px-4 py-3 text-gray-600">{row.customer}</td>
                          <td className="px-4 py-3 text-gray-700">{row.theoretical} طرد</td>
                          <td className="px-4 py-3 text-gray-700">{row.actual} طرد</td>
                          <td className="px-4 py-3">
                            <span className={cn("font-semibold", row.diff > 0 ? "text-orange-600" : row.diff < 0 ? "text-red-600" : "text-green-600")}>
                              {row.diff > 0 ? "+" : ""}{row.diff}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", diffBadge[row.status])}>
                              <Icon className="w-3 h-3" />{row.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pager.page} totalPages={pager.totalPages}
              total={pager.total} pageSize={pager.pageSize}
              onPageChange={pager.changePage} onPageSizeChange={pager.changePageSize}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}