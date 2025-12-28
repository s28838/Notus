const BASE = import.meta.env.VITE_API_URL;

export async function apiGet(path) {
  const token = localStorage.getItem("firebaseToken");

  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

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
