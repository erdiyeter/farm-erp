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

function buildHealthTimeline(record, locks, alarms) {
  const items = [
    {
      key: `health-${record.id}`,
      date: record.record_date,
      type: "Health Record",
      event: record.record_type,
      details: record.diagnosis || record.treatment || "Record created",
    },
    ...locks.map((lock) => ({
      key: `lock-${lock.id}`,
      date: lock.start_date,
      type: "Withdrawal",
      event: lock.is_active ? "Lock activated" : "Lock released",
      details: `${lock.reason || "No reason provided"}; ends ${lock.end_date}`,
    })),
    ...alarms.map((alarm) => ({
      key: `alarm-${alarm.id}`,
      date: alarm.due_date,
      type: "Alarm",
      event: alarm.title,
      details: `${alarm.priority} priority; ${
        alarm.is_completed ? "completed" : "open"
      }`,
    })),
  ];

  if (record.inventory_consumption) {
    items.push({
      key: `inventory-${record.id}`,
      date: record.inventory_consumption.movement_date,
      type: "Inventory",
      event: record.inventory_consumption.item_name,
      details: `${record.inventory_consumption.quantity} consumed`,
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
      "Are you sure you want to delete this health record?"
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
    return <Loading text="Loading health record..." className="status-text" />;
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
            <h1>Health Record</h1>
            <p>
              {record.record_date} - Animal {record.animal_id}
            </p>
          </div>
          <div className="dashboard-export-links health-detail-actions">
            <ButtonLink to="/health-records" variant="secondary">
              Back
            </ButtonLink>
            <ButtonLink
              to={`/animals/${record.animal_id}`}
              variant="secondary"
            >
              View Animal
            </ButtonLink>
            <ButtonLink
              to={`/health-records/${record.id}/edit`}
              variant="secondary"
            >
              Edit
            </ButtonLink>
            <button
              className="secondary-button"
              type="button"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {error && <ErrorMessage message={error} className="error-text" />}

        <div className="dashboard-kpi-grid health-detail-kpis">
          <KpiCard title="Record Type" value={record.record_type} />
          <KpiCard title="Withdrawal" value={withdrawalStatus} />
          <KpiCard
            title="Inventory Consumption"
            value={record.inventory_consumption ? "Recorded" : "None"}
          />
          <KpiCard title="Open Alarms" value={openAlarms.length} />
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Clinical Summary</h2>
            <p>Diagnosis and record context</p>
          </div>
        </div>
        <dl className="health-detail-grid">
          <div><dt>Record ID</dt><dd>{record.id}</dd></div>
          <div><dt>Animal ID</dt><dd>{record.animal_id}</dd></div>
          <div><dt>Diagnosis</dt><dd>{record.diagnosis || "-"}</dd></div>
          <div><dt>Created At</dt><dd>{record.created_at || "-"}</dd></div>
          <div className="health-detail-wide">
            <dt>Notes</dt><dd>{record.notes || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Treatment and Medicine</h2>
            <p>Recorded treatment plan and medicine usage</p>
          </div>
        </div>
        <dl className="health-detail-grid">
          <div className="health-detail-wide">
            <dt>Treatment</dt><dd>{record.treatment || "-"}</dd>
          </div>
          <div><dt>Medication</dt><dd>{record.medicine_name || "-"}</dd></div>
          <div><dt>Dosage</dt><dd>{record.dosage || "-"}</dd></div>
          {record.inventory_consumption && (
            <>
              <div>
                <dt>Inventory Item</dt>
                <dd>{record.inventory_consumption.item_name}</dd>
              </div>
              <div>
                <dt>Consumed Quantity</dt>
                <dd>{record.inventory_consumption.quantity}</dd>
              </div>
              <div>
                <dt>Movement Date</dt>
                <dd>{record.inventory_consumption.movement_date}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Withdrawal Context</h2>
            <p>Withdrawal period and linked operational alerts</p>
          </div>
        </div>
        <p className="health-withdrawal-summary">
          <strong>Status:</strong> {withdrawalStatus} | <strong>Record end date:</strong>{" "}
          {record.withdrawal_end_date || "Not set"}
        </p>

        {withdrawalLocks.length === 0 ? (
          <p className="empty-text">No withdrawal locks linked to this record.</p>
        ) : (
          <div className="dashboard-records-table">
            <table className="data-table">
              <thead><tr><th>Start</th><th>End</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>{withdrawalLocks.map((lock) => <tr key={lock.id}><td>{lock.start_date}</td><td>{lock.end_date}</td><td>{lock.reason || "-"}</td><td>{lock.is_active && lock.end_date >= today ? "Active" : "Ended"}</td></tr>)}</tbody>
            </table>
          </div>
        )}

        {alarms.length > 0 && (
          <div className="health-linked-alarms">
            <h3>Linked Alarms</h3>
            <div className="dashboard-records-table">
              <table className="data-table">
                <thead><tr><th>Due Date</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>{alarms.map((alarm) => <tr key={alarm.id}><td>{alarm.due_date}</td><td>{alarm.priority}</td><td>{alarm.is_completed ? "Completed" : "Open"}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Health Workflow Timeline</h2>
            <p>Health, medicine, withdrawal, and alert events</p>
          </div>
        </div>
        <div className="dashboard-records-table">
          <table className="data-table health-timeline-table">
            <thead><tr><th>Date</th><th>Type</th><th>Event</th><th>Details</th></tr></thead>
            <tbody>{timelineItems.map((item) => <tr key={item.key}><td>{item.date}</td><td><span className="health-type-label">{item.type}</span></td><td>{item.event}</td><td>{item.details}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default HealthRecordDetail;
