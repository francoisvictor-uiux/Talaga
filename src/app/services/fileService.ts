import { API_URL, ApiError, getAuthToken } from "./api";

type UploadFolder = "customers" | "items" | "packages" | "settings" | "general";

type UploadResult = {
  isSuccess: boolean;
  data?: { url: string };
  errorMessages?: string[];
};

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/Files/Upload`, { method: "POST", headers, body: form });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new ApiError(`تعذر رفع الصورة (${msg})`, 0, [msg]);
  }

  const text = await res.text();
  const data: UploadResult | null = text ? safeJson(text) : null;

  if (!res.ok || !data?.isSuccess || !data.data?.url) {
    const errors = data?.errorMessages ?? [`HTTP ${res.status}`];
    throw new ApiError(errors[0] ?? `HTTP ${res.status}`, res.status, errors);
  }
  return data.data.url;
}

function safeJson(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}
