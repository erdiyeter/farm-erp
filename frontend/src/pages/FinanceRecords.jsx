import { useEffect, useState } from "react";
import {
  createFinanceRecord,
  getFinanceRecords,
} from "../api/financeApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { tBusiness as t, tBusinessValue as tv } from "../i18n";

const initialFormData = {
  record_type: "income",
  category: "",
  amount: "",
  record_date: "",
  description: "",
};

function FinanceRecords() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadFinanceRecords() {
      try {
        const data = await getFinanceRecords();
        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFinanceRecords();
  }, []);

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
      await createFinanceRecord(payload);
      const data = await getFinanceRecords();
      setRecords(data);
      setFormData(initialFormData);
      setSuccessMessage(t("Finance record created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Finance Records")}
        subtitle={t("Create and review income and expense records")}
      />

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
          {saving ? t("Saving...") : t("Create Finance Record")}
        </button>
      </form>

      {loading ? (
        <Loading text={t("Loading finance records...")} className="status-text" />
      ) : records.length === 0 ? (
        <p className="empty-text">{t("No finance records found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Type")}</th>
              <th>{t("Category")}</th>
              <th>{t("Amount")}</th>
              <th>{t("Date")}</th>
              <th>{t("Description")}</th>
              <th>{t("Created At")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{tv(record.record_type)}</td>
                <td>{record.category}</td>
                <td>{record.amount}</td>
                <td>{record.record_date}</td>
                <td>{record.description || "-"}</td>
                <td>{record.created_at || "-"}</td>
                <td>
                  <ButtonLink to={`/finance/${record.id}`} variant="secondary">
                    {t("View")}
                  </ButtonLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default FinanceRecords;
