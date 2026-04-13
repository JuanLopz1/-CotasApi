async function handleJson(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed.");
  }
  return response.json();
}

function authHeaders(token) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function getComments(petPostId, token) {
  const response = await fetch(`/api/petposts/${petPostId}/comments`, {
    headers: authHeaders(token)
  });
  return handleJson(response);
}

export async function postComment(petPostId, { authorName, content }, token) {
  const response = await fetch(`/api/petposts/${petPostId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token)
    },
    body: JSON.stringify({ authorName, content })
  });
  return handleJson(response);
}

export async function deleteComment(petPostId, commentId, token) {
  const response = await fetch(`/api/petposts/${petPostId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(token)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed.");
  }
}
