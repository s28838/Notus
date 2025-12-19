const BASE = import.meta.env.VITE_API_URL;

export async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`);

  // 1. Jeśli status HTTP to np. 404 / 500
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  // 2. Sprawdzamy, co naprawdę przyszło
  const contentType = res.headers.get("content-type");

  // 3. TYLKO jeśli to JSON → parsujemy jako JSON
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }

  // 4. W innym wypadku zwracamy tekst (HTML)
  const text = await res.text();
  throw new Error("Odpowiedź nie jest JSON-em:\n" + text);
}
