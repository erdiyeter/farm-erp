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

function addDays(dateText, days) {
  const date = new Date(`${dateText}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sortNewest(records, dateField) {
  return [...records].sort(
    (first, second) =>
      second[dateField].localeCompare(first[dateField]) ||
      second.id - first.id
  );
}

function getAnimalsNeedingAttention(locks, today, upcomingEnd) {
  const byAnimal = new Map();
  const candidates = locks
    .filter(
      (lock) => lock.is_active && lock.end_date <= upcomingEnd
    )
    .map((lock) => ({
      animalId: lock.animal_id,
      dueDate: lock.end_date,
      reason: lock.reason || "Withdrawal lock",
      priority: lock.end_date < today ? "Overdue" : "Due soon",
      rank: lock.end_date < today ? 0 : 1,
    }))
    .sort(
      (first, second) =>
        first.rank - second.rank ||
        first.dueDate.localeCompare(second.dueDate)
    );

  candidates.forEach((item) => {
    if (!byAnimal.has(item.animalId)) {
      byAnimal.set(item.animalId, item);
    }
  });

  return [...byAnimal.values()].slice(0, 5);
}

function getMilkTrend(records) {
  const totalsByDate = new Map();
  records.forEach((record) => {
    totalsByDate.set(
      record.record_date,
      (totalsByDate.get(record.record_date) || 0) +
        Number(record.milk_liters)
    );
  });
  const dates = [...totalsByDate.keys()].sort().reverse();

  if (dates.length < 2) {
    return {
      value: "Not enough data",
      detail: "Two production days are needed for comparison.",
    };
  }

  const difference = totalsByDate.get(dates[0]) - totalsByDate.get(dates[1]);
  return {
    value: `${difference > 0 ? "+" : ""}${difference.toFixed(2)} L`,
    detail: `${dates[0]} compared with ${dates[1]}`,
  };
}

function formatReportValue(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ReportSection({ title, description, records, emptyMessage, children }) {
  return (
    <div className="report-detail-section">
      <div className="report-section-header report-section-header-row">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="report-record-count">
          {records.length} {records.length === 1 ? "record" : "records"}
        </span>
      </div>
      {records.length === 0 ? (
        <p className="empty-text">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
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
  const upcomingEnd = addDays(today, 6);
  const openAlarms = alarms.filter((alarm) => !alarm.is_completed);
  const upcomingAlarms = openAlarms.filter(
    (alarm) => alarm.due_date >= today
  );
  const overdueAlarms = openAlarms.filter((alarm) => alarm.due_date < today);
  const canViewVeterinaryData =
    user?.role === "admin" || user?.role === "veterinarian";
  const withdrawalLocks = reportDetails?.withdrawal_locks || [];
  const animalsNeedingAttention = getAnimalsNeedingAttention(
    withdrawalLocks,
    today,
    upcomingEnd
  );
  const upcomingWithdrawals = withdrawalLocks
    .filter(
      (lock) =>
        lock.is_active &&
        lock.end_date >= today &&
        lock.end_date <= upcomingEnd
    )
    .sort((first, second) => first.end_date.localeCompare(second.end_date))
    .slice(0, 5);
  const prioritizedOverdueAlarms = [...overdueAlarms]
    .sort((first, second) => first.due_date.localeCompare(second.due_date))
    .slice(0, 5);
  const recentHealthActivity = sortNewest(
    reportDetails?.health_records || [],
    "record_date"
  ).slice(0, 5);
  const recentMilkActivity = stats?.recent_records ||
    sortNewest(reportDetails?.milk_records || [], "record_date").slice(0, 5);
  const reportMilkRecords = sortNewest(
    reportDetails?.milk_records || [],
    "record_date"
  );
  const reportHealthRecords = sortNewest(
    reportDetails?.health_records || [],
    "record_date"
  );
  const reportFinancialRecords = sortNewest(
    reportDetails?.financial_records || [],
    "record_date"
  );
  const reportWithdrawalLocks = sortNewest(
    reportDetails?.withdrawal_locks || [],
    "start_date"
  );
  const reportAlarms = sortNewest(
    reportDetails?.alarms || [],
    "due_date"
  );
  const milkTrend = getMilkTrend(reportMilkRecords);
  const reportPeriod = appliedStartDate && appliedEndDate
    ? `${appliedStartDate} to ${appliedEndDate}`
    : appliedStartDate
      ? `from ${appliedStartDate}`
      : appliedEndDate
        ? `through ${appliedEndDate}`
        : "all available dates";
  const emptyReportMessage = (recordType) =>
    `No ${recordType} found for ${reportPeriod}. Adjust or clear the filters.`;

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
        <h1>Farm Operations Cockpit</h1>
        <p>Prioritized daily activity and records requiring attention.</p>
      </div>

      <div className="dashboard-cockpit-grid">
        {canViewVeterinaryData && reportDetails && (
          <section className="dashboard-section dashboard-cockpit-wide">
            <div className="dashboard-section-header">
              <div>
                <h2>Animals Needing Attention</h2>
                <p>Overdue or soon-expiring withdrawal locks</p>
              </div>
              <Link className="dashboard-nav-link" to="/animals">
                View Animals
              </Link>
            </div>

            {animalsNeedingAttention.length === 0 ? (
              <p className="empty-text">No animals need immediate attention.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Animal ID</th>
                      <th>Reason</th>
                      <th>Due Date</th>
                      <th>Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animalsNeedingAttention.map((item) => (
                      <tr key={item.animalId}>
                        <td>{item.priority}</td>
                        <td>{item.animalId}</td>
                        <td>{item.reason}</td>
                        <td>{item.dueDate}</td>
                        <td>
                          <Link to={`/animals/${item.animalId}`}>View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {canViewVeterinaryData && reportDetails && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Upcoming Withdrawal Expirations</h2>
                <p>Active locks ending within seven days</p>
              </div>
            </div>

            {upcomingWithdrawals.length === 0 ? (
              <p className="empty-text">No upcoming withdrawal expirations.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>End Date</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingWithdrawals.map((lock) => (
                      <tr key={lock.id}>
                        <td>
                          <Link to={`/animals/${lock.animal_id}`}>
                            {lock.animal_id}
                          </Link>
                        </td>
                        <td>{lock.end_date}</td>
                        <td>{lock.reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {canViewVeterinaryData && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Overdue Alarms</h2>
                <p>Oldest overdue items first</p>
              </div>
              <Link className="dashboard-nav-link" to="/alarms">
                View Alarms
              </Link>
            </div>

            {prioritizedOverdueAlarms.length === 0 ? (
              <p className="empty-text">No overdue alarms.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Alarm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prioritizedOverdueAlarms.map((alarm) => (
                      <tr key={alarm.id}>
                        <td>{alarm.due_date}</td>
                        <td>{alarm.priority}</td>
                        <td>{alarm.title}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {canViewVeterinaryData && reportDetails && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Recent Health Activity</h2>
                <p>Latest health records across the herd</p>
              </div>
            </div>

            {recentHealthActivity.length === 0 ? (
              <p className="empty-text">No recent health activity.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Animal</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHealthActivity.map((record) => (
                      <tr key={record.id}>
                        <td>{record.record_date}</td>
                        <td>
                          <Link to={`/animals/${record.animal_id}`}>
                            {record.animal_id}
                          </Link>
                        </td>
                        <td>{record.record_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {(stats || reportDetails) && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Recent Milk Activity</h2>
                <p>Latest milk records across the herd</p>
              </div>
            </div>

            {recentMilkActivity.length === 0 ? (
              <p className="empty-text">No recent milk activity.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Animal</th>
                      <th>Liters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMilkActivity.map((record) => (
                      <tr key={record.id}>
                        <td>{record.record_date}</td>
                        <td>
                          <Link to={`/animals/${record.animal_id}`}>
                            {record.animal_id}
                          </Link>
                        </td>
                        <td>{record.milk_liters}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
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
                    <td>
                      <Link to={`/animals/${record.animal_id}`}>
                        {record.animal_id}
                      </Link>
                    </td>
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

      <section className="dashboard-section reporting-workspace">
        <div className="dashboard-section-header">
          <div>
            <h2>Operational Reports</h2>
            <p>Review trends, totals, and detailed records by date range.</p>
          </div>
        </div>

        <form className="dashboard-export-filters" onSubmit={handleApplyFilters}>
          <div className="report-filter-presets">
            {[1, 7, 30].map((days) => (
              <button
                className="secondary-button"
                type="button"
                key={days}
                onClick={() => handlePreset(days)}
              >
                {days === 1 ? "Today" : `Last ${days} Days`}
              </button>
            ))}
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

        <p className="report-period-banner">
          <strong>Applied period:</strong> {reportPeriod}
        </p>

        {reportError && (
          <ErrorMessage message={reportError} className="error-text" />
        )}

        {reportLoading ? (
          <Loading text="Loading reports..." className="status-text" />
        ) : reportSummary && reportDetails ? (
          <>
            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Production</h3>
                <p>Milk volume and daily direction for the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Total Milk Liters"
                  value={formatReportValue(reportSummary.total_milk_liters)}
                />
                <KpiCard
                  title="Average Daily Milk"
                  value={formatReportValue(reportSummary.average_daily_milk)}
                />
                <KpiCard
                  title="Milk Records"
                  value={reportSummary.total_milk_records}
                />
                <div className="dashboard-kpi-card report-trend-card">
                  <h2>Latest Daily Milk Trend</h2>
                  <p>{milkTrend.value}</p>
                  <small>{milkTrend.detail}</small>
                </div>
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Operations</h3>
                <p>Herd activity requiring regular review.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Total Animals"
                  value={reportSummary.total_animals}
                />
                <KpiCard
                  title="Health Records"
                  value={reportSummary.total_health_records}
                />
                <KpiCard
                  title="Active Withdrawal Locks"
                  value={reportSummary.active_withdrawal_locks}
                />
                <KpiCard
                  title="Open Alarms"
                  value={reportSummary.open_alarms}
                />
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Finance</h3>
                <p>Income, expense, and net amount for the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Total Income"
                  value={formatReportValue(reportSummary.total_income)}
                />
                <KpiCard
                  title="Total Expense"
                  value={formatReportValue(reportSummary.total_expense)}
                />
                <KpiCard
                  title="Net Amount"
                  value={formatReportValue(
                    reportSummary.total_income - reportSummary.total_expense
                  )}
                />
              </div>
            </div>

            <div className="report-detail-section report-export-section">
              <div className="report-section-header">
                <h3>CSV Export</h3>
                <p>Date-based exports use the applied period shown above.</p>
              </div>
              <div className="dashboard-export-links">
                <button
                  type="button"
                  className="dashboard-nav-link"
                  onClick={() =>
                    handleExport(
                      "animals/export.csv",
                      "animals_export.csv",
                      false
                    )
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

            <ReportSection
              title="Milk Report"
              description="Production records, newest first."
              records={reportMilkRecords}
              emptyMessage={emptyReportMessage("milk records")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Date</th><th>Animal</th><th>Liters</th><th>Session</th></tr></thead>
                  <tbody>{reportMilkRecords.map((record) => <tr key={record.id}><td>{record.record_date}</td><td>{record.animal_id}</td><td>{record.milk_liters}</td><td>{record.session || "-"}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection
              title="Health Report"
              description="Health activity, newest first."
              records={reportHealthRecords}
              emptyMessage={emptyReportMessage("health records")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Date</th><th>Animal</th><th>Type</th><th>Diagnosis</th></tr></thead>
                  <tbody>{reportHealthRecords.map((record) => <tr key={record.id}><td>{record.record_date}</td><td>{record.animal_id}</td><td>{record.record_type}</td><td>{record.diagnosis || "-"}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection
              title="Finance Report"
              description="Active income and expense records, newest first."
              records={reportFinancialRecords}
              emptyMessage={emptyReportMessage("finance records")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Amount</th></tr></thead>
                  <tbody>{reportFinancialRecords.map((record) => <tr key={record.id}><td>{record.record_date}</td><td>{record.record_type}</td><td>{record.category}</td><td>{record.amount}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection
              title="Withdrawal Lock Report"
              description="Withdrawal periods by start date, newest first."
              records={reportWithdrawalLocks}
              emptyMessage={emptyReportMessage("withdrawal locks")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Start Date</th><th>Animal</th><th>End Date</th><th>Status</th></tr></thead>
                  <tbody>{reportWithdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td>{lock.animal_id}</td><td>{lock.end_date}</td><td>{!lock.is_active ? "Released" : lock.end_date < today ? "Expired" : "Active"}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection
              title="Alarm Report"
              description="Alarms by due date, newest first."
              records={reportAlarms}
              emptyMessage={emptyReportMessage("alarms")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Due Date</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead>
                  <tbody>{reportAlarms.map((alarm) => <tr key={alarm.id}><td>{alarm.due_date}</td><td>{alarm.title}</td><td>{alarm.priority}</td><td>{alarm.is_completed ? "Completed" : "Open"}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>
          </>
        ) : (
          <p className="empty-text">Report data is not available.</p>
        )}
      </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
