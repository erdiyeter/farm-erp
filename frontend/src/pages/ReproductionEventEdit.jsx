import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getReproductionEventById,
  updateReproductionEvent,
} from "../api/reproductionEventApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t } from "../i18n";

const initialFormData = {
  animal_id: "",
  event_type: "mating",
  event_date: "",
  pregnancy_status: "true",
  pregnancy_outcome: "unknown",
  offspring_count: "",
  notes: "",
};

function ReproductionEventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { animals, loading: animalsLoading, getAnimalLabel } = useAnimals();
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const event = await getReproductionEventById(id);
        setFormData({
          animal_id: event.animal_id,
          event_type: event.event_type,
          event_date: event.event_date,
          pregnancy_status: String(event.pregnancy_status ?? true),
          pregnancy_outcome: event.pregnancy_outcome || "unknown",
          offspring_count: event.offspring_count ?? "",
          notes: event.notes || "",
        });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "event_type"
        ? {
            pregnancy_status: "true",
            pregnancy_outcome: value === "birth" ? "birth" : "unknown",
            offspring_count: "",
          }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateReproductionEvent(id, {
        animal_id: Number(formData.animal_id),
        event_type: formData.event_type,
        event_date: formData.event_date,
        pregnancy_status:
          formData.event_type === "pregnancy"
            ? formData.pregnancy_status === "true"
            : null,
        pregnancy_outcome:
          formData.event_type === "birth"
            ? "birth"
            : formData.pregnancy_outcome,
        offspring_count:
          formData.event_type === "birth"
            ? Number(formData.offspring_count)
            : null,
        notes: formData.notes || null,
      });
      navigate(`/reproduction-events/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading reproduction event...")} className="status-text" />;
  }
  if (loadError) {
    return <ErrorMessage message={loadError} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>{t("Edit Reproduction Event")}</h1>
      {error && <ErrorMessage message={error} className="error-text" />}
      <form className="health-record-form" onSubmit={handleSubmit}>
        <div>
          <label>
            {t("Animal")}:
            <select name="animal_id" value={formData.animal_id} onChange={handleChange} disabled={animalsLoading} required>
              <option value="">{t("Select animal")}</option>
              {animals.map((animal) => <option key={animal.id} value={animal.id}>{getAnimalLabel(animal.id)}</option>)}
            </select>
          </label>
        </div>
        <div>
          <label>
            {t("Event Type")}:
            <select name="event_type" value={formData.event_type} onChange={handleChange}>
              <option value="mating">{t("Mating")}</option>
              <option value="pregnancy">{t("Pregnancy Confirmation")}</option>
              <option value="birth">{t("Birth")}</option>
            </select>
          </label>
        </div>
        <div><label>{t("Event Date")}:<input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required /></label></div>
        {formData.event_type === "pregnancy" && (
          <div><label>{t("Pregnancy Status")}:<select name="pregnancy_status" value={formData.pregnancy_status} onChange={handleChange}><option value="true">{t("Pregnancy confirmed")}</option><option value="false">{t("Not pregnant")}</option></select></label></div>
        )}
        {formData.event_type !== "birth" && (
          <div><label>{t("Pregnancy Outcome")}:<select name="pregnancy_outcome" value={formData.pregnancy_outcome} onChange={handleChange}><option value="unknown">{t("Unknown")}</option><option value="pregnant">{t("Pregnant")}</option><option value="abortion">{t("Abortion")}</option><option value="failed">{t("Failed")}</option></select></label></div>
        )}
        {formData.event_type === "birth" && (
          <div><label>{t("Offspring Count")}:<input type="number" name="offspring_count" value={formData.offspring_count} onChange={handleChange} min="1" step="1" required /></label></div>
        )}
        <div><label>{t("Notes")}:<textarea name="notes" value={formData.notes} onChange={handleChange} /></label></div>
        <button type="submit" disabled={saving || animalsLoading}>{saving ? t("Saving...") : t("Save")}</button>
        <Link to={`/reproduction-events/${id}`}><button type="button">{t("Cancel")}</button></Link>
      </form>
    </div>
  );
}

export default ReproductionEventEdit;
