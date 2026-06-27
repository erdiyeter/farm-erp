import { useEffect, useState } from "react";
import {
  createInventoryMovement,
  getInventoryItems,
  getInventoryMovements,
} from "../api/inventoryApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { tBusiness as t, tBusinessValue as tv } from "../i18n";

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
        setError(t("Error: Failed to load inventory movements"));
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
      setSuccessMessage(t("Inventory movement created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Inventory Movements")}
        subtitle={t("Create and review stock movements")}
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            {t("Item")}:
            <select
              name="item_id"
              value={formData.item_id}
              onChange={handleChange}
              required
            >
              <option value="">{t("Select item")}</option>
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
            {t("Movement Type")}:
            <select
              name="movement_type"
              value={formData.movement_type}
              onChange={handleChange}
              required
            >
              <option value="in">{tv("in")}</option>
              <option value="out">{tv("out")}</option>
              <option value="adjustment">{tv("adjustment")}</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            {t("Quantity")}:
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
            {t("Movement Date")}:
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
            {t("Notes")}:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? t("Saving...") : t("Create Inventory Movement")}
        </button>
      </form>

      <h2>{t("Active Items Stock Reference")}</h2>

      {activeItems.length === 0 ? (
        <p className="empty-text">{t("No active inventory items found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Name")}</th>
              <th>{t("Current Quantity")}</th>
              <th>{t("Unit")}</th>
              <th>{t("Stock Status")}</th>
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
                    ? t("Low stock")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>{t("Movement History")}</h2>

      {loading ? (
        <Loading
          text={t("Loading inventory movements...")}
          className="status-text"
        />
      ) : movements.length === 0 ? (
        <p className="empty-text">{t("No inventory movements found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Item ID")}</th>
              <th>{t("Movement Type")}</th>
              <th>{t("Quantity")}</th>
              <th>{t("Movement Date")}</th>
              <th>{t("Notes")}</th>
              <th>{t("Created At")}</th>
            </tr>
          </thead>

          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id}>
                <td>{movement.id}</td>
                <td>{movement.item_id}</td>
                <td>{tv(movement.movement_type)}</td>
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
