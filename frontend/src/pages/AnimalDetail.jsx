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
import useAnimalDetail from "../hooks/useAnimalDetail";

const initialOperationalData = {
  milkRecords: [],
  healthRecords: [],
  activeLocks: [],
  activeAlarms: [],
};

function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { animal, loading, error, setError } = useAnimalDetail(id);
  const [deleting, setDeleting] = useState(false);
  const [operationalData, setOperationalData] = useState(
    initialOperationalData
  );
  const [operationalLoading, setOperationalLoading] = useState(true);
  const [operationalError, setOperationalError] = useState("");

  useEffect(() => {
    async function loadOperationalData() {
      try {
        const [milkRecords, healthRecords, locks, alarms] =
          await Promise.all([
            getMilkRecordsByAnimalId(id),
            getHealthRecordsByAnimalId(id),
            getWithdrawalLocks(),
            getAlarms(),
          ]);
        const today = new Date().toISOString().slice(0, 10);
        const animalId = Number(id);
        const activeLocks = locks.filter(
          (lock) =>
            lock.animal_id === animalId &&
            lock.is_active === true &&
            lock.end_date >= today
        );
        const activeAlarmTitles = new Set(
          activeLocks.map(
            (lock) =>
              `Withdrawal lock ${lock.id} for animal ${animalId}`
          )
        );
        const activeAlarms = alarms.filter(
          (alarm) =>
            !alarm.is_completed && activeAlarmTitles.has(alarm.title)
        );

        setOperationalData({
          milkRecords,
          healthRecords,
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
  }, [id]);

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
    <div className="dashboard-page">
      <section className="dashboard-section">
        <h1>Animal Detail</h1>

        <p>
          <strong>ID:</strong> {animal.id}
        </p>

        <p>
          <strong>Ear Tag:</strong> {animal.ear_tag}
        </p>

        <p>
          <strong>Name:</strong> {animal.name || "-"}
        </p>

        <p>
          <strong>Species:</strong> {animal.species || "-"}
        </p>

        <p>
          <strong>Breed:</strong> {animal.breed || "-"}
        </p>

        <p>
          <strong>Sex:</strong> {animal.sex || "-"}
        </p>

        <p>
          <strong>Birth Date:</strong> {animal.birth_date || "-"}
        </p>

        <p>
          <strong>Notes:</strong> {animal.notes || "-"}
        </p>

        <p>
          <strong>Active:</strong> {animal.is_active ? "Yes" : "No"}
        </p>

        <Link to="/animals">
          <button>Back to Animals</button>
        </Link>

        <Link to={`/animals/${animal.id}/edit`}>
          <button>Edit</button>
        </Link>

        {animal.is_active === true && (
          <button onClick={handleDeactivate} disabled={deleting}>
            {deleting ? "Deactivating..." : "Deactivate"}
          </button>
        )}
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
                <h2>Simple Operational Summary</h2>
                <p>Current activity linked to this animal</p>
              </div>
            </div>

            <div className="dashboard-kpi-grid">
              <KpiCard
                title="Milk Records"
                value={operationalData.milkRecords.length}
              />
              <KpiCard
                title="Health Records"
                value={operationalData.healthRecords.length}
              />
              <KpiCard
                title="Active Withdrawal Locks"
                value={operationalData.activeLocks.length}
              />
              <KpiCard
                title="Active Alarms"
                value={operationalData.activeAlarms.length}
              />
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-header">
              <div>
                <h2>Recent Milk Records</h2>
                <p>Latest five milk records</p>
              </div>
            </div>

            {operationalData.milkRecords.length === 0 ? (
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

            {operationalData.healthRecords.length === 0 ? (
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

            {operationalData.activeLocks.length === 0 ? (
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
                <h2>Active Alarms</h2>
                <p>Open withdrawal alarms linked to this animal</p>
              </div>
            </div>

            {operationalData.activeAlarms.length === 0 ? (
              <p className="empty-text">No active alarms found.</p>
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
    </div>
  );
}

export default AnimalDetail;
