const API_BASE_URL = "/api/PetPosts";

function buildQuery(filters) {
  const params = new URLSearchParams();

  if (filters.status !== "") {
    params.set("status", filters.status);
  }

  if (filters.postType !== "") {
    params.set("postType", filters.postType);
  }

  if (filters.clientId) {
    params.set("clientId", filters.clientId);
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

export async function getPetPosts(filters) {
  const response = await fetch(`${API_BASE_URL}${buildQuery(filters)}`);
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
  body.set("description", newPost.description);
  body.set("location", newPost.location);

  if (newPost.imageUrl) {
    body.set("imageUrl", newPost.imageUrl);
  }

  if (newPost.imageFile) {
    body.set("imageFile", newPost.imageFile);
  }

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

export async function updatePetPost(id, postData, token) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(postData)
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

export const postTypeOptions = [
  { value: 0, label: "Adoption" },
  { value: 1, label: "Lost" },
  { value: 2, label: "Found" }
];

export const statusOptions = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Approved" },
  { value: 2, label: "Rejected" }
];

export const statusLabelMap = {
  0: "Pending",
  1: "Available",
  2: "Rejected"
};

export const categoryOptions = [
  { value: "all", label: "All" },
  { value: "dogs", label: "Dogs" },
  { value: "cats", label: "Cats" },
  { value: "birds", label: "Birds" },
  { value: "others", label: "Others" }
];
