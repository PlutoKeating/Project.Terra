import { supabase } from "./lib/supabase";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  let url = path;
  if (path.startsWith("/api/v1")) {
    const normalizedBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
    url = `${normalizedBase}${path.slice(7)}`;
  }
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type") && options?.body) headers.set("Content-Type", "application/json");
  if (session) headers.set("Authorization", `Bearer ${session.access_token}`);
  return fetch(url, { ...options, headers });
}
