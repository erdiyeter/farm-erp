import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInventoryItems } from "../api/inventoryApi";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

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
        setError("Error: Failed to load inventory summary");
      } finally {
        setLoading(false);
      }
    }

    loadInventorySummary();
  }, []);

  if (loading) {
    return (
      <Loading
        text="Loading inventory summary..."
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
        title="Inventory"
        subtitle="Inventory summary and low stock overview"
      />

      <div className="dashboard-kpi-grid">
        <KpiCard title="Total Active Items" value={activeItems.length} />
        <KpiCard title="Total Stock Quantity" value={totalStockQuantity} />
        <KpiCard title="Low Stock Items" value={lowStockItems.length} />
      </div>

      <div className="dashboard-links">
        <Link to="/inventory/items">View Inventory Items</Link>
        {" | "}
        <Link to="/inventory/movements">View Inventory Movements</Link>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Low Stock Items</h2>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="empty-text">No low stock items.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Current Quantity</th>
                <th>Minimum Quantity</th>
                <th>Unit</th>
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
