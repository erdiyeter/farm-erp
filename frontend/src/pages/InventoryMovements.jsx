import { useEffect, useState } from "react";
import {
  createInventoryMovement,
  getInventoryItems,
  getInventoryMovements,
} from "../api/inventoryApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

const initialFormData = {
  item_id: "",
  movement_type: "in",
  quantity: "",
  movement_date: "",
  notes: "",
};

function InventoryMovements() {
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeItems = items.filter((item) => item.is_active === true);

  useEffect(() => {
    async function loadInventoryData() {
      try {
        const [movementData, itemData] = await Promise.all([
          getInventoryMovements(),
          getInventoryItems(),
        ]);

        setMovements(movementData);
        setItems(itemData);
      } catch {
        setError("Error: Failed to load inventory movements");
      } finally {
        setLoading(false);
      }
    }

    loadInventoryData();
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
      item_id: Number(formData.item_id),
      movement_type: formData.movement_type,
      quantity: Number(formData.quantity),
      movement_date: formData.movement_date,
      notes: formData.notes || null,
    };

    try {
      await createInventoryMovement(payload);

      const [movementData, itemData] = await Promise.all([
        getInventoryMovements(),
        getInventoryItems(),
      ]);

      setMovements(movementData);
      setItems(itemData);
      setFormData(initialFormData);
      setSuccessMessage("Inventory movement created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Inventory Movements"
        subtitle="Create and review stock movements"
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Item:
            <select
              name="item_id"
              value={formData.item_id}
              onChange={handleChange}
              required
            >
              <option value="">Select item</option>
              {activeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} - {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Movement Type:
            <select
              name="movement_type"
              value={formData.movement_type}
              onChange={handleChange}
              required
            >
              <option value="in">in</option>
              <option value="out">out</option>
              <option value="adjustment">adjustment</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Quantity:
            <input
              type="number"
              step="0.01"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Movement Date:
            <input
              type="date"
              name="movement_date"
              value={formData.movement_date}
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
          {saving ? "Saving..." : "Create Inventory Movement"}
        </button>
      </form>

      <h2>Active Items Stock Reference</h2>

      {activeItems.length === 0 ? (
        <p className="empty-text">No active inventory items found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Current Quantity</th>
              <th>Unit</th>
              <th>Stock Status</th>
            </tr>
          </thead>

          <tbody>
            {activeItems.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.current_quantity}</td>
                <td>{item.unit}</td>
                <td>
                  {Number(item.current_quantity) <=
                  Number(item.minimum_quantity)
                    ? "Low stock"
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Movement History</h2>

      {loading ? (
        <Loading
          text="Loading inventory movements..."
          className="status-text"
        />
      ) : movements.length === 0 ? (
        <p className="empty-text">No inventory movements found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Item ID</th>
              <th>Movement Type</th>
              <th>Quantity</th>
              <th>Movement Date</th>
              <th>Notes</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.id}</td>
                <td>{movement.item_id}</td>
                <td>{movement.movement_type}</td>
                <td>{movement.quantity}</td>
                <td>{movement.movement_date}</td>
                <td>{movement.notes || "-"}</td>
                <td>{movement.created_at || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default InventoryMovements;
