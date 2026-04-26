import { ApiError, apiFetch } from "./api";

export type AuthUser = {
  userId: string;
  email: string;
  fullName: string;
  arName?: string | null;
  roles: string[];
  token: string;
  expiresAt: string;
};

type ServiceResult<T> = {
  isSuccess: boolean;
  data?: T;
  errorMessages?: string[];
};

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const res = await apiFetch<ServiceResult<AuthUser>>("/Auth/Login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  if (!res.isSuccess || !res.data) {
    throw new ApiError(res.errorMessages?.[0] ?? "فشل تسجيل الدخول", 400, res.errorMessages ?? []);
  }
  return res.data;
}

export type RegisterPayload = {
  email: string;
  userName: string;
  fullName: string;
  arName?: string;
  password: string;
  roles: string[];
};

export async function registerRequest(payload: RegisterPayload): Promise<AuthUser> {
  const res = await apiFetch<ServiceResult<AuthUser>>("/Auth/Register", {
    method: "POST",
    body: payload,
  });
  if (!res.isSuccess || !res.data) {
    throw new Error(res.errorMessages?.[0] ?? "فشل إنشاء الحساب");
  }
  return res.data;
}
