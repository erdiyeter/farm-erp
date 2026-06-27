import { useEffect, useState } from "react";
import {
  createInventoryItem,
  getInventoryItems,
} from "../api/inventoryApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { tBusiness as t, tBusinessValue as tv } from "../i18n";

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
        setError(t("Error: Failed to load inventory items"));
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
      setSuccessMessage(t("Inventory item created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Inventory Items")}
        subtitle={t("Create and review inventory items")}
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            {t("Name")}:
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
            {t("Category")}:
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            {t("Unit")}:
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
            {t("Current Quantity")}:
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
            {t("Minimum Quantity")}:
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
            {t("Unit Cost")}:
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
            {t("Notes")}:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? t("Saving...") : t("Create Inventory Item")}
        </button>
      </form>

      {loading ? (
        <Loading
          text={t("Loading inventory items...")}
          className="status-text"
        />
      ) : items.length === 0 ? (
        <p className="empty-text">{t("No inventory items found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Name")}</th>
              <th>{t("Category")}</th>
              <th>{t("Unit")}</th>
              <th>{t("Current Quantity")}</th>
              <th>{t("Minimum Quantity")}</th>
              <th>{t("Unit Cost")}</th>
              <th>{t("Stock Status")}</th>
              <th>{t("Notes")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{tv(item.category) || "-"}</td>
                <td>{item.unit}</td>
                <td>{item.current_quantity}</td>
                <td>{item.minimum_quantity}</td>
                <td>{item.unit_cost ?? "-"}</td>
                <td>
                  {Number(item.current_quantity) <=
                  Number(item.minimum_quantity)
                    ? t("Low stock")
                    : "-"}
                </td>
                <td>{item.notes || "-"}</td>
                <td>
                  <ButtonLink
                    to={`/inventory/items/${item.id}`}
                    variant="secondary"
                  >
                    {t("View")}
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
