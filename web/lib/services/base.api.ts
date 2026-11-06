const baseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:4000')
).replace(/\/$/, '');

export const SESSION_TOKEN_KEY = 'apax.jwt';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiResponse =
  | { success: true; payload: Record<string, unknown> }
  | { success: false; message: string };

// Use only for requests to the trusted API origin. Never log these headers.
export function withAuthorization(headers: HeadersInit = {}): Headers {
  const result = new Headers(headers);
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (token) result.set('Authorization', `Bearer ${token}`);
  return result;
}

export const baseAPI = async (
  path: string,
  method: HttpMethod,
  body?: unknown,
  headers: HeadersInit = {},
): Promise<ApiResponse> => {
  try {
    const requestHeaders = new Headers(headers);
    requestHeaders.set('Content-Type', 'application/json');
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' && body !== undefined ? JSON.stringify(body) : undefined,
    });
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      return { success: false, message: `Invalid JSON response from server (HTTP ${res.status})` };
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { success: false, message: 'Invalid API response' };
    }
    const data = payload as Record<string, unknown>;
    if (!res.ok || data.success !== true) {
      return {
        success: false,
        message: typeof data.message === 'string' && data.message.trim()
          ? data.message
          : `Request failed (HTTP ${res.status})`,
      };
    }
    return { success: true, payload: data };
  } catch {
    return { success: false, message: 'Unable to reach the API. Please try again.' };
  }
};
