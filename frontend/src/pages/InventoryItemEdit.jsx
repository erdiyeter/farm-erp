import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getInventoryItemById,
  updateInventoryItem,
} from "../api/inventoryApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

const initialFormData = {
  name: "",
  category: "",
  unit: "",
  current_quantity: "",
  minimum_quantity: "",
  notes: "",
};

function InventoryItemEdit() {
  const { id } = useParams();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadInventoryItem() {
      try {
        const item = await getInventoryItemById(id);

        setFormData({
          name: item.name || "",
          category: item.category || "",
          unit: item.unit || "",
          current_quantity: item.current_quantity ?? "",
          minimum_quantity: item.minimum_quantity ?? "",
          notes: item.notes || "",
        });
      } catch {
        setError("Error: Failed to load inventory item");
      } finally {
        setLoading(false);
      }
    }

    loadInventoryItem();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      name: formData.name,
      category: formData.category || null,
      unit: formData.unit,
      current_quantity: Number(formData.current_quantity),
      minimum_quantity: Number(formData.minimum_quantity),
      notes: formData.notes || null,
    };

    try {
      await updateInventoryItem(id, payload);
      setSuccessMessage("Inventory item updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text="Loading inventory item..."
        className="status-text"
      />
    );
  }

  if (error && !saving && !successMessage) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Edit Inventory Item</h1>

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Category:
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Unit:
            <input
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Current Quantity:
            <input
              type="number"
              step="0.01"
              name="current_quantity"
              value={formData.current_quantity}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Minimum Quantity:
            <input
              type="number"
              step="0.01"
              name="minimum_quantity"
              value={formData.minimum_quantity}
              onChange={handleChange}
              required
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

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>

        <Link to={`/inventory/items/${id}`}>
          <button type="button">Cancel</button>
        </Link>
      </form>

      {successMessage && (
        <p>
          <Link to={`/inventory/items/${id}`}>Back to Inventory Item</Link>
        </p>
      )}
    </div>
  );
}

export default InventoryItemEdit;
