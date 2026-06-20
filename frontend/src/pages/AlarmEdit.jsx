import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAlarmById, updateAlarm } from "../api/alarmApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

const initialFormData = {
  title: "",
  description: "",
  alarm_type: "reminder",
  priority: "medium",
  due_date: "",
  is_completed: false,
};

function AlarmEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAlarm() {
      try {
        const alarm = await getAlarmById(id);

        setFormData({
          title: alarm.title || "",
          description: alarm.description || "",
          alarm_type: alarm.alarm_type || "reminder",
          priority: alarm.priority || "medium",
          due_date: alarm.due_date || "",
          is_completed: alarm.is_completed ?? false,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAlarm();
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
      title: formData.title,
      description: formData.description || null,
      alarm_type: formData.alarm_type,
      priority: formData.priority,
      due_date: formData.due_date,
      is_completed: formData.is_completed,
    };

    try {
      await updateAlarm(id, payload);
      navigate(`/alarms/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text="Loading alarm..." className="status-text" />;
  }

  if (error && !saving) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Edit Alarm</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

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
          {saving ? "Saving..." : "Save"}
        </button>

        <Link to={`/alarms/${id}`}>
          <button type="button">Cancel</button>
        </Link>
      </form>
    </div>
  );
}

export default AlarmEdit;
