import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createVaccination,
  getVaccinations,
} from "../api/vaccinationApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t } from "../i18n";

const initialFormData = {
  animal_id: "",
  vaccine_name: "",
  dose: "",
  application_date: "",
  next_due_date: "",
  notes: "",
};

function Vaccinations() {
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
    async function loadVaccinations() {
      try {
        const data = await getVaccinations();
        setRecords(data);
      } catch {
        setError(t("Error: Failed to load vaccination records"));
      } finally {
        setLoading(false);
      }
    }

    loadVaccinations();
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
      vaccine_name: formData.vaccine_name,
      dose: formData.dose || null,
      application_date: formData.application_date,
      next_due_date: formData.next_due_date || null,
      notes: formData.notes || null,
    };

    try {
      await createVaccination(payload);
      const data = await getVaccinations();
      setRecords(data);
      setFormData(initialFormData);
      setSuccessMessage(t("Vaccination record created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Vaccinations")}
        subtitle={t("Create and review vaccination records")}
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
            {t("Vaccine Name")}:
            <input
              name="vaccine_name"
              value={formData.vaccine_name}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Dose")}:
            <input
              name="dose"
              value={formData.dose}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            {t("Application Date")}:
            <input
              type="date"
              name="application_date"
              value={formData.application_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Next Due Date")}:
            <input
              type="date"
              name="next_due_date"
              value={formData.next_due_date}
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
          {saving ? t("Saving...") : t("Create Vaccination Record")}
        </button>
      </form>

      {loading ? (
        <Loading
          text={t("Loading vaccination records...")}
          className="status-text"
        />
      ) : records.length === 0 ? (
        <p className="empty-text">{t("No vaccination records found.")}</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("ID")}</th>
              <th>{t("Animal")}</th>
              <th>{t("Vaccine Name")}</th>
              <th>{t("Dose")}</th>
              <th>{t("Application Date")}</th>
              <th>{t("Next Due Date")}</th>
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
                <td>{record.vaccine_name}</td>
                <td>{record.dose || "-"}</td>
                <td>{record.application_date}</td>
                <td>{record.next_due_date || "-"}</td>
                <td>{record.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Vaccinations;
