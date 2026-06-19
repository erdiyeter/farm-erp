const API_BASE_URL = "http://127.0.0.1:8000/api/v1/finance";

export async function getFinanceRecords() {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch finance records");
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
    throw new Error("Failed to create finance record.");
  }

  return response.json();
}

export async function getFinanceRecord(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch finance record");
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
    throw new Error("Failed to update finance record.");
  }

  return response.json();
}

export async function deleteFinanceRecord(id) {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete finance record.");
  }

  return response.json();
}
