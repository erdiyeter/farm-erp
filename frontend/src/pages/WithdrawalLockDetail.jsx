import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteWithdrawalLock,
  getWithdrawalLockById,
} from "../api/withdrawalLockApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import useAnimals from "../hooks/useAnimals";
import { tOperation as t } from "../i18n";

function WithdrawalLockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAnimalLabel } = useAnimals();

  const [lock, setLock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWithdrawalLock() {
      try {
        const data = await getWithdrawalLockById(id);
        setLock(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWithdrawalLock();
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      t("Are you sure you want to delete this withdrawal lock?")
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteWithdrawalLock(id);
      navigate("/withdrawal-locks");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Loading
        text={t("Loading withdrawal lock...")}
        className="status-text"
      />
    );
  }

  if (!lock && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Withdrawal Lock Detail")}</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

      <p>
        <strong>{t("ID")}:</strong> {lock.id}
      </p>

      <p>
        <strong>{t("Animal")}:</strong>{" "}
        <ButtonLink to={`/animals/${lock.animal_id}`} variant="secondary">
          {getAnimalLabel(lock.animal_id)}
        </ButtonLink>
      </p>

      <p>
        <strong>{t("Health Record ID")}:</strong> {lock.health_record_id || "-"}
      </p>

      <p>
        <strong>{t("Start Date")}:</strong> {lock.start_date}
      </p>

      <p>
        <strong>{t("End Date")}:</strong> {lock.end_date}
      </p>

      <p>
        <strong>{t("Reason")}:</strong> {lock.reason || "-"}
      </p>

      <p>
        <strong>{t("Active")}:</strong> {lock.is_active ? t("Yes") : t("No")}
      </p>

      <p>
        <strong>{t("Created At")}:</strong> {lock.created_at || "-"}
      </p>

      <p>
        <strong>{t("Updated At")}:</strong> {lock.updated_at || "-"}
      </p>

      <ButtonLink to="/withdrawal-locks" variant="secondary">
        {t("Back")}
      </ButtonLink>

      <ButtonLink
        to={`/withdrawal-locks/${lock.id}/edit`}
        variant="secondary"
      >
        {t("Edit")}
      </ButtonLink>

      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? t("Deleting...") : t("Delete")}
      </button>
    </div>
  );
}

export default WithdrawalLockDetail;
