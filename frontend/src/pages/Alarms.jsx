import { useEffect, useState } from "react";
import { createAlarm, getAlarms } from "../api/alarmApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

const initialFormData = {
  title: "",
  description: "",
  alarm_type: "reminder",
  priority: "medium",
  due_date: "",
  is_completed: false,
};

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadAlarms() {
      try {
        const data = await getAlarms();
        setAlarms(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAlarms();
  }, []);

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
    setSuccessMessage("");

    const payload = {
      title: formData.title,
      description: formData.description || null,
      alarm_type: formData.alarm_type,
      priority: formData.priority,
      due_date: formData.due_date,
      is_completed: formData.is_completed,
    };

    try {
      await createAlarm(payload);
      const data = await getAlarms();
      setAlarms(data);
      setFormData(initialFormData);
      setSuccessMessage("Alarm created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Alarms"
        subtitle="Create and review manual reminders"
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Title:
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Type:
            <select
              name="alarm_type"
              value={formData.alarm_type}
              onChange={handleChange}
              required
            >
              <option value="vaccination">vaccination</option>
              <option value="withdrawal">withdrawal</option>
              <option value="health">health</option>
              <option value="reminder">reminder</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Priority:
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Due Date:
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Description:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Completed:
            <input
              type="checkbox"
              name="is_completed"
              checked={formData.is_completed}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Alarm"}
        </button>
      </form>

      {loading ? (
        <Loading text="Loading alarms..." className="status-text" />
      ) : alarms.length === 0 ? (
        <p className="empty-text">No alarms found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Completed</th>
              <th>Description</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {alarms.map((alarm) => (
              <tr key={alarm.id}>
                <td>{alarm.id}</td>
                <td>{alarm.title}</td>
                <td>{alarm.alarm_type}</td>
                <td>{alarm.priority}</td>
                <td>{alarm.due_date}</td>
                <td>{alarm.is_completed ? "Yes" : "No"}</td>
                <td>{alarm.description || "-"}</td>
                <td>{alarm.created_at || "-"}</td>
                <td>
                  <ButtonLink to={`/alarms/${alarm.id}`} variant="secondary">
                    View
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Alarms;
