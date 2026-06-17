import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteAnimal } from "../api/animalApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import useAnimalDetail from "../hooks/useAnimalDetail";

function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { animal, loading, error, setError } = useAnimalDetail(id);
  const [deleting, setDeleting] = useState(false);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this animal?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteAnimal(id);

      navigate("/animals");
    } catch {
      setError(
        "Unable to deactivate animal. Please make sure the backend server is running."
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text="Loading animal details..."
        className="status-text"
      />
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        className="error-text"
      />
    );
  }

  return (
    <div>
      <h1>Animal Detail</h1>

      <p>
        <strong>ID:</strong> {animal.id}
      </p>

      <p>
        <strong>Ear Tag:</strong> {animal.ear_tag}
      </p>

      <p>
        <strong>Name:</strong> {animal.name || "-"}
      </p>

      <p>
        <strong>Species:</strong> {animal.species || "-"}
      </p>

      <p>
        <strong>Breed:</strong> {animal.breed || "-"}
      </p>

      <p>
        <strong>Sex:</strong> {animal.sex || "-"}
      </p>

      <p>
        <strong>Birth Date:</strong> {animal.birth_date || "-"}
      </p>

      <p>
        <strong>Notes:</strong> {animal.notes || "-"}
      </p>

      <p>
        <strong>Active:</strong> {animal.is_active ? "Yes" : "No"}
      </p>

      <Link to="/animals">
        <button>Back to Animals</button>
      </Link>

      <Link to={`/animals/${animal.id}/edit`}>
        <button>Edit</button>
      </Link>

      {animal.is_active === true && (
        <button onClick={handleDeactivate} disabled={deleting}>
          {deleting ? "Deactivating..." : "Deactivate"}
        </button>
      )}
    </div>
  );
}

export default AnimalDetail;
