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
    purchase_date: "",
    purchase_price: "",
    sale_price: "",
    lactation_number: "",
    lactation_start_date: "",
    lactation_end_date: "",
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
      purchase_date: formData.purchase_date || null,
      purchase_price: formData.purchase_price
        ? Number(formData.purchase_price)
        : null,
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      lactation_number: formData.lactation_number
        ? Number(formData.lactation_number)
        : null,
      lactation_start_date: formData.lactation_start_date || null,
      lactation_end_date: formData.lactation_end_date || null,
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
        <label>Purchase Date:</label>
        <input
          type="date"
          name="purchase_date"
          value={formData.purchase_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Purchase Price:</label>
        <input
          type="number"
          name="purchase_price"
          value={formData.purchase_price}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label>Sale Price:</label>
        <input
          type="number"
          name="sale_price"
          value={formData.sale_price}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </div>

      <div>
        <label>Lactation Number:</label>
        <input
          type="number"
          name="lactation_number"
          value={formData.lactation_number}
          onChange={handleChange}
          min="1"
          step="1"
        />
      </div>

      <div>
        <label>Lactation Start Date:</label>
        <input
          type="date"
          name="lactation_start_date"
          value={formData.lactation_start_date}
          onChange={handleChange}
        />
      </div>

      <div>
        <label>Lactation End Date:</label>
        <input
          type="date"
          name="lactation_end_date"
          value={formData.lactation_end_date}
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
