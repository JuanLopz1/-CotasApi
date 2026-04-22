const AUTH_STORAGE_KEY = "cotas_auth_user";
const API_BASE = "https://cotasapi-jdlop-acarexacb9hkh3d6.centralus-01.azurewebsites.net/";

/** Same paths as ASP.NET Core AuthController (case-insensitive on server). */
const AUTH_REGISTER = `${API_BASE}api/auth/register`;
const AUTH_LOGIN = `${API_BASE}api/auth/login`;

async function readAuthError(response) {
  const text = (await response.text()).trim();
  const short = text.length > 280 ? `${text.slice(0, 280)}…` : text;
  if (response.status === 404) {
    return (
      short ||
      `Server returned 404 (Not Found). The register endpoint may be missing — stop and restart the API after rebuilding, ` +
        `or open /swagger and confirm POST ${AUTH_REGISTER} exists.`
    );
  }
  if (response.status === 401 || response.status === 400) {
    return short || `${response.status} ${response.statusText}`;
  }
  return short || `${response.status} ${response.statusText}`;
}

export async function register(name, email, password) {
  const response = await fetch(AUTH_REGISTER, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  });

  if (!response.ok) {
    throw new Error(await readAuthError(response));
  }

  return response.json();
}

export async function login(email, password) {
  const response = await fetch(AUTH_LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    throw new Error(await readAuthError(response));
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
