import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

export type BackendCustomerType = {
  id: string;
  name: string;
  isActive: boolean;
  creationDate: string;
};

export async function getAllCustomerTypes(): Promise<BackendCustomerType[]> {
  const res = await apiFetch<ServiceResult<BackendCustomerType[]>>("/CustomerTypeConfigs/GetAllCustomerTypes");
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل أنواع العملاء");
  return res.data ?? [];
}

export async function addCustomerType(name: string): Promise<BackendCustomerType> {
  const res = await apiFetch<ServiceResult<BackendCustomerType>>("/CustomerTypeConfigs/AddCustomerType", {
    method: "POST",
    body: name,
  });
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل إضافة النوع");
  return res.data!;
}

export async function deleteCustomerType(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/CustomerTypeConfigs/DeactivateCustomerType", {
    method: "DELETE",
    headers: { "X-Id": id },
  });
}
