import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteFinanceRecord,
  getFinanceRecord,
} from "../api/financeApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { tBusiness as t, tBusinessValue as tv } from "../i18n";

function FinanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFinanceRecord() {
      try {
        const data = await getFinanceRecord(id);
        setRecord(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceRecord();
  }, [id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      t("Are you sure you want to delete this finance record?")
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteFinanceRecord(id);
      navigate("/finance");
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading finance record...")} className="status-text" />;
  }

  if (!record && error) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Finance Record Detail")}</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

      <p>
        <strong>{t("ID")}:</strong> {record.id}
      </p>

      <p>
        <strong>{t("Type")}:</strong> {tv(record.record_type)}
      </p>

      <p>
        <strong>{t("Category")}:</strong> {record.category}
      </p>

      <p>
        <strong>{t("Amount")}:</strong> {record.amount}
      </p>

      <p>
        <strong>{t("Date")}:</strong> {record.record_date}
      </p>

      <p>
        <strong>{t("Description")}:</strong> {record.description || "-"}
      </p>

      <p>
        <strong>{t("Active")}:</strong> {record.is_active ? t("Yes") : t("No")}
      </p>

      <p>
        <strong>{t("Created At")}:</strong> {record.created_at || "-"}
      </p>

      <ButtonLink to="/finance" variant="secondary">
        {t("Back")}
      </ButtonLink>

      <ButtonLink to={`/finance/${record.id}/edit`} variant="secondary">
        {t("Edit")}
      </ButtonLink>

      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? t("Deleting...") : t("Delete")}
      </button>
    </div>
  );
}

export default FinanceDetail;
