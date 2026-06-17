import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAnimalById, updateAnimal } from "../api/animalApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";

function AnimalEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ear_tag: "",
    name: "",
    species: "cattle",
    breed: "",
    sex: "",
    birth_date: "",
    notes: "",
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnimal() {
      try {
        const animal = await getAnimalById(id);

        setFormData({
          ear_tag: animal.ear_tag || "",
          name: animal.name || "",
          species: animal.species || "cattle",
          breed: animal.breed || "",
          sex: animal.sex || "",
          birth_date: animal.birth_date || "",
          notes: animal.notes || "",
          is_active: animal.is_active ?? true,
        });
      } catch {
        setError(
          "Unable to load animal. Please make sure the backend server is running."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnimal();
  }, [id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...formData,
      name: formData.name || null,
      breed: formData.breed || null,
      sex: formData.sex || null,
      birth_date: formData.birth_date || null,
      notes: formData.notes || null,
    };

    try {
      await updateAnimal(id, payload);
      navigate(`/animals/${id}`);
    } catch {
      setError(
        "Unable to update animal. Please make sure the backend server is running."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading />;
  }

  if (error && !saving) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      <h1>Edit Animal</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Ear Tag:
            <input
              name="ear_tag"
              value={formData.ear_tag}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Name:
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Species:
            <input
              name="species"
              value={formData.species}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Breed:
            <input
              name="breed"
              value={formData.breed}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Sex:
            <input
              name="sex"
              value={formData.sex}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Birth Date:
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Notes:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Active:
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => navigate(`/animals/${id}`)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default AnimalEdit;
