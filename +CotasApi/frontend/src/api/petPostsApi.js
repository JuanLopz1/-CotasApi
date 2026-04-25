const API_BASE = "https://cotasapi-jdlop-acarexacb9hkh3d6.centralus-01.azurewebsites.net/";
const API_BASE_URL = `${API_BASE}api/PetPosts`;

/** Turn API-relative paths (/img/...) into absolute URLs so images load from the API host, not the SPA origin. */
export function resolvePetImageSrc(imageUrl) {
  if (!imageUrl || !String(imageUrl).trim()) {
    return null;
  }
  const trimmed = String(imageUrl).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  try {
    return new URL(trimmed, API_BASE).href;
  } catch {
    return trimmed;
  }
}

function buildQuery(filters) {
  const safe = filters ?? {};
  const params = new URLSearchParams();

  if (safe.status !== undefined && safe.status !== null && safe.status !== "") {
    params.set("status", String(safe.status));
  }

  if (safe.postType !== undefined && safe.postType !== null && safe.postType !== "") {
    params.set("postType", String(safe.postType));
  }

  if (safe.clientId) {
    params.set("clientId", safe.clientId);
  }
  if (safe.includeReunited) {
    params.set("includeReunited", "true");
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getPetPosts(filters, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${buildQuery(filters)}`, { headers });
  return handleResponse(response);
}

export async function getPetPostStats() {
  const response = await fetch(`${API_BASE_URL}/stats`);
  return handleResponse(response);
}

export async function getMyPetPosts(clientId, token) {
  const params = new URLSearchParams();
  if (clientId) {
    params.set("clientId", clientId);
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/mine${suffix}`, { headers });
  return handleResponse(response);
}

export async function getPetPost(id, clientId, token) {
  const params = new URLSearchParams();
  if (clientId) {
    params.set("clientId", clientId);
  }
  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${id}${suffix}`, { headers });
  return handleResponse(response);
}

export async function createPetPost(newPost, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = new FormData();
  body.set("title", newPost.title);
  body.set("petName", newPost.petName);
  body.set("postType", String(newPost.postType));
  body.set("petCategory", String(newPost.petCategory));
  if (newPost.petKindLabel) {
    body.set("petKindLabel", newPost.petKindLabel);
  }
  body.set("description", newPost.description);
  body.set("location", newPost.location);
  body.set("contactEmail", newPost.contactEmail);
  if (newPost.contactPhone) {
    body.set("contactPhone", newPost.contactPhone);
  }
  if (
    newPost.preferredContact !== undefined &&
    newPost.preferredContact !== null &&
    newPost.preferredContact !== ""
  ) {
    body.set("preferredContact", String(newPost.preferredContact));
  }

  if (!newPost.imageFile) {
    throw new Error("An image file is required.");
  }
  body.set("imageFile", newPost.imageFile);

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers,
    body
  });

  return handleResponse(response);
}

export async function updatePetPostStatus(id, status, token) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${id}/status`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status })
  });

  return handleResponse(response);
}

export async function markPetPostReunited(id, details, token) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${id}/reunited`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ details })
  });

  return handleResponse(response);
}

export async function updatePetPost(id, payload, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = new FormData();
  body.set("title", payload.title);
  body.set("petName", payload.petName);
  body.set("postType", String(payload.postType));
  body.set("petCategory", String(payload.petCategory));
  if (payload.petKindLabel) {
    body.set("petKindLabel", payload.petKindLabel);
  }
  body.set("description", payload.description);
  body.set("location", payload.location);
  body.set("contactEmail", payload.contactEmail);
  if (payload.contactPhone) {
    body.set("contactPhone", payload.contactPhone);
  }
  if (
    payload.preferredContact !== undefined &&
    payload.preferredContact !== null &&
    payload.preferredContact !== ""
  ) {
    body.set("preferredContact", String(payload.preferredContact));
  }
  if (payload.imageFile) {
    body.set("imageFile", payload.imageFile);
  }
  body.set("clearImage", payload.clearImage ? "true" : "false");
  if (payload.status !== undefined && payload.status !== null && payload.status !== "") {
    body.set("status", String(payload.status));
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers,
    body
  });

  return handleResponse(response);
}

export async function deletePetPost(id, token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
    headers
  });

  return handleResponse(response);
}

export async function togglePetLike(id, clientId) {
  const response = await fetch(`${API_BASE_URL}/${id}/like`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ clientId })
  });

  return handleResponse(response);
}

export function likeErrorMessage(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("only adoption") || msg.includes("adoption posts")) {
    return "Likes are only available on adoption posts.";
  }
  if (msg.includes("clientid") || msg.includes("client id")) {
    return "We could not identify this browser. Try refreshing the page.";
  }
  if (msg.includes("not found") || msg.includes("404")) {
    return "This post is no longer available.";
  }
  return "Could not update the like. Check your connection and try again.";
}

export const preferredContactOptions = [
  { value: "", label: "No preference" },
  { value: 0, label: "Either email or phone" },
  { value: 1, label: "Email preferred" },
  { value: 2, label: "Phone preferred" }
];

export function preferredContactLabel(value) {
  if (value === null || value === undefined) {
    return "No preference";
  }
  const row = preferredContactOptions.find((o) => o.value === value);
  return row?.label ?? "No preference";
}

export const postTypeOptions = [
  { value: 0, label: "Adoption" },
  { value: 1, label: "Lost" },
  { value: 2, label: "Found" }
];

export const petCategoryOptions = [
  { value: 0, filterSlug: "dogs", label: "Dog" },
  { value: 1, filterSlug: "cats", label: "Cat" },
  { value: 2, filterSlug: "birds", label: "Bird" },
  { value: 3, filterSlug: "others", label: "Other (describe below)" }
];

export function categorySlugForPost(post) {
  const match = petCategoryOptions.find((o) => o.value === post.petCategory);
  return match?.filterSlug ?? "others";
}

export function petCategoryLabel(post) {
  const match = petCategoryOptions.find((o) => o.value === post.petCategory);
  const base = match?.label.replace(" (describe below)", "") ?? "Pet";
  const extra = post.petKindLabel?.trim();
  if (extra) {
    if (post.petCategory === 3) {
      return `${base}: ${extra}`;
    }
    return `${base} · ${extra}`;
  }
  return base;
}

export const statusOptions = [
  { value: 0, label: "In review" },
  { value: 1, label: "Approved" },
  { value: 2, label: "Rejected" },
  { value: 3, label: "Reunited" }
];

export function statusPresentation(post) {
  const pending = { label: "In review", className: "badge-pending" };
  const rejected = { label: "Rejected", className: "badge-rejected" };

  if (post.status === 0) {
    return pending;
  }
  if (post.status === 2) {
    return rejected;
  }
  if (post.status === 3) {
    return { label: "Reunited", className: "badge-reunited" };
  }

  if (post.postType === 0) {
    return { label: "Ready to adopt", className: "badge-adopt" };
  }
  if (post.postType === 1) {
    return { label: "Missing", className: "badge-lost" };
  }
  if (post.postType === 2) {
    return { label: "Found — needs owner", className: "badge-found" };
  }

  return { label: "Published", className: "badge-adopt" };
}

export const categoryOptions = [
  { value: "all", label: "All" },
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
  { value: "birds", label: "Birds" },
  { value: "others", label: "Others" }
];
