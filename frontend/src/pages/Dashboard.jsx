import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import {
  getDashboardStats,
  downloadReportCsv,
  getReportDetails,
  getReportSummary,
} from "../api/dashboardApi";
import { getAlarms } from "../api/alarmApi";
import { useAuth } from "../context/authContext";

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPresetDates(days) {
  const endDate = new Date();
  const startDate = new Date();

  if (days === "month") {
    startDate.setDate(1);
  } else {
    startDate.setDate(startDate.getDate() - (days - 1));
  }

  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate),
  };
}

function Dashboard() {
  const { user } = useAuth();
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
  const canViewVeterinaryData =
    user?.role === "admin" || user?.role === "veterinarian";

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        if (user?.role === "worker") {
          setStats(await getDashboardStats());
        } else {
          const requests = [
            getAlarms(),
            getReportSummary(),
            getReportDetails(),
          ];
          if (user?.role === "admin") {
            requests.unshift(getDashboardStats());
          }
          const results = await Promise.all(requests);
          const offset = user?.role === "admin" ? 1 : 0;
          if (user?.role === "admin") {
            setStats(results[0]);
          }
          setAlarms(results[offset]);
          setReportSummary(results[offset + 1]);
          setReportDetails(results[offset + 2]);
        }
      } catch {
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardStats();
  }, [user?.role]);

  async function loadReportData(startDate, endDate) {
    setReportLoading(true);
    setReportError("");

    try {
      const [summaryData, detailData] = await Promise.all([
        getReportSummary(startDate, endDate),
        getReportDetails(startDate, endDate),
      ]);
      setReportSummary(summaryData);
      setReportDetails(detailData);
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  }

  async function handleApplyFilters(event) {
    event.preventDefault();
    await loadReportData(reportStartDate, reportEndDate);
  }

  async function handleClearFilters() {
    setReportStartDate("");
    setReportEndDate("");
    await loadReportData("", "");
  }

  async function handlePreset(days) {
    const { startDate, endDate } = getPresetDates(days);
    setReportStartDate(startDate);
    setReportEndDate(endDate);
    await loadReportData(startDate, endDate);
  }

  async function handleExport(path, filename, useDateRange = true) {
    setReportError("");
    try {
      await downloadReportCsv(
        path,
        filename,
        useDateRange ? appliedStartDate : "",
        useDateRange ? appliedEndDate : ""
      );
    } catch (err) {
      setReportError(err.message);
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

      {stats && (
        <>
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

        </>
      )}

      {stats && canViewVeterinaryData && (
        <>
      {stats && canViewVeterinaryData && (
        <>
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
        </>
      )}

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

        </>
      )}

      {canViewVeterinaryData && (
        <>
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
            <h2>Reports</h2>
            <p>Review and export farm records by date range</p>
          </div>
        </div>

        <form className="dashboard-export-filters" onSubmit={handleApplyFilters}>
          <div className="report-filter-presets">
            <button
              className="secondary-button"
              type="button"
              onClick={() => handlePreset(1)}
            >
              Today
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => handlePreset(7)}
            >
              Last 7 Days
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => handlePreset(30)}
            >
              Last 30 Days
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => handlePreset("month")}
            >
              This Month
            </button>
          </div>
          <label>
            Start Date
            <input
              type="date"
              value={reportStartDate}
              onChange={(event) => setReportStartDate(event.target.value)}
            />
          </label>
          <label>
            End Date
            <input
              type="date"
              value={reportEndDate}
              onChange={(event) => setReportEndDate(event.target.value)}
            />
          </label>
          <div className="report-filter-actions">
            <button className="primary-button" type="submit">
              Apply Filters
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        </form>

        {reportError && <ErrorMessage message={reportError} className="error-text" />}

        {reportLoading ? (
          <Loading text="Loading reports..." className="status-text" />
        ) : reportSummary && reportDetails ? (
          <>
            <div className="report-section-header">
              <h3>Reporting Summary</h3>
              <p>Key totals for the applied date range.</p>
            </div>
            <div className="dashboard-kpi-grid report-kpi-grid">
              <KpiCard
                title="Total Milk"
                value={reportSummary.total_milk_liters}
              />
              <KpiCard
                title="Average Daily Milk"
                value={reportSummary.average_daily_milk}
              />
              <KpiCard
                title="Total Health Records"
                value={reportSummary.total_health_records}
              />
              <KpiCard
                title="Active Withdrawal Locks"
                value={reportSummary.active_withdrawal_locks}
              />
              <KpiCard title="Open Alarms" value={reportSummary.open_alarms} />
            </div>

            <div className="report-detail-section">
              <div className="report-section-header">
                <h3>CSV Export</h3>
                <p>Downloads use the applied date filters.</p>
              </div>

              <div className="dashboard-export-links">
          <button
            type="button"
            className="dashboard-nav-link"
            onClick={() =>
              handleExport("animals/export.csv", "animals_export.csv", false)
            }
          >
            Export Animals CSV
          </button>
          <button
            type="button"
            className="dashboard-nav-link"
            onClick={() =>
              handleExport(
                "health-records/export.csv",
                "health_records_export.csv"
              )
            }
          >
            Export Health Records CSV
          </button>
          <button
            type="button"
            className="dashboard-nav-link"
            onClick={() =>
              handleExport(
                "withdrawal-locks/export.csv",
                "withdrawal_locks_export.csv"
              )
            }
          >
            Export Withdrawal Locks CSV
          </button>
          <button
            type="button"
            className="dashboard-nav-link"
            onClick={() =>
              handleExport(
                "milk-records/export.csv",
                "milk_records_export.csv"
              )
            }
          >
            Export Milk Records CSV
          </button>
              </div>
            </div>

            <div className="report-detail-section">
              <div className="report-section-header"><h3>Milk Report</h3><p>Milk production records in the selected date range.</p></div>
              {reportDetails.milk_records.length === 0 ? <p className="empty-text">No milk records found.</p> : (
                <div className="dashboard-records-table"><table className="data-table">
                  <thead><tr><th>Animal ID</th><th>Date</th><th>Liters</th><th>Session</th></tr></thead>
                  <tbody>{reportDetails.milk_records.map((record) => <tr key={record.id}><td>{record.animal_id}</td><td>{record.record_date}</td><td>{record.milk_liters}</td><td>{record.session || "-"}</td></tr>)}</tbody>
                </table></div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-header"><h3>Health Report</h3><p>Health activity in the selected date range.</p></div>
              {reportDetails.health_records.length === 0 ? <p className="empty-text">No health records found.</p> : (
                <div className="dashboard-records-table"><table className="data-table">
                  <thead><tr><th>Animal ID</th><th>Record Type</th><th>Date</th><th>Diagnosis</th></tr></thead>
                  <tbody>{reportDetails.health_records.map((record) => <tr key={record.id}><td>{record.animal_id}</td><td>{record.record_type}</td><td>{record.record_date}</td><td>{record.diagnosis || "-"}</td></tr>)}</tbody>
                </table></div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-header"><h3>Finance Report</h3><p>Active income and expense records.</p></div>
              {reportDetails.financial_records.length === 0 ? <p className="empty-text">No finance records found.</p> : (
                <div className="dashboard-records-table"><table className="data-table">
                  <thead><tr><th>Type</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>{reportDetails.financial_records.map((record) => <tr key={record.id}><td>{record.record_type}</td><td>{record.category}</td><td>{record.amount}</td><td>{record.record_date}</td></tr>)}</tbody>
                </table></div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-header"><h3>Withdrawal Lock Report</h3><p>Withdrawal periods by lock start date.</p></div>
              {reportDetails.withdrawal_locks.length === 0 ? <p className="empty-text">No withdrawal locks found.</p> : (
                <div className="dashboard-records-table"><table className="data-table">
                  <thead><tr><th>Animal ID</th><th>Start Date</th><th>End Date</th><th>Status</th></tr></thead>
                  <tbody>{reportDetails.withdrawal_locks.map((lock) => <tr key={lock.id}><td>{lock.animal_id}</td><td>{lock.start_date}</td><td>{lock.end_date}</td><td>{!lock.is_active ? "Released" : lock.end_date < today ? "Expired" : "Active"}</td></tr>)}</tbody>
                </table></div>
              )}
            </div>

            <div className="report-detail-section">
              <div className="report-section-header"><h3>Alarm Report</h3><p>Alarms by due date.</p></div>
              {reportDetails.alarms.length === 0 ? <p className="empty-text">No alarms found.</p> : (
                <div className="dashboard-records-table"><table className="data-table">
                  <thead><tr><th>Title</th><th>Priority</th><th>Due Date</th><th>Status</th></tr></thead>
                  <tbody>{reportDetails.alarms.map((alarm) => <tr key={alarm.id}><td>{alarm.title}</td><td>{alarm.priority}</td><td>{alarm.due_date}</td><td>{alarm.is_completed ? "Completed" : "Open"}</td></tr>)}</tbody>
                </table></div>
              )}
            </div>
          </>
        ) : null}
      </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
