import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAlarms } from "../api/alarmApi";
import { deleteAnimal } from "../api/animalApi";
import { getHealthRecordsByAnimalId } from "../api/healthRecordApi";
import { getMilkRecordsByAnimalId } from "../api/milkRecordApi";
import { getReproductionEventsByAnimalId } from "../api/reproductionEventApi";
import { getWeightRecordsByAnimalId } from "../api/weightRecordApi";
import { getWithdrawalLocks } from "../api/withdrawalLockApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import BaseKpiCard from "../components/KpiCard";
import { useAuth } from "../context/authContext";
import useAnimalDetail from "../hooks/useAnimalDetail";
import { tAnimal as t, tAnimalValue as tv } from "../i18n";

const initialOperationalData = {
  milkRecords: [],
  healthRecords: [],
  weightRecords: [],
  reproductionEvents: [],
  withdrawalLocks: [],
  alarms: [],
  activeLocks: [],
  activeAlarms: [],
};

function getDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

function getLatestRecordDate(records) {
  return records.reduce(
    (latestDate, record) =>
      record.record_date > latestDate ? record.record_date : latestDate,
    ""
  );
}

function formatMilkLiters(value) {
  return `${Number(value).toFixed(2)} L`;
}

function formatEconomicValue(value) {
  return value === null || value === undefined ? "-" : value;
}

function getDecisionSupportStatus(isActive, unavailable = false) {
  if (unavailable) {
    return t("Unavailable");
  }
  return isActive ? t("Active") : t("Clear");
}

