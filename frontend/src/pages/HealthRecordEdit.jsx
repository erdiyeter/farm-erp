import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getHealthRecordById,
  updateHealthRecord,
} from "../api/healthRecordApi";
import { getInventoryItems } from "../api/inventoryApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import { useAuth } from "../context/authContext";

const initialFormData = {
  animal_id: "",
  record_type: "treatment",
  record_date: "",
  diagnosis: "",
  treatment: "",
  medicine_name: "",
  dosage: "",
  inventory_item_id: "",
  withdrawal_end_date: "",
  notes: "",
};

function HealthRecordEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [hasInventoryConsumption, setHasInventoryConsumption] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canUseInventory = user?.role === "admin";

  useEffect(() => {
    async function loadHealthRecord() {
      try {
        const [record, items] = await Promise.all([
          getHealthRecordById(id),
          canUseInventory ? getInventoryItems() : Promise.resolve([]),
        ]);

        setFormData({
          animal_id: record.animal_id ?? "",
          record_type: record.record_type || "treatment",
          record_date: record.record_date || "",
          diagnosis: record.diagnosis || "",
          treatment: record.treatment || "",
          medicine_name: record.medicine_name || "",
          dosage: record.dosage || "",
          inventory_item_id:
            record.inventory_consumption?.item_id ?? "",
          withdrawal_end_date: record.withdrawal_end_date || "",
          notes: record.notes || "",
        });
        setInventoryItems(items);
        setHasInventoryConsumption(Boolean(record.inventory_consumption));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealthRecord();
  }, [canUseInventory, id]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
      ...(name === "record_type" && value !== "treatment"
        ? { inventory_item_id: "" }
        : {}),
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
      inventory_item_id:
        formData.record_type === "treatment" && formData.inventory_item_id
          ? Number(formData.inventory_item_id)
          : null,
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

      <form className="health-record-form" onSubmit={handleSubmit}>
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
              disabled={hasInventoryConsumption}
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
              disabled={hasInventoryConsumption}
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

        {formData.record_type === "treatment" && (
          <>
            <div>
              <label>
                Dosage:
                <input
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  disabled={hasInventoryConsumption}
                  required={Boolean(formData.inventory_item_id)}
                  placeholder="Numeric when consuming inventory"
                />
              </label>
            </div>

            {canUseInventory && (
              <div>
                <label>
                  Inventory Item:
                  <select
                    name="inventory_item_id"
                    value={formData.inventory_item_id}
                    onChange={handleChange}
                    disabled={hasInventoryConsumption}
                  >
                    <option value="">No inventory consumption</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.current_quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </label>
                {hasInventoryConsumption && (
                  <small className="health-form-note">
                    Inventory consumption has already been recorded and cannot
                    be changed here.
                  </small>
                )}
              </div>
            )}
          </>
        )}

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
