import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteWithdrawalLock,
  getWithdrawalLockById,
} from "../api/withdrawalLockApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

function WithdrawalLockDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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
      "Are you sure you want to delete this withdrawal lock?"
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
        text="Loading withdrawal lock..."
        className="status-text"
      />
    );
  }

  if (!lock && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Withdrawal Lock Detail</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

      <p>
        <strong>ID:</strong> {lock.id}
      </p>

      <p>
        <strong>Animal ID:</strong> {lock.animal_id}
      </p>

      <p>
        <strong>Health Record ID:</strong> {lock.health_record_id || "-"}
      </p>

      <p>
        <strong>Start Date:</strong> {lock.start_date}
      </p>

      <p>
        <strong>End Date:</strong> {lock.end_date}
      </p>

      <p>
        <strong>Reason:</strong> {lock.reason || "-"}
      </p>

      <p>
        <strong>Active:</strong> {lock.is_active ? "Yes" : "No"}
      </p>

      <p>
        <strong>Created At:</strong> {lock.created_at || "-"}
      </p>

      <p>
        <strong>Updated At:</strong> {lock.updated_at || "-"}
      </p>

      <ButtonLink to="/withdrawal-locks" variant="secondary">
        Back
      </ButtonLink>

      <ButtonLink
        to={`/withdrawal-locks/${lock.id}/edit`}
        variant="secondary"
      >
        Edit
      </ButtonLink>

      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}

export default WithdrawalLockDetail;
