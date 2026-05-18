import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendCustomerDriver = {
  id: string;
  customerId: string;
  name: string;
  phone?: string | null;
  plate: string;
  nationalId?: string | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddCustomerDriverPayload = {
  customerId: string;
  name: string;
  phone?: string;
  plate: string;
  nationalId?: string;
  notes?: string;
};

export type EditCustomerDriverPayload = AddCustomerDriverPayload & {
  id: string;
  isActive: boolean;
};

export async function getCustomerDrivers(customerId: string): Promise<BackendCustomerDriver[]> {
  const res = await apiFetch<ServiceResult<BackendCustomerDriver[]>>(
    `/CustomerDrivers/GetAllCustomerDrivers?customerId=${customerId}`
  );
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل السائقين");
  return (res.data ?? []).filter(d => d.isActive);
}

export async function addCustomerDriver(payload: AddCustomerDriverPayload): Promise<BackendCustomerDriver> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerDriver>>("/CustomerDrivers/AddCustomerDriver", { method: "POST", body: payload }),
    "فشل إضافة السائق",
  );
}

export async function editCustomerDriver(payload: EditCustomerDriverPayload): Promise<BackendCustomerDriver> {
  return unwrap(
    await apiFetch<ServiceResult<BackendCustomerDriver>>("/CustomerDrivers/EditCustomerDriver", { method: "PUT", body: payload }),
    "فشل تحديث السائق",
  );
}

export async function deactivateCustomerDriver(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/CustomerDrivers/DeactivateCustomerDriver", { method: "DELETE", headers: { "X-Id": id } });
}