function isDateWithinRange(dateText, startDate, endDate) {
  return Boolean(dateText) && dateText >= startDate && dateText <= endDate;
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

function getCurrentPregnancyStatus(event) {
  if (!event) {
    return "-";
  }
  if (event.pregnancy_outcome === "pregnant") {
    return t("Pregnant");
  }
  if (event.pregnancy_outcome === "birth") {
    return t("Birth recorded");
  }
  if (event.pregnancy_outcome === "abortion") {
    return t("Abortion recorded");
  }
  if (event.pregnancy_outcome === "failed") {
    return t("Not pregnant / failed");
  }
  if (event.pregnancy_outcome === "unknown") {
    return t("Unknown");
  }
  if (event.event_type === "pregnancy") {
    return event.pregnancy_status ? t("Pregnant") : t("Not pregnant");
  }
  if (event.event_type === "birth") {
    return t("Birth recorded");
  }
  return t("Unknown");
}

function KpiCard({ title, value, ...props }) {
  return <BaseKpiCard title={t(title)} value={tv(value)} {...props} />;
}

function getDailyMilkTotals(records) {
  const totalsByDate = new Map();

  records.forEach((record) => {
    totalsByDate.set(
      record.record_date,
      (totalsByDate.get(record.record_date) || 0) +
        Number(record.milk_liters)
    );
  });

  return [...totalsByDate.entries()]
    .map(([date, milkLiters]) => ({ date, milkLiters }))
    .sort((first, second) => second.date.localeCompare(first.date));
}

function getDaysSince(dateText, today) {
  if (!dateText) {
    return "-";
  }
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const difference =
    (Date.parse(`${today}T00:00:00Z`) -
      Date.parse(`${dateText}T00:00:00Z`)) /
    millisecondsPerDay;

  if (difference < 0) {
    return "Future date";
  }
  const days = Math.floor(difference);
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function buildTimeline(operationalData) {
  const items = [
    ...operationalData.milkRecords.map((record) => ({
      key: `milk-${record.id}`,
      date: record.record_date,
      type: t("Milk"),
      event: `${record.milk_liters} ${t("liters")}${
        record.session ? ` (${record.session})` : ""
      }`,
      details: record.notes || t("Milk production recorded"),
    })),
    ...operationalData.healthRecords.map((record) => ({
      key: `health-${record.id}`,
      date: record.record_date,
      type: t("Health"),
      event: record.record_type,
      details:
        record.diagnosis || record.treatment || t("Health activity recorded"),
      to: `/health-records/${record.id}`,
    })),
    ...operationalData.weightRecords.map((record) => ({
      key: `weight-${record.id}`,
      date: record.record_date,
      type: t("Weight"),
      event: `${record.weight_kg} kg`,
      details: record.notes || "Weight recorded",
      to: `/weight-records/${record.id}`,
    })),
    ...operationalData.reproductionEvents.map((event) => ({
      key: `reproduction-${event.id}`,
      date: event.event_date,
      type: t("Reproduction"),
      event:
        event.event_type === "pregnancy"
          ? event.pregnancy_status
            ? t("Pregnancy confirmed")
            : t("Not pregnant")
          : event.event_type === "birth"
            ? `${t("Birth")} (${event.offspring_count} ${t("offspring")})`
            : t("Mating"),
      details: `${formatPregnancyOutcome(event.pregnancy_outcome)} ${t("outcome")}${
        event.notes ? `; ${event.notes}` : ""
      }`,
      to: `/reproduction-events/${event.id}`,
    })),
    ...operationalData.withdrawalLocks.map((lock) => ({
      key: `lock-${lock.id}`,
      date: lock.start_date,
      type: t("Withdrawal Lock"),
      event: lock.is_active ? t("Lock activated") : t("Released lock"),
      details: `${lock.reason || t("No reason provided")}; ${t("ends")} ${lock.end_date}`,
      to: `/withdrawal-locks/${lock.id}`,
    })),
    ...operationalData.alarms.map((alarm) => ({
      key: `alarm-${alarm.id}`,
      date: alarm.due_date,
      type: t("Alarm"),
      event: alarm.title,
      details: `${tv(alarm.priority)} ${t("priority")}; ${
        alarm.is_completed ? t("completed") : t("open")
      }`,
      to: `/alarms/${alarm.id}`,
    })),
  ];

  return items.sort(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.key.localeCompare(first.key)
  );
}

function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { animal, loading, error, setError } = useAnimalDetail(id);
  const [deleting, setDeleting] = useState(false);
  const [operationalData, setOperationalData] = useState(
    initialOperationalData
  );
  const [operationalLoading, setOperationalLoading] = useState(true);
  const [operationalError, setOperationalError] = useState("");
  const canViewMilk = user?.role === "admin" || user?.role === "worker";
  const canViewCare =
    user?.role === "admin" || user?.role === "veterinarian";
  const canViewReproduction =
    user?.role === "admin" || user?.role === "worker";
  const today = new Date().toISOString().slice(0, 10);
  const last30DaysStart = getDateDaysAgo(30);
  const sortedMilkRecords = [...operationalData.milkRecords].sort(
    (first, second) =>
      second.record_date.localeCompare(first.record_date) ||
      second.id - first.id
  );
  const last30DaysMilkRecords = sortedMilkRecords.filter(
      (record) =>
        record.record_date >= last30DaysStart && record.record_date <= today
    );
  const last30DaysMilkLiters = last30DaysMilkRecords
    .reduce((total, record) => total + Number(record.milk_liters), 0)
    .toFixed(2);
  const lifetimeMilkLiters = operationalData.milkRecords
    .reduce((total, record) => total + Number(record.milk_liters), 0)
    .toFixed(2);
  const averageMilkPerRecord = sortedMilkRecords.length
    ? (
        Number(lifetimeMilkLiters) / sortedMilkRecords.length
      ).toFixed(2)
    : null;
  const last30DaysAverageMilk = last30DaysMilkRecords.length
    ? (
        Number(last30DaysMilkLiters) / last30DaysMilkRecords.length
      ).toFixed(2)
    : null;
  const dailyMilkTotals = getDailyMilkTotals(sortedMilkRecords);
  const latestProductionDay = dailyMilkTotals[0];
  const previousProductionDay = dailyMilkTotals[1];
  const milkDifference = latestProductionDay && previousProductionDay
    ? latestProductionDay.milkLiters - previousProductionDay.milkLiters
    : null;
  const latestVersusPrevious = latestProductionDay
    ? `${formatMilkLiters(latestProductionDay.milkLiters)} vs ${
        previousProductionDay
          ? formatMilkLiters(previousProductionDay.milkLiters)
          : "-"
      }`
    : "-";
  const productionTrend = milkDifference === null
    ? "-"
    : milkDifference > 0
      ? `${t("Up")} (+${milkDifference.toFixed(2)} L)`
      : milkDifference < 0
        ? `${t("Down")} (${milkDifference.toFixed(2)} L)`
        : `${t("Unchanged")} (0.00 L)`;
  const treatmentCount = operationalData.healthRecords.filter(
    (record) => record.record_type === "treatment"
  ).length;
  const lastMilkRecordDate = getLatestRecordDate(
    operationalData.milkRecords
  );
  const lastHealthRecordDate = getLatestRecordDate(
    operationalData.healthRecords
  );
  const sortedWeightRecords = [...operationalData.weightRecords].sort(
    (first, second) =>
      second.record_date.localeCompare(first.record_date) ||
      second.id - first.id
  );
  const latestWeightRecord = sortedWeightRecords[0];
  const previousWeightRecord = sortedWeightRecords[1];
  const weightChange = previousWeightRecord
    ? Number(latestWeightRecord.weight_kg) -
      Number(previousWeightRecord.weight_kg)
    : null;
  const daysBetweenWeightMeasurements = previousWeightRecord
    ? Math.round(
        (Date.parse(`${latestWeightRecord.record_date}T00:00:00Z`) -
          Date.parse(`${previousWeightRecord.record_date}T00:00:00Z`)) /
          (24 * 60 * 60 * 1000)
      )
    : null;
  const averageDailyGain = daysBetweenWeightMeasurements > 0
    ? weightChange / daysBetweenWeightMeasurements
    : null;
  const sortedReproductionEvents = [...operationalData.reproductionEvents].sort(
    (first, second) =>
      second.event_date.localeCompare(first.event_date) ||
      second.id - first.id
  );
  const latestReproductionEvent = sortedReproductionEvents[0];
  const matingCount = sortedReproductionEvents.filter(
    (event) => event.event_type === "mating"
  ).length;
  const pregnancyCount = sortedReproductionEvents.filter(
    (event) =>
      event.event_type === "pregnancy" && event.pregnancy_status === true
  ).length;
  const birthEvents = sortedReproductionEvents.filter(
    (event) => event.event_type === "birth"
  );
  const totalOffspring = birthEvents.reduce(
    (total, event) => total + Number(event.offspring_count || 0),
    0
  );
  const twinBirthCount = birthEvents.filter(
    (event) => event.is_twin_birth
  ).length;
  const latestBirth = birthEvents[0];
  const latestPregnancyOutcome = sortedReproductionEvents.find(
    (event) =>
      event.pregnancy_outcome ||
      event.event_type === "pregnancy" ||
      event.event_type === "birth"
  );
  const currentPregnancyStatus = getCurrentPregnancyStatus(
    latestPregnancyOutcome
  );
  const daysSinceLastMilk = getDaysSince(lastMilkRecordDate, today);
  const daysSinceLastHealth = getDaysSince(lastHealthRecordDate, today);
  const timelineItems = buildTimeline(operationalData);
  const economicSummary = animal?.economic_summary;
  const netEconomicValue = Number(economicSummary?.net_economic_value);
  const hasNetEconomicValue =
    economicSummary?.net_economic_value !== null &&
    economicSummary?.net_economic_value !== undefined &&
    !Number.isNaN(netEconomicValue);
  const decisionSupportIndicators = [
    {
      title: "Positive Economic Value",
      status: getDecisionSupportStatus(
        hasNetEconomicValue && netEconomicValue > 0,
        !hasNetEconomicValue
      ),
      detail: hasNetEconomicValue
        ? formatEconomicValue(economicSummary.net_economic_value)
        : t("Net economic value unavailable"),
    },
    {
      title: "Negative Economic Value",
      status: getDecisionSupportStatus(
        hasNetEconomicValue && netEconomicValue < 0,
        !hasNetEconomicValue
      ),
      detail: hasNetEconomicValue
        ? formatEconomicValue(economicSummary.net_economic_value)
        : t("Net economic value unavailable"),
    },
    {
      title: "Repeated Treatments",
      status: getDecisionSupportStatus(
        Number(economicSummary?.treatment_count || 0) >= 3
      ),
      detail: `${economicSummary?.treatment_count ?? 0} ${t("treatments")}`,
    },
    {
      title: "High Health Activity",
      status: getDecisionSupportStatus(
        Number(economicSummary?.health_event_count || 0) >= 5
      ),
      detail: `${economicSummary?.health_event_count ?? 0} ${t("health events")}`,
    },
    {
      title: "Active Withdrawal Lock",
      status: getDecisionSupportStatus(
        operationalData.activeLocks.length > 0,
        !canViewCare
      ),
      detail: canViewCare
        ? `${operationalData.activeLocks.length} ${t("active locks")}`
        : t("Not available for your role"),
    },
    {
      title: "Recently Exited Animal",
      status: getDecisionSupportStatus(
        isDateWithinRange(animal?.exit_date, last30DaysStart, today)
      ),
      detail: animal?.exit_date
        ? `${tv(animal.exit_reason) || t("Exited")} ${t("on")} ${animal.exit_date}`
        : t("No exit date"),
    },
  ];

  useEffect(() => {
    async function loadOperationalData() {
      setOperationalLoading(true);
      setOperationalError("");
      try {
        const [
          milkRecords,
          healthRecords,
          weightRecords,
          reproductionEvents,
          locks,
          alarms,
        ] =
          await Promise.all([
            canViewMilk
              ? getMilkRecordsByAnimalId(id)
              : Promise.resolve([]),
            canViewCare
              ? getHealthRecordsByAnimalId(id)
              : Promise.resolve([]),
            getWeightRecordsByAnimalId(id),
            canViewReproduction
              ? getReproductionEventsByAnimalId(id)
              : Promise.resolve([]),
            canViewCare ? getWithdrawalLocks() : Promise.resolve([]),
            canViewCare ? getAlarms() : Promise.resolve([]),
          ]);
        const today = new Date().toISOString().slice(0, 10);
        const animalId = Number(id);
        const withdrawalLocks = locks.filter(
          (lock) => lock.animal_id === animalId
        );
        const activeLocks = withdrawalLocks.filter(
          (lock) =>
            lock.is_active === true &&
            lock.end_date >= today
        );
        const alarmTitles = new Set(
          withdrawalLocks.map(
            (lock) =>
              `Withdrawal lock ${lock.id} for animal ${animalId}`
          )
        );
        const associatedAlarms = alarms.filter((alarm) =>
          alarmTitles.has(alarm.title)
        );
        const activeAlarmTitles = new Set(
          activeLocks.map(
            (lock) =>
              `Withdrawal lock ${lock.id} for animal ${animalId}`
          )
        );
        const activeAlarms = associatedAlarms.filter(
          (alarm) =>
            !alarm.is_completed && activeAlarmTitles.has(alarm.title)
        );

        setOperationalData({
          milkRecords,
          healthRecords,
          weightRecords,
          reproductionEvents,
          withdrawalLocks,
          alarms: associatedAlarms,
          activeLocks,
          activeAlarms,
        });
      } catch (err) {
        setOperationalError(err.message);
      } finally {
        setOperationalLoading(false);
      }
    }

    loadOperationalData();
  }, [canViewCare, canViewMilk, canViewReproduction, id]);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      t("Are you sure you want to deactivate this animal?")
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteAnimal(id);

      navigate("/animals");
    } catch {
      setError(
        t("Unable to deactivate animal. Please make sure the backend server is running.")
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text={t("Loading animal details...")}
        className="status-text"
      />
    );
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        className="error-text"
      />
    );
  }

  return (
    <div className="dashboard-page animal-profile-page">
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h1>{t("Animal Identity")}</h1>
            <p>{t("Core profile and current status for")} {animal.ear_tag}</p>
          </div>
          <div className="dashboard-export-links animal-profile-actions">
            <Link className="dashboard-nav-link" to="/animals">
              {t("Back to Animals")}
            </Link>
            <Link
              className="dashboard-nav-link"
              to={`/animals/${animal.id}/edit`}
            >
              {t("Edit")}
            </Link>
            {animal.is_active === true && (
              <button
                className="dashboard-nav-link"
                type="button"
                onClick={handleDeactivate}
                disabled={deleting}
              >
                {deleting ? t("Deactivating...") : t("Deactivate")}
              </button>
            )}
          </div>
        </div>

        <dl className="animal-identity-grid">
          <div><dt>{t("ID")}</dt><dd>{animal.id}</dd></div>
          <div><dt>{t("Ear Tag")}</dt><dd>{animal.ear_tag}</dd></div>
          <div><dt>{t("Name")}</dt><dd>{animal.name || "-"}</dd></div>
          <div><dt>{t("Species")}</dt><dd>{animal.species || "-"}</dd></div>
          <div><dt>{t("Breed")}</dt><dd>{animal.breed || "-"}</dd></div>
          <div><dt>{t("Sex")}</dt><dd>{animal.sex || "-"}</dd></div>
          <div><dt>{t("Birth Date")}</dt><dd>{animal.birth_date || "-"}</dd></div>
          <div className="animal-identity-notes">
            <dt>{t("Notes")}</dt><dd>{animal.notes || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Lifecycle Information")}</h2>
            <p>{t("Current herd lifecycle status")}</p>
          </div>
        </div>
        <dl className="animal-identity-grid">
          <div>
            <dt>{t("Status")}</dt>
            <dd>{animal.exit_date ? t("Exited") : t("Active")}</dd>
          </div>
          <div>
            <dt>{t("Exit Date")}</dt>
            <dd>{animal.exit_date || "-"}</dd>
          </div>
          <div>
            <dt>{t("Exit Reason")}</dt>
            <dd>{animal.exit_reason || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Lactation Summary")}</h2>
            <p>{t("Current lactation state for dairy operations")}</p>
          </div>
        </div>
        <div className="dashboard-kpi-grid animal-profile-metrics">
          <KpiCard
            title="Lactation Status"
            value={tv(animal.lactation_status) || t("Unknown")}
          />
          <KpiCard
            title="Lactation Number"
            value={animal.lactation_number || "-"}
          />
          <KpiCard
            title="Lactation Start Date"
            value={animal.lactation_start_date || "-"}
          />
          <KpiCard
            title="Lactation End Date"
            value={animal.lactation_end_date || "-"}
          />
          <KpiCard
            title="Days In Milk"
            value={animal.days_in_milk ?? "-"}
          />
          <KpiCard
            title="Active Lactation"
            value={animal.active_lactation ? t("Yes") : t("No")}
          />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Economic Data")}</h2>
            <p>{t("Captured purchase and sale values for future economic analysis")}</p>
          </div>
        </div>
        <dl className="animal-identity-grid">
          <div>
            <dt>{t("Purchase Date")}</dt>
            <dd>{animal.purchase_date || "-"}</dd>
          </div>
          <div>
            <dt>{t("Purchase Value")}</dt>
            <dd>{formatEconomicValue(animal.economic_summary?.purchase_value)}</dd>
          </div>
          <div>
            <dt>{t("Sale Value")}</dt>
            <dd>{formatEconomicValue(animal.economic_summary?.sale_value)}</dd>
          </div>
          <div>
            <dt>{t("Profit / Loss")}</dt>
            <dd>{formatEconomicValue(animal.economic_summary?.profit_loss)}</dd>
          </div>
          <div>
            <dt>{t("Sale Status / Exit Reason")}</dt>
            <dd>
              {animal.exit_reason === "sold"
                ? t("Sold")
                : animal.exit_reason || "-"}
            </dd>
          </div>
          <div>
            <dt>{t("Lifetime Milk Production")}</dt>
            <dd>
              {animal.economic_summary
                ? `${animal.economic_summary.lifetime_milk_production} L`
                : "-"}
            </dd>
          </div>
          <div>
            <dt>{t("Lifetime Milk Revenue")}</dt>
            <dd>
              {formatEconomicValue(
                animal.economic_summary?.lifetime_milk_revenue
              )}
            </dd>
          </div>
          <div>
            <dt>{t("Health Event Count")}</dt>
            <dd>
              {formatEconomicValue(
                animal.economic_summary?.health_event_count
              )}
            </dd>
          </div>
          <div>
            <dt>{t("Treatment Count")}</dt>
            <dd>
              {formatEconomicValue(animal.economic_summary?.treatment_count)}
            </dd>
          </div>
          <div>
            <dt>{t("Health Cost")}</dt>
            <dd>
              {formatEconomicValue(animal.economic_summary?.health_cost)}
            </dd>
          </div>
          <div>
            <dt>{t("Net Economic Value")}</dt>
            <dd>
              {formatEconomicValue(
                animal.economic_summary?.net_economic_value
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Decision Support")}</h2>
            <p>{t("Simple rule-based indicators from current animal data")}</p>
          </div>
        </div>

        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Indicator")}</th>
                <th>{t("Status")}</th>
                <th>{t("Basis")}</th>
              </tr>
            </thead>
            <tbody>
              {decisionSupportIndicators.map((indicator) => (
                <tr key={indicator.title}>
                  <td>{t(indicator.title)}</td>
                  <td>{indicator.status}</td>
                  <td>{indicator.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {operationalError && (
        <ErrorMessage message={operationalError} className="error-text" />
      )}

      {operationalLoading ? (
        <Loading
          text={t("Loading operational details...")}
          className="status-text"
        />
      ) : operationalError ? null : (
        <>
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>{t("Operational Summary")}</h2>
                <p>{t("Current activity linked to this animal")}</p>
              </div>
            </div>

            <div className="animal-profile-metric-group">
              <h3>{t("Production Context")}</h3>
              <p>
                {t("Latest-day comparison combines all milk records from each date.")}
              </p>
              <div className="dashboard-kpi-grid animal-profile-metrics">
                <KpiCard
                  title="Latest vs Previous Production Day"
                  value={canViewMilk ? latestVersusPrevious : "-"}
                />
                <KpiCard
                  title="Production Trend"
                  value={canViewMilk ? productionTrend : "-"}
                />
                <KpiCard
                  title="Average Milk per Record"
                  value={
                    canViewMilk && averageMilkPerRecord
                      ? formatMilkLiters(averageMilkPerRecord)
                      : "-"
                  }
                />
                <KpiCard
                  title="Last 30 Days Average per Record"
                  value={
                    canViewMilk && last30DaysAverageMilk
                      ? formatMilkLiters(last30DaysAverageMilk)
                      : "-"
                  }
                />
              </div>
            </div>

            <div className="animal-profile-metric-group">
              <h3>{t("Lifetime Summary")}</h3>
              <p>{t("Totals calculated from this animal's available history.")}</p>
              <div className="dashboard-kpi-grid animal-profile-metrics">
                <KpiCard
                  title="Lifetime Milk Liters"
                  value={canViewMilk ? lifetimeMilkLiters : "-"}
                />
                <KpiCard
                  title="Total Milk Records"
                  value={canViewMilk ? operationalData.milkRecords.length : "-"}
                />
                <KpiCard
                  title="Total Health Events"
                  value={canViewCare ? operationalData.healthRecords.length : "-"}
                />
                <KpiCard
                  title="Total Weight Records"
                  value={operationalData.weightRecords.length}
                />
                <KpiCard
                  title="Total Treatments"
                  value={canViewCare ? treatmentCount : "-"}
                />
                <KpiCard
                  title="Withdrawal History"
                  value={canViewCare ? operationalData.withdrawalLocks.length : "-"}
                />
              </div>
            </div>

            <div className="animal-profile-metric-group">
              <h3>{t("Current Operational Indicators")}</h3>
              <p>{t("Recent activity and current restrictions.")}</p>
              <div className="dashboard-kpi-grid animal-profile-metrics">
                <KpiCard
                  title="Lifecycle Status"
                  value={animal.exit_date ? t("Exited") : t("Active")}
                />
                <KpiCard
                  title="Exit Date"
                  value={animal.exit_date || "-"}
                />
                <KpiCard
                  title="Exit Reason"
                  value={animal.exit_reason || "-"}
                />
                <KpiCard
                  title="Last 30 Days Milk Liters"
                  value={canViewMilk ? last30DaysMilkLiters : "-"}
                />
                <KpiCard
                  title="Last Milk Record Date"
                  value={canViewMilk ? lastMilkRecordDate || "-" : "-"}
                />
                <KpiCard
                  title="Days Since Last Milk"
                  value={canViewMilk ? daysSinceLastMilk : "-"}
                />
                <KpiCard
                  title="Last Health Record Date"
                  value={canViewCare ? lastHealthRecordDate || "-" : "-"}
                />
                <KpiCard
                  title="Latest Recorded Weight"
                  value={
                    latestWeightRecord
                      ? `${latestWeightRecord.weight_kg} kg`
                      : "-"
                  }
                />
                <KpiCard
                  title="Latest Weight Record Date"
                  value={latestWeightRecord?.record_date || "-"}
                />
                <KpiCard
                  title="Days Since Last Health Event"
                  value={canViewCare ? daysSinceLastHealth : "-"}
                />
                <KpiCard
                  title="Active Withdrawal Locks"
                  value={canViewCare ? operationalData.activeLocks.length : "-"}
                />
                <KpiCard
                  title="Open Alarms"
                  value={canViewCare ? operationalData.activeAlarms.length : "-"}
                />
              </div>
            </div>

            {previousWeightRecord && (
              <div className="animal-profile-metric-group">
                <h3>{t("Weight Growth")}</h3>
                <p>
                  {t("Calculated from the latest two weight measurements.")}
                </p>
                <div className="dashboard-kpi-grid animal-profile-metrics">
                  <KpiCard
                    title="Latest Weight"
                    value={`${latestWeightRecord.weight_kg} kg`}
                  />
                  <KpiCard
                    title="Previous Weight"
                    value={`${previousWeightRecord.weight_kg} kg`}
                  />
                  <KpiCard
                    title="Weight Change"
                    value={`${weightChange >= 0 ? "+" : ""}${weightChange.toFixed(2)} kg`}
                  />
                  <KpiCard
                    title="Days Between Measurements"
                    value={daysBetweenWeightMeasurements}
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
              </div>
            )}

            <div className="animal-profile-metric-group">
              <h3>{t("Reproduction Summary")}</h3>
              <p>{t("Totals calculated from this animal's reproduction history.")}</p>
              <div className="dashboard-kpi-grid animal-profile-metrics">
                <KpiCard title="Total Matings" value={canViewReproduction ? matingCount : "-"} />
                <KpiCard title="Total Pregnancies" value={canViewReproduction ? pregnancyCount : "-"} />
                <KpiCard title="Total Births" value={canViewReproduction ? birthEvents.length : "-"} />
                <KpiCard title="Total Offspring" value={canViewReproduction ? totalOffspring : "-"} />
                <KpiCard title="Twin Birth Count" value={canViewReproduction ? twinBirthCount : "-"} />
                <KpiCard title="Last Birth Date" value={canViewReproduction ? latestBirth?.event_date || "-" : "-"} />
                <KpiCard title="Current Pregnancy Status" value={canViewReproduction ? currentPregnancyStatus : "-"} />
                <KpiCard
                  title="Latest Reproduction Event"
                  value={
                    canViewReproduction && latestReproductionEvent
                      ? `${tv(latestReproductionEvent.event_type)} ${t("on")} ${latestReproductionEvent.event_date}`
                      : "-"
                  }
                />
                <KpiCard
                  title="Latest Pregnancy Outcome"
                  value={
                    canViewReproduction
                      ? formatPregnancyOutcome(
                          latestPregnancyOutcome?.pregnancy_outcome
                        )
                      : "-"
                  }
                />
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>{t("Operational Timeline")}</h2>
                <p>{t("Milk, health, weight, reproduction, withdrawal, and alarm activity")}</p>
              </div>
            </div>

            {timelineItems.length === 0 ? (
              <p className="empty-text">{t("No timeline activity found.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table animal-profile-timeline">
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Type")}</th>
                      <th>{t("Event")}</th>
                      <th>{t("Details")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineItems.map((item) => (
                      <tr key={item.key}>
                        <td>{item.date}</td>
                        <td>
                          <span className="animal-timeline-type">
                            {item.type}
                          </span>
                        </td>
                        <td>
                          {item.to ? (
                            <Link to={item.to}>{item.event}</Link>
                          ) : (
                            item.event
                          )}
                        </td>
                        <td>{item.details}</td>
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
                <h2>{t("Reproduction History")}</h2>
                <p>{t("Latest five reproduction events")}</p>
              </div>
            </div>

            {!canViewReproduction ? (
              <p className="empty-text">
                {t("Reproduction history is not available for your role.")}
              </p>
            ) : sortedReproductionEvents.length === 0 ? (
              <p className="empty-text">{t("No reproduction events found.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr><th>{t("Date")}</th><th>{t("Type")}</th><th>{t("Status / Offspring")}</th><th>{t("Outcome")}</th><th>{t("Notes")}</th></tr>
                  </thead>
                  <tbody>
                    {sortedReproductionEvents.slice(0, 5).map((event) => (
                      <tr key={event.id}>
                        <td><Link to={`/reproduction-events/${event.id}`}>{event.event_date}</Link></td>
                        <td>{tv(event.event_type)}</td>
                        <td>
                          {event.event_type === "pregnancy"
                            ? event.pregnancy_status
                              ? t("Pregnancy confirmed")
                              : t("Not pregnant")
                            : event.event_type === "birth"
                              ? `${event.offspring_count} ${t("offspring")}${event.is_twin_birth ? ` (${t("twins")})` : ""}`
                              : "-"}
                        </td>
                        <td>{formatPregnancyOutcome(event.pregnancy_outcome)}</td>
                        <td>{event.notes || "-"}</td>
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
                <h2>{t("Recent Weight Records")}</h2>
                <p>{t("Latest five weight records")}</p>
              </div>
            </div>

            {sortedWeightRecords.length === 0 ? (
              <p className="empty-text">{t("No weight records found.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Weight")}</th>
                      <th>{t("Notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedWeightRecords.slice(0, 5).map((record) => (
                      <tr key={record.id}>
                        <td>
                          <Link to={`/weight-records/${record.id}`}>
                            {record.record_date}
                          </Link>
                        </td>
                        <td>{record.weight_kg} kg</td>
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
                <h2>{t("Recent Milk Records")}</h2>
                <p>{t("Latest five milk records")}</p>
              </div>
            </div>

            {!canViewMilk ? (
              <p className="empty-text">
                {t("Milk records are not available for your role.")}
              </p>
            ) : operationalData.milkRecords.length === 0 ? (
              <p className="empty-text">{t("No milk records found.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Liters")}</th>
                      <th>{t("Session")}</th>
                      <th>{t("Notes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalData.milkRecords
                      .slice(0, 5)
                      .map((record) => (
                        <tr key={record.id}>
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
                <h2>{t("Recent Health Records")}</h2>
                <p>{t("Latest five health records")}</p>
              </div>
            </div>

            {!canViewCare ? (
              <p className="empty-text">
                {t("Health records are not available for your role.")}
              </p>
            ) : operationalData.healthRecords.length === 0 ? (
              <p className="empty-text">{t("No health records found.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Date")}</th>
                      <th>{t("Type")}</th>
                      <th>{t("Diagnosis")}</th>
                      <th>{t("Treatment")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalData.healthRecords
                      .slice(0, 5)
                      .map((record) => (
                        <tr key={record.id}>
                          <td>{record.record_date}</td>
                          <td>{tv(record.record_type)}</td>
                          <td>{record.diagnosis || "-"}</td>
                          <td>{record.treatment || "-"}</td>
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
                <h2>{t("Active Withdrawal Locks")}</h2>
                <p>{t("Current withdrawal periods for this animal")}</p>
              </div>
            </div>

            {!canViewCare ? (
              <p className="empty-text">
                {t("Withdrawal locks are not available for your role.")}
              </p>
            ) : operationalData.activeLocks.length === 0 ? (
              <p className="empty-text">{t("No active withdrawal locks.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Start Date")}</th>
                      <th>{t("End Date")}</th>
                      <th>{t("Reason")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalData.activeLocks.map((lock) => (
                      <tr key={lock.id}>
                        <td>{lock.start_date}</td>
                        <td>{lock.end_date}</td>
                        <td>{lock.reason || "-"}</td>
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
                <h2>{t("Open Alarms")}</h2>
                <p>{t("Open withdrawal alarms reliably linked to this animal")}</p>
              </div>
            </div>

            {!canViewCare ? (
              <p className="empty-text">
                {t("Alarms are not available for your role.")}
              </p>
            ) : operationalData.activeAlarms.length === 0 ? (
              <p className="empty-text">{t("No open alarms found.")}</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t("Title")}</th>
                      <th>{t("Priority")}</th>
                      <th>{t("Due Date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalData.activeAlarms.map((alarm) => (
                      <tr key={alarm.id}>
                        <td>{alarm.title}</td>
                        <td>{tv(alarm.priority)}</td>
                        <td>{alarm.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <div className="animal-profile-future">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Future Profile Areas")}</h2>
            <p>{t("Reserved for later operational development")}</p>
          </div>
        </div>
        <div className="animal-profile-placeholder-grid">
          {[
            ["Performance", "Performance indicators will be added in a future sprint."],
            ["Genetics / Breeding", "Genetics and breeding data will be added in a future sprint."],
          ].map(([title, message]) => (
            <section
              className="dashboard-section animal-profile-placeholder"
              key={title}
            >
              <span className="animal-profile-placeholder-status">{t("Planned")}</span>
              <h2>{t(title)}</h2>
              <p>{t(message)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnimalDetail;
