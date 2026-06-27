import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInventoryItems } from "../api/inventoryApi";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { tBusiness as t } from "../i18n";

function InventoryDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeItems = items.filter((item) => item.is_active === true);
  const lowStockItems = activeItems.filter(
    (item) => Number(item.current_quantity) <= Number(item.minimum_quantity)
  );
  const totalStockQuantity = activeItems.reduce(
    (total, item) => total + Number(item.current_quantity || 0),
    0
  );

  useEffect(() => {
    async function loadInventorySummary() {
      try {
        const data = await getInventoryItems();
        setItems(data);
      } catch {
        setError(t("Error: Failed to load inventory summary"));
      } finally {
        setLoading(false);
      }
    }

    loadInventorySummary();
  }, []);

  if (loading) {
    return (
      <Loading
        text={t("Loading inventory summary...")}
        className="status-text"
      />
    );
  }

  if (error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t("Inventory")}
        subtitle={t("Inventory summary and low stock overview")}
      />

      <div className="dashboard-kpi-grid">
        <KpiCard title={t("Total Active Items")} value={activeItems.length} />
        <KpiCard title={t("Total Stock Quantity")} value={totalStockQuantity} />
        <KpiCard title={t("Low Stock Items")} value={lowStockItems.length} />
      </div>

      <div className="dashboard-links">
        <Link to="/inventory/items">{t("View Inventory Items")}</Link>
        {" | "}
        <Link to="/inventory/movements">{t("View Inventory Movements")}</Link>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>{t("Low Stock Items")}</h2>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="empty-text">{t("No low stock items.")}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("ID")}</th>
                <th>{t("Name")}</th>
                <th>{t("Current Quantity")}</th>
                <th>{t("Minimum Quantity")}</th>
                <th>{t("Unit")}</th>
              </tr>
            </thead>

            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.current_quantity}</td>
                  <td>{item.minimum_quantity}</td>
                  <td>{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default InventoryDashboard;
