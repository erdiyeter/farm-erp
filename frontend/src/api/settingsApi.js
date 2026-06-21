import { authenticatedFetch } from "./apiClient";

const API_URL = "http://127.0.0.1:8000/api/v1/settings";

async function getSettingsError(response, fallbackMessage) {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return "Invalid settings. Please check the form fields.";
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export async function getSettings() {
  const response = await authenticatedFetch(API_URL);

  if (!response.ok) {
    throw new Error(
      await getSettingsError(response, "Failed to fetch settings")
    );
  }

  return response.json();
}

export async function updateSettings(data) {
  const response = await authenticatedFetch(API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getSettingsError(response, "Failed to update settings")
    );
  }

  return response.json();
}
