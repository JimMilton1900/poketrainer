const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed (${status})`);
    this.status = status;
    this.body = body; // { error, constraint, mysql: { code, errno, message } }
  }
}

// Drops empty values so ?search=&type= never reaches the server
export const qs = (params = {}) => {
  const clean = Object.entries(params).filter(([, v]) => v !== '' && v != null);
  return clean.length ? '?' + new URLSearchParams(clean).toString() : '';
};

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { error: 'Cannot reach the API. Is the Express server running?' });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  get: (path, params) => request('GET', path + qs(params)),
  post: (path, body) => request('POST', path, body ?? {}),
  put: (path, body) => request('PUT', path, body ?? {}),
  del: (path) => request('DELETE', path),
};