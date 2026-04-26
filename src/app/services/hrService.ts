import { apiFetch } from "./api";

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

function unwrap<T>(res: ServiceResult<T>, fallback: string): T {
  if (!res.isSuccess) throw new Error(res.errorMessages?.[0] ?? fallback);
  return res.data as T;
}

// ===== Salaries =====
export type BackendSalary = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  year: number;
  month: number;
  baseSalary: number;
  bonuses?: number | null;
  deductions?: number | null;
  advancesDeducted?: number | null;
  absenceDeductions?: number | null;
  netSalary: number;
  paidDate?: string | null;
  status: string;
  notes?: string | null;
  creationDate: string;
};

export type AddSalaryPayload = {
  employeeId: string;
  year: number;
  month: number;
  baseSalary: number;
  bonuses?: number;
  deductions?: number;
  notes?: string;
};

export async function getSalaries(year?: number, month?: number, employeeId?: string): Promise<BackendSalary[]> {
  const p = new URLSearchParams();
  if (year) p.set("year", String(year));
  if (month) p.set("month", String(month));
  if (employeeId) p.set("employeeId", employeeId);
  const qs = p.toString() ? `?${p.toString()}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendSalary[]>>(`/HR/GetSalaries${qs}`), "فشل تحميل المرتبات");
}

export async function addSalary(payload: AddSalaryPayload): Promise<BackendSalary> {
  return unwrap(await apiFetch<ServiceResult<BackendSalary>>("/HR/AddSalary", { method: "POST", body: payload }), "فشل إضافة المرتب");
}

export async function markSalaryPaid(id: string): Promise<void> {
  await apiFetch<ServiceResult<boolean>>("/HR/MarkSalaryPaid", { method: "POST", headers: { "X-Id": id } });
}

export async function addSalaryBonus(id: string, amount: number): Promise<void> {
  await apiFetch<ServiceResult<boolean>>(`/HR/AddSalaryBonus?amount=${amount}`, { method: "POST", headers: { "X-Id": id } });
}

// ===== Leaves =====
export type BackendLeave = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  leaveType: string;
  fromDate: string;
  toDate: string;
  daysCount: number;
  status: string;
  reason?: string | null;
  approverNotes?: string | null;
  creationDate: string;
};

export type AddLeavePayload = {
  employeeId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason?: string;
};

export async function getLeaves(employeeId?: string): Promise<BackendLeave[]> {
  const qs = employeeId ? `?employeeId=${employeeId}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendLeave[]>>(`/HR/GetLeaves${qs}`), "فشل تحميل الإجازات");
}

export async function addLeave(payload: AddLeavePayload): Promise<BackendLeave> {
  return unwrap(await apiFetch<ServiceResult<BackendLeave>>("/HR/AddLeave", { method: "POST", body: payload }), "فشل إضافة الإجازة");
}

export async function setLeaveStatus(id: string, status: string, approverNotes?: string): Promise<BackendLeave> {
  return unwrap(await apiFetch<ServiceResult<BackendLeave>>("/HR/SetLeaveStatus", { method: "PUT", body: { id, status, approverNotes } }), "فشل تحديث الإجازة");
}

// ===== Advances =====
export type BackendAdvance = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  advanceDate: string;
  amount: number;
  deductedAmount?: number | null;
  remainingAmount?: number | null;
  installmentsCount?: number | null;
  monthlyDeduction: number;
  reason?: string | null;
  status?: string | null;
  creationDate: string;
};

export type AddAdvancePayload = {
  employeeId: string;
  amount: number;
  installmentsCount?: number;
  reason?: string;
};

export async function getAdvances(employeeId?: string): Promise<BackendAdvance[]> {
  const qs = employeeId ? `?employeeId=${employeeId}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendAdvance[]>>(`/HR/GetAdvances${qs}`), "فشل تحميل السلف");
}

export async function addAdvance(payload: AddAdvancePayload): Promise<BackendAdvance> {
  return unwrap(await apiFetch<ServiceResult<BackendAdvance>>("/HR/AddAdvance", { method: "POST", body: payload }), "فشل إضافة السلفة");
}

// ===== Absences =====
export type BackendAbsence = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  absenceDate: string;
  absenceType?: string | null;
  isExcused: boolean;
  deductionAmount?: number | null;
  notes?: string | null;
  creationDate: string;
};

export type AddAbsencePayload = {
  employeeId: string;
  absenceDate: string;
  absenceType: string;
  isExcused?: boolean;
  deductionAmount?: number;
  notes?: string;
};

export async function getAbsences(employeeId?: string): Promise<BackendAbsence[]> {
  const qs = employeeId ? `?employeeId=${employeeId}` : "";
  return unwrap(await apiFetch<ServiceResult<BackendAbsence[]>>(`/HR/GetAbsences${qs}`), "فشل تحميل الغياب");
}

export async function addAbsence(payload: AddAbsencePayload): Promise<BackendAbsence> {
  return unwrap(await apiFetch<ServiceResult<BackendAbsence>>("/HR/AddAbsence", { method: "POST", body: payload }), "فشل إضافة سجل الغياب");
}
