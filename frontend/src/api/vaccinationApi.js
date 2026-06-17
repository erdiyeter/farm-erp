const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

async function getCreateVaccinationError(response) {
  try {
    const data = await response.json();

    if (data.detail === "Animal not found") {
      return "Animal not found. Please enter an existing animal ID.";
    }

    if (Array.isArray(data.detail)) {
      return "Invalid input. Please check the form fields.";
    }
  } catch {
    return "Failed to create vaccination record. Please try again.";
  }

  return "Failed to create vaccination record. Please try again.";
}

export async function getVaccinations() {
  const response = await fetch(`${API_BASE_URL}/vaccinations`);

  if (!response.ok) {
    throw new Error("Failed to fetch vaccination records");
  }

  return response.json();
}

export async function createVaccination(vaccinationData) {
  const response = await fetch(`${API_BASE_URL}/vaccinations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vaccinationData),
  });

  if (!response.ok) {
    throw new Error(await getCreateVaccinationError(response));
  }

  return response.json();
}

export async function getVaccinationsByAnimalId(animalId) {
  const response = await fetch(
    `${API_BASE_URL}/animals/${animalId}/vaccinations`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch animal vaccination records");
  }

  return response.json();
}
