import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getWithdrawalLockById,
  updateWithdrawalLock,
} from "../api/withdrawalLockApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

const initialFormData = {
  animal_id: "",
  health_record_id: "",
  start_date: "",
  end_date: "",
  reason: "",
  is_active: true,
};

function WithdrawalLockEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWithdrawalLock() {
      try {
        const lock = await getWithdrawalLockById(id);

        setFormData({
          animal_id: lock.animal_id ?? "",
          health_record_id: lock.health_record_id ?? "",
          start_date: lock.start_date || "",
          end_date: lock.end_date || "",
          reason: lock.reason || "",
          is_active: lock.is_active ?? true,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWithdrawalLock();
  }, [id]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      animal_id: Number(formData.animal_id),
      health_record_id: formData.health_record_id
        ? Number(formData.health_record_id)
        : null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason || null,
      is_active: formData.is_active,
    };

    try {
      await updateWithdrawalLock(id, payload);
      navigate(`/withdrawal-locks/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text="Loading withdrawal lock..."
        className="status-text"
      />
    );
  }

  if (error && !saving) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Edit Withdrawal Lock</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

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

        <div>
          <label>
            Active:
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>

        <Link to={`/withdrawal-locks/${id}`}>
          <button type="button">Cancel</button>
        </Link>
      </form>
    </div>
  );
}

export default WithdrawalLockEdit;
