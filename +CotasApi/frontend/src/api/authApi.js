const AUTH_STORAGE_KEY = "cotas_auth_user";

export async function login(email, password) {
  const response = await fetch("/api/Auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Login failed.");
  }

  return response.json();
}

export function saveAuthUser(authUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
}

export function loadAuthUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
