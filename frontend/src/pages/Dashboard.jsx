import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import {
  getDashboardStats,
  getReportDetails,
  getReportSummary,
} from "../api/dashboardApi";
import { getAlarms } from "../api/alarmApi";

const REPORT_API_BASE_URL = "http://127.0.0.1:8000/api/v1/reports";

function getDatedExportUrl(path, startDate, endDate) {
  const query = new URLSearchParams();

  if (startDate) {
    query.set("start_date", startDate);
  }
  if (endDate) {
    query.set("end_date", endDate);
  }

  const queryString = query.toString();
  return `${REPORT_API_BASE_URL}/${path}${queryString ? `?${queryString}` : ""}`;
}

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [reportSummary, setReportSummary] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const today = getTodayText();
  const openAlarms = alarms.filter((alarm) => !alarm.is_completed);
  const upcomingAlarms = openAlarms.filter(
    (alarm) => alarm.due_date >= today
  );
  const overdueAlarms = openAlarms.filter((alarm) => alarm.due_date < today);

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const [dashboardData, alarmData, summaryData, detailData] =
          await Promise.all([
          getDashboardStats(),
          getAlarms(),
          getReportSummary(),
          getReportDetails(),
        ]);
        setStats(dashboardData);
        setAlarms(alarmData);
        setReportSummary(summaryData);
        setReportDetails(detailData);
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, []);

  async function handleApplyFilters(event) {
    event.preventDefault();
    setReportLoading(true);
    setReportError("");

    try {
      const [summaryData, detailData] = await Promise.all([
        getReportSummary(reportStartDate, reportEndDate),
        getReportDetails(reportStartDate, reportEndDate),
      ]);
      setReportSummary(summaryData);
      setReportDetails(detailData);
      setAppliedStartDate(reportStartDate);
      setAppliedEndDate(reportEndDate);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  async function handleClearFilters() {
    setReportStartDate("");
    setReportEndDate("");
    setReportLoading(true);
    setReportError("");

    try {
      const [summaryData, detailData] = await Promise.all([
        getReportSummary(),
        getReportDetails(),
      ]);
      setReportSummary(summaryData);
      setReportDetails(detailData);
      setAppliedStartDate("");
      setAppliedEndDate("");
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

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

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Animals</h2>
            <p>Current animal count</p>
          </div>
          <Link className="dashboard-nav-link" to="/animals">
            View Animals
          </Link>
        </div>

        <div className="dashboard-kpi-grid">
          <KpiCard title="Total Animals" value={stats.total_animals} />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Milk Production</h2>
            <p>Current milk production totals and recent entries</p>
          </div>
          <Link className="dashboard-nav-link" to="/milk-records">
            View Milk Records
          </Link>
        </div>

        <div className="dashboard-kpi-grid">
          <KpiCard
            title="Today Milk Liters"
            value={stats.today_milk_liters}
          />
          <KpiCard
            title="Last 7 Days Milk Liters"
            value={stats.last_7_days_milk_liters}
          />
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

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Health Records</h2>
            <p>Recent health records and active withdrawal periods</p>
          </div>
          <Link className="dashboard-nav-link" to="/health-records">
            View Health Records
          </Link>
        </div>

        <div className="dashboard-kpi-grid">
          <KpiCard
            title="Total Health Records"
            value={stats.total_health_records}
          />
          <KpiCard
            title="Today Health Records"
            value={stats.today_health_records}
          />
          <KpiCard
            title="Last 7 Days Health Records"
            value={stats.last_7_days_health_records}
          />
          <KpiCard
            title="Active Withdrawal Health Records"
            value={stats.active_withdrawal_health_records}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Withdrawal Locks</h2>
            <p>Active, expiring, and overdue withdrawal periods</p>
          </div>
          <Link className="dashboard-nav-link" to="/withdrawal-locks">
            View Withdrawal Locks
          </Link>
        </div>

        <div className="dashboard-kpi-grid">
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
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Alarms</h2>
            <p>Open, upcoming, and overdue manual alarms</p>
          </div>
          <Link className="dashboard-nav-link" to="/alarms">
            View Alarms
          </Link>
        </div>

        <div className="dashboard-kpi-grid">
          <KpiCard title="Total Open Alarms" value={openAlarms.length} />
          <KpiCard title="Upcoming Alarms" value={upcomingAlarms.length} />
          <KpiCard title="Overdue Alarms" value={overdueAlarms.length} />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>CSV Export</h2>
            <p>Download simple report data from existing records</p>
          </div>
        </div>

        <div className="dashboard-export-filters">
          <label>
            Start date
            <input
              type="date"
              value={reportStartDate}
              onChange={(event) => setReportStartDate(event.target.value)}
            />
          </label>
          <label>
            End date
            <input
              type="date"
              value={reportEndDate}
              onChange={(event) => setReportEndDate(event.target.value)}
            />
          </label>
        </div>

        <div className="dashboard-export-links">
          <a
            className="dashboard-nav-link"
            href={`${REPORT_API_BASE_URL}/animals/export.csv`}
            download="animals_export.csv"
          >
            Export Animals CSV
          </a>
          <a
            className="dashboard-nav-link"
            href={getDatedExportUrl(
              "health-records/export.csv",
              reportStartDate,
              reportEndDate
            )}
            download="health_records_export.csv"
          >
            Export Health Records CSV
          </a>
          <a
            className="dashboard-nav-link"
            href={getDatedExportUrl(
              "withdrawal-locks/export.csv",
              reportStartDate,
              reportEndDate
            )}
            download="withdrawal_locks_export.csv"
          >
            Export Withdrawal Locks CSV
          </a>
          <a
            className="dashboard-nav-link"
            href={getDatedExportUrl(
              "milk-records/export.csv",
              reportStartDate,
              reportEndDate
            )}
            download="milk_records_export.csv"
          >
            Export Milk Records CSV
          </a>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
