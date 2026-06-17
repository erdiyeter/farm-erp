import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import { getDashboardStats } from "../api/dashboardApi";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  if (loading) {
    return <Loading text="Loading dashboard..." className="status-text" />;
  }

  if (error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Farm ERP Dashboard</h1>
        <p>Manage your farm modules from one central place.</p>
      </div>

      <div className="dashboard-kpi-grid">
        <KpiCard title="Total Animals" value={stats.total_animals} />
        <KpiCard title="Today Milk Liters" value={stats.today_milk_liters} />
        <KpiCard
          title="Last 7 Days Milk Liters"
          value={stats.last_7_days_milk_liters}
        />
      </div>

      <div className="dashboard-links">
        <Link to="/animals">Animals</Link>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Recent Records</h2>
          <p>Latest milk production entries</p>
        </div>

        {stats.recent_records.length === 0 ? (
          <p className="empty-text">No recent records yet.</p>
        ) : (
          <div className="dashboard-records-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Animal ID</th>
                  <th>Date</th>
                  <th>Milk Liters</th>
                  <th>Session</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {stats.recent_records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>
                    <td>{record.animal_id}</td>
                    <td>{record.record_date}</td>
                    <td>{record.milk_liters}</td>
                    <td>{record.session || "-"}</td>
                    <td>{record.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
