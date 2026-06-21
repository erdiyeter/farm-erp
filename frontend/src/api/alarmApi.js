import { authenticatedFetch } from "./apiClient";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1/alarms";

async function getAlarmError(response, fallbackMessage) {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return "Invalid input. Please check the form fields.";
    }
  } catch {
    return fallbackMessage;
  }

  return fallbackMessage;
}

export async function getAlarms() {
  const response = await authenticatedFetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error(
      await getAlarmError(response, "Failed to fetch alarms")
    );
  }

  return response.json();
}

export async function createAlarm(data) {
  const response = await authenticatedFetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getAlarmError(response, "Failed to create alarm")
    );
  }

  return response.json();
}

export async function getAlarmById(id) {
  const response = await authenticatedFetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    throw new Error(
      await getAlarmError(response, "Failed to fetch alarm")
    );
  }

  return response.json();
}

export async function updateAlarm(id, data) {
  const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getAlarmError(response, "Failed to update alarm")
    );
  }

  return response.json();
}

export async function deleteAlarm(id) {
  const response = await authenticatedFetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await getAlarmError(response, "Failed to delete alarm")
    );
  }
}
