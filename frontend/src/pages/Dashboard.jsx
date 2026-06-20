import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import { getDashboardStats } from "../api/dashboardApi";
import { getAlarms } from "../api/alarmApi";

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getTodayText();
  const openAlarms = alarms.filter((alarm) => !alarm.is_completed);
  const upcomingAlarms = openAlarms.filter(
    (alarm) => alarm.due_date >= today
  );
  const overdueAlarms = openAlarms.filter((alarm) => alarm.due_date < today);

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const [dashboardData, alarmData] = await Promise.all([
          getDashboardStats(),
          getAlarms(),
        ]);
        setStats(dashboardData);
        setAlarms(alarmData);
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
        <KpiCard
          title="Active Withdrawal Locks"
          value={stats.active_withdrawal_locks}
        />
        <KpiCard
          title="Expiring Today"
          value={stats.withdrawal_locks_expiring_today}
        />
        <KpiCard
          title="Overdue Locks"
          value={stats.overdue_withdrawal_locks}
        />
      </div>

      <div className="dashboard-links">
        <Link to="/animals">Animals</Link>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Alarm Summary</h2>
          <p>Open, upcoming, and overdue manual alarms</p>
        </div>

        <div className="dashboard-kpi-grid">
          <KpiCard title="Total Open Alarms" value={openAlarms.length} />
          <KpiCard title="Upcoming Alarms" value={upcomingAlarms.length} />
          <KpiCard title="Overdue Alarms" value={overdueAlarms.length} />
        </div>

        <div className="dashboard-links">
          <Link to="/alarms">View Alarms</Link>
        </div>
      </section>

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
