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

const initialFormData = {
  animal_id: "",
  event_type: "mating",
  event_date: "",
  pregnancy_status: "true",
  offspring_count: "",
  notes: "",
};

function getEventDetails(event) {
  if (event.event_type === "pregnancy") {
    return event.pregnancy_status ? "Pregnancy confirmed" : "Not pregnant";
  }
  if (event.event_type === "birth") {
    return `${event.offspring_count} offspring${
      event.is_twin_birth ? " (twin birth)" : ""
    }`;
  }
  return "Mating recorded";
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
        ? { pregnancy_status: "true", offspring_count: "" }
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
        offspring_count:
          formData.event_type === "birth"
            ? Number(formData.offspring_count)
            : null,
        notes: formData.notes || null,
      });
      setEvents(await getReproductionEvents());
      setFormData(initialFormData);
      setSuccessMessage("Reproduction event created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Reproduction Events"
        subtitle="Record mating, pregnancy, and birth events"
      />
      {error && <ErrorMessage message={error} className="error-text" />}
      {animalsError && (
        <ErrorMessage message={animalsError} className="error-text" />
      )}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form className="health-record-form" onSubmit={handleSubmit}>
        <div>
          <label>
            Animal:
            <select
              className="animal-select"
              name="animal_id"
              value={formData.animal_id}
              onChange={handleChange}
              disabled={animalsLoading}
              required
            >
              <option value="">
                {animalsLoading ? "Loading animals..." : "Select animal"}
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
            Event Type:
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
            >
              <option value="mating">Mating</option>
              <option value="pregnancy">Pregnancy Confirmation</option>
              <option value="birth">Birth</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Event Date:
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
              Pregnancy Status:
              <select
                name="pregnancy_status"
                value={formData.pregnancy_status}
                onChange={handleChange}
              >
                <option value="true">Pregnancy confirmed</option>
                <option value="false">Not pregnant</option>
              </select>
            </label>
          </div>
        )}
        {formData.event_type === "birth" && (
          <div>
            <label>
              Offspring Count:
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
            Notes:
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
            />
          </label>
        </div>
        <button type="submit" disabled={saving || animalsLoading}>
          {saving ? "Saving..." : "Create Reproduction Event"}
        </button>
      </form>

      {loading ? (
        <Loading text="Loading reproduction events..." className="status-text" />
      ) : events.length === 0 ? (
        <p className="empty-text">No reproduction events found.</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Animal</th><th>Type</th><th>Details</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.event_date}</td>
                  <td>{getAnimalLabel(event.animal_id)}</td>
                  <td>{event.event_type}</td>
                  <td>{getEventDetails(event)}</td>
                  <td>
                    <ButtonLink
                      to={`/reproduction-events/${event.id}`}
                      variant="secondary"
                    >
                      View
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
