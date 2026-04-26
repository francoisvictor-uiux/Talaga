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

export type BackendMovementType = "Incoming" | "Outgoing" | "Transfer" | "Adjustment";

export type BackendMovement = {
  id: string;
  movementNumber: string;
  movementType: BackendMovementType | string;
  movementDate: string;

  customerId: string;
  customerName?: string | null;
  customerArName?: string | null;

  itemId: string;
  itemName?: string | null;
  itemArName?: string | null;

  packageId?: string | null;
  packageName?: string | null;

  fromWarehouseId?: string | null;
  fromWarehouseName?: string | null;
  fromChamberId?: string | null;
  fromChamberName?: string | null;
  toWarehouseId?: string | null;
  toWarehouseName?: string | null;
  toChamberId?: string | null;
  toChamberName?: string | null;

  quantity: number;
  netWeightKg?: number | null;
  unit?: string | null;
  driverName?: string | null;
  vehiclePlate?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddMovementPayload = {
  movementNumber: string;
  movementType: string;
  movementDate: string;
  customerId: string;
  itemId: string;
  packageId?: string;
  fromWarehouseId?: string;
  fromChamberId?: string;
  toWarehouseId?: string;
  toChamberId?: string;
  quantity: number;
  netWeightKg?: number;
  unit?: string;
  driverName?: string;
  vehiclePlate?: string;
  referenceNumber?: string;
  notes?: string;
};

export type EditMovementPayload = AddMovementPayload & {
  id: string;
  isActive: boolean;
};

export type GetAllMovementsArgs = {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  movementType?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
};

export async function getAllMovements(args: GetAllMovementsArgs = {}): Promise<BackendMovement[]> {
  const p = new URLSearchParams({
    pageIndex: String(args.pageIndex ?? 1),
    pageSize: String(args.pageSize ?? 100),
  });
  if (args.search) p.set("search", args.search);
  if (args.movementType) p.set("movementType", args.movementType);
  if (args.customerId) p.set("customerId", args.customerId);
  if (args.fromDate) p.set("fromDate", args.fromDate);
  if (args.toDate) p.set("toDate", args.toDate);
  const res = await apiFetch<PagedResult<BackendMovement[]>>(`/Movements/GetAllMovements?${p.toString()}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل الحركات");
  return res.data ?? [];
}

export async function getMovement(id: string): Promise<BackendMovement> {
  return unwrap(
    await apiFetch<ServiceResult<BackendMovement>>("/Movements/GetMovement", { headers: { "X-Id": id } }),
    "فشل تحميل الحركة",
  );
}

export async function addMovement(payload: AddMovementPayload): Promise<BackendMovement> {
  return unwrap(
    await apiFetch<ServiceResult<BackendMovement>>("/Movements/AddMovement", { method: "POST", body: payload }),
    "فشل إضافة الحركة",
  );
}

export async function editMovement(payload: EditMovementPayload): Promise<BackendMovement> {
  return unwrap(
    await apiFetch<ServiceResult<BackendMovement>>("/Movements/EditMovement", { method: "PUT", body: payload }),
    "فشل تحديث الحركة",
  );
}

export async function deactivateMovement(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Movements/DeactivateMovement", { method: "DELETE", headers: { "X-Id": id } });
}
