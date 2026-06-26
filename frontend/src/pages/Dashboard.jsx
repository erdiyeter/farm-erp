import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
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
import BaseKpiCard from "../components/KpiCard";
import {
  tDashboard as t,
  tDashboardValue as tv,
} from "../i18n";

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
      reason: lock.reason || t("Withdrawal lock"),
      priority: lock.end_date < today ? "Overdue" : "Due soon",
      priorityLabel: t(lock.end_date < today ? "Overdue" : "Due soon"),
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
      value: t("Not enough data"),
      detail: t("Two production days are needed for comparison."),
    };
  }

  const difference = totalsByDate.get(dates[0]) - totalsByDate.get(dates[1]);
  return {
    value: `${difference > 0 ? "+" : ""}${difference.toFixed(2)} L`,
    detail: `${dates[0]} ${t("compared with")} ${dates[1]}`,
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

function formatDecisionSupportAnimal(animal) {
  return `${animal.ear_tag}${animal.name ? ` - ${animal.name}` : ""} (ID: ${animal.animal_id})`;
}

function formatOptionalScore(value) {
  return value === null || value === undefined ? "-" : Number(value).toFixed(2);
}

function formatAttentionReasons(animal) {
  return animal.attention_reasons.length
    ? animal.attention_reasons.map(tv).join(", ")
    : "-";
}

function formatRecommendedActions(animal) {
  return animal.recommended_actions?.length
    ? animal.recommended_actions.map(tv).join(", ")
    : "-";
}

function formatDashboardTexts(values) {
  return values?.length ? values.map(tv).join(", ") : "-";
}

function getPriorityBadgeClass(priority) {
  return `priority-badge priority-badge-${String(priority || "medium").toLowerCase()}`;
}

function formatPregnancyOutcome(outcome) {
  const labels = {
    pregnant: t("Pregnant"),
    birth: t("Birth"),
    abortion: t("Abortion"),
    failed: t("Failed"),
    unknown: t("Unknown"),
  };
  return labels[outcome] || "-";
}

function KpiCard({ title, ...props }) {
  return <BaseKpiCard title={t(title)} {...props} />;
}

function ReportSection({ title, description, records, emptyMessage, children }) {
  return (
    <div className="report-detail-section">
      <div className="report-section-header report-section-header-row">
        <div>
          <h3>{t(title)}</h3>
          <p>{t(description)}</p>
        </div>
        <span className="report-record-count">
          {records.length} {t(records.length === 1 ? "record" : "records")}
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

function RankingTable({ title, records, emptyMessage }) {
  return (
    <div>
      <div className="report-section-header">
        <h3>{t(title)}</h3>
      </div>
      {records.length === 0 ? (
        <p className="empty-text">{t(emptyMessage)}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr><th>{t("Animal")}</th><th>{t("Metric")}</th><th>{t("Explanation")}</th></tr>
            </thead>
            <tbody>
              {records.map((animal) => (
                <tr key={animal.animal_id}>
                  <td>
                    <Link to={`/animals/${animal.animal_id}`}>
                      {formatDecisionSupportAnimal(animal)}
                    </Link>
                  </td>
                  <td>{animal.metric_label}</td>
                  <td>{formatDashboardTexts(animal.explanations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EconomicScoreRankingTable({ title, records, emptyMessage }) {
  return (
    <div>
      <div className="report-section-header">
        <h3>{t(title)}</h3>
      </div>
      {records.length === 0 ? (
        <p className="empty-text">{t(emptyMessage)}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr><th>{t("Rank")}</th><th>{t("Animal")}</th><th>{t("Score")}</th><th>{t("Explanation")}</th></tr>
            </thead>
            <tbody>
              {records.map((animal) => (
                <tr key={animal.animal_id}>
                  <td>{animal.rank_position}</td>
                  <td>
                    <Link to={`/animals/${animal.animal_id}`}>
                      {formatDecisionSupportAnimal(animal)}
                    </Link>
                  </td>
                  <td>{formatOptionalScore(animal.economic_score)}</td>
                  <td>{formatDashboardTexts(animal.explanations)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    ? `${appliedStartDate} ${t("to")} ${appliedEndDate}`
    : appliedStartDate
      ? `${t("from")} ${appliedStartDate}`
      : appliedEndDate
        ? `${t("through")} ${appliedEndDate}`
        : t("all available dates");
  const decisionSupport = stats?.decision_support;
  const herdKpis = stats?.herd_kpis || reportSummary?.herd_kpis;
  const keyHerdWarnings = decisionSupport?.key_herd_warnings || [];
  const keyHerdOpportunities =
    decisionSupport?.key_herd_opportunities || [];
  const attentionReviewAnimals = decisionSupport?.black_list_animals ||
    decisionSupport?.priority_review_animals ||
    [];
  const emptyReportMessage = (recordType) =>
    `${t("No records found for")} ${t(recordType)} (${reportPeriod}). ${t("Adjust or clear the filters.")}`;

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
        setError(t("Unable to load dashboard data."));
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
      setReportError(err.message || t("Unable to load report data."));
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
      setReportError(err.message || t("Unable to export CSV."));
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
    if (!window.confirm(`${t("Complete alarm")} "${alarm.title}"?`)) {
      return;
    }

    setActionKey(`alarm-${alarm.id}`);
    setActionError("");
    setActionMessage("");
    try {
      await updateAlarm(alarm.id, { is_completed: true });
      await refreshDashboardAfterAction();
      setActionMessage(t("Alarm completed successfully."));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionKey("");
    }
  }

  async function handleReleaseLock(lockId) {
    if (!window.confirm(t("Release this withdrawal lock?"))) {
      return;
    }

    setActionKey(`lock-${lockId}`);
    setActionError("");
    setActionMessage("");
    try {
      await updateWithdrawalLock(lockId, { is_active: false });
      await refreshDashboardAfterAction();
      setActionMessage(t("Withdrawal lock released successfully."));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionKey("");
    }
  }

  if (loading) {
    return <Loading text={t("Loading dashboard...")} className="status-text" />;
  }

  if (error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>{t("Farm Operations Cockpit")}</h1>
        <p>{t("Prioritized daily activity and records requiring attention.")}</p>
      </div>

      {actionError && (
        <ErrorMessage message={actionError} className="error-text" />
      )}
      {actionMessage && <p className="status-text">{actionMessage}</p>}

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Farm Overview")}</h2>
            <p>{t("Current herd and operational status at a glance")}</p>
          </div>
          <Link className="dashboard-nav-link" to="/animals">
            {t("View Animals")}
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
          <KpiCard
            title="Animals In Lactation"
            value={reportSummary?.animals_in_lactation ?? "-"}
          />
        </div>
      </section>

      {decisionSupport && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>{t("Decision Support Summary")}</h2>
              <p>{t("Today's most important herd priorities from current attention data")}</p>
            </div>
          </div>

          {decisionSupport.todays_focus.length === 0 ? (
            <p className="empty-text">{t("No decision-support priorities for today.")}</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("Focus Area")}</th>
                    <th>{t("Animals")}</th>
                    <th>{t("Recommended Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionSupport.todays_focus.map((item) => (
                    <tr key={item.reason}>
                      <td>{tv(item.reason)}</td>
                      <td>{item.animal_count}</td>
                      <td>{tv(item.recommended_action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {decisionSupport && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>{t("Decision Support")}</h2>
              <p>{t("Rule-based attention indicators from current animal data")}</p>
            </div>
          </div>

          <div className="dashboard-kpi-grid">
            <KpiCard
              title="Animals Requiring Attention"
              value={decisionSupport.animals_requiring_attention}
            />
            <KpiCard
              title="Economic Attention"
              value={decisionSupport.animals_with_negative_economic_value}
            />
            <KpiCard
              title="Active Withdrawal Locks"
              value={decisionSupport.animals_with_active_withdrawal_locks}
            />
            <KpiCard
              title="Repeated Treatments"
              value={decisionSupport.animals_with_repeated_treatments}
            />
            <KpiCard
              title="Recently Exited Animals"
              value={decisionSupport.recently_exited_animals}
            />
            <KpiCard
              title="Highest Economic Score"
              value={formatOptionalScore(herdKpis?.highest_economic_score)}
            />
            <KpiCard
              title="Lowest Economic Score"
              value={formatOptionalScore(herdKpis?.lowest_economic_score)}
            />
            <KpiCard
              title="Average Economic Score"
              value={formatOptionalScore(herdKpis?.average_economic_score)}
            />
            <KpiCard
              title="Active Animals"
              value={herdKpis?.active_animals ?? "-"}
            />
            <KpiCard
              title="Exited Animals"
              value={herdKpis?.exited_animals ?? "-"}
            />
          </div>

          <div className="dashboard-cockpit-grid">
            <div>
              <div className="report-section-header">
                <h3>{t("Key Herd Warnings")}</h3>
              </div>
              {keyHerdWarnings.length === 0 ? (
                <p className="empty-text">{t("No herd warnings from current rules.")}</p>
              ) : (
                <ul className="dashboard-list">
                  {keyHerdWarnings.map((warning) => (
                    <li key={warning}>{tv(warning)}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="report-section-header">
                <h3>{t("Key Herd Opportunities")}</h3>
              </div>
              {keyHerdOpportunities.length === 0 ? (
                <p className="empty-text">{t("No herd opportunities from current rules.")}</p>
              ) : (
                <ul className="dashboard-list">
                  {keyHerdOpportunities.map((opportunity) => (
                    <li key={opportunity}>{tv(opportunity)}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="report-section-header">
                <h3>{t("Attention Required Animals")}</h3>
              </div>
              {decisionSupport.attention_required_animals.length === 0 ? (
                <p className="empty-text">{t("No animals currently require attention.")}</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead>
                      <tr><th>{t("Animal")}</th><th>{t("Triggered Indicators")}</th><th>{t("Explanation")}</th></tr>
                    </thead>
                    <tbody>
                      {decisionSupport.attention_required_animals.map((animal) => (
                        <tr key={animal.animal_id}>
                          <td>
                            <Link to={`/animals/${animal.animal_id}`}>
                              {formatDecisionSupportAnimal(animal)}
                            </Link>
                          </td>
                          <td>{formatDashboardTexts(animal.indicators)}</td>
                          <td>{formatDashboardTexts(animal.explanations)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="report-section-header">
                <h3>{t("Economic Attention Animals")}</h3>
              </div>
              {decisionSupport.negative_economic_value_animals.length === 0 ? (
                <p className="empty-text">{t("No animals currently require economic attention.")}</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead>
                      <tr><th>{t("Animal")}</th><th>{t("Net Economic Value")}</th><th>{t("Explanation")}</th></tr>
                    </thead>
                    <tbody>
                      {decisionSupport.negative_economic_value_animals.map((animal) => (
                        <tr key={animal.animal_id}>
                          <td>
                            <Link to={`/animals/${animal.animal_id}`}>
                              {formatDecisionSupportAnimal(animal)}
                            </Link>
                          </td>
                          <td>
                            {animal.net_economic_value === null
                              ? "-"
                              : animal.net_economic_value.toFixed(2)}
                          </td>
                          <td>{formatDashboardTexts(animal.explanations)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="report-section-header">
                <h3>{t("Recently Exited Animals")}</h3>
              </div>
              {decisionSupport.recently_exited_animal_list.length === 0 ? (
                <p className="empty-text">{t("No animals exited in the last 30 days.")}</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead>
                      <tr><th>{t("Animal")}</th><th>{t("Exit Date")}</th><th>{t("Indicator")}</th><th>{t("Explanation")}</th></tr>
                    </thead>
                    <tbody>
                      {decisionSupport.recently_exited_animal_list.map((animal) => (
                        <tr key={animal.animal_id}>
                          <td>
                            <Link to={`/animals/${animal.animal_id}`}>
                              {formatDecisionSupportAnimal(animal)}
                            </Link>
                          </td>
                          <td>{animal.exit_date || "-"}</td>
                          <td>{formatDashboardTexts(animal.indicators)}</td>
                          <td>{formatDashboardTexts(animal.explanations)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {decisionSupport && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>{t("Golden List")}</h2>
              <p>{t("Active animals with positive economic value and low operational concern")}</p>
            </div>
          </div>

          {decisionSupport.golden_list_animals.length === 0 ? (
            <p className="empty-text">{t("No animals currently qualify for the Golden List.")}</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("Animal")}</th>
                    <th>{t("Key Strengths")}</th>
                    <th>{t("Recommended Actions")}</th>
                    <th>{t("Net Economic Value")}</th>
                    <th>{t("Lifetime Milk")}</th>
                    <th>{t("Treatments")}</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionSupport.golden_list_animals.map((animal) => (
                    <tr key={animal.animal_id}>
                      <td>
                        <Link to={`/animals/${animal.animal_id}`}>
                          {formatDecisionSupportAnimal(animal)}
                        </Link>
                      </td>
                      <td>{formatDashboardTexts(animal.strengths)}</td>
                      <td>{formatDashboardTexts(animal.recommended_actions)}</td>
                      <td>{animal.net_economic_value.toFixed(2)}</td>
                      <td>{animal.lifetime_milk_production.toFixed(2)} L</td>
                      <td>{animal.treatment_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {decisionSupport && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>{t("Priority Review")}</h2>
              <p>{t("Rule-based attention queue with reasons, actions, and operational context")}</p>
            </div>
          </div>

          {attentionReviewAnimals.length === 0 ? (
            <p className="empty-text">{t("No animals currently require priority review.")}</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t("Animal")}</th>
                    <th>{t("Priority")}</th>
                    <th>{t("Attention Reasons")}</th>
                    <th>{t("Priority Explanation")}</th>
                    <th>{t("Recommended Actions")}</th>
                    <th>{t("Net Economic Value")}</th>
                    <th>{t("Treatments")}</th>
                    <th>{t("Health Events")}</th>
                    <th>{t("Withdrawal Lock")}</th>
                  </tr>
                </thead>
                <tbody>
                  {attentionReviewAnimals.map((animal) => (
                    <tr key={animal.animal_id}>
                      <td>
                        <Link to={`/animals/${animal.animal_id}`}>
                          {formatDecisionSupportAnimal(animal)}
                        </Link>
                      </td>
                      <td>
                        <span className={getPriorityBadgeClass(animal.priority_level)}>
                          {tv(animal.priority_level)}
                        </span>
                      </td>
                      <td>{formatAttentionReasons(animal)}</td>
                      <td>{tv(animal.priority_explanation) || "-"}</td>
                      <td>{formatRecommendedActions(animal)}</td>
                      <td>
                        {animal.net_economic_value === null
                          ? "-"
                          : animal.net_economic_value.toFixed(2)}
                      </td>
                      <td>{animal.treatment_count}</td>
                      <td>{animal.health_event_count}</td>
                      <td>{animal.has_active_withdrawal_lock ? t("Active") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {decisionSupport && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>{t("Decision Support Rankings")}</h2>
              <p>{t("Compact rankings from existing economic, production, health, and weight data")}</p>
            </div>
          </div>

          <div className="dashboard-cockpit-grid">
            <EconomicScoreRankingTable
              title="Top Performing Animals"
              records={decisionSupport.top_performing_animals}
              emptyMessage="No active animals have economic scores yet."
            />
            <EconomicScoreRankingTable
              title="Lowest Performing Animals"
              records={decisionSupport.lowest_performing_animals}
              emptyMessage="No active animals have economic scores yet."
            />
            <RankingTable
              title="Top Economic Animals"
              records={decisionSupport.top_economic_animals}
              emptyMessage="No calculable economic values found."
            />
            <RankingTable
              title="Bottom Economic Animals"
              records={decisionSupport.bottom_economic_animals}
              emptyMessage="No calculable economic values found."
            />
            <RankingTable
              title="Top Milk Producers"
              records={decisionSupport.top_milk_producers}
              emptyMessage="No milk production records found."
            />
            <RankingTable
              title="Low Milk Producers"
              records={decisionSupport.low_milk_producers}
              emptyMessage="No milk production records found."
            />
            <RankingTable
              title="Most Treated Animals"
              records={decisionSupport.most_treated_animals}
              emptyMessage="No treatment records found."
            />
            <RankingTable
              title="Highest Weight Gain Animals"
              records={decisionSupport.highest_weight_gain_animals}
              emptyMessage="No animals have enough weight history."
            />
            <RankingTable
              title="Lowest Weight Gain Animals"
              records={decisionSupport.lowest_weight_gain_animals}
              emptyMessage="No animals have enough weight history."
            />
          </div>
        </section>
      )}

      {canViewOperations && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>{t("Weight Overview")}</h2>
              <p>
                {t("Latest herd measurements and 30-day recording coverage")}
              </p>
            </div>
            <Link className="dashboard-nav-link" to="/weight-records">
              {t("View Weight Records")}
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
            <p className="empty-text">{t("No weight records found.")}</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Weight")}</th><th>{t("Details")}</th></tr>
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
                      <td><Link to={`/weight-records/${record.id}`}>{t("View")}</Link></td>
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
              <h2>{t("Reproduction Overview")}</h2>
              <p>{t("Recorded pregnancy and birth outcomes across the herd")}</p>
            </div>
            <Link className="dashboard-nav-link" to="/reproduction-events">
              {t("View Reproduction")}
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
            <p className="empty-text">{t("No reproduction events found.")}</p>
          ) : (
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead>
                  <tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Event")}</th><th>{t("Status")}</th><th>{t("Outcome")}</th></tr>
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
                            ? t("Pregnancy confirmed")
                            : t("Not pregnant")
                          : event.event_type === "birth"
                            ? `${event.offspring_count} ${t("offspring")}${event.is_twin_birth ? ` (${t("twins")})` : ""}`
                            : t("Mating recorded")}
                      </td>
                      <td>{formatPregnancyOutcome(event.pregnancy_outcome)}</td>
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
              <h2>{t("Health & Operations")}</h2>
              <p>{t("Recent health activity, withdrawal periods, and workload highlights")}</p>
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
                <h3>{t("Recent Health Records")}</h3>
              </div>
              {recentHealthActivity.length === 0 ? (
                <p className="empty-text">{t("No recent health records.")}</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead><tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Type")}</th></tr></thead>
                    <tbody>{recentHealthActivity.map((record) => <tr key={record.id}><td>{record.record_date}</td><td><Link to={`/animals/${record.animal_id}`}>{getAnimalLabel(record.animal_id)}</Link></td><td><Link to={`/health-records/${record.id}`}>{record.record_type}</Link></td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
            <div>
              <div className="report-section-header">
                <h3>{t("Recent Withdrawal Locks")}</h3>
              </div>
              {recentWithdrawalLocks.length === 0 ? (
                <p className="empty-text">{t("No withdrawal locks found.")}</p>
              ) : (
                <div className="dashboard-records-table">
                  <table className="data-table">
                    <thead><tr><th>{t("Start")}</th><th>{t("Animal")}</th><th>{t("End")}</th><th>{t("Status")}</th></tr></thead>
                    <tbody>{recentWithdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td><Link to={`/animals/${lock.animal_id}`}>{getAnimalLabel(lock.animal_id)}</Link></td><td>{lock.end_date}</td><td><Link to={`/withdrawal-locks/${lock.id}`}>{!lock.is_active ? t("Released") : lock.end_date < today ? t("Expired") : t("Active")}</Link></td></tr>)}</tbody>
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
                <h2>{t("Withdrawal Lock Risks")}</h2>
                <p>{t("Overdue locks first, then locks ending within seven days")}</p>
              </div>
              <Link className="dashboard-nav-link" to="/animals">
                {t("View Animals")}
              </Link>
            </div>

            {withdrawalRisks.length === 0 ? (
              <p className="empty-text">{t("No withdrawal lock risks.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Priority")}</th>
                      <th>{t("Animal")}</th>
                      <th>{t("Reason")}</th>
                      <th>{t("Due Date")}</th>
                      <th>{t("Profile")}</th>
                      <th>{t("Action")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalRisks.map((item) => (
                      <tr key={item.lockId}>
                        <td>{item.priorityLabel}</td>
                        <td>{getAnimalLabel(item.animalId)}</td>
                        <td>{item.reason}</td>
                        <td>{item.dueDate}</td>
                        <td>
                          <Link to={`/animals/${item.animalId}`}>{t("View")}</Link>
                        </td>
                        <td>
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => handleReleaseLock(item.lockId)}
                            disabled={Boolean(actionKey)}
                          >
                            {actionKey === `lock-${item.lockId}`
                              ? t("Releasing...")
                              : t("Release")}
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
                <h2>{t("Overdue Alarms")}</h2>
                <p>{t("Oldest overdue items first")}</p>
              </div>
              <Link className="dashboard-nav-link" to="/alarms">
                {t("View Alarms")}
              </Link>
            </div>

            {prioritizedOverdueAlarms.length === 0 ? (
              <p className="empty-text">{t("No overdue alarms.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Due Date")}</th>
                      <th>{t("Priority")}</th>
                      <th>{t("Alarm")}</th>
                      <th>{t("Action")}</th>
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
                              ? t("Completing...")
                              : t("Complete")}
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
                <h2>{t("Low Stock")}</h2>
                <p>{t("Active items at or below minimum quantity")}</p>
              </div>
              <Link className="dashboard-nav-link" to="/inventory">
                {t("View Inventory")}
              </Link>
            </div>

            {lowStockItems.length === 0 ? (
              <p className="empty-text">{t("No low stock items.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Item")}</th>
                      <th>{t("Current")}</th>
                      <th>{t("Minimum")}</th>
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
                <h2>{t("Vaccination Risks")}</h2>
                <p>{t("Overdue vaccinations first, then upcoming due dates")}</p>
              </div>
              <Link className="dashboard-nav-link" to="/vaccinations">
                {t("View Vaccinations")}
              </Link>
            </div>

            {vaccinationRisks.length === 0 ? (
              <p className="empty-text">{t("No vaccination risks.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Due Date")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Animal")}</th>
                      <th>{t("Vaccine")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinationRisks.map((vaccination) => (
                      <tr key={vaccination.id}>
                        <td>{vaccination.next_due_date}</td>
                        <td>{t(vaccination.riskStatus)}</td>
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
                <h2>{t("Recent Health Activity")}</h2>
                <p>{t("Latest health records across the herd")}</p>
              </div>
            </div>

            {recentHealthActivity.length === 0 ? (
              <p className="empty-text">{t("No recent health activity.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Animal")}</th>
                      <th>{t("Type")}</th>
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
                <h2>{t("Recent Milk Activity")}</h2>
                <p>{t("Latest milk records across the herd")}</p>
              </div>
            </div>

            {recentMilkActivity.length === 0 ? (
              <p className="empty-text">{t("No recent milk activity.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Animal")}</th>
                      <th>{t("Liters")}</th>
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
            <h2>{t("Animals")}</h2>
            <p>{t("Current animal count")}</p>
          </div>
          <Link className="dashboard-nav-link" to="/animals">
            {t("View Animals")}
          </Link>
        </div>

        <div className="dashboard-kpi-grid">
          <KpiCard title="Total Animals" value={stats.total_animals} />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Milk Production")}</h2>
            <p>{t("Current milk production totals and recent entries")}</p>
          </div>
          <Link className="dashboard-nav-link" to="/milk-records">
            {t("View Milk Records")}
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
          <p className="empty-text">{t("No recent records yet.")}</p>
        ) : (
          <div className="dashboard-records-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("ID")}</th>
                  <th>{t("Animal ID")}</th>
                  <th>{t("Date")}</th>
                  <th>{t("Milk Liters")}</th>
                  <th>{t("Session")}</th>
                  <th>{t("Notes")}</th>
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
            <h2>{t("Health Records")}</h2>
            <p>{t("Recent health records and active withdrawal periods")}</p>
          </div>
          <Link className="dashboard-nav-link" to="/health-records">
            {t("View Health Records")}
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
            <h2>{t("Withdrawal Locks")}</h2>
            <p>{t("Active, expiring, and overdue withdrawal periods")}</p>
          </div>
          <Link className="dashboard-nav-link" to="/withdrawal-locks">
            {t("View Withdrawal Locks")}
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
            <h2>{t("Alarms")}</h2>
            <p>{t("Open, upcoming, and overdue manual alarms")}</p>
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
            <h2>{t("Operational Reports")}</h2>
            <p>{t("Review trends, totals, and detailed records by date range.")}</p>
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
          <strong>{t("Applied period")}:</strong> {reportPeriod}
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
                <h3>{t("Production")}</h3>
                <p>{t("Milk record dates and current lactation status.")}</p>
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
                <KpiCard
                  title="Animals In Lactation"
                  value={reportSummary.animals_in_lactation}
                />
                <KpiCard
                  title="Active Lactations"
                  value={reportSummary.active_lactations}
                />
                <KpiCard
                  title="Average DIM"
                  value={
                    reportSummary.average_days_in_milk === null
                      ? "-"
                      : formatReportValue(reportSummary.average_days_in_milk)
                  }
                />
                <div className="dashboard-kpi-card report-trend-card">
                  <h2>{t("Latest Daily Milk Trend")}</h2>
                  <p>{milkTrend.value}</p>
                  <small>{milkTrend.detail}</small>
                </div>
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>{t("Weight Analytics")}</h3>
                <p>{t("Weight record facts within the applied period.")}</p>
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
                <h3>{t("Lifecycle")}</h3>
                <p>{t("Animal exits by exit date in the applied period.")}</p>
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
                  <h2>{t("Exits by Reason")}</h2>
                  <p>{reportSummary.exits_by_reason.length}</p>
                  <small>
                    {reportSummary.exits_by_reason.length === 0
                      ? t("No exits in this period.")
                      : reportSummary.exits_by_reason
                          .map((item) => `${item.exit_reason}: ${item.count}`)
                          .join(", ")}
                  </small>
                </div>
              </div>
            </div>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>{t("Reproduction Analytics")}</h3>
                <p>{t("Reproduction event facts within the applied period.")}</p>
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
                  title="Pregnant Outcomes"
                  value={reportSummary.pregnant_outcomes}
                />
                <KpiCard
                  title="Abortion Outcomes"
                  value={reportSummary.abortion_outcomes}
                />
                <KpiCard
                  title="Failed Outcomes"
                  value={reportSummary.failed_outcomes}
                />
                <KpiCard
                  title="Unknown Outcomes"
                  value={reportSummary.unknown_outcomes}
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
                  <thead><tr><th>{t("Exit Date")}</th><th>{t("Animal")}</th><th>{t("Reason")}</th><th>{t("Status")}</th></tr></thead>
                  <tbody>{reportExitedAnimals.map((animal) => <tr key={animal.id}><td>{animal.exit_date}</td><td><Link to={`/animals/${animal.id}`}>{getAnimalLabel(animal.id)}</Link></td><td>{animal.exit_reason}</td><td>{t("Exited")}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>

            <div className="report-kpi-group">
              <div className="report-section-header">
                <h3>{t("Operations")}</h3>
                <p>{t("Current herd count and date-based operational activity.")}</p>
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
                <h3>{t("Finance")}</h3>
                <p>{t("Active finance records by record date in the applied period.")}</p>
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
                      <th>{t("Animal")}</th>
                      <th>{t("Milk Liters")}</th>
                      <th>{t("Milk Records")}</th>
                      <th>{t("Average / Record")}</th>
                      <th>{t("Production Days")}</th>
                      <th>{t("Health Events")}</th>
                      <th>{t("Withdrawal Locks")}</th>
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
                <h3>{t("CSV Export")}</h3>
                <p>{t("Date-based exports use the applied period shown above.")}</p>
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
                  {t("Export Animals CSV")}
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
                  {t("Export Health Records CSV")}
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
                  {t("Export Withdrawal Locks CSV")}
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
                  {t("Export Milk Records CSV")}
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
                  {t("Export Weight Records CSV")}
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
                  <thead><tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Liters")}</th><th>{t("Session")}</th></tr></thead>
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
                  <thead><tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Weight")}</th><th>{t("Notes")}</th></tr></thead>
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
                      <th>{t("Date")}</th>
                      <th>{t("Animal")}</th>
                      <th>{t("Event")}</th>
                      <th>{t("Status")}</th>
                      <th>{t("Outcome")}</th>
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
                              ? t("Pregnancy confirmed")
                              : t("Not pregnant")
                            : event.event_type === "birth"
                              ? `${event.offspring_count} ${t("offspring")}${event.is_twin_birth ? ` (${t("twins")})` : ""}`
                              : t("Mating recorded")}
                        </td>
                        <td>{formatPregnancyOutcome(event.pregnancy_outcome)}</td>
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
                  <thead><tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Type")}</th><th>{t("Diagnosis")}</th></tr></thead>
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
                  <thead><tr><th>{t("Date")}</th><th>{t("Type")}</th><th>{t("Category")}</th><th>{t("Amount")}</th></tr></thead>
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
                  <thead><tr><th>{t("Start Date")}</th><th>{t("Animal")}</th><th>{t("End Date")}</th><th>{t("Status")}</th></tr></thead>
                  <tbody>{reportWithdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td><Link to={`/animals/${lock.animal_id}`}>{getAnimalLabel(lock.animal_id)}</Link></td><td>{lock.end_date}</td><td>{!lock.is_active ? t("Released") : lock.end_date < today ? t("Expired") : t("Active")}</td></tr>)}</tbody>
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
                  <thead><tr><th>{t("Due Date")}</th><th>{t("Title")}</th><th>{t("Priority")}</th><th>{t("Status")}</th></tr></thead>
                  <tbody>{reportAlarms.map((alarm) => <tr key={alarm.id}><td>{alarm.due_date}</td><td>{alarm.title}</td><td>{alarm.priority}</td><td>{alarm.is_completed ? t("Completed") : t("Open")}</td></tr>)}</tbody>
                </table>
              </div>
            </ReportSection>
          </>
        ) : (
          <p className="empty-text">{t("Report data is not available.")}</p>
        )}
      </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
