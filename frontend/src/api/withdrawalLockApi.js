const API_BASE_URL = "http://127.0.0.1:8000/api/v1/withdrawal-locks";

async function getWithdrawalLockError(response, fallbackMessage) {
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

export async function getWithdrawalLocks() {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    throw new Error(
      await getWithdrawalLockError(
        response,
        "Failed to fetch withdrawal locks"
      )
    );
  }

  return response.json();
}

export async function createWithdrawalLock(data) {
  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getWithdrawalLockError(
        response,
        "Failed to create withdrawal lock"
      )
    );
  }

  return response.json();
}
