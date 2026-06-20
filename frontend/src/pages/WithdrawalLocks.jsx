import { useEffect, useState } from "react";
import {
  createWithdrawalLock,
  getWithdrawalLocks,
} from "../api/withdrawalLockApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

const initialFormData = {
  animal_id: "",
  health_record_id: "",
  start_date: "",
  end_date: "",
  reason: "",
};

function WithdrawalLocks() {
  const [locks, setLocks] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadWithdrawalLocks() {
      try {
        const data = await getWithdrawalLocks();
        setLocks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWithdrawalLocks();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      animal_id: Number(formData.animal_id),
      health_record_id: formData.health_record_id
        ? Number(formData.health_record_id)
        : null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason || null,
    };

    try {
      await createWithdrawalLock(payload);
      const data = await getWithdrawalLocks();
      setLocks(data);
      setFormData(initialFormData);
      setSuccessMessage("Withdrawal lock created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Withdrawal Locks"
        subtitle="Create and review manual withdrawal periods"
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Animal ID:
            <input
              type="number"
              name="animal_id"
              value={formData.animal_id}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Health Record ID:
            <input
              type="number"
              name="health_record_id"
              value={formData.health_record_id}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Start Date:
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            End Date:
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Reason:
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Withdrawal Lock"}
        </button>
      </form>

      {loading ? (
        <Loading
          text="Loading withdrawal locks..."
          className="status-text"
        />
      ) : locks.length === 0 ? (
        <p className="empty-text">No withdrawal locks found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Animal ID</th>
              <th>Health Record ID</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Reason</th>
              <th>Active</th>
              <th>Created At</th>
              <th>Updated At</th>
            </tr>
          </thead>

          <tbody>
            {locks.map((lock) => (
              <tr key={lock.id}>
                <td>{lock.id}</td>
                <td>{lock.animal_id}</td>
                <td>{lock.health_record_id || "-"}</td>
                <td>{lock.start_date}</td>
                <td>{lock.end_date}</td>
                <td>{lock.reason || "-"}</td>
                <td>{lock.is_active ? "Yes" : "No"}</td>
                <td>{lock.created_at || "-"}</td>
                <td>{lock.updated_at || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default WithdrawalLocks;
