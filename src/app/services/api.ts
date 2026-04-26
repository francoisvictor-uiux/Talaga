const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5219";
const TOKEN_KEY = "talaga_auth_token";

export function getAuthToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  errors: string[];
  constructor(message: string, status: number, errors: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

export async function apiFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = true } = opts;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new ApiError(`تعذر الاتصال بالخادم (${msg})`, 0, [msg]);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const errors: string[] = Array.isArray(data?.errorMessages)
      ? data.errorMessages
      : Array.isArray(data?.ErrorMessages)
      ? data.ErrorMessages
      : Array.isArray(data?.errors)
      ? data.errors
      : data?.detail
      ? [data.detail]
      : [`HTTP ${res.status}`];
    throw new ApiError(errors[0] ?? `HTTP ${res.status}`, res.status, errors);
  }

  return data as T;
}

function safeJson(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}

export { API_URL };
