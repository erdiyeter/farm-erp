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
import { tAnimal as t, tAnimalValue as tv } from "../i18n";

function formatPregnancyOutcome(outcome) {
  return tv(outcome) || "-";
}

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
    if (!window.confirm(t("Are you sure you want to delete this reproduction event?"))) {
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
    return <Loading text={t("Loading reproduction event...")} className="status-text" />;
  }
  if (!event) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Reproduction Event Detail")}</h1>
      {error && <ErrorMessage message={error} className="error-text" />}
      <dl className="health-detail-grid">
        <div><dt>{t("Animal")}</dt><dd>{getAnimalLabel(event.animal_id)}</dd></div>
        <div><dt>{t("Event Type")}</dt><dd>{tv(event.event_type)}</dd></div>
        <div><dt>{t("Event Date")}</dt><dd>{event.event_date}</dd></div>
        <div>
          <dt>{t("Pregnancy Status")}</dt>
          <dd>{event.pregnancy_status === null ? "-" : event.pregnancy_status ? t("Confirmed") : t("Not pregnant")}</dd>
        </div>
        <div><dt>{t("Pregnancy Outcome")}</dt><dd>{formatPregnancyOutcome(event.pregnancy_outcome)}</dd></div>
        <div><dt>{t("Offspring Count")}</dt><dd>{event.offspring_count ?? "-"}</dd></div>
        <div><dt>{t("Twin Birth")}</dt><dd>{event.is_twin_birth ? t("Yes") : t("No")}</dd></div>
        <div className="health-detail-wide"><dt>{t("Notes")}</dt><dd>{event.notes || "-"}</dd></div>
      </dl>
      <div className="dashboard-export-links">
        <ButtonLink to="/reproduction-events" variant="secondary">{t("Back")}</ButtonLink>
        <ButtonLink to={`/reproduction-events/${event.id}/edit`} variant="secondary">{t("Edit")}</ButtonLink>
        <button onClick={handleDelete} disabled={deleting}>
          {deleting ? t("Deleting...") : t("Delete")}
        </button>
      </div>
    </div>
  );
}

export default ReproductionEventDetail;
