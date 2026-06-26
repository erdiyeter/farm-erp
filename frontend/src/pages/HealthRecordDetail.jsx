import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAlarms } from "../api/alarmApi";
import {
  deleteHealthRecord,
  getHealthRecordById,
} from "../api/healthRecordApi";
import { getWithdrawalLocks } from "../api/withdrawalLockApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import useAnimals from "../hooks/useAnimals";
import { tOperation as t, tOperationValue as tv } from "../i18n";

function buildHealthTimeline(record, locks, alarms) {
  const items = [
    {
      key: `health-${record.id}`,
      date: record.record_date,
      type: t("Health Record"),
      event: tv(record.record_type),
      details: record.diagnosis || record.treatment || t("Record created"),
    },
    ...locks.map((lock) => ({
      key: `lock-${lock.id}`,
      date: lock.start_date,
      type: t("Withdrawal"),
      event: lock.is_active ? t("Lock activated") : t("Lock released"),
      details: `${lock.reason || t("No reason provided")}; ${t("End")} ${lock.end_date}`,
    })),
    ...alarms.map((alarm) => ({
      key: `alarm-${alarm.id}`,
      date: alarm.due_date,
      type: t("Alarm"),
      event: alarm.title,
      details: `${tv(alarm.priority)} ${t("Priority")}; ${
        alarm.is_completed ? tv("completed") : tv("open")
      }`,
    })),
  ];

  if (record.inventory_consumption) {
    items.push({
      key: `inventory-${record.id}`,
      date: record.inventory_consumption.movement_date,
      type: t("Inventory Item"),
      event: record.inventory_consumption.item_name,
      details: `${record.inventory_consumption.quantity} ${tv("consumed")}`,
    });
  }

  return items.sort(
    (first, second) =>
      second.date.localeCompare(first.date) ||
      second.key.localeCompare(first.key)
  );
}

function HealthRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAnimalLabel } = useAnimals();

  const [record, setRecord] = useState(null);
  const [withdrawalLocks, setWithdrawalLocks] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHealthWorkflow() {
      try {
        const [recordData, lockData, alarmData] = await Promise.all([
          getHealthRecordById(id),
          getWithdrawalLocks(),
          getAlarms(),
        ]);
        const recordId = Number(id);
        const matchingLocks = lockData.filter(
          (lock) => lock.health_record_id === recordId
        );
        const alarmTitles = new Set(
          matchingLocks.map(
            (lock) =>
              `Withdrawal lock ${lock.id} for animal ${lock.animal_id}`
          )
        );

        setRecord(recordData);
        setWithdrawalLocks(matchingLocks);
        setAlarms(
          alarmData.filter((alarm) => alarmTitles.has(alarm.title))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealthWorkflow();
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      t("Are you sure you want to delete this health record?")
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteHealthRecord(id);
      navigate("/health-records");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading health record...")} className="status-text" />;
  }

  if (!record && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  const today = new Date().toISOString().slice(0, 10);
  const activeLocks = withdrawalLocks.filter(
    (lock) => lock.is_active && lock.end_date >= today
  );
  const openAlarms = alarms.filter((alarm) => !alarm.is_completed);
  const withdrawalStatus = activeLocks.length > 0 ||
    (record.withdrawal_end_date && record.withdrawal_end_date >= today)
    ? "Active"
    : withdrawalLocks.length > 0 || record.withdrawal_end_date
      ? "Ended"
      : "None";
  const timelineItems = buildHealthTimeline(
    record,
    withdrawalLocks,
    alarms
  );

  return (
    <div className="dashboard-page health-detail-page">
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h1>{t("Health Record")}</h1>
            <p>
              {record.record_date} - {getAnimalLabel(record.animal_id)}
            </p>
          </div>
          <div className="dashboard-export-links health-detail-actions">
            <ButtonLink to="/health-records" variant="secondary">
              {t("Back")}
            </ButtonLink>
            <ButtonLink
              to={`/animals/${record.animal_id}`}
              variant="secondary"
            >
              {t("View Animal")}
            </ButtonLink>
            <ButtonLink
              to={`/health-records/${record.id}/edit`}
              variant="secondary"
            >
              {t("Edit")}
            </ButtonLink>
            <button
              className="secondary-button"
              type="button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? t("Deleting...") : t("Delete")}
            </button>
          </div>
        </div>

        {error && <ErrorMessage message={error} className="error-text" />}

        <div className="dashboard-kpi-grid health-detail-kpis">
          <KpiCard title={t("Record Type")} value={tv(record.record_type)} />
          <KpiCard title={t("Withdrawal")} value={tv(withdrawalStatus)} />
          <KpiCard
            title={t("Inventory Consumption")}
            value={record.inventory_consumption ? t("Recorded") : t("None")}
          />
          <KpiCard title={t("Open alarms")} value={openAlarms.length} />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Clinical Summary")}</h2>
            <p>{t("Diagnosis and record context")}</p>
          </div>
        </div>
        <dl className="health-detail-grid">
          <div><dt>{t("Record ID")}</dt><dd>{record.id}</dd></div>
          <div><dt>{t("Animal")}</dt><dd>{getAnimalLabel(record.animal_id)}</dd></div>
          <div><dt>{t("Diagnosis")}</dt><dd>{record.diagnosis || "-"}</dd></div>
          <div><dt>{t("Created At")}</dt><dd>{record.created_at || "-"}</dd></div>
          <div className="health-detail-wide">
            <dt>{t("Notes")}</dt><dd>{record.notes || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Treatment and Medicine")}</h2>
            <p>{t("Recorded treatment plan and medicine usage")}</p>
          </div>
        </div>
        <dl className="health-detail-grid">
          <div className="health-detail-wide">
            <dt>{t("Treatment")}</dt><dd>{record.treatment || "-"}</dd>
          </div>
          <div><dt>{t("Medication")}</dt><dd>{record.medicine_name || "-"}</dd></div>
          <div><dt>{t("Dosage")}</dt><dd>{record.dosage || "-"}</dd></div>
          {record.inventory_consumption && (
            <>
              <div>
                <dt>{t("Inventory Item")}</dt>
                <dd>{record.inventory_consumption.item_name}</dd>
              </div>
              <div>
                <dt>{t("Consumed Quantity")}</dt>
                <dd>{record.inventory_consumption.quantity}</dd>
              </div>
              <div>
                <dt>{t("Movement Date")}</dt>
                <dd>{record.inventory_consumption.movement_date}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Withdrawal Context")}</h2>
            <p>{t("Withdrawal period and linked operational alerts")}</p>
          </div>
        </div>
        <p className="health-withdrawal-summary">
          <strong>{t("Status")}:</strong> {tv(withdrawalStatus)} | <strong>{t("Record end date")}:</strong>{" "}
          {record.withdrawal_end_date || t("None")}
        </p>

        {withdrawalLocks.length === 0 ? (
          <p className="empty-text">{t("No withdrawal locks linked to this record.")}</p>
        ) : (
          <div className="dashboard-records-table">
            <table className="data-table">
              <thead><tr><th>{t("Start")}</th><th>{t("End")}</th><th>{t("Reason")}</th><th>{t("Status")}</th></tr></thead>
              <tbody>{withdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td>{lock.end_date}</td><td>{lock.reason || "-"}</td><td>{tv(lock.is_active && lock.end_date >= today ? "Active" : "Ended")}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {alarms.length > 0 && (
          <div className="health-linked-alarms">
            <h3>{t("Linked Alarms")}</h3>
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead><tr><th>{t("Due Date")}</th><th>{t("Priority")}</th><th>{t("Status")}</th></tr></thead>
                <tbody>{alarms.map((alarm) => <tr key={alarm.id}><td>{alarm.due_date}</td><td>{tv(alarm.priority)}</td><td>{tv(alarm.is_completed ? "Completed" : "Open")}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>{t("Health Workflow Timeline")}</h2>
            <p>{t("Health, medicine, withdrawal, and alert events")}</p>
          </div>
        </div>
        <div className="dashboard-records-table">
          <table className="data-table health-timeline-table">
            <thead><tr><th>{t("Date")}</th><th>{t("Type")}</th><th>{t("Event")}</th><th>{t("Details")}</th></tr></thead>
            <tbody>{timelineItems.map((item) => <tr key={item.key}><td>{item.date}</td><td><span className="health-type-label">{item.type}</span></td><td>{item.event}</td><td>{item.details}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default HealthRecordDetail;
