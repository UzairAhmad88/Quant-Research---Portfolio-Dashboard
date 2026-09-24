const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => apiFetch<T>(path, { method: "GET", ...options }),
  post: <T>(path: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body), ...options }),
  put: <T>(path: string, body?: any, options?: RequestInit) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body), ...options }),
  delete: <T>(path: string, options?: RequestInit) => apiFetch<T>(path, { method: "DELETE", ...options }),
};
