import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteReproductionEvent,
  getReproductionEventById,
} from "../api/reproductionEventApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import useAnimals from "../hooks/useAnimals";

function ReproductionEventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAnimalLabel } = useAnimals();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        setEvent(await getReproductionEventById(id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this reproduction event?")) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await deleteReproductionEvent(id);
      navigate("/reproduction-events");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading text="Loading reproduction event..." className="status-text" />;
  }
  if (!event) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Reproduction Event Detail</h1>
      {error && <ErrorMessage message={error} className="error-text" />}
      <dl className="health-detail-grid">
        <div><dt>Animal</dt><dd>{getAnimalLabel(event.animal_id)}</dd></div>
        <div><dt>Event Type</dt><dd>{event.event_type}</dd></div>
        <div><dt>Event Date</dt><dd>{event.event_date}</dd></div>
        <div>
          <dt>Pregnancy Status</dt>
          <dd>{event.pregnancy_status === null ? "-" : event.pregnancy_status ? "Confirmed" : "Not pregnant"}</dd>
        </div>
        <div><dt>Offspring Count</dt><dd>{event.offspring_count ?? "-"}</dd></div>
        <div><dt>Twin Birth</dt><dd>{event.is_twin_birth ? "Yes" : "No"}</dd></div>
        <div className="health-detail-wide"><dt>Notes</dt><dd>{event.notes || "-"}</dd></div>
      </dl>
      <div className="dashboard-export-links">
        <ButtonLink to="/reproduction-events" variant="secondary">Back</ButtonLink>
        <ButtonLink to={`/reproduction-events/${event.id}/edit`} variant="secondary">Edit</ButtonLink>
        <button onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default ReproductionEventDetail;
