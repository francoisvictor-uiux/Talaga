import { apiFetch } from "./api";

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

type PagedResult<T> = ServiceResult<T> & {
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
};

export type BackendAuditLog = {
  id: string;
  dateTime: string;
  userId?: string | null;
  userName: string;
  module: string;
  action: string;
  details: string;
  entityName?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
};

export type GetAllAuditLogsArgs = {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  module?: string;
  fromDate?: string;
  toDate?: string;
};

export async function getAllAuditLogs(args: GetAllAuditLogsArgs = {}): Promise<BackendAuditLog[]> {
  const p = new URLSearchParams({
    pageIndex: String(args.pageIndex ?? 1),
    pageSize: String(args.pageSize ?? 200),
  });
  if (args.search) p.set("search", args.search);
  if (args.module) p.set("module", args.module);
  if (args.fromDate) p.set("fromDate", args.fromDate);
  if (args.toDate) p.set("toDate", args.toDate);
  const res = await apiFetch<PagedResult<BackendAuditLog[]>>(`/AuditLog/GetAllAuditLogs?${p.toString()}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل سجل التعديلات");
  return res.data ?? [];
}
