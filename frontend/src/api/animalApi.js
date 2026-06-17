import { apiRequest } from "./apiClient";

export async function getAnimals() {
  return apiRequest("/animals");
}

export async function getAnimalById(id) {
  return apiRequest(`/animals/${id}`);
}

export async function createAnimal(animalData) {
  try {
    return await apiRequest("/animals", {
      method: "POST",
      body: JSON.stringify(animalData),
    });
  } catch {
    throw new Error(
      "Ear tag already exists. Please enter a different ear tag."
    );
  }
}

export async function updateAnimal(id, animalData) {
  try {
    return await apiRequest(`/animals/${id}`, {
      method: "PUT",
      body: JSON.stringify(animalData),
    });
  } catch {
    throw new Error("Failed to update animal");
  }
}

export async function deleteAnimal(id) {
  try {
    return await apiRequest(`/animals/${id}`, {
      method: "DELETE",
    });
  } catch {
    throw new Error("Failed to deactivate animal");
  }
}

export async function getAnimalStats() {
  try {
    return await apiRequest("/animals/stats");
  } catch {
    throw new Error("Failed to fetch animal statistics");
  }
}