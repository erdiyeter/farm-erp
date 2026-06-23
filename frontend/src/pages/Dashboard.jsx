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
import { getAlarms, updateAlarm } from "../api/alarmApi";
import { getInventoryItems } from "../api/inventoryApi";
import { getReproductionEvents } from "../api/reproductionEventApi";
import { getVaccinations } from "../api/vaccinationApi";
import { getWeightRecords } from "../api/weightRecordApi";
import { updateWithdrawalLock } from "../api/withdrawalLockApi";
import { useAuth } from "../context/authContext";
import useAnimals from "../hooks/useAnimals";

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

function getWithdrawalRisks(locks, today, upcomingEnd) {
  return locks
    .filter(
      (lock) => lock.is_active && lock.end_date <= upcomingEnd
    )
    .map((lock) => ({
      lockId: lock.id,
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
    )
    .slice(0, 5);
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

function getPerAnimalBreakdown(milkRecords, healthRecords, withdrawalLocks) {
  const breakdownByAnimal = new Map();

  function getAnimalBreakdown(animalId) {
    if (!breakdownByAnimal.has(animalId)) {
      breakdownByAnimal.set(animalId, {
        animalId,
        milkLiters: 0,
        milkRecords: 0,
        productionDates: new Set(),
        healthEvents: 0,
        withdrawalLocks: 0,
      });
    }
    return breakdownByAnimal.get(animalId);
  }

  milkRecords.forEach((record) => {
    const breakdown = getAnimalBreakdown(record.animal_id);
    breakdown.milkLiters += Number(record.milk_liters);
    breakdown.milkRecords += 1;
    breakdown.productionDates.add(record.record_date);
  });
  healthRecords.forEach((record) => {
    getAnimalBreakdown(record.animal_id).healthEvents += 1;
  });
  withdrawalLocks.forEach((lock) => {
    getAnimalBreakdown(lock.animal_id).withdrawalLocks += 1;
  });

  return [...breakdownByAnimal.values()].map((item) => ({
    ...item,
    averageMilkPerRecord: item.milkRecords
      ? item.milkLiters / item.milkRecords
      : 0,
    productionDays: item.productionDates.size,
  })).sort(
    (first, second) =>
      second.milkLiters - first.milkLiters ||
      second.healthEvents - first.healthEvents ||
      second.withdrawalLocks - first.withdrawalLocks ||
      first.animalId - second.animalId
  );
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

function getLatestRecordsByAnimal(records, dateField) {
  const latestByAnimal = new Map();
  sortNewest(records, dateField).forEach((record) => {
    if (!latestByAnimal.has(record.animal_id)) {
      latestByAnimal.set(record.animal_id, record);
    }
  });
  return latestByAnimal;
}

function getAverageDailyGain(records) {
  const recordsByAnimal = new Map();
  records.forEach((record) => {
    const animalRecords = recordsByAnimal.get(record.animal_id) || [];
    animalRecords.push(record);
    recordsByAnimal.set(record.animal_id, animalRecords);
  });

  const gains = [];
  recordsByAnimal.forEach((animalRecords) => {
    const [latest, previous] = sortNewest(animalRecords, "record_date");
    if (!previous) {
      return;
    }
    const days = Math.round(
      (Date.parse(`${latest.record_date}T00:00:00Z`) -
        Date.parse(`${previous.record_date}T00:00:00Z`)) /
        (24 * 60 * 60 * 1000)
    );
    if (days > 0) {
      gains.push(
        (Number(latest.weight_kg) - Number(previous.weight_kg)) / days
      );
    }
  });

  return gains.length
    ? gains.reduce((total, gain) => total + gain, 0) / gains.length
    : null;
}

function Dashboard() {
  const { user } = useAuth();
  const { animals, getAnimalLabel } = useAnimals();
  const [stats, setStats] = useState(null);
  const [alarms, setAlarms] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [reproductionEvents, setReproductionEvents] = useState([]);
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
  const [actionKey, setActionKey] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const today = getTodayText();
  const upcomingEnd = addDays(today, 6);
  const openAlarms = alarms.filter((alarm) => !alarm.is_completed);
  const upcomingAlarms = openAlarms.filter(
    (alarm) => alarm.due_date >= today
  );
  const overdueAlarms = openAlarms.filter((alarm) => alarm.due_date < today);
  const canViewVeterinaryData =
    user?.role === "admin" || user?.role === "veterinarian";
  const canViewInventory =
    user?.role === "admin" || user?.role === "worker";
  const canViewOperations =
    user?.role === "admin" || user?.role === "worker";
  const canViewVaccinations = user?.role === "admin";
  const lowStockItems = inventoryItems
    .filter(
      (item) =>
        item.is_active &&
        Number(item.current_quantity) <= Number(item.minimum_quantity)
    )
    .sort((first, second) => {
      const firstMinimum = Number(first.minimum_quantity);
      const secondMinimum = Number(second.minimum_quantity);
      const firstSeverity = firstMinimum > 0
        ? (firstMinimum - Number(first.current_quantity)) / firstMinimum
        : 0;
      const secondSeverity = secondMinimum > 0
        ? (secondMinimum - Number(second.current_quantity)) / secondMinimum
        : 0;
      return secondSeverity - firstSeverity || first.id - second.id;
    })
    .slice(0, 5);
  const vaccinationRisks = vaccinations
    .filter(
      (vaccination) => vaccination.next_due_date
    )
    .map((vaccination) => ({
      ...vaccination,
      riskStatus: vaccination.next_due_date < today
        ? "Overdue"
        : vaccination.next_due_date === today
          ? "Due today"
          : "Upcoming",
      riskRank: vaccination.next_due_date < today
        ? 0
        : vaccination.next_due_date === today
          ? 1
          : 2,
    }))
    .sort(
      (first, second) =>
        first.riskRank - second.riskRank ||
        first.next_due_date.localeCompare(second.next_due_date)
    )
    .slice(0, 5);
  const withdrawalLocks = reportDetails?.withdrawal_locks || [];
  const withdrawalRisks = getWithdrawalRisks(
    withdrawalLocks,
    today,
    upcomingEnd
  );
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
  const reportWeightRecords = sortNewest(
    reportDetails?.weight_records || [],
    "record_date"
  );
  const reportReproductionEvents = sortNewest(
    reportDetails?.reproduction_events || [],
    "event_date"
  );
  const reportExitedAnimals = sortNewest(
    reportDetails?.exited_animals || [],
    "exit_date"
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
  const activeAnimals = animals;
  const activeAnimalIds = new Set(activeAnimals.map((animal) => animal.id));
  const recentWeightStart = addDays(today, -29);
  const latestWeightsByAnimal = getLatestRecordsByAnimal(
    weightRecords,
    "record_date"
  );
  const animalsWithRecentWeight = activeAnimals.filter((animal) => {
    const latest = latestWeightsByAnimal.get(animal.id);
    return latest && latest.record_date >= recentWeightStart;
  }).length;
  const animalsMissingRecentWeight =
    activeAnimals.length - animalsWithRecentWeight;
  const latestWeightValues = activeAnimals
    .map((animal) => latestWeightsByAnimal.get(animal.id))
    .filter(Boolean)
    .map((record) => Number(record.weight_kg));
  const averageLatestWeight = latestWeightValues.length
    ? latestWeightValues.reduce((total, weight) => total + weight, 0) /
      latestWeightValues.length
    : null;
  const averageDailyGain = getAverageDailyGain(
    weightRecords.filter((record) => activeAnimalIds.has(record.animal_id))
  );
  const recentWeightRecords = sortNewest(
    weightRecords,
    "record_date"
  ).slice(0, 5);
  const sortedReproductionEvents = sortNewest(
    reproductionEvents,
    "event_date"
  );
  const confirmedPregnancies = reproductionEvents.filter(
    (event) =>
      event.event_type === "pregnancy" && event.pregnancy_status === true
  ).length;
  const birthEvents = reproductionEvents.filter(
    (event) => event.event_type === "birth"
  );
  const animalsWithReproductionHistory = new Set(
    reproductionEvents.map((event) => event.animal_id)
  ).size;
  const totalOffspring = birthEvents.reduce(
    (total, event) => total + Number(event.offspring_count || 0),
    0
  );
  const twinBirths = birthEvents.filter(
    (event) => event.is_twin_birth
  ).length;
  const lastBirthDate = sortNewest(birthEvents, "event_date")[0]?.event_date;
  const recentReproductionEvents = sortedReproductionEvents.slice(0, 5);
  const recentWithdrawalLocks = sortNewest(
    withdrawalLocks,
    "start_date"
  ).slice(0, 5);
  const perAnimalBreakdown = getPerAnimalBreakdown(
    reportMilkRecords,
    reportHealthRecords,
    reportWithdrawalLocks
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
          const [statsData, itemData, weightData, reproductionData] = await Promise.all([
            getDashboardStats(),
            getInventoryItems(),
            getWeightRecords(),
            getReproductionEvents(),
          ]);
          setStats(statsData);
          setInventoryItems(itemData);
          setWeightRecords(weightData);
          setReproductionEvents(reproductionData);
        } else if (user?.role === "admin") {
          const [
            statsData,
            alarmData,
            summaryData,
            detailData,
            itemData,
            vaccinationData,
            weightData,
            reproductionData,
          ] = await Promise.all([
            getDashboardStats(),
            getAlarms(),
            getReportSummary(),
            getReportDetails(),
            getInventoryItems(),
            getVaccinations(),
            getWeightRecords(),
            getReproductionEvents(),
          ]);
          setStats(statsData);
          setAlarms(alarmData);
          setReportSummary(summaryData);
          setReportDetails(detailData);
          setInventoryItems(itemData);
          setVaccinations(vaccinationData);
          setWeightRecords(weightData);
          setReproductionEvents(reproductionData);
        } else {
          const [alarmData, summaryData, detailData] = await Promise.all([
            getAlarms(),
            getReportSummary(),
            getReportDetails(),
          ]);
          setAlarms(alarmData);
          setReportSummary(summaryData);
          setReportDetails(detailData);
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

  async function refreshDashboardAfterAction() {
    const requests = [
      getAlarms(),
      getReportSummary(appliedStartDate, appliedEndDate),
      getReportDetails(appliedStartDate, appliedEndDate),
    ];

    if (user?.role === "admin") {
      requests.push(getDashboardStats());
    }

    const [alarmData, summaryData, detailData, statsData] =
      await Promise.all(requests);
    setAlarms(alarmData);
    setReportSummary(summaryData);
    setReportDetails(detailData);
    if (statsData) {
      setStats(statsData);
    }
  }

  async function handleCompleteAlarm(alarm) {
    if (!window.confirm(`Complete alarm "${alarm.title}"?`)) {
      return;
    }

    setActionKey(`alarm-${alarm.id}`);
    setActionError("");
    setActionMessage("");
    try {
      await updateAlarm(alarm.id, { is_completed: true });
      await refreshDashboardAfterAction();
      setActionMessage("Alarm completed successfully.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionKey("");
    }
  }

  async function handleReleaseLock(lockId) {
    if (!window.confirm("Release this withdrawal lock?")) {
      return;
    }

    setActionKey(`lock-${lockId}`);
    setActionError("");
    setActionMessage("");
    try {
      await updateWithdrawalLock(lockId, { is_active: false });
      await refreshDashboardAfterAction();
      setActionMessage("Withdrawal lock released successfully.");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionKey("");
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

      {actionError && (
        <ErrorMessage message={actionError} className="error-text" />
      )}
      {actionMessage && <p className="status-text">{actionMessage}</p>}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Farm Overview</h2>
            <p>Current herd and operational status at a glance</p>
          </div>
          <Link className="dashboard-nav-link" to="/animals">
            View Animals
          </Link>
        </div>
        <div className="dashboard-kpi-grid">
          <KpiCard
            title="Total Active Animals"
            value={stats?.total_animals ?? activeAnimals.length}
          />
          <KpiCard
            title="Active Withdrawal Locks"
            value={
              stats?.active_withdrawal_locks ??
              reportSummary?.active_withdrawal_locks ??
              "-"
            }
          />
          <KpiCard
            title="Open Alarms"
            value={canViewVeterinaryData ? openAlarms.length : "-"}
          />
          <KpiCard
            title="Total Exits"
            value={reportSummary?.total_exited_animals ?? "-"}
          />
          <KpiCard
            title="Mortality Exits"
            value={reportSummary?.mortality_exits ?? "-"}
          />
          <KpiCard
            title="Sales Exits"
            value={reportSummary?.sold_exits ?? "-"}
          />
        </div>
      </section>

      {canViewOperations && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Weight Overview</h2>
              <p>
                Latest herd measurements and 30-day recording coverage
              </p>
            </div>
            <Link className="dashboard-nav-link" to="/weight-records">
              View Weight Records
            </Link>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard
              title="Animals with Recent Weight"
              value={animalsWithRecentWeight}
            />
            <KpiCard
              title="Animals Missing Recent Weight"
              value={animalsMissingRecentWeight}
            />
            <KpiCard
              title="Average Latest Weight"
              value={
                averageLatestWeight === null
                  ? "-"
                  : `${averageLatestWeight.toFixed(2)} kg`
              }
            />
            <KpiCard
              title="Average Daily Gain"
              value={
                averageDailyGain === null
                  ? "-"
                  : `${averageDailyGain.toFixed(3)} kg/day`
              }
            />
          </div>
          {recentWeightRecords.length === 0 ? (
            <p className="empty-text">No weight records found.</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Animal</th><th>Weight</th><th>Details</th></tr>
                </thead>
                <tbody>
                  {recentWeightRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.record_date}</td>
                      <td>
                        <Link to={`/animals/${record.animal_id}`}>
                          {getAnimalLabel(record.animal_id)}
                        </Link>
                      </td>
                      <td>{record.weight_kg} kg</td>
                      <td><Link to={`/weight-records/${record.id}`}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {canViewOperations && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Reproduction Overview</h2>
              <p>Recorded pregnancy and birth outcomes across the herd</p>
            </div>
            <Link className="dashboard-nav-link" to="/reproduction-events">
              View Reproduction
            </Link>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard title="Total Pregnancies" value={confirmedPregnancies} />
            <KpiCard title="Total Births" value={birthEvents.length} />
            <KpiCard title="Total Offspring" value={totalOffspring} />
            <KpiCard title="Twin Births" value={twinBirths} />
            <KpiCard
              title="Animals with Reproduction History"
              value={animalsWithReproductionHistory}
            />
            <KpiCard title="Last Birth Date" value={lastBirthDate || "-"} />
          </div>
          {recentReproductionEvents.length === 0 ? (
            <p className="empty-text">No reproduction events found.</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr><th>Date</th><th>Animal</th><th>Event</th><th>Outcome</th></tr>
                </thead>
                <tbody>
                  {recentReproductionEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <Link to={`/reproduction-events/${event.id}`}>
                          {event.event_date}
                        </Link>
                      </td>
                      <td>
                        <Link to={`/animals/${event.animal_id}`}>
                          {getAnimalLabel(event.animal_id)}
                        </Link>
                      </td>
                      <td>{event.event_type}</td>
                      <td>
                        {event.event_type === "pregnancy"
                          ? event.pregnancy_status
                            ? "Pregnancy confirmed"
                            : "Not pregnant"
                          : event.event_type === "birth"
                            ? `${event.offspring_count} offspring${event.is_twin_birth ? " (twins)" : ""}`
                            : "Mating recorded"}
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
              <h2>Health &amp; Operations</h2>
              <p>Recent health activity, withdrawal periods, and workload highlights</p>
            </div>
          </div>
          <div className="dashboard-kpi-grid">
            <KpiCard title="Recent Health Records" value={recentHealthActivity.length} />
            <KpiCard title="Recent Withdrawal Locks" value={recentWithdrawalLocks.length} />
            <KpiCard title="Overdue Withdrawal Locks" value={stats?.overdue_withdrawal_locks ?? withdrawalRisks.filter((item) => item.priority === "Overdue").length} />
            <KpiCard title="Open Operational Alarms" value={openAlarms.length} />
          </div>
          <div className="dashboard-cockpit-grid">
            <div>
              <div className="report-section-header">
                <h3>Recent Health Records</h3>
              </div>
              {recentHealthActivity.length === 0 ? (
                <p className="empty-text">No recent health records.</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Animal</th><th>Type</th></tr></thead>
                    <tbody>{recentHealthActivity.map((record) => <tr key={record.id}><td>{record.record_date}</td><td><Link to={`/animals/${record.animal_id}`}>{getAnimalLabel(record.animal_id)}</Link></td><td><Link to={`/health-records/${record.id}`}>{record.record_type}</Link></td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div>
              <div className="report-section-header">
                <h3>Recent Withdrawal Locks</h3>
              </div>
              {recentWithdrawalLocks.length === 0 ? (
                <p className="empty-text">No withdrawal locks found.</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead><tr><th>Start</th><th>Animal</th><th>End</th><th>Status</th></tr></thead>
                    <tbody>{recentWithdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td><Link to={`/animals/${lock.animal_id}`}>{getAnimalLabel(lock.animal_id)}</Link></td><td>{lock.end_date}</td><td><Link to={`/withdrawal-locks/${lock.id}`}>{!lock.is_active ? "Released" : lock.end_date < today ? "Expired" : "Active"}</Link></td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-cockpit-grid">
        {canViewVeterinaryData && reportDetails && (
          <section className="dashboard-section dashboard-cockpit-wide">
            <div className="dashboard-section-header">
              <div>
                <h2>Withdrawal Lock Risks</h2>
                <p>Overdue locks first, then locks ending within seven days</p>
              </div>
              <Link className="dashboard-nav-link" to="/animals">
                View Animals
              </Link>
            </div>

            {withdrawalRisks.length === 0 ? (
              <p className="empty-text">No withdrawal lock risks.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Animal</th>
                      <th>Reason</th>
                      <th>Due Date</th>
                      <th>Profile</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRisks.map((item) => (
                      <tr key={item.lockId}>
                        <td>{item.priority}</td>
                        <td>{getAnimalLabel(item.animalId)}</td>
                        <td>{item.reason}</td>
                        <td>{item.dueDate}</td>
                        <td>
                          <Link to={`/animals/${item.animalId}`}>View</Link>
                        </td>
                        <td>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleReleaseLock(item.lockId)}
                            disabled={Boolean(actionKey)}
                          >
                            {actionKey === `lock-${item.lockId}`
                              ? "Releasing..."
                              : "Release"}
                          </button>
                        </td>
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prioritizedOverdueAlarms.map((alarm) => (
                      <tr key={alarm.id}>
                        <td>{alarm.due_date}</td>
                        <td>{alarm.priority}</td>
                        <td>{alarm.title}</td>
                        <td>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleCompleteAlarm(alarm)}
                            disabled={Boolean(actionKey)}
                          >
                            {actionKey === `alarm-${alarm.id}`
                              ? "Completing..."
                              : "Complete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {canViewInventory && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Low Stock</h2>
                <p>Active items at or below minimum quantity</p>
              </div>
              <Link className="dashboard-nav-link" to="/inventory">
                View Inventory
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="empty-text">No low stock items.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Current</th>
                      <th>Minimum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.current_quantity} {item.unit}</td>
                        <td>{item.minimum_quantity} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {canViewVaccinations && (
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Vaccination Risks</h2>
                <p>Overdue vaccinations first, then upcoming due dates</p>
              </div>
              <Link className="dashboard-nav-link" to="/vaccinations">
                View Vaccinations
              </Link>
            </div>

            {vaccinationRisks.length === 0 ? (
              <p className="empty-text">No vaccination risks.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Animal</th>
                      <th>Vaccine</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinationRisks.map((vaccination) => (
                      <tr key={vaccination.id}>
                        <td>{vaccination.next_due_date}</td>
                        <td>{vaccination.riskStatus}</td>
                        <td>
                          <Link to={`/animals/${vaccination.animal_id}`}>
                            {getAnimalLabel(vaccination.animal_id)}
                          </Link>
                        </td>
                        <td>{vaccination.vaccine_name}</td>
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
                            {getAnimalLabel(record.animal_id)}
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
                            {getAnimalLabel(record.animal_id)}
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
                        {getAnimalLabel(record.animal_id)}
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
          <br />
          Milk, health, weight, and finance use record dates; lifecycle uses
          exit dates; reproduction uses event dates; withdrawal locks use start
          dates; alarms use due dates. Animal count is current.
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
                <p>Milk record dates within the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Milk Liters (Record Date)"
                  value={formatReportValue(reportSummary.total_milk_liters)}
                />
                <KpiCard
                  title="Average per Production Day"
                  value={formatReportValue(reportSummary.average_daily_milk)}
                />
                <KpiCard
                  title="Milk Records (Record Date)"
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
                <h3>Weight Analytics</h3>
                <p>Weight record facts within the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Latest Weight"
                  value={
                    reportSummary.latest_weight_kg === null
                      ? "-"
                      : `${formatReportValue(reportSummary.latest_weight_kg)} kg`
                  }
                />
                <KpiCard
                  title="Latest Weight Date"
                  value={reportSummary.latest_weight_record_date || "-"}
                />
                <KpiCard
                  title="Total Weight Records"
                  value={reportSummary.total_weight_records}
                />
                <KpiCard
                  title="Average Weight Change"
                  value={
                    reportSummary.average_weight_change_kg === null
                      ? "-"
                      : `${formatReportValue(reportSummary.average_weight_change_kg)} kg`
                  }
                />
                <KpiCard
                  title="Animals with Weight Change"
                  value={reportSummary.animals_with_weight_change}
                />
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Lifecycle</h3>
                <p>Animal exits by exit date in the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Total Exits"
                  value={reportSummary.total_exited_animals}
                />
                <KpiCard
                  title="Mortality Exits"
                  value={reportSummary.mortality_exits}
                />
                <KpiCard
                  title="Sales Exits"
                  value={reportSummary.sold_exits}
                />
                <div className="dashboard-kpi-card report-trend-card">
                  <h2>Exits by Reason</h2>
                  <p>{reportSummary.exits_by_reason.length}</p>
                  <small>
                    {reportSummary.exits_by_reason.length === 0
                      ? "No exits in this period."
                      : reportSummary.exits_by_reason
                          .map((item) => `${item.exit_reason}: ${item.count}`)
                          .join(", ")}
                  </small>
                </div>
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Reproduction Analytics</h3>
                <p>Reproduction event facts within the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Reproduction Events"
                  value={reportSummary.total_reproduction_events}
                />
                <KpiCard
                  title="Total Matings"
                  value={reportSummary.total_matings}
                />
                <KpiCard
                  title="Total Pregnancies"
                  value={reportSummary.total_pregnancies}
                />
                <KpiCard
                  title="Total Births"
                  value={reportSummary.total_births}
                />
                <KpiCard
                  title="Total Offspring"
                  value={reportSummary.total_offspring}
                />
                <KpiCard
                  title="Twin Births"
                  value={reportSummary.twin_births}
                />
                <KpiCard
                  title="Animals with Reproduction History"
                  value={reportSummary.animals_with_reproduction_history}
                />
                <KpiCard
                  title="Last Birth Date"
                  value={reportSummary.last_birth_date || "-"}
                />
              </div>
            </div>

            <ReportSection
              title="Lifecycle Exit Report"
              description="Exited animals by exit date, newest first."
              records={reportExitedAnimals}
              emptyMessage={emptyReportMessage("animal exits")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Exit Date</th><th>Animal</th><th>Reason</th><th>Status</th></tr></thead>
                  <tbody>{reportExitedAnimals.map((animal) => <tr key={animal.id}><td>{animal.exit_date}</td><td><Link to={`/animals/${animal.id}`}>{getAnimalLabel(animal.id)}</Link></td><td>{animal.exit_reason}</td><td>Exited</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Operations</h3>
                <p>Current herd count and date-based operational activity.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Total Animals (Current)"
                  value={reportSummary.total_animals}
                />
                <KpiCard
                  title="Health Records (Record Date)"
                  value={reportSummary.total_health_records}
                />
                <KpiCard
                  title="Weight Records (Record Date)"
                  value={reportSummary.total_weight_records}
                />
                <KpiCard
                  title="Reproduction Events (Event Date)"
                  value={reportSummary.total_reproduction_events}
                />
                <KpiCard
                  title="Active Locks (Start Date)"
                  value={reportSummary.active_withdrawal_locks}
                />
                <KpiCard
                  title="Open Alarms (Due Date)"
                  value={reportSummary.open_alarms}
                />
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>Finance</h3>
                <p>Active finance records by record date in the applied period.</p>
              </div>
              <div className="dashboard-kpi-grid report-kpi-grid">
                <KpiCard
                  title="Income (Record Date)"
                  value={formatReportValue(reportSummary.total_income)}
                />
                <KpiCard
                  title="Expense (Record Date)"
                  value={formatReportValue(reportSummary.total_expense)}
                />
                <KpiCard
                  title="Net Amount (Record Date)"
                  value={formatReportValue(
                    reportSummary.total_income - reportSummary.total_expense
                  )}
                />
              </div>
            </div>

            <ReportSection
              title="Per-Animal Breakdown"
              description="Production and operational workload for the applied period."
              records={perAnimalBreakdown}
              emptyMessage={emptyReportMessage("animal activity")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead>
                    <tr>
                      <th>Animal</th>
                      <th>Milk Liters</th>
                      <th>Milk Records</th>
                      <th>Average / Record</th>
                      <th>Production Days</th>
                      <th>Health Events</th>
                      <th>Withdrawal Locks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perAnimalBreakdown.map((item) => (
                      <tr key={item.animalId}>
                        <td>
                          <Link to={`/animals/${item.animalId}`}>
                            {getAnimalLabel(item.animalId)}
                          </Link>
                        </td>
                        <td>{item.milkLiters.toFixed(2)}</td>
                        <td>{item.milkRecords}</td>
                        <td>{item.averageMilkPerRecord.toFixed(2)}</td>
                        <td>{item.productionDays}</td>
                        <td>{item.healthEvents}</td>
                        <td>{item.withdrawalLocks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>

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
                <button
                  type="button"
                  className="dashboard-nav-link"
                  onClick={() =>
                    handleExport(
                      "weight-records/export.csv",
                      "weight_records_export.csv"
                    )
                  }
                >
                  Export Weight Records CSV
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
                  <tbody>{reportMilkRecords.map((record) => <tr key={record.id}><td>{record.record_date}</td><td><Link to={`/animals/${record.animal_id}`}>{getAnimalLabel(record.animal_id)}</Link></td><td>{record.milk_liters}</td><td>{record.session || "-"}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection
              title="Weight Report"
              description="Weight records, newest first."
              records={reportWeightRecords}
              emptyMessage={emptyReportMessage("weight records")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead><tr><th>Date</th><th>Animal</th><th>Weight</th><th>Notes</th></tr></thead>
                  <tbody>{reportWeightRecords.map((record) => <tr key={record.id}><td><Link to={`/weight-records/${record.id}`}>{record.record_date}</Link></td><td><Link to={`/animals/${record.animal_id}`}>{getAnimalLabel(record.animal_id)}</Link></td><td>{record.weight_kg} kg</td><td>{record.notes || "-"}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <ReportSection
              title="Reproduction Report"
              description="Reproduction events, newest first."
              records={reportReproductionEvents}
              emptyMessage={emptyReportMessage("reproduction events")}
            >
              <div className="dashboard-records-table">
                <table className="data-table report-data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Animal</th>
                      <th>Event</th>
                      <th>Outcome</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportReproductionEvents.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <Link to={`/reproduction-events/${event.id}`}>
                            {event.event_date}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/animals/${event.animal_id}`}>
                            {getAnimalLabel(event.animal_id)}
                          </Link>
                        </td>
                        <td>{event.event_type}</td>
                        <td>
                          {event.event_type === "pregnancy"
                            ? event.pregnancy_status
                              ? "Pregnancy confirmed"
                              : "Not pregnant"
                            : event.event_type === "birth"
                              ? `${event.offspring_count} offspring${event.is_twin_birth ? " (twins)" : ""}`
                              : "Mating recorded"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
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
                  <tbody>{reportHealthRecords.map((record) => <tr key={record.id}><td>{record.record_date}</td><td><Link to={`/animals/${record.animal_id}`}>{getAnimalLabel(record.animal_id)}</Link></td><td>{record.record_type}</td><td>{record.diagnosis || "-"}</td></tr>)}</tbody>
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
                  <tbody>{reportWithdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td><Link to={`/animals/${lock.animal_id}`}>{getAnimalLabel(lock.animal_id)}</Link></td><td>{lock.end_date}</td><td>{!lock.is_active ? "Released" : lock.end_date < today ? "Expired" : "Active"}</td></tr>)}</tbody>
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
