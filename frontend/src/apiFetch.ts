const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  let url = path;
  if (path.startsWith("/api/v1")) {
    const normalizedBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    url = `${normalizedBase}${path.slice(7)}`;
  }
  
  const extendedOptions: RequestInit = {
    ...options,
    credentials: "include",
  };
  
  return fetch(url, extendedOptions);
}
