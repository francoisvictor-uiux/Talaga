import { apiFetch } from "./api";

export type JobTitleOption = {
  id: string;
  name: string;
  arName?: string | null;
};

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

export async function getJobTitlesDDL(): Promise<JobTitleOption[]> {
  const res = await apiFetch<ServiceResult<JobTitleOption[]>>("/DDL/JobTitles");
  if (!res.isSuccess) {
    throw new Error(res.errorMessages?.[0] ?? "فشل تحميل المسميات الوظيفية");
  }
  return res.data ?? [];
}

export async function addJobTitle(arName: string): Promise<JobTitleOption> {
  const code = `JT-${Date.now()}`;
  const res = await apiFetch<ServiceResult<{ id: string; code: string; name: string; arName?: string | null }>>(
    "/JobTitles/AddJobTitle",
    { method: "POST", body: { code, name: arName, arName } },
  );
  if (!res.isSuccess || !res.data) throw new Error(res.errorMessages?.[0] ?? "فشل إضافة المسمى الوظيفي");
  return { id: res.data.id, name: res.data.name, arName: res.data.arName };
}
