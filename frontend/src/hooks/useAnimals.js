import { useEffect, useState } from "react";
import { getAnimals } from "../api/animalApi";

function useAnimals() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnimals() {
      try {
        const data = await getAnimals();
        setAnimals(data);
      } catch {
        setError(
          "Unable to load animals. Please make sure the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnimals();
  }, []);

  function getAnimalLabel(animalId) {
    const animal = animals.find((item) => item.id === Number(animalId));

    if (!animal) {
      return `Animal ID ${animalId}`;
    }

    return `${animal.ear_tag}${animal.name ? ` - ${animal.name}` : ""} (ID: ${animal.id})`;
  }

  return {
    animals,
    loading,
    error,
    getAnimalLabel,
  };
}

export default useAnimals;
