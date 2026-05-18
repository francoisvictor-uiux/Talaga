import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendVoucher = {
  id: string;
  voucherNo: string;
  voucherType: string;
  customerId?: string | null;
  partyName: string;
  partyType: string;
  amount: number;
  paymentMethod: string;
  cashAccount?: string | null;
  voucherDate: string;
  notes?: string | null;
  createdByName?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddVoucherPayload = {
  voucherType: string;
  customerId?: string;
  partyName: string;
  partyType: string;
  amount: number;
  paymentMethod: string;
  cashAccount?: string;
  voucherDate: string;
  notes?: string;
};

export type EditVoucherPayload = AddVoucherPayload & { id: string; isActive: boolean };

export async function getAllVouchers(search?: string): Promise<BackendVoucher[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "?pageSize=200";
  return unwrap(await apiFetch<ServiceResult<BackendVoucher[]>>(`/CashVouchers/GetAllVouchers${q}`), "فشل تحميل السندات");
}

export async function addVoucher(payload: AddVoucherPayload): Promise<BackendVoucher> {
  return unwrap(await apiFetch<ServiceResult<BackendVoucher>>("/CashVouchers/AddVoucher", { method: "POST", body: payload }), "فشل إضافة السند");
}

export async function editVoucher(payload: EditVoucherPayload): Promise<BackendVoucher> {
  return unwrap(await apiFetch<ServiceResult<BackendVoucher>>("/CashVouchers/EditVoucher", { method: "PUT", body: payload }), "فشل تحديث السند");
}

export async function deactivateVoucher(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/CashVouchers/DeactivateVoucher", { method: "DELETE", headers: { "X-Id": id } });
}

export type BackendStockBalance = {
  id: string;
  customerId: string;
  customerName: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  chamberId: string;
  chamberName: string;
  quantity: number;
  netWeightKg?: number | null;
  unit?: string | null;
  lastMovementDate?: string | null;
};

export async function getStockBalances(params?: { warehouseId?: string; itemId?: string; customerId?: string }): Promise<BackendStockBalance[]> {
  const q = new URLSearchParams();
  if (params?.warehouseId) q.set("warehouseId", params.warehouseId);
  if (params?.itemId) q.set("itemId", params.itemId);
  if (params?.customerId) q.set("customerId", params.customerId);
  const qs = q.toString() ? `?${q.toString()}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendStockBalance[]>>(`/CashVouchers/GetStockBalances${qs}`), "فشل تحميل الأرصدة");
}
