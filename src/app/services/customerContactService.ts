import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendCustomerContact = {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  role?: string | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddCustomerContactPayload = {
  customerId: string;
  name: string;
  phone: string;
  role?: string;
  notes?: string;
};

export type EditCustomerContactPayload = AddCustomerContactPayload & {
  id: string;
  isActive: boolean;
};

export async function getCustomerContacts(customerId: string): Promise<BackendCustomerContact[]> {
  const res = await apiFetch<ServiceResult<BackendCustomerContact[]>>(
    `/CustomerContacts/GetAllCustomerContacts?customerId=${customerId}`
  );
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل جهات الاتصال");
  return (res.data ?? []).filter(c => c.isActive);
}

export async function addCustomerContact(payload: AddCustomerContactPayload): Promise<BackendCustomerContact> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerContact>>("/CustomerContacts/AddCustomerContact", { method: "POST", body: payload }),
    "فشل إضافة جهة الاتصال",
  );
}

export async function editCustomerContact(payload: EditCustomerContactPayload): Promise<BackendCustomerContact> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerContact>>("/CustomerContacts/EditCustomerContact", { method: "PUT", body: payload }),
    "فشل تحديث جهة الاتصال",
  );
}

export async function deactivateCustomerContact(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/CustomerContacts/DeactivateCustomerContact", { method: "DELETE", headers: { "X-Id": id } });
}
