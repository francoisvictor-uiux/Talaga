import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendBrand = {
  id: string;
  itemId: string;
  name: string;
  code?: string | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddBrandPayload = {
  itemId: string;
  name: string;
  code?: string;
  notes?: string;
};

export type EditBrandPayload = AddBrandPayload & { id: string; isActive: boolean };

export async function getBrandsByItem(itemId: string): Promise<BackendBrand[]> {
  const res = await apiFetch<ServiceResult<BackendBrand[]>>(`/Items/GetBrandsByItem?itemId=${itemId}`);
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? "فشل تحميل الماركات");
  return (res.data ?? []).filter(b => b.isActive);
}

export async function addBrand(payload: AddBrandPayload): Promise<BackendBrand> {
  return unwrap(
    await apiFetch<ServiceResult<BackendBrand>>("/Items/AddBrand", { method: "POST", body: payload }),
    "فشل إضافة الماركة",
  );
}

export async function editBrand(payload: EditBrandPayload): Promise<BackendBrand> {
  return unwrap(
    await apiFetch<ServiceResult<BackendBrand>>("/Items/EditBrand", { method: "PUT", body: payload }),
    "فشل تحديث الماركة",
  );
}

export async function deleteBrand(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/Items/DeactivateBrand", { method: "DELETE", headers: { "X-Id": id } });
}
