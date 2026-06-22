import { authenticatedFetch } from "./apiClient";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function getReproductionEventError(response, fallbackMessage) {
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

async function request(path, fallbackMessage, options) {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(await getReproductionEventError(response, fallbackMessage));
  }
  return response.status === 204 ? null : response.json();
}

export function getReproductionEvents() {
  return request(
    "/reproduction-events",
    "Failed to fetch reproduction events"
  );
}

export function getReproductionEventsByAnimalId(animalId) {
  return request(
    `/animals/${animalId}/reproduction-events`,
    "Failed to fetch animal reproduction events"
  );
}

export function getReproductionEventById(id) {
  return request(
    `/reproduction-events/${id}`,
    "Failed to fetch reproduction event"
  );
}

export function createReproductionEvent(data) {
  return request(
    "/reproduction-events",
    "Failed to create reproduction event",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

export function updateReproductionEvent(id, data) {
  return request(
    `/reproduction-events/${id}`,
    "Failed to update reproduction event",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
}

export function deleteReproductionEvent(id) {
  return request(
    `/reproduction-events/${id}`,
    "Failed to delete reproduction event",
    { method: "DELETE" }
  );
}
