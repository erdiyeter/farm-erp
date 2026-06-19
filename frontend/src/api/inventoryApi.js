const API_BASE_URL = "http://127.0.0.1:8000/api/v1/inventory";

async function getInventoryError(response, fallbackMessage) {
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

export async function getInventoryItems() {
  const response = await fetch(`${API_BASE_URL}/items`);

  if (!response.ok) {
    throw new Error("Failed to fetch inventory items");
  }

  return response.json();
}

export async function getInventoryItemById(id) {
  const response = await fetch(`${API_BASE_URL}/items/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch inventory item");
  }

  return response.json();
}

export async function createInventoryItem(itemData) {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    throw new Error(
      await getInventoryError(response, "Failed to create inventory item")
    );
  }

  return response.json();
}

export async function updateInventoryItem(id, itemData) {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(itemData),
  });

  if (!response.ok) {
    throw new Error(
      await getInventoryError(response, "Failed to update inventory item")
    );
  }

  return response.json();
}

export async function deactivateInventoryItem(id) {
  const response = await fetch(`${API_BASE_URL}/items/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await getInventoryError(
        response,
        "Failed to deactivate inventory item"
      )
    );
  }

  return response.json();
}

export async function getInventoryMovements() {
  const response = await fetch(`${API_BASE_URL}/movements`);

  if (!response.ok) {
    throw new Error("Failed to fetch inventory movements");
  }

  return response.json();
}

export async function createInventoryMovement(movementData) {
  const response = await fetch(`${API_BASE_URL}/movements`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(movementData),
  });

  if (!response.ok) {
    throw new Error(
      await getInventoryError(response, "Failed to create inventory movement")
    );
  }

  return response.json();
}
