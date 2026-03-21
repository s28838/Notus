const BASE = import.meta.env.VITE_API_URL;

export async function apiGet(path, overrideToken) {
  const token = overrideToken || localStorage.getItem("clerkToken");

  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new CustomEvent("auth:error", { 
      detail: { status: res.status, path } 
    }));
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
export async function apiPost(path, body, overrideToken) {
  const token = overrideToken || localStorage.getItem("clerkToken");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new CustomEvent("auth:error", { 
      detail: { status: res.status, path } 
    }));
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}