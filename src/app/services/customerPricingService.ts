import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BillingMethod = "PerDay" | "PerMonth";

export type BackendCustomerPrice = {
  id: string;
  customerId: string;
  itemId?: string | null;
  itemName: string;
  pricePerDay: number;
  pricePerMonth: number;
  billingMethod: BillingMethod;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddCustomerPricePayload = {
  customerId: string;
  itemId?: string;
  itemName: string;
  pricePerDay: number;
  pricePerMonth: number;
  billingMethod: BillingMethod;
  notes?: string;
};

export type EditCustomerPricePayload = AddCustomerPricePayload & {
  id: string;
  isActive: boolean;
};

export async function getCustomerPrices(customerId: string): Promise<BackendCustomerPrice[]> {
  const res = await apiFetch<ServiceResult<BackendCustomerPrice[]>>(
    `/CustomerPricings/GetAllCustomerPricings?customerId=${customerId}`
  );
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل الأسعار الخاصة");
  return (res.data ?? []).filter(p => p.isActive);
}

export async function addCustomerPrice(payload: AddCustomerPricePayload): Promise<BackendCustomerPrice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerPrice>>("/CustomerPricings/AddCustomerPricing", { method: "POST", body: payload }),
    "فشل إضافة السعر",
  );
}

export async function editCustomerPrice(payload: EditCustomerPricePayload): Promise<BackendCustomerPrice> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerPrice>>("/CustomerPricings/EditCustomerPricing", { method: "PUT", body: payload }),
    "فشل تحديث السعر",
  );
}

export async function deactivateCustomerPrice(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/CustomerPricings/DeactivateCustomerPricing", { method: "DELETE", headers: { "X-Id": id } });
}
