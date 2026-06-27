import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  deactivateInventoryItem,
  getInventoryItemById,
} from "../api/inventoryApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { tBusiness as t } from "../i18n";

function InventoryItemDetail() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadInventoryItem() {
      try {
        const data = await getInventoryItemById(id);
        setItem(data);
      } catch {
        setError(t("Error: Failed to load inventory item"));
      } finally {
        setLoading(false);
      }
    }

    loadInventoryItem();
  }, [id]);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      t("Are you sure you want to deactivate this inventory item?")
    );

    if (!confirmed) {
      return;
    }

    setDeactivating(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await deactivateInventoryItem(id);
      setItem(data);
      setSuccessMessage(t("Inventory item deactivated successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text={t("Loading inventory item...")}
        className="status-text"
      />
    );
  }

  if (!item && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Inventory Item Detail")}</h1>

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <p>
        <strong>{t("ID")}:</strong> {item.id}
      </p>

      <p>
        <strong>{t("Name")}:</strong> {item.name}
      </p>

      <p>
        <strong>{t("Category")}:</strong> {item.category || "-"}
      </p>

      <p>
        <strong>{t("Unit")}:</strong> {item.unit}
      </p>

      <p>
        <strong>{t("Current Quantity")}:</strong> {item.current_quantity}
      </p>

      <p>
        <strong>{t("Minimum Quantity")}:</strong> {item.minimum_quantity}
      </p>

      <p>
        <strong>{t("Unit Cost")}:</strong> {item.unit_cost ?? "-"}
      </p>

      <p>
        <strong>{t("Notes")}:</strong> {item.notes || "-"}
      </p>

      <p>
        <strong>{t("Is Active")}:</strong> {item.is_active ? t("Yes") : t("No")}
      </p>

      <p>
        <strong>{t("Created At")}:</strong> {item.created_at || "-"}
      </p>

      <p>
        <strong>{t("Updated At")}:</strong> {item.updated_at || "-"}
      </p>

      <ButtonLink to="/inventory/items" variant="secondary">
        {t("Back to Inventory Items")}
      </ButtonLink>

      <ButtonLink to={`/inventory/items/${item.id}/edit`} variant="secondary">
        {t("Edit")}
      </ButtonLink>

      {item.is_active === true && (
        <button onClick={handleDeactivate} disabled={deactivating}>
          {deactivating ? t("Deactivating...") : t("Deactivate")}
        </button>
      )}

      {successMessage && (
        <p>
          <Link to="/inventory/items">{t("Return to Inventory Items")}</Link>
        </p>
      )}
    </div>
  );
}

export default InventoryItemDetail;
