import { useEffect, useState } from "react";
import {
  createWeightRecord,
  getWeightRecords,
} from "../api/weightRecordApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t } from "../i18n";

const initialFormData = {
  animal_id: "",
  record_date: "",
  weight_kg: "",
  notes: "",
};

function newestFirst(first, second) {
  return (
    second.record_date.localeCompare(first.record_date) || second.id - first.id
  );
}

function WeightRecords() {
  const {
    animals,
    loading: animalsLoading,
    error: animalsError,
    getAnimalLabel,
  } = useAnimals();
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadWeightRecords() {
      try {
        const data = await getWeightRecords();
        setRecords([...data].sort(newestFirst));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWeightRecords();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      await createWeightRecord({
        animal_id: Number(formData.animal_id),
        record_date: formData.record_date,
        weight_kg: Number(formData.weight_kg),
        notes: formData.notes || null,
      });
      const data = await getWeightRecords();
      setRecords([...data].sort(newestFirst));
      setFormData(initialFormData);
      setSuccessMessage(t("Weight record created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Weight Records")}
        subtitle={t("Create and review animal weight records")}
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {animalsError && (
        <ErrorMessage message={animalsError} className="error-text" />
      )}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form className="health-record-form" onSubmit={handleSubmit}>
        <div>
          <label>
            {t("Animal")}:
            <select
              className="animal-select"
              name="animal_id"
              value={formData.animal_id}
              onChange={handleChange}
              disabled={animalsLoading}
              required
            >
              <option value="">
                {animalsLoading ? t("Loading animals...") : t("Select animal")}
              </option>
              {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                  {getAnimalLabel(animal.id)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            {t("Record Date")}:
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
            {t("Weight")} (kg):
            <input
              type="number"
              name="weight_kg"
              value={formData.weight_kg}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Notes")}:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving || animalsLoading}>
          {saving ? t("Saving...") : t("Create Weight Record")}
        </button>
      </form>

      {loading ? (
        <Loading text={t("Loading weight records...")} className="status-text" />
      ) : records.length === 0 ? (
        <p className="empty-text">{t("No weight records found.")}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Date")}</th>
                <th>{t("Animal")}</th>
                <th>{t("Weight")}</th>
                <th>{t("Notes")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.record_date}</td>
                  <td>{getAnimalLabel(record.animal_id)}</td>
                  <td>{record.weight_kg} kg</td>
                  <td>{record.notes || "-"}</td>
                  <td>
                    <ButtonLink
                      to={`/weight-records/${record.id}`}
                      variant="secondary"
                    >
                      {t("View")}
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WeightRecords;
