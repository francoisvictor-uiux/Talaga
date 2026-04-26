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
