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

// ===== Warehouse =====
export type BackendWarehouse = {
  id: string;
  code: string;
  name: string;
  arName?: string | null;
  location?: string | null;
  city?: string | null;
  storageType: string;
  operationStatus: string;
  areaSquareMeters?: number | null;
  totalCapacity?: number | null;
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
  capacityBox?: number | null;
  capacitySack?: number | null;
  capacityCarton?: number | null;
  machineType?: string | null;
  machinePower?: number | null;
  dailyRent?: number | null;
  monthlyRent?: number | null;
  managerName?: string | null;
  managerPhone?: string | null;
  notes?: string | null;
  isActive: boolean;
  chambersCount: number;
  creationDate: string;
};

export type AddWarehousePayload = {
  code: string;
  name: string;
  arName?: string;
  location?: string;
  city?: string;
  storageType: string;
  operationStatus?: string;
  areaSquareMeters?: number;
  totalCapacity?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  capacityBox?: number;
  capacitySack?: number;
  capacityCarton?: number;
  machineType?: string;
  machinePower?: number;
  dailyRent?: number;
  monthlyRent?: number;
  managerName?: string;
  managerPhone?: string;
  notes?: string;
};

export type EditWarehousePayload = AddWarehousePayload & {
  id: string;
  isActive: boolean;
};

export async function getAllWarehouses(pageIndex = 1, pageSize = 100, search?: string): Promise<BackendWarehouse[]> {
  const p = new URLSearchParams({ pageIndex: String(pageIndex), pageSize: String(pageSize) });
  if (search) p.set("search", search);
  const res = await apiFetch<PagedResult<BackendWarehouse[]>>(`/Warehouses/GetAllWarehouses?${p.toString()}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل الثلاجات");
  return res.data ?? [];
}

export async function addWarehouse(payload: AddWarehousePayload): Promise<BackendWarehouse> {
  return unwrap(await apiFetch<ServiceResult<BackendWarehouse>>("/Warehouses/AddWarehouse", { method: "POST", body: payload }), "فشل إضافة الثلاجة");
}

export async function editWarehouse(payload: EditWarehousePayload): Promise<BackendWarehouse> {
  return unwrap(await apiFetch<ServiceResult<BackendWarehouse>>("/Warehouses/EditWarehouse", { method: "PUT", body: payload }), "فشل تحديث الثلاجة");
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Warehouses/DeactivateWarehouse", { method: "DELETE", headers: { "X-Id": id } });
}

// ===== Chamber =====
export type BackendChamber = {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  arName?: string | null;
  storageType: string;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  capacity?: number | null;
  currentOccupancy?: number | null;
  rowsCount?: number | null;
  columnsCount?: number | null;
  lengthM?: number | null;
  widthM?: number | null;
  heightM?: number | null;
  capacityWeightTon?: number | null;
  capacityBox?: number | null;
  capacitySack?: number | null;
  capacityCarton?: number | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddChamberPayload = {
  warehouseId: string;
  code: string;
  name: string;
  arName?: string;
  storageType: string;
  temperatureMin?: number;
  temperatureMax?: number;
  capacity?: number;
  rowsCount?: number;
  columnsCount?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  capacityWeightTon?: number;
  capacityBox?: number;
  capacitySack?: number;
  capacityCarton?: number;
  notes?: string;
};

export type EditChamberPayload = {
  id: string;
  code: string;
  name: string;
  arName?: string;
  storageType: string;
  temperatureMin?: number;
  temperatureMax?: number;
  capacity?: number;
  rowsCount?: number;
  columnsCount?: number;
  lengthM?: number;
  widthM?: number;
  heightM?: number;
  capacityWeightTon?: number;
  capacityBox?: number;
  capacitySack?: number;
  capacityCarton?: number;
  notes?: string;
  isActive: boolean;
};

export async function getChambers(warehouseId?: string): Promise<BackendChamber[]> {
  const qs = warehouseId ? `?warehouseId=${warehouseId}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendChamber[]>>(`/Warehouses/GetChambers${qs}`), "فشل تحميل العنابر");
}

export async function addChamber(payload: AddChamberPayload): Promise<BackendChamber> {
  return unwrap(await apiFetch<ServiceResult<BackendChamber>>("/Warehouses/AddChamber", { method: "POST", body: payload }), "فشل إضافة العنبر");
}

export async function editChamber(payload: EditChamberPayload): Promise<BackendChamber> {
  return unwrap(await apiFetch<ServiceResult<BackendChamber>>("/Warehouses/EditChamber", { method: "PUT", body: payload }), "فشل تحديث العنبر");
}

export async function deleteChamber(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Warehouses/DeleteChamber", { method: "DELETE", headers: { "X-Id": id } });
}
