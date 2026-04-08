import { useState } from "react";
import { motion } from "motion/react";
import { Shield, Search, ChevronDown } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { auditLogs } from "../data/mockData";
import { Pagination, usePagination } from "../components/ui/Pagination";
import { cn } from "../components/ui/utils";
import React from "react";

const actionColors: Record<string, string> = {
  "إضافة": "bg-green-100 text-green-700 border-green-200",
  "تعديل": "bg-blue-100 text-blue-700 border-blue-200",
  "حذف": "bg-red-100 text-red-700 border-red-200",
};

const modules = ["الكل", "الوارد", "المنصرف", "المخازن", "العملاء", "الموظفون", "الأصناف", "السندات", "الإعدادات"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const anim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export function AuditLog() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("الكل");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = auditLogs.filter(log => {
    const matchSearch = log.user.includes(search) || log.details.includes(search);
    const matchModule = moduleFilter === "الكل" || log.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const pager = usePagination(filtered, 10);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={anim} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Shield className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">سجل التعديلات</h2>
          <p className="text-sm text-gray-500">سجل قراءة فقط — لا يمكن التعديل أو الحذف</p>
        </div>
      </motion.div>

      {/* Notice Banner */}
      <motion.div variants={anim} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-sm text-blue-700">هذه الصفحة للقراءة فقط. يتم تسجيل جميع الإجراءات تلقائياً ولا يمكن تعديلها.</p>
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
            <Select onValueChange={setModuleFilter}>
              <SelectTrigger className="w-40" dir="rtl"><SelectValue placeholder="اختر الموديول" /></SelectTrigger>
              <SelectContent dir="rtl">
                {modules.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input type="date" className="w-36" />
              <span className="text-gray-400 text-xs">إلى</span>
              <Input type="date" className="w-36" />
            </div>
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
                    <React.Fragment key={log.id}>
                      <motion.tr
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={cn("border-b hover:bg-gray-50/50 transition-colors cursor-pointer", idx % 2 === 0 ? "bg-white" : "bg-gray-50/30")}
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{log.datetime}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-700 font-semibold">
                              {log.user.charAt(0)}
                            </div>
                            <span className="text-gray-700">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{log.module}</td>
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs border", actionColors[log.action])}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <div className="flex items-center gap-1">
                            <span className="truncate">{log.details}</span>
                            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform", expanded === log.id && "rotate-180")} />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.ip}</td>
                      </motion.tr>
                      {expanded === log.id && (
                        <tr className="bg-blue-50/50">
                          <td colSpan={6} className="px-8 py-3 text-sm text-gray-700 border-b">
                            <strong>التفاصيل الكاملة: </strong>{log.details}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
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