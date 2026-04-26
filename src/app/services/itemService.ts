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

// ===== Item =====
export type BackendItem = {
  id: string;
  code: string;
  prefix?: string | null;
  name: string;
  arName?: string | null;
  description?: string | null;
  itemCategoryId?: string | null;
  categoryName?: string | null;
  storageType: string;
  baseUnit?: string | null;
  unitWeightKg?: number | null;
  shelfLifeDays?: number | null;
  alertDaysBeforeExpiry?: number | null;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  barcode?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddItemPayload = {
  code: string;
  prefix?: string;
  name: string;
  arName?: string;
  itemCategoryId?: string;
  storageType: string;
  shelfLifeDays?: number;
  alertDaysBeforeExpiry?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  imageUrl?: string;
};

export type EditItemPayload = AddItemPayload & {
  id: string;
  isActive: boolean;
};

export async function getAllItems(pageIndex = 1, pageSize = 100, search?: string): Promise<BackendItem[]> {
  const p = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (search) p.set("search", search);
  const res = await apiFetch<PagedResult<BackendItem[]>>(`/Items/GetAllItems?${p.toString()}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل الأصناف");
  return res.data ?? [];
}

export async function addItem(payload: AddItemPayload): Promise<BackendItem> {
  return unwrap(await apiFetch<ServiceResult<BackendItem>>("/Items/AddItem", { method: "POST", body: payload }), "فشل إضافة الصنف");
}

export async function editItem(payload: EditItemPayload): Promise<BackendItem> {
  return unwrap(await apiFetch<ServiceResult<BackendItem>>("/Items/EditItem", { method: "PUT", body: payload }), "فشل تحديث الصنف");
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Items/DeactivateItem", { method: "DELETE", headers: { "X-Id": id } });
}

// ===== Package =====
export type BackendPackage = {
  id: string;
  code: string;
  name: string;
  arName?: string | null;
  packageType?: string | null;
  material?: string | null;
  emptyWeightKg?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  volumeLiters?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddPackagePayload = {
  code: string;
  name: string;
  arName?: string;
  packageType?: string;
  emptyWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  imageUrl?: string;
};

export type EditPackagePayload = AddPackagePayload & {
  id: string;
  isActive: boolean;
};

export async function getAllPackages(pageIndex = 1, pageSize = 100, search?: string): Promise<BackendPackage[]> {
  const p = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (search) p.set("search", search);
  const res = await apiFetch<PagedResult<BackendPackage[]>>(`/Items/GetAllPackages?${p.toString()}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل العبوات");
  return res.data ?? [];
}

export async function addPackage(payload: AddPackagePayload): Promise<BackendPackage> {
  return unwrap(await apiFetch<ServiceResult<BackendPackage>>("/Items/AddPackage", { method: "POST", body: payload }), "فشل إضافة العبوة");
}

export async function editPackage(payload: EditPackagePayload): Promise<BackendPackage> {
  return unwrap(await apiFetch<ServiceResult<BackendPackage>>("/Items/EditPackage", { method: "PUT", body: payload }), "فشل تحديث العبوة");
}

export async function deletePackage(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Items/DeactivatePackage", { method: "DELETE", headers: { "X-Id": id } });
}

// ===== Category =====
export type BackendCategory = {
  id: string;
  code: string;
  name: string;
  arName?: string | null;
  isActive: boolean;
};

export async function getAllCategories(): Promise<BackendCategory[]> {
  return unwrap(await apiFetch<ServiceResult<BackendCategory[]>>("/Items/GetAllCategories"), "فشل تحميل الفئات");
}
