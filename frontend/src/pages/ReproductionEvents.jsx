import { useEffect, useState } from "react";
import {
  createReproductionEvent,
  getReproductionEvents,
} from "../api/reproductionEventApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";
import { tAnimal as t, tAnimalValue as tv } from "../i18n";

const initialFormData = {
  animal_id: "",
  event_type: "mating",
  event_date: "",
  pregnancy_status: "true",
  pregnancy_outcome: "unknown",
  offspring_count: "",
  notes: "",
};

function formatPregnancyOutcome(outcome) {
  return tv(outcome) || "-";
}

function getEventDetails(event) {
  if (event.event_type === "pregnancy") {
    return `${event.pregnancy_status ? t("Pregnancy confirmed") : t("Not pregnant")}; ${t("outcome")}: ${formatPregnancyOutcome(event.pregnancy_outcome)}`;
  }
  if (event.event_type === "birth") {
    return `${event.offspring_count} ${t("offspring")}${
      event.is_twin_birth ? ` (${t("twin birth")})` : ""
    }`;
  }
  return `${t("Mating recorded")}; ${t("outcome")}: ${formatPregnancyOutcome(event.pregnancy_outcome)}`;
}

function ReproductionEvents() {
  const {
    animals,
    loading: animalsLoading,
    error: animalsError,
    getAnimalLabel,
  } = useAnimals();
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setEvents(await getReproductionEvents());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

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
    setSuccessMessage("");

    try {
      await createReproductionEvent({
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
      setEvents(await getReproductionEvents());
      setFormData(initialFormData);
      setSuccessMessage(t("Reproduction event created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Reproduction Events")}
        subtitle={t("Record mating, pregnancy, and birth events")}
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
            {t("Event Type")}:
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
            >
              <option value="mating">{t("Mating")}</option>
              <option value="pregnancy">{t("Pregnancy Confirmation")}</option>
              <option value="birth">{t("Birth")}</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            {t("Event Date")}:
            <input
              type="date"
              name="event_date"
              value={formData.event_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        {formData.event_type === "pregnancy" && (
          <div>
            <label>
              {t("Pregnancy Status")}:
              <select
                name="pregnancy_status"
                value={formData.pregnancy_status}
                onChange={handleChange}
              >
                <option value="true">{t("Pregnancy confirmed")}</option>
                <option value="false">{t("Not pregnant")}</option>
              </select>
            </label>
          </div>
        )}
        {formData.event_type !== "birth" && (
          <div>
            <label>
              {t("Pregnancy Outcome")}:
              <select
                name="pregnancy_outcome"
                value={formData.pregnancy_outcome}
                onChange={handleChange}
              >
                <option value="unknown">{t("Unknown")}</option>
                <option value="pregnant">{t("Pregnant")}</option>
                <option value="abortion">{t("Abortion")}</option>
                <option value="failed">{t("Failed")}</option>
              </select>
            </label>
          </div>
        )}
        {formData.event_type === "birth" && (
          <div>
            <label>
              {t("Offspring Count")}:
              <input
                type="number"
                name="offspring_count"
                value={formData.offspring_count}
                onChange={handleChange}
                min="1"
                step="1"
                required
              />
            </label>
          </div>
        )}
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
          {saving ? t("Saving...") : t("Create Reproduction Event")}
        </button>
      </form>

      {loading ? (
        <Loading text={t("Loading reproduction events...")} className="status-text" />
      ) : events.length === 0 ? (
        <p className="empty-text">{t("No reproduction events found.")}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr><th>{t("Date")}</th><th>{t("Animal")}</th><th>{t("Type")}</th><th>{t("Details")}</th><th>{t("Actions")}</th></tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.event_date}</td>
                  <td>{getAnimalLabel(event.animal_id)}</td>
                  <td>{tv(event.event_type)}</td>
                  <td>{getEventDetails(event)}</td>
                  <td>
                    <ButtonLink
                      to={`/reproduction-events/${event.id}`}
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

export default ReproductionEvents;
