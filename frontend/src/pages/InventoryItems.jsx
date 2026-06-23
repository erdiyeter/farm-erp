import { useEffect, useState } from "react";
import {
  createInventoryItem,
  getInventoryItems,
} from "../api/inventoryApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

const initialFormData = {
  name: "",
  category: "",
  unit: "",
  current_quantity: "",
  minimum_quantity: "",
  unit_cost: "",
  notes: "",
};

function InventoryItems() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadInventoryItems() {
      try {
        const data = await getInventoryItems();
        setItems(data);
      } catch {
        setError("Error: Failed to load inventory items");
      } finally {
        setLoading(false);
      }
    }

    loadInventoryItems();
  }, []);

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
      unit_cost: formData.unit_cost ? Number(formData.unit_cost) : null,
      notes: formData.notes || null,
    };

    try {
      await createInventoryItem(payload);
      const data = await getInventoryItems();
      setItems(data);
      setFormData(initialFormData);
      setSuccessMessage("Inventory item created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Inventory Items"
        subtitle="Create and review inventory items"
      />

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
            Unit Cost:
            <input
              type="number"
              step="0.01"
              min="0"
              name="unit_cost"
              value={formData.unit_cost}
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

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Inventory Item"}
        </button>
      </form>

      {loading ? (
        <Loading
          text="Loading inventory items..."
          className="status-text"
        />
      ) : items.length === 0 ? (
        <p className="empty-text">No inventory items found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Current Quantity</th>
              <th>Minimum Quantity</th>
              <th>Unit Cost</th>
              <th>Stock Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.category || "-"}</td>
                <td>{item.unit}</td>
                <td>{item.current_quantity}</td>
                <td>{item.minimum_quantity}</td>
                <td>{item.unit_cost ?? "-"}</td>
                <td>
                  {Number(item.current_quantity) <=
                  Number(item.minimum_quantity)
                    ? "Low stock"
                    : "-"}
                </td>
                <td>{item.notes || "-"}</td>
                <td>
                  <ButtonLink
                    to={`/inventory/items/${item.id}`}
                    variant="secondary"
                  >
                    View
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryItems;
