const CLIENT_ID_STORAGE_KEY = "cotas_client_id";

export function getOrCreateClientId() {
  const existing = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const value =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(CLIENT_ID_STORAGE_KEY, value);
  return value;
}
