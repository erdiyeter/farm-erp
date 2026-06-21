import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAlarms } from "../api/alarmApi";
import { deleteAnimal } from "../api/animalApi";
import { getHealthRecordsByAnimalId } from "../api/healthRecordApi";
import { getMilkRecordsByAnimalId } from "../api/milkRecordApi";
import { getWithdrawalLocks } from "../api/withdrawalLockApi";
import Loading from "../components/Loading";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import { useAuth } from "../context/authContext";
import useAnimalDetail from "../hooks/useAnimalDetail";

const initialOperationalData = {
  milkRecords: [],
  healthRecords: [],
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

function buildTimeline(operationalData) {
  const items = [
    ...operationalData.milkRecords.map((record) => ({
      key: `milk-${record.id}`,
      date: record.record_date,
      type: "Milk",
      event: `${record.milk_liters} liters${
        record.session ? ` (${record.session})` : ""
      }`,
      details: record.notes || "Milk production recorded",
    })),
    ...operationalData.healthRecords.map((record) => ({
      key: `health-${record.id}`,
      date: record.record_date,
      type: "Health",
      event: record.record_type,
      details:
        record.diagnosis || record.treatment || "Health activity recorded",
    })),
    ...operationalData.withdrawalLocks.map((lock) => ({
      key: `lock-${lock.id}`,
      date: lock.start_date,
      type: "Withdrawal Lock",
      event: lock.is_active ? "Lock activated" : "Released lock",
      details: `${lock.reason || "No reason provided"}; ends ${lock.end_date}`,
    })),
    ...operationalData.alarms.map((alarm) => ({
      key: `alarm-${alarm.id}`,
      date: alarm.due_date,
      type: "Alarm",
      event: alarm.title,
      details: `${alarm.priority} priority; ${
        alarm.is_completed ? "completed" : "open"
      }`,
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
  const today = new Date().toISOString().slice(0, 10);
  const last30DaysStart = getDateDaysAgo(30);
  const last30DaysMilkLiters = operationalData.milkRecords
    .filter(
      (record) =>
        record.record_date >= last30DaysStart && record.record_date <= today
    )
    .reduce((total, record) => total + Number(record.milk_liters), 0)
    .toFixed(2);
  const lastMilkRecordDate = getLatestRecordDate(
    operationalData.milkRecords
  );
  const lastHealthRecordDate = getLatestRecordDate(
    operationalData.healthRecords
  );
  const timelineItems = buildTimeline(operationalData);

  useEffect(() => {
    async function loadOperationalData() {
      setOperationalLoading(true);
      setOperationalError("");
      try {
        const [milkRecords, healthRecords, locks, alarms] =
          await Promise.all([
            canViewMilk
              ? getMilkRecordsByAnimalId(id)
              : Promise.resolve([]),
            canViewCare
              ? getHealthRecordsByAnimalId(id)
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
  }, [canViewCare, canViewMilk, id]);

  async function handleDeactivate() {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this animal?"
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
        "Unable to deactivate animal. Please make sure the backend server is running."
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text="Loading animal details..."
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
            <h1>Animal Identity</h1>
            <p>Core profile and current status for {animal.ear_tag}</p>
          </div>
          <div className="dashboard-export-links animal-profile-actions">
            <Link className="dashboard-nav-link" to="/animals">
              Back to Animals
            </Link>
            <Link
              className="dashboard-nav-link"
              to={`/animals/${animal.id}/edit`}
            >
              Edit
            </Link>
            {animal.is_active === true && (
              <button
                className="dashboard-nav-link"
                type="button"
                onClick={handleDeactivate}
                disabled={deleting}
              >
                {deleting ? "Deactivating..." : "Deactivate"}
              </button>
            )}
          </div>
        </div>

        <dl className="animal-identity-grid">
          <div><dt>ID</dt><dd>{animal.id}</dd></div>
          <div><dt>Ear Tag</dt><dd>{animal.ear_tag}</dd></div>
          <div><dt>Name</dt><dd>{animal.name || "-"}</dd></div>
          <div><dt>Species</dt><dd>{animal.species || "-"}</dd></div>
          <div><dt>Breed</dt><dd>{animal.breed || "-"}</dd></div>
          <div><dt>Sex</dt><dd>{animal.sex || "-"}</dd></div>
          <div><dt>Birth Date</dt><dd>{animal.birth_date || "-"}</dd></div>
          <div><dt>Status</dt><dd>{animal.is_active ? "Active" : "Inactive"}</dd></div>
          <div className="animal-identity-notes">
            <dt>Notes</dt><dd>{animal.notes || "-"}</dd>
          </div>
        </dl>
      </section>

      {operationalError && (
        <ErrorMessage message={operationalError} className="error-text" />
      )}

      {operationalLoading ? (
        <Loading
          text="Loading operational details..."
          className="status-text"
        />
      ) : operationalError ? null : (
        <>
          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Operational Summary</h2>
                <p>Current activity linked to this animal</p>
              </div>
            </div>

            <div className="dashboard-kpi-grid animal-profile-metrics">
              <KpiCard
                title="Total Milk Records"
                value={canViewMilk ? operationalData.milkRecords.length : "-"}
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
                title="Total Health Records"
                value={canViewCare ? operationalData.healthRecords.length : "-"}
              />
              <KpiCard
                title="Last Health Record Date"
                value={canViewCare ? lastHealthRecordDate || "-" : "-"}
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
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Operational Timeline</h2>
                <p>Milk, health, withdrawal, and alarm activity</p>
              </div>
            </div>

            {timelineItems.length === 0 ? (
              <p className="empty-text">No timeline activity found.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table animal-profile-timeline">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Event</th>
                      <th>Details</th>
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
                        <td>{item.event}</td>
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
                <h2>Recent Milk Records</h2>
                <p>Latest five milk records</p>
              </div>
            </div>

            {!canViewMilk ? (
              <p className="empty-text">
                Milk records are not available for your role.
              </p>
            ) : operationalData.milkRecords.length === 0 ? (
              <p className="empty-text">No milk records found.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Liters</th>
                      <th>Session</th>
                      <th>Notes</th>
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
                <h2>Recent Health Records</h2>
                <p>Latest five health records</p>
              </div>
            </div>

            {!canViewCare ? (
              <p className="empty-text">
                Health records are not available for your role.
              </p>
            ) : operationalData.healthRecords.length === 0 ? (
              <p className="empty-text">No health records found.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Diagnosis</th>
                      <th>Treatment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalData.healthRecords
                      .slice(0, 5)
                      .map((record) => (
                        <tr key={record.id}>
                          <td>{record.record_date}</td>
                          <td>{record.record_type}</td>
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
                <h2>Active Withdrawal Locks</h2>
                <p>Current withdrawal periods for this animal</p>
              </div>
            </div>

            {!canViewCare ? (
              <p className="empty-text">
                Withdrawal locks are not available for your role.
              </p>
            ) : operationalData.activeLocks.length === 0 ? (
              <p className="empty-text">No active withdrawal locks.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Reason</th>
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
                <h2>Open Alarms</h2>
                <p>Open withdrawal alarms reliably linked to this animal</p>
              </div>
            </div>

            {!canViewCare ? (
              <p className="empty-text">
                Alarms are not available for your role.
              </p>
            ) : operationalData.activeAlarms.length === 0 ? (
              <p className="empty-text">No open alarms found.</p>
            ) : (
              <div className="dashboard-records-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalData.activeAlarms.map((alarm) => (
                      <tr key={alarm.id}>
                        <td>{alarm.title}</td>
                        <td>{alarm.priority}</td>
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
            <h2>Future Profile Areas</h2>
            <p>Reserved for later operational development</p>
          </div>
        </div>
        <div className="animal-profile-placeholder-grid">
          {[
            ["Lactation", "Lactation tracking will be added in a future sprint."],
            ["Reproduction", "Reproduction history will be added in a future sprint."],
            ["Performance", "Performance indicators will be added in a future sprint."],
            ["Genetics / Breeding", "Genetics and breeding data will be added in a future sprint."],
          ].map(([title, message]) => (
            <section
              className="dashboard-section animal-profile-placeholder"
              key={title}
            >
              <span className="animal-profile-placeholder-status">Planned</span>
              <h2>{title}</h2>
              <p>{message}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnimalDetail;
