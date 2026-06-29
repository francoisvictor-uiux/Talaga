import { useEffect, useMemo, useState } from "react";
import { useSessionFilter } from "../hooks/useSessionFilter";
import { motion } from "motion/react";
import { Shield, Search } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { cn } from "../components/ui/utils";
import { toast } from "sonner";
import { getAllAuditLogs, type BackendAuditLog } from "../services/auditLogService";

const actionColors: Record<string, string> = {
  "إضافة": "bg-green-100 text-green-700 border-green-200",
  "تعديل": "bg-blue-100 text-blue-700 border-blue-200",
  "حذف": "bg-red-100 text-red-700 border-red-200",
};

const modules = [
  "الكل",
  "الثلاجات",
  "مربعات التبريد",
  "الأصناف",
  "الحركات",
  "العملاء",
  "الموظفون",
];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const formatDateTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function AuditLog() {
  const [rawLogs, setRawLogs] = useState<BackendAuditLog[]>([]);
  const [search, setSearch, resetSearch] = useSessionFilter("audit_search", "");
  const [moduleFilter, setModuleFilter, resetModule] = useSessionFilter("audit_module", "الكل");
  const [fromDate, setFromDate, resetFrom] = useSessionFilter("audit_from", "");
  const [toDate, setToDate, resetTo] = useSessionFilter("audit_to", "");
  const [selected, setSelected] = useState<BackendAuditLog | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getAllAuditLogs({ pageIndex: 1, pageSize: 500 });
        if (!cancelled) setRawLogs(list);
      } catch (err: any) {
        if (!cancelled) toast.error(err?.message ?? "فشل تحميل سجل التعديلات");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const from = fromDate ? new Date(fromDate).getTime() : null;
    const to = toDate ? new Date(toDate).getTime() + 86_400_000 : null;
    return rawLogs.filter(log => {
      const userName = log.userName || "";
      const matchSearch = !search ||
        userName.includes(search) ||
        log.details.includes(search) ||
        (log.entityId ?? "").includes(search);
      const matchModule = moduleFilter === "الكل" || log.module === moduleFilter;
      const t = new Date(log.dateTime).getTime();
      const matchFrom = from === null || t >= from;
      const matchTo = to === null || t <= to;
      return matchSearch && matchModule && matchFrom && matchTo;
    });
  }, [rawLogs, search, moduleFilter, fromDate, toDate]);

  const pager = usePagination(filtered, 50);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={anim}>
        <PageHeader icon={Shield} title="سجل التعديلات" subtitle="سجل قراءة فقط — لا يمكن التعديل أو الحذف" color="slate" />
      </motion.div>

      {/* Notice Banner */}
      <motion.div variants={anim} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-700">يتم تسجيل كل العمليات (إضافة / تعديل / حذف) لكل الموديولات تلقائياً.</p>
      </motion.div>

      {/* Filters */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="بحث بالمستخدم أو التفاصيل..."
                className="pr-9"
                dir="rtl"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40" dir="rtl"><SelectValue placeholder="اختر الموديول" /></SelectTrigger>
              <SelectContent dir="rtl">
                {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" className="w-36" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <span className="text-gray-400 text-xs">إلى</span>
              <Input type="date" className="w-36" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            {(search || moduleFilter !== "الكل" || fromDate || toDate) && (
              <Button size="sm" variant="outline" onClick={() => { resetSearch(); resetModule(); resetFrom(); resetTo(); pager.reset(); }}>إعادة تعيين</Button>
            )}
            <div className="text-xs text-gray-500 mr-auto">{filtered.length} سجل</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={anim}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">التاريخ والوقت</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">المستخدم</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">الموديول</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">نوع الإجراء</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">التفاصيل</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">IP العنوان</th>
                  </tr>
                </thead>
                <tbody>
                  {pager.paginated.map((log, idx) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(
                        "border-b hover:bg-blue-50/40 transition-colors cursor-pointer",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/30",
                      )}
                      onClick={() => setSelected(log)}
                      title="عرض التفاصيل"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{formatDateTime(log.dateTime)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-semibold">
                            {(log.userName || "؟").charAt(0)}
                          </div>
                          <span className="text-gray-700">{log.userName || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.module}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs border", actionColors[log.action] ?? "bg-gray-100 text-gray-700 border-gray-200")}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{log.details}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.ipAddress || "—"}</td>
                    </motion.tr>
                  ))}
                  {pager.paginated.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-400">لا توجد سجلات مطابقة</td>
                    </tr>
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

      {/* Details dialog */}
      <Dialog open={selected !== null} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent dir="rtl" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              تفاصيل السجل
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <DetailRow label="التاريخ والوقت" value={formatDateTime(selected.dateTime)} mono />
              <DetailRow label="المستخدم" value={selected.userName || "—"} />
              <DetailRow label="الموديول" value={selected.module} />
              <DetailRow
                label="نوع الإجراء"
                valueElement={
                  <span className={cn("px-2 py-0.5 rounded-full text-xs border w-fit", actionColors[selected.action] ?? "bg-gray-100 text-gray-700 border-gray-200")}>
                    {selected.action}
                  </span>
                }
              />
              <DetailRow label="نوع الكيان" value={selected.entityName || "—"} />
              <DetailRow label="معرّف الكيان" value={selected.entityId || "—"} mono />
              <DetailRow label="IP العنوان" value={selected.ipAddress || "—"} mono />
              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500 mb-1">التفاصيل الكاملة</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selected.details}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function DetailRow({ label, value, valueElement, mono = false }: { label: string; value?: string; valueElement?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-gray-500 mt-1 min-w-28">{label}</span>
      {valueElement ? (
        <div className="flex-1 text-right">{valueElement}</div>
      ) : (
        <span className={cn("text-gray-800 text-sm flex-1 text-right break-all", mono && "font-mono text-xs")}>{value}</span>
      )}
    </div>
  );
}
