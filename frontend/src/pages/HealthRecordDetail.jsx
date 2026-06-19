import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteHealthRecord,
  getHealthRecordById,
} from "../api/healthRecordApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

function HealthRecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHealthRecord() {
      try {
        const data = await getHealthRecordById(id);
        setRecord(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealthRecord();
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this health record?"
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteHealthRecord(id);
      navigate("/health-records");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading text="Loading health record..." className="status-text" />;
  }

  if (!record && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Health Record Detail</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

      <p>
        <strong>ID:</strong> {record.id}
      </p>

      <p>
        <strong>Animal ID:</strong> {record.animal_id}
      </p>

      <p>
        <strong>Type:</strong> {record.record_type}
      </p>

      <p>
        <strong>Date:</strong> {record.record_date}
      </p>

      <p>
        <strong>Diagnosis:</strong> {record.diagnosis || "-"}
      </p>

      <p>
        <strong>Treatment:</strong> {record.treatment || "-"}
      </p>

      <p>
        <strong>Medication:</strong> {record.medicine_name || "-"}
      </p>

      <p>
        <strong>Dosage:</strong> {record.dosage || "-"}
      </p>

      <p>
        <strong>Withdrawal End Date:</strong>{" "}
        {record.withdrawal_end_date || "-"}
      </p>

      <p>
        <strong>Notes:</strong> {record.notes || "-"}
      </p>

      <p>
        <strong>Created At:</strong> {record.created_at || "-"}
      </p>

      <ButtonLink to="/health-records" variant="secondary">
        Back to Health Records
      </ButtonLink>

      <ButtonLink
        to={`/health-records/${record.id}/edit`}
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

export default HealthRecordDetail;
