import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendCustomerNaulage = {
  id: string;
  customerId: string;
  itemId?: string | null;
  itemName: string;
  naulage: number;
  naulageUnit: string;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddCustomerNaulagePayload = {
  customerId: string;
  itemId?: string;
  itemName: string;
  naulage: number;
  naulageUnit: string;
  notes?: string;
};

export type EditCustomerNaulagePayload = AddCustomerNaulagePayload & {
  id: string;
  isActive: boolean;
};

export async function getCustomerNaulages(customerId: string): Promise<BackendCustomerNaulage[]> {
  const res = await apiFetch<ServiceResult<BackendCustomerNaulage[]>>(
    `/CustomerNaulages/GetAllCustomerNaulages?customerId=${customerId}`
  );
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل النولونات");
  return (res.data ?? []).filter(n => n.isActive);
}

export async function addCustomerNaulage(payload: AddCustomerNaulagePayload): Promise<BackendCustomerNaulage> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerNaulage>>("/CustomerNaulages/AddCustomerNaulage", { method: "POST", body: payload }),
    "فشل إضافة النولون",
  );
}

export async function editCustomerNaulage(payload: EditCustomerNaulagePayload): Promise<BackendCustomerNaulage> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerNaulage>>("/CustomerNaulages/EditCustomerNaulage", { method: "PUT", body: payload }),
    "فشل تحديث النولون",
  );
}

export async function deactivateCustomerNaulage(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/CustomerNaulages/DeactivateCustomerNaulage", { method: "DELETE", headers: { "X-Id": id } });
}
