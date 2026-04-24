let baseUrl = "http://localhost:8000";
let authTokenGetter: AuthTokenGetter | null = null;

export type AuthTokenGetter = () => string | null | Promise<string | null>;

export function setBaseUrl(url: string) {
  baseUrl = url;
}

export function setAuthTokenGetter(getter: AuthTokenGetter) {
  authTokenGetter = getter;
}

export async function customFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authTokenGetter ? await authTokenGetter() : null;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response.json();
}
