import { apiFetch } from "./api";

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

export type BackendSetting = {
  key: string;
  category: string;
  value: string;
  description?: string | null;
  modifiedDate?: string | null;
};

export type SettingItem = { key: string; value: string };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export async function getAllSettings(): Promise<BackendSetting[]> {
  return unwrap(
    await apiFetch<ServiceResult<BackendSetting[]>>("/Settings/GetAll"),
    "فشل تحميل الإعدادات",
  );
}

export async function getSettingsByCategory(category: string): Promise<BackendSetting[]> {
  return unwrap(
    await apiFetch<ServiceResult<BackendSetting[]>>(`/Settings/GetByCategory?category=${encodeURIComponent(category)}`),
    "فشل تحميل الإعدادات",
  );
}

export async function updateSettingsBatch(items: SettingItem[]): Promise<BackendSetting[]> {
  return unwrap(
    await apiFetch<ServiceResult<BackendSetting[]>>("/Settings/UpdateBatch", {
      method: "PUT",
      body: { items },
    }),
    "فشل حفظ الإعدادات",
  );
}

/** Convert a list of settings into a key→value map for easier UI binding. */
export function settingsToMap(settings: BackendSetting[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const s of settings) m[s.key] = s.value;
  return m;
}
