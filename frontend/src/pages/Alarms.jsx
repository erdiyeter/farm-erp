import { useEffect, useState } from "react";
import { createAlarm, getAlarms } from "../api/alarmApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { tOperation as t, tOperationValue as tv } from "../i18n";

const initialFormData = {
  title: "",
  description: "",
  alarm_type: "reminder",
  priority: "medium",
  due_date: "",
  is_completed: false,
};

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const today = getTodayText();
  const filteredAlarms = alarms.filter((alarm) => {
    if (activeFilter === "open") {
      return !alarm.is_completed;
    }

    if (activeFilter === "completed") {
      return alarm.is_completed;
    }

    if (activeFilter === "overdue") {
      return !alarm.is_completed && alarm.due_date < today;
    }

    if (activeFilter === "upcoming") {
      return !alarm.is_completed && alarm.due_date >= today;
    }

    return true;
  });

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
      setSuccessMessage(t("Alarm created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Alarms")}
        subtitle={t("Create and review manual reminders")}
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            {t("Title")}:
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
            {t("Type")}:
            <select
              name="alarm_type"
              value={formData.alarm_type}
              onChange={handleChange}
              required
            >
              <option value="vaccination">{tv("vaccination")}</option>
              <option value="withdrawal">{tv("withdrawal")}</option>
              <option value="health">{tv("health")}</option>
              <option value="reminder">{tv("reminder")}</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            {t("Priority")}:
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
            >
              <option value="low">{tv("low")}</option>
              <option value="medium">{tv("medium")}</option>
              <option value="high">{tv("high")}</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            {t("Due Date")}:
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
            {t("Description")}:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            {t("Completed")}:
            <input
              type="checkbox"
              name="is_completed"
              checked={formData.is_completed}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? t("Saving...") : t("Create Alarm")}
        </button>
      </form>

      <div className="filter-bar">
        <label>
          {t("Filter")}:
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
          >
            <option value="all">{t("All alarms")}</option>
            <option value="open">{t("Open alarms")}</option>
            <option value="completed">{t("Completed alarms")}</option>
            <option value="overdue">{t("Overdue alarms")}</option>
            <option value="upcoming">{t("Upcoming alarms")}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Loading text={t("Loading alarms...")} className="status-text" />
      ) : alarms.length === 0 ? (
        <p className="empty-text">{t("No alarms found.")}</p>
      ) : filteredAlarms.length === 0 ? (
        <p className="empty-text">{t("No alarms match this filter.")}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("ID")}</th>
                <th>{t("Title")}</th>
                <th>{t("Type")}</th>
                <th>{t("Priority")}</th>
                <th>{t("Due Date")}</th>
                <th>{t("Completed")}</th>
                <th>{t("Description")}</th>
                <th>{t("Created At")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredAlarms.map((alarm) => (
                <tr key={alarm.id}>
                  <td>{alarm.id}</td>
                  <td>{alarm.title}</td>
                  <td>{tv(alarm.alarm_type)}</td>
                  <td>{tv(alarm.priority)}</td>
                  <td>{alarm.due_date}</td>
                  <td>{alarm.is_completed ? t("Yes") : t("No")}</td>
                  <td>{alarm.description || "-"}</td>
                  <td>{alarm.created_at || "-"}</td>
                  <td>
                    <ButtonLink
                      to={`/alarms/${alarm.id}`}
                      variant="secondary"
                    >
                      {t("View")}
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Alarms;
