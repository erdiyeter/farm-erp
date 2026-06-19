const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function getHealthRecordError(response, fallbackMessage) {
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

export async function getHealthRecords() {
  const response = await fetch(`${API_BASE_URL}/health-records`);

  if (!response.ok) {
    throw new Error(
      await getHealthRecordError(response, "Failed to fetch health records")
    );
  }

  return response.json();
}

export async function createHealthRecord(data) {
  const response = await fetch(`${API_BASE_URL}/health-records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getHealthRecordError(response, "Failed to create health record")
    );
  }

  return response.json();
}
