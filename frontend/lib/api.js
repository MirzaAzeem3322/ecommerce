const PUBLIC_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const BASE_URL = typeof window === 'undefined' ? process.env.API_URL || PUBLIC_URL : PUBLIC_URL;

export const TOKEN_KEY = 'shop_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Small fetch wrapper for the Express API.
 * Adds JSON headers + the login token, and throws an Error with the API's message on failure.
 */
export async function api(path, { method = 'GET', body, token, ...rest } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const authToken = token ?? getToken();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      ...rest,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.details = data.details;
    throw error;
  }
  return data;
}
