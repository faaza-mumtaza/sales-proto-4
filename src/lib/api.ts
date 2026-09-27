// API client — wrapper fetch untuk semua request ke /api/*.

export interface ApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T extends object>(
  path: string,
  init?: RequestInit,
): Promise<T & ApiResponse> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError("Koneksi ke server gagal. Periksa jaringan Anda.", 0);
  }

  let body: ApiResponse | null = null;
  try {
    body = (await res.json()) as ApiResponse;
  } catch {
    // response non-JSON
  }

  if (!res.ok || !body?.ok) {
    throw new ApiError(body?.message ?? "Terjadi kesalahan. Coba lagi.", res.status);
  }
  return body as unknown as T & ApiResponse;
}

export function apiGet<T extends object>(path: string): Promise<T & ApiResponse> {
  return request<T>(path, { method: "GET", cache: "no-store" });
}

export function apiPost<T extends object>(
  path: string,
  data?: unknown,
): Promise<T & ApiResponse> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export function apiPut<T extends object>(
  path: string,
  data?: unknown,
): Promise<T & ApiResponse> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(data ?? {}),
  });
}

export function apiPatch<T extends object>(
  path: string,
  data?: unknown,
): Promise<T & ApiResponse> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(data ?? {}),
  });
}

export function apiDelete<T extends object>(
  path: string,
  params?: Record<string, string>,
): Promise<T & ApiResponse> {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return request<T>(path + qs, { method: "DELETE" });
}
