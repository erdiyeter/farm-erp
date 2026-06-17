import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAnimal } from "../api/animalApi";

function AnimalCreateForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ear_tag: "",
    name: "",
    species: "cattle",
    breed: "",
    sex: "",
    birth_date: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      ear_tag: formData.ear_tag.trim(),
      name: formData.name.trim() || null,
      species: formData.species.trim() || "cattle",
      breed: formData.breed.trim() || null,
      sex: formData.sex.trim() || null,
      birth_date: formData.birth_date || null,
      notes: formData.notes.trim() || null,
    };

    try {
      await createAnimal(payload);
      navigate("/animals");
    } catch (err) {
      if (err.message.includes("already exists")) {
        setError("Ear tag already exists. Please enter a different ear tag.");
      } else {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p>Error: {error}</p>}

      <div>
        <label>Ear Tag:</label>
        <input
          name="ear_tag"
          value={formData.ear_tag}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Name:</label>
        <input name="name" value={formData.name} onChange={handleChange} />
      </div>

      <div>
        <label>Species:</label>
        <input
          name="species"
          value={formData.species}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Breed:</label>
        <input name="breed" value={formData.breed} onChange={handleChange} />
      </div>

      <div>
        <label>Sex:</label>
        <input name="sex" value={formData.sex} onChange={handleChange} />
      </div>

      <div>
        <label>Birth Date:</label>
        <input
          type="date"
          name="birth_date"
          value={formData.birth_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Notes:</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange} />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>

      <button type="button" onClick={() => navigate("/animals")}>
        Cancel
      </button>
    </form>
  );
}

export default AnimalCreateForm;