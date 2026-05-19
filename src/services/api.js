const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/+$/, "");

export const API_BASE = BASE;

function resolveToken(overrideToken, hasOverride) {
  return hasOverride ? overrideToken : localStorage.getItem("clerkToken");
}

function dispatchAuthError(status, path) {
  if (status === 401 || status === 403) {
    window.dispatchEvent(
      new CustomEvent("auth:error", {
        detail: { status, path },
      })
    );
  }
}

async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    throw new Error("Nie można połączyć się z backendem. Sprawdź, czy serwer działa.");
  }
}

function localizeErrorMessage(message) {
  return message
    .replace("To konto istnieje już jako student.", "To konto istnieje już jako uczeń.")
    .replace("To konto istnieje juÅ¼ jako student.", "To konto istnieje już jako uczeń.");
}

function extractErrorMessage(text, status) {
  try {
    const parsed = JSON.parse(text);

    if (parsed.message && parsed.message.trim() !== "") {
      return localizeErrorMessage(parsed.message);
    }

    if (status === 404) return "Kod jest niepoprawny.";
    if (status === 409) return "Jesteś już zapisany na tę sesję.";
    if (status === 400) return "Nie udało się wykonać operacji.";
    if (status === 401) return "Sesja wygasła. Zaloguj się ponownie.";
    if (status === 403) return "Nie masz uprawnień do wykonania tej akcji.";
    if (status >= 500) return "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.";

    return parsed.error || "Wystąpił błąd.";
  } catch {
    if (status === 404) return "Kod jest niepoprawny.";
    if (status === 409) return "Jesteś już zapisany na tę sesję.";
    if (status === 400) return "Nie udało się wykonać operacji.";
    if (status === 401) return "Sesja wygasła. Zaloguj się ponownie.";
    if (status === 403) return "Nie masz uprawnień do wykonania tej akcji.";
    if (status >= 500) return "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.";
    return text || "Wystąpił błąd.";
  }
}

export async function apiGet(path, params, overrideToken) {
  const legacyTokenAsSecondArg = arguments.length === 2 && typeof params === "string";
  const queryParams = legacyTokenAsSecondArg ? null : params;
  const token = legacyTokenAsSecondArg
    ? params
    : resolveToken(overrideToken, arguments.length >= 3);

  let url = `${BASE}${path}`;
  if (queryParams) {
    const query = new URLSearchParams(queryParams).toString();
    url += `?${query}`;
  }

  const res = await safeFetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  dispatchAuthError(res.status, path);

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
  const token = resolveToken(overrideToken, arguments.length >= 3);

  const res = await safeFetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  dispatchAuthError(res.status, path);

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

export async function apiPut(path, body, overrideToken) {
  const token = resolveToken(overrideToken, arguments.length >= 3);

  const res = await safeFetch(`${BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  dispatchAuthError(res.status, path);

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
  const token = resolveToken(overrideToken, arguments.length >= 2);

  const res = await safeFetch(`${BASE}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  dispatchAuthError(res.status, path);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(extractErrorMessage(text, res.status));
  }

  return true;
}

export async function apiPostMultipart(path, formData, overrideToken) {
  const token = resolveToken(overrideToken, arguments.length >= 3);

  const res = await safeFetch(`${BASE}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  dispatchAuthError(res.status, path);

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
