import { useEffect, useState } from "react";
import {
  createHealthRecord,
  getHealthRecords,
} from "../api/healthRecordApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";

const initialFormData = {
  animal_id: "",
  record_type: "treatment",
  record_date: "",
  diagnosis: "",
  treatment: "",
  medication: "",
  vet_name: "",
  notes: "",
};

function HealthRecords() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadHealthRecords() {
      try {
        const data = await getHealthRecords();
        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealthRecords();
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
      record_type: formData.record_type,
      record_date: formData.record_date,
      diagnosis: formData.diagnosis || null,
      treatment: formData.treatment || null,
      medicine_name: formData.medication || null,
      vet_name: formData.vet_name || null,
      notes: formData.notes || null,
    };

    try {
      await createHealthRecord(payload);
      const data = await getHealthRecords();
      setRecords(data);
      setFormData(initialFormData);
      setSuccessMessage("Health record created successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title="Health Records"
        subtitle="Create and review animal health records"
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Animal ID:
            <input
              type="number"
              name="animal_id"
              value={formData.animal_id}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Record Type:
            <select
              name="record_type"
              value={formData.record_type}
              onChange={handleChange}
              required
            >
              <option value="treatment">treatment</option>
              <option value="illness">illness</option>
              <option value="checkup">checkup</option>
              <option value="vaccination">vaccination</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Record Date:
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
            Diagnosis:
            <input
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Treatment:
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Medication:
            <input
              name="medication"
              value={formData.medication}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Vet Name:
            <input
              name="vet_name"
              value={formData.vet_name}
              onChange={handleChange}
            />
          </label>
        </div>

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

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create Health Record"}
        </button>
      </form>

      {loading ? (
        <Loading text="Loading health records..." className="status-text" />
      ) : records.length === 0 ? (
        <p className="empty-text">No health records found.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Animal ID</th>
              <th>Type</th>
              <th>Date</th>
              <th>Diagnosis</th>
              <th>Treatment</th>
              <th>Medication</th>
              <th>Notes</th>
              <th>Created At</th>
            </tr>
          </thead>

          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.id}</td>
                <td>{record.animal_id}</td>
                <td>{record.record_type}</td>
                <td>{record.record_date}</td>
                <td>{record.diagnosis || "-"}</td>
                <td>{record.treatment || "-"}</td>
                <td>{record.medicine_name || "-"}</td>
                <td>{record.notes || "-"}</td>
                <td>{record.created_at || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default HealthRecords;
