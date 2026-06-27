import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getWeightRecordById,
  updateWeightRecord,
} from "../api/weightRecordApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t } from "../i18n";

const initialFormData = {
  animal_id: "",
  record_date: "",
  weight_kg: "",
  notes: "",
};

function WeightRecordEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    animals,
    loading: animalsLoading,
    error: animalsError,
    getAnimalLabel,
  } = useAnimals();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadWeightRecord() {
      try {
        const record = await getWeightRecordById(id);
        setFormData({
          animal_id: record.animal_id ?? "",
          record_date: record.record_date || "",
          weight_kg: record.weight_kg ?? "",
          notes: record.notes || "",
        });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWeightRecord();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await updateWeightRecord(id, {
        animal_id: Number(formData.animal_id),
        record_date: formData.record_date,
        weight_kg: Number(formData.weight_kg),
        notes: formData.notes || null,
      });
      navigate(`/weight-records/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading weight record...")} className="status-text" />;
  }

  if (loadError) {
    return <ErrorMessage message={loadError} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Edit Weight Record")}</h1>

      {error && <ErrorMessage message={error} className="error-text" />}
      {animalsError && (
        <ErrorMessage message={animalsError} className="error-text" />
      )}

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
              {formData.animal_id &&
                !animals.some(
                  (animal) => animal.id === Number(formData.animal_id)
                ) && (
                  <option value={formData.animal_id}>
                    {getAnimalLabel(formData.animal_id)}
                  </option>
                )}
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
          {saving ? t("Saving...") : t("Save")}
        </button>
        <Link to={`/weight-records/${id}`}>
          <button type="button">{t("Cancel")}</button>
        </Link>
      </form>
    </div>
  );
}

export default WeightRecordEdit;
