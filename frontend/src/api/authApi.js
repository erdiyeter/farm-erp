const API_URL = "http://127.0.0.1:8000/api/v1/auth";

async function getAuthError(response, fallbackMessage) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") {
      return data.detail;
    }
  } catch {
    return fallbackMessage;
  }
  return fallbackMessage;
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await getAuthError(response, "Login failed"));
  }
  return response.json();
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(
      await getAuthError(response, "Unable to restore login session")
    );
  }
  return response.json();
}
