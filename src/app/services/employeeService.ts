import { apiFetch } from "./api";

export type BackendEmployee = {
  id: string;
  code: string;
  fullName: string;
  arName?: string | null;
  nationalId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  jobTitleId?: string | null;
  jobTitleName?: string | null;
  jobTitleArName?: string | null;
  department?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  baseSalary?: number | null;
  employmentStatus: string;
  bankAccountNumber?: string | null;
  notes?: string | null;
  userId?: string | null;
  userName?: string | null;
  isUser?: boolean;
  isActive: boolean;
  creationDate: string;
};

export type PaginationHeader = {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

type PagedResult<T> = {
  isSuccess: boolean;
  data?: T;
  pagination?: PaginationHeader;
  errorMessages?: string[];
};

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

export type AddEmployeePayload = {
  code: string;
  fullName: string;
  arName?: string;
  phone?: string;
  email?: string;
  jobTitleId?: string;
  department?: string;
  hireDate?: string;
  baseSalary?: number;
  employmentStatus?: string;
  userId?: string;
  userName?: string;
  password?: string;
  roles?: string[];
};

export type EditEmployeePayload = {
  id: string;
  code: string;
  fullName: string;
  arName?: string | null;
  nationalId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  jobTitleId?: string | null;
  department?: string | null;
  hireDate?: string | null;
  terminationDate?: string | null;
  baseSalary?: number | null;
  employmentStatus: string;
  bankAccountNumber?: string | null;
  notes?: string | null;
  userId?: string | null;
  isActive: boolean;
};

export async function getAllEmployees(
  pageIndex = 1,
  pageSize = 50,
  search?: string,
): Promise<{ items: BackendEmployee[]; pagination?: PaginationHeader }> {
  const params = new URLSearchParams({
    pageIndex: String(pageIndex),
    pageSize: String(pageSize),
  });
  if (search) params.set("search", search);

  const res = await apiFetch<PagedResult<BackendEmployee[]>>(
    `/Employees/GetAllEmployees?${params.toString()}`,
  );
  if (!res.isSuccess) {
    throw new Error(res.errorMessages?.[0] ?? "فشل تحميل الموظفين");
  }
  return { items: res.data ?? [], pagination: res.pagination };
}

export async function addEmployeeRequest(payload: AddEmployeePayload): Promise<BackendEmployee> {
  const res = await apiFetch<ServiceResult<BackendEmployee>>(
    "/Employees/AddEmployee",
    { method: "POST", body: payload },
  );
  if (!res.isSuccess || !res.data) {
    throw new Error(res.errorMessages?.[0] ?? "فشل إضافة الموظف");
  }
  return res.data;
}

export async function editEmployeeRequest(payload: EditEmployeePayload): Promise<BackendEmployee> {
  const res = await apiFetch<ServiceResult<BackendEmployee>>(
    "/Employees/EditEmployee",
    { method: "PUT", body: payload },
  );
  if (!res.isSuccess || !res.data) {
    throw new Error(res.errorMessages?.[0] ?? "فشل تحديث الموظف");
  }
  return res.data;
}
