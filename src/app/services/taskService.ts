import { apiFetch } from "./api";

type ServiceResult<T> = { isSuccess: boolean; data?: T; errorMessages?: string[] };

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

export type BackendTask = {
  id: string;
  title: string;
  taskType: string;
  priority: string;
  status: string;
  dueDate?: string | null;
  assigneeEmployeeId?: string | null;
  assigneeName?: string | null;
  notes?: string | null;
  isActive: boolean;
  creationDate: string;
};

export type AddTaskPayload = {
  title: string;
  taskType: string;
  priority: string;
  dueDate?: string;
  assigneeEmployeeId?: string;
  assigneeName?: string;
  notes?: string;
};

export type UpdateTaskPayload = AddTaskPayload & {
  id: string;
  status: string;
  isActive: boolean;
};

export async function getAllTasks(): Promise<BackendTask[]> {
  return unwrap(await apiFetch<ServiceResult<BackendTask[]>>("/AppTasks/GetAllTasks"), "فشل تحميل المهام");
}

export async function addTask(payload: AddTaskPayload): Promise<BackendTask> {
  return unwrap(await apiFetch<ServiceResult<BackendTask>>("/AppTasks/AddTask", { method: "POST", body: payload }), "فشل إضافة المهمة");
}

export async function updateTask(payload: UpdateTaskPayload): Promise<BackendTask> {
  return unwrap(await apiFetch<ServiceResult<BackendTask>>("/AppTasks/UpdateTask", { method: "PUT", body: payload }), "فشل تحديث المهمة");
}

export async function deactivateTask(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/AppTasks/DeactivateTask", { method: "DELETE", headers: { "X-Id": id } });
}
