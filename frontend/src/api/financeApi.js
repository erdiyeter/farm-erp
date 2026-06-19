const API_BASE_URL = "http://127.0.0.1:8000/api/v1/finance";

async function getFinanceError(response, fallbackMessage) {
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

export async function getFinanceRecords() {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error(
      await getFinanceError(response, "Failed to fetch finance records")
    );
  }

  return response.json();
}

export async function createFinanceRecord(financeData) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(financeData),
  });

  if (!response.ok) {
    throw new Error(
      await getFinanceError(response, "Failed to create finance record.")
    );
  }

  return response.json();
}

export async function getFinanceRecord(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    throw new Error(
      await getFinanceError(response, "Failed to fetch finance record")
    );
  }

  return response.json();
}

export async function updateFinanceRecord(id, financeData) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(financeData),
  });

  if (!response.ok) {
    throw new Error(
      await getFinanceError(response, "Failed to update finance record.")
    );
  }

  return response.json();
}

export async function deleteFinanceRecord(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await getFinanceError(response, "Failed to delete finance record.")
    );
  }

  return response.json();
}
