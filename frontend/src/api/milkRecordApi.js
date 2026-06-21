import { authenticatedFetch } from "./apiClient";

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function getCreateMilkRecordError(response) {
  try {
    const data = await response.json();

    if (data.detail === "Animal not found") {
      return "Animal not found. Please enter an existing animal ID.";
    }

    if (Array.isArray(data.detail)) {
      return "Invalid input. Please check the form fields.";
    }
  } catch {
    return "Failed to create milk record. Please try again.";
  }

  return "Failed to create milk record. Please try again.";
}

export async function getMilkRecords() {
  const response = await authenticatedFetch(`${API_BASE_URL}/milk-records`);

  if (!response.ok) {
    throw new Error("Failed to fetch milk records");
  }

  return response.json();
}

export async function createMilkRecord(milkRecordData) {
  const response = await authenticatedFetch(`${API_BASE_URL}/milk-records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(milkRecordData),
  });

  if (!response.ok) {
    throw new Error(await getCreateMilkRecordError(response));
  }

  return response.json();
}

export async function getMilkRecordsByAnimalId(animalId) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/animals/${animalId}/milk-records`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch animal milk records");
  }

  return response.json();
}
