import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getHealthRecordById,
  updateHealthRecord,
} from "../api/healthRecordApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";

const initialFormData = {
  animal_id: "",
  record_type: "treatment",
  record_date: "",
  diagnosis: "",
  treatment: "",
  medicine_name: "",
  dosage: "",
  withdrawal_end_date: "",
  notes: "",
};

function HealthRecordEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHealthRecord() {
      try {
        const record = await getHealthRecordById(id);

        setFormData({
          animal_id: record.animal_id ?? "",
          record_type: record.record_type || "treatment",
          record_date: record.record_date || "",
          diagnosis: record.diagnosis || "",
          treatment: record.treatment || "",
          medicine_name: record.medicine_name || "",
          dosage: record.dosage || "",
          withdrawal_end_date: record.withdrawal_end_date || "",
          notes: record.notes || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealthRecord();
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

    const payload = {
      animal_id: Number(formData.animal_id),
      record_type: formData.record_type,
      record_date: formData.record_date,
      diagnosis: formData.diagnosis || null,
      treatment: formData.treatment || null,
      medicine_name: formData.medicine_name || null,
      dosage: formData.dosage || null,
      withdrawal_end_date: formData.withdrawal_end_date || null,
      notes: formData.notes || null,
    };

    try {
      await updateHealthRecord(id, payload);
      navigate(`/health-records/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text="Loading health record..." className="status-text" />;
  }

  if (error && !saving) {
    return <ErrorMessage message={error} className="error-text" />;
  }

  return (
    <div className="page-card">
      <h1>Edit Health Record</h1>

      {error && <ErrorMessage message={error} className="error-text" />}

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
              name="medicine_name"
              value={formData.medicine_name}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Dosage:
            <input
              name="dosage"
              value={formData.dosage}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            Withdrawal End Date:
            <input
              type="date"
              name="withdrawal_end_date"
              value={formData.withdrawal_end_date}
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
          {saving ? "Saving..." : "Save"}
        </button>

        <Link to={`/health-records/${id}`}>
          <button type="button">Cancel</button>
        </Link>
      </form>
    </div>
  );
}

export default HealthRecordEdit;
