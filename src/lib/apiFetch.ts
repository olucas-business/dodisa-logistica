// Drop-in replacement for fetch() against our own /api/* routes: injects the
// Supabase access token from the logged-in session so the backend can resolve
// which company's data this request belongs to. Without this header the
// server now rejects the request (401) instead of falling back to shared data.
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  let token: string | undefined;
  try {
    const session = localStorage.getItem("erp_session");
    token = session ? JSON.parse(session).token : undefined;
  } catch {
    token = undefined;
  }

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
