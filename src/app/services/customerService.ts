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

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendCustomer = {
  id: string;
  code: string;
  name: string;
  arName?: string | null;
  customerType?: string | null;
  taxNumber?: string | null;
  commercialRegister?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  creditLimit?: number | null;
  openingBalance?: number | null;
  currentBalance?: number | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddCustomerPayload = {
  code: string;
  name: string;
  arName?: string;
  customerType?: string;
  taxNumber?: string;
  commercialRegister?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  creditLimit?: number;
  openingBalance?: number;
  notes?: string;
};

export type EditCustomerPayload = AddCustomerPayload & {
  id: string;
  isActive: boolean;
};

export async function getAllCustomers(pageIndex = 1, pageSize = 100, search?: string): Promise<BackendCustomer[]> {
  const p = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (search) p.set("search", search);
  const res = await apiFetch<PagedResult<BackendCustomer[]>>(`/Customers/GetAllCustomers?${p.toString()}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل العملاء");
  return res.data ?? [];
}

export async function getCustomer(id: string): Promise<BackendCustomer> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomer>>("/Customers/GetCustomer", { headers: { "X-Id": id } }),
    "فشل تحميل العميل",
  );
}

export async function addCustomer(payload: AddCustomerPayload): Promise<BackendCustomer> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomer>>("/Customers/AddCustomer", { method: "POST", body: payload }),
    "فشل إضافة العميل",
  );
}

export async function editCustomer(payload: EditCustomerPayload): Promise<BackendCustomer> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomer>>("/Customers/EditCustomer", { method: "PUT", body: payload }),
    "فشل تحديث العميل",
  );
}

export async function deactivateCustomer(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Customers/DeactivateCustomer", { method: "DELETE", headers: { "X-Id": id } });
}
