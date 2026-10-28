const envApiUrl = typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL?.trim() : "";

export const API_BASE_URL =
  envApiUrl && envApiUrl.length > 0
    ? envApiUrl.replace(/\/$/, "")
    : "";

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // Support both an origin and an origin ending in /api without duplicating it.
  const suffix = API_BASE_URL.endsWith("/api") && (normalizedPath === "/api" || normalizedPath.startsWith("/api/"))
    ? normalizedPath.slice(4) : normalizedPath;
  return API_BASE_URL ? `${API_BASE_URL}${suffix}` : normalizedPath;
};

export function isTrustedApiUrl(input: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const target = new URL(input, window.location.href);
    const base = new URL(API_BASE_URL || "/", window.location.href);
    const basePath = base.pathname.replace(/\/$/, "");
    if (target.origin !== base.origin || !["http:", "https:"].includes(target.protocol)) return false;
    const relative = basePath && target.pathname.startsWith(`${basePath}/`)
      ? target.pathname.slice(basePath.length) : target.pathname;
    return /^\/(api|auth)(\/|$)/.test(relative) ||
      (basePath.endsWith("/api") && target.pathname.startsWith(`${basePath}/`));
  } catch {
    return false;
  }
}

function sessionToken(): string | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
  } catch {
    // Browsers may block storage in private sessions or embedded pages.
    return null;
  }
}

// Scope automatic credentials to this application's API, including Request inputs.
if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const token = sessionToken();
    if (token && isTrustedApiUrl(url)) {
      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }
    return nativeFetch(input, init);
  };
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = apiUrl(path);
  const headers = new Headers(options.headers);
  const token = sessionToken();
  if (token && isTrustedApiUrl(url) && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Let the browser generate multipart boundaries for FormData uploads.
  if (!headers.has("Content-Type") && !(typeof FormData !== "undefined" && options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: options.credentials || "same-origin"
  });
  return safeJsonResponse(response);
}

export async function safeJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Resposta inválida: ${text}`);
  }
  return response.json();
}

export async function safeJsonResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 120)}`);
  }
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    throw new Error(`Resposta não JSON: ${text.slice(0, 120)}`);
  }
  return response.json();
}
