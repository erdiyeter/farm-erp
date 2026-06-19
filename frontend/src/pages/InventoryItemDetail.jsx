import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  deactivateInventoryItem,
  getInventoryItemById,
} from "../api/inventoryApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

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
        setError("Error: Failed to load inventory item");
      } finally {
        setLoading(false);
      }
    }

    loadInventoryItem();
  }, [id]);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this inventory item?"
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
      setSuccessMessage("Inventory item deactivated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setDeactivating(false);
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

  if (!item && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Inventory Item Detail</h1>

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <p>
        <strong>ID:</strong> {item.id}
      </p>

      <p>
        <strong>Name:</strong> {item.name}
      </p>

      <p>
        <strong>Category:</strong> {item.category || "-"}
      </p>

      <p>
        <strong>Unit:</strong> {item.unit}
      </p>

      <p>
        <strong>Current Quantity:</strong> {item.current_quantity}
      </p>

      <p>
        <strong>Minimum Quantity:</strong> {item.minimum_quantity}
      </p>

      <p>
        <strong>Notes:</strong> {item.notes || "-"}
      </p>

      <p>
        <strong>Is Active:</strong> {item.is_active ? "Yes" : "No"}
      </p>

      <p>
        <strong>Created At:</strong> {item.created_at || "-"}
      </p>

      <p>
        <strong>Updated At:</strong> {item.updated_at || "-"}
      </p>

      <ButtonLink to="/inventory/items" variant="secondary">
        Back to Inventory Items
      </ButtonLink>

      <ButtonLink to={`/inventory/items/${item.id}/edit`} variant="secondary">
        Edit
      </ButtonLink>

      {item.is_active === true && (
        <button onClick={handleDeactivate} disabled={deactivating}>
          {deactivating ? "Deactivating..." : "Deactivate"}
        </button>
      )}

      {successMessage && (
        <p>
          <Link to="/inventory/items">Return to Inventory Items</Link>
        </p>
      )}
    </div>
  );
}

export default InventoryItemDetail;
