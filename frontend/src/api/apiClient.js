const API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const TOKEN_KEY = "farm_erp_access_token";

export function authenticatedFetch(url, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

export async function apiRequest(endpoint, options = {}) {
  const response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}
