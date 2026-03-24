const BASE = import.meta.env.VITE_API_URL;

function extractErrorMessage(text, status) {
  try {
    const parsed = JSON.parse(text);

    if (parsed.message && parsed.message.trim() !== "") {
      return parsed.message;
    }

    if (status === 404) return "Kod jest niepoprawny.";
    if (status === 409) return "Jesteś już zapisany na tę sesję.";
    if (status === 400) return "Nie udało się wykonać operacji.";

    return parsed.error || "Wystąpił błąd.";
  } catch {
    if (status === 404) return "Kod jest niepoprawny.";
    if (status === 409) return "Jesteś już zapisany na tę sesję.";
    if (status === 400) return "Nie udało się wykonać operacji.";
    return text || "Wystąpił błąd.";
  }
}

export async function apiGet(path, params, overrideToken) {
  const token = overrideToken || localStorage.getItem("clerkToken");

  let url = `${BASE}${path}`;
  if (params) {
    const query = new URLSearchParams(params).toString();
    url += `?${query}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    window.dispatchEvent(
      new CustomEvent("auth:error", {
        detail: { status: res.status, path },
      })
    );
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(extractErrorMessage(text, res.status));
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

  if (res.status === 401) {
    window.dispatchEvent(
      new CustomEvent("auth:error", {
        detail: { status: res.status, path },
      })
    );
  }

  const text = await res.text();

  if (!res.ok) {
    throw new Error(extractErrorMessage(text, res.status));
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiDelete(path, overrideToken) {
  const token = overrideToken || localStorage.getItem("clerkToken");

  const res = await fetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new CustomEvent("auth:error", { 
      detail: { status: res.status, path } 
    }));
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return true;
}

export async function apiPostMultipart(path, formData, overrideToken) {
  const token = overrideToken || localStorage.getItem("clerkToken");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
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