import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createMilkRecord,
  getMilkRecords,
} from "../api/milkRecordApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t } from "../i18n";

const initialFormData = {
  animal_id: "",
  record_date: "",
  milk_liters: "",
  session: "",
  notes: "",
};

function MilkRecords() {
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
    async function loadMilkRecords() {
      try {
        const data = await getMilkRecords();
        setRecords(data);
      } catch {
        setError(t("Error: Failed to load milk records"));
      } finally {
        setLoading(false);
      }
    }

    loadMilkRecords();
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
      animal_id: Number(formData.animal_id),
      record_date: formData.record_date,
      milk_liters: Number(formData.milk_liters),
      session: formData.session || null,
      notes: formData.notes || null,
    };

    try {
      await createMilkRecord(payload);
      const data = await getMilkRecords();
      setRecords(data);
      setFormData(initialFormData);
      setSuccessMessage(t("Milk record created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Milk Records")}
        subtitle={t("Create and review milk production records")}
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {animalsError && (
        <ErrorMessage message={animalsError} className="error-text" />
      )}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
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
            {t("Milk Liters")}:
            <input
              type="number"
              step="0.01"
              name="milk_liters"
              value={formData.milk_liters}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Session")}:
            <input
              name="session"
              value={formData.session}
              onChange={handleChange}
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
          {saving ? t("Saving...") : t("Create Milk Record")}
        </button>
      </form>

      {loading ? (
        <Loading text={t("Loading milk records...")} className="status-text" />
      ) : records.length === 0 ? (
        <p className="empty-text">{t("No milk records found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Animal")}</th>
              <th>{t("Date")}</th>
              <th>{t("Milk Liters")}</th>
              <th>{t("Session")}</th>
              <th>{t("Notes")}</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>
                  <Link to={`/animals/${record.animal_id}`}>
                    {getAnimalLabel(record.animal_id)}
                  </Link>
                </td>
                <td>{record.record_date}</td>
                <td>{record.milk_liters}</td>
                <td>{record.session || "-"}</td>
                <td>{record.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MilkRecords;
