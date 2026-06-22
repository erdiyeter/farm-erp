import { authenticatedFetch } from "./apiClient";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function getWeightRecordError(response, fallbackMessage) {
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

export async function getWeightRecords() {
  const response = await authenticatedFetch(`${API_BASE_URL}/weight-records`);

  if (!response.ok) {
    throw new Error(
      await getWeightRecordError(response, "Failed to fetch weight records")
    );
  }

  return response.json();
}

export async function getWeightRecordsByAnimalId(animalId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/animals/${animalId}/weight-records`
  );

  if (!response.ok) {
    throw new Error(
      await getWeightRecordError(
        response,
        "Failed to fetch animal weight records"
      )
    );
  }

  return response.json();
}

export async function createWeightRecord(data) {
  const response = await authenticatedFetch(`${API_BASE_URL}/weight-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getWeightRecordError(response, "Failed to create weight record")
    );
  }

  return response.json();
}

export async function getWeightRecordById(id) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/weight-records/${id}`
  );

  if (!response.ok) {
    throw new Error(
      await getWeightRecordError(response, "Failed to fetch weight record")
    );
  }

  return response.json();
}

export async function updateWeightRecord(id, data) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/weight-records/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    throw new Error(
      await getWeightRecordError(response, "Failed to update weight record")
    );
  }

  return response.json();
}

export async function deleteWeightRecord(id) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/weight-records/${id}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    throw new Error(
      await getWeightRecordError(response, "Failed to delete weight record")
    );
  }
}
