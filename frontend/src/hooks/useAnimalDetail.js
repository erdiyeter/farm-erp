import { useEffect, useState } from "react";
import { getAnimalById } from "../api/animalApi";

function useAnimalDetail(id) {
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnimal() {
      try {
        const data = await getAnimalById(id);
        setAnimal(data);
      } catch {
        setError(
          "Unable to load animal details. Please make sure the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnimal();
  }, [id]);

  return {
    animal,
    loading,
    error,
    setError,
  };
}

export default useAnimalDetail;
