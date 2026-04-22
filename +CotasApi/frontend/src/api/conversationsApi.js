const API_BASE = "https://cotasapi-jdlop-acarexacb9hkh3d6.centralus-01.azurewebsites.net/";

async function handleJson(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed.");
  }
  return response.json();
}

export async function getMyConversations(token) {
  const response = await fetch(`${API_BASE}api/conversations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleJson(response);
}

export async function startConversation(petPostId, token) {
  const response = await fetch(`${API_BASE}api/conversations/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ petPostId })
  });
  return handleJson(response);
}

export async function getConversationMessages(conversationId, token) {
  const response = await fetch(`${API_BASE}api/conversations/${conversationId}/messages`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return handleJson(response);
}

export async function sendConversationMessage(conversationId, content, token) {
  const response = await fetch(`${API_BASE}api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ content })
  });
  return handleJson(response);
}
