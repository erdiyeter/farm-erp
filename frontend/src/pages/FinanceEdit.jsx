import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getFinanceRecord,
  updateFinanceRecord,
} from "../api/financeApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { tBusiness as t, tBusinessValue as tv } from "../i18n";

const initialFormData = {
  record_type: "income",
  category: "",
  amount: "",
  record_date: "",
  description: "",
};

function FinanceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadFinanceRecord() {
      try {
        const record = await getFinanceRecord(id);

        setFormData({
          record_type: record.record_type || "income",
          category: record.category || "",
          amount: record.amount ?? "",
          record_date: record.record_date || "",
          description: record.description || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceRecord();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      record_type: formData.record_type,
      category: formData.category,
      amount: Number(formData.amount),
      record_date: formData.record_date,
      description: formData.description || null,
    };

    try {
      await updateFinanceRecord(id, payload);
      setSuccessMessage(t("Finance record updated successfully."));
      setTimeout(() => navigate(`/finance/${id}`), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading finance record...")} className="status-text" />;
  }

  if (error && !saving && !successMessage) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Edit Finance Record")}</h1>

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            {t("Type")}:
            <select
              name="record_type"
              value={formData.record_type}
              onChange={handleChange}
              required
            >
              <option value="income">{tv("income")}</option>
              <option value="expense">{tv("expense")}</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            {t("Category")}:
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Amount")}:
            <input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Date")}:
            <input
              type="date"
              name="record_date"
              value={formData.record_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Description")}:
            <input
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving}>
          {saving ? t("Saving...") : t("Save")}
        </button>

        <Link to={`/finance/${id}`}>
          <button type="button">{t("Cancel")}</button>
        </Link>
      </form>
    </div>
  );
}

export default FinanceEdit;
