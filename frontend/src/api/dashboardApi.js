const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function getDashboardStats() {
  const response = await fetch(`${API_BASE_URL}/dashboard`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard statistics");
  }

  return response.json();
}
