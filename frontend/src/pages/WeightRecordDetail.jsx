import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteWeightRecord,
  getWeightRecordById,
} from "../api/weightRecordApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t } from "../i18n";

function WeightRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: animalsError, getAnimalLabel } = useAnimals();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWeightRecord() {
      try {
        setRecord(await getWeightRecordById(id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWeightRecord();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(t("Are you sure you want to delete this weight record?"))) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteWeightRecord(id);
      navigate("/weight-records");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading weight record...")} className="status-text" />;
  }

  if (!record) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Weight Record Detail")}</h1>

      {error && <ErrorMessage message={error} className="error-text" />}
      {animalsError && (
        <ErrorMessage message={animalsError} className="error-text" />
      )}

      <dl className="health-detail-grid">
        <div>
          <dt>{t("Animal")}</dt>
          <dd>{getAnimalLabel(record.animal_id)}</dd>
        </div>
        <div>
          <dt>{t("Record Date")}</dt>
          <dd>{record.record_date}</dd>
        </div>
        <div>
          <dt>{t("Weight")}</dt>
          <dd>{record.weight_kg} kg</dd>
        </div>
        <div className="health-detail-wide">
          <dt>{t("Notes")}</dt>
          <dd>{record.notes || "-"}</dd>
        </div>
      </dl>

      <div className="dashboard-export-links">
        <ButtonLink to="/weight-records" variant="secondary">
          {t("Back")}
        </ButtonLink>
        <ButtonLink
          to={`/weight-records/${record.id}/edit`}
          variant="secondary"
        >
          {t("Edit")}
        </ButtonLink>
        <button onClick={handleDelete} disabled={deleting}>
          {deleting ? t("Deleting...") : t("Delete")}
        </button>
      </div>
    </div>
  );
}

export default WeightRecordDetail;
