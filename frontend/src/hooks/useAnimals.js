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

  return {
    animals,
    loading,
    error,
  };
}

export default useAnimals;
