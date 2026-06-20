import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteAlarm, getAlarmById } from "../api/alarmApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

function AlarmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [alarm, setAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAlarm() {
      try {
        const data = await getAlarmById(id);
        setAlarm(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAlarm();
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this alarm?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteAlarm(id);
      navigate("/alarms");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading text="Loading alarm..." className="status-text" />;
  }

  if (!alarm && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Alarm Detail</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

      <p>
        <strong>ID:</strong> {alarm.id}
      </p>

      <p>
        <strong>Title:</strong> {alarm.title}
      </p>

      <p>
        <strong>Description:</strong> {alarm.description || "-"}
      </p>

      <p>
        <strong>Type:</strong> {alarm.alarm_type}
      </p>

      <p>
        <strong>Priority:</strong> {alarm.priority}
      </p>

      <p>
        <strong>Due Date:</strong> {alarm.due_date}
      </p>

      <p>
        <strong>Completed:</strong> {alarm.is_completed ? "Yes" : "No"}
      </p>

      <p>
        <strong>Created At:</strong> {alarm.created_at || "-"}
      </p>

      <ButtonLink to="/alarms" variant="secondary">
        Back
      </ButtonLink>

      <ButtonLink to={`/alarms/${alarm.id}/edit`} variant="secondary">
        Edit
      </ButtonLink>

      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

export default AlarmDetail;
