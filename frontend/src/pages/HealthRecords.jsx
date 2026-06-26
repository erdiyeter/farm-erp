import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createHealthRecord,
  getHealthRecords,
} from "../api/healthRecordApi";
import { getInventoryItems } from "../api/inventoryApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import KpiCard from "../components/KpiCard";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/authContext";
import useAnimals from "../hooks/useAnimals";
import { tOperation as t, tOperationValue as tv } from "../i18n";

const initialFormData = {
  animal_id: "",
  record_type: "treatment",
  record_date: "",
  diagnosis: "",
  treatment: "",
  medication: "",
  dosage: "",
  inventory_item_id: "",
  notes: "",
};

function getWithdrawalStatus(record, today) {
  if (!record.withdrawal_end_date) {
    return "None";
  }
  return record.withdrawal_end_date >= today ? "Active" : "Ended";
}

function HealthRecords() {
  const { user } = useAuth();
  const {
    animals,
    loading: animalsLoading,
    error: animalsError,
    getAnimalLabel,
  } = useAnimals();
  const [records, setRecords] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const canUseInventory = user?.role === "admin";
  const filteredRecords = records.filter((record) => {
    if (activeFilter === "checkup") {
      return record.record_type === "checkup";
    }

    if (activeFilter === "treatment") {
      return record.record_type === "treatment";
    }

    if (activeFilter === "illness") {
      return record.record_type === "illness";
    }

    if (activeFilter === "vaccination") {
      return record.record_type === "vaccination";
    }

    return true;
  });

  const treatmentCount = records.filter(
    (record) => record.record_type === "treatment"
  ).length;
  const illnessCount = records.filter(
    (record) => record.record_type === "illness"
  ).length;
  const vaccinationCount = records.filter(
    (record) => record.record_type === "vaccination"
  ).length;
  const checkupCount = records.filter(
    (record) => record.record_type === "checkup"
  ).length;
  const today = new Date().toISOString().slice(0, 10);
  const activeWithdrawalCount = records.filter(
    (record) =>
      record.withdrawal_end_date && record.withdrawal_end_date >= today
  ).length;

  useEffect(() => {
    async function loadHealthRecords() {
      try {
        const [recordData, itemData] = await Promise.all([
          getHealthRecords(),
          canUseInventory ? getInventoryItems() : Promise.resolve([]),
        ]);
        setRecords(recordData);
        setInventoryItems(itemData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadHealthRecords();
  }, [canUseInventory]);

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
    setSuccessMessage("");

    const payload = {
      animal_id: Number(formData.animal_id),
      record_type: formData.record_type,
      record_date: formData.record_date,
      diagnosis: formData.diagnosis || null,
      treatment: formData.treatment || null,
      medicine_name: formData.medication || null,
      dosage:
        formData.record_type === "treatment"
          ? formData.dosage || null
          : null,
      inventory_item_id:
        formData.record_type === "treatment" && formData.inventory_item_id
          ? Number(formData.inventory_item_id)
          : null,
      notes: formData.notes || null,
    };

    try {
    await createHealthRecord(payload);
      const [recordData, itemData] = await Promise.all([
        getHealthRecords(),
        canUseInventory ? getInventoryItems() : Promise.resolve([]),
      ]);
      setRecords(recordData);
      setInventoryItems(itemData);
      setFormData(initialFormData);
      setSuccessMessage(t("Health record created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Health Records")}
        subtitle={t("Create and review animal health records")}
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
            {t("Record Type")}:
            <select
              name="record_type"
              value={formData.record_type}
              onChange={handleChange}
              required
            >
              <option value="treatment">{tv("treatment")}</option>
              <option value="illness">{tv("illness")}</option>
              <option value="checkup">{tv("checkup")}</option>
              <option value="vaccination">{tv("vaccination")}</option>
            </select>
          </label>
        </div>

        {formData.record_type === "treatment" && (
          <>
            <div>
              <label>
                {t("Dosage")}:
                <input
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleChange}
                  required={Boolean(formData.inventory_item_id)}
                  placeholder={t("Numeric when consuming inventory")}
                />
              </label>
            </div>

            {canUseInventory ? (
              <div>
                <label>
                  {t("Inventory Item")}:
                  <select
                    name="inventory_item_id"
                    value={formData.inventory_item_id}
                    onChange={handleChange}
                  >
                    <option value="">{t("No inventory consumption")}</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.current_quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                  <small>
                    {t("Selecting an item records the numeric dosage as inventory use.")}
                  </small>
                </label>
              </div>
            ) : (
              <p className="health-form-note">
                {t("Inventory consumption selection is available to administrators.")}
              </p>
            )}
          </>
        )}

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
            {t("Diagnosis")}:
            <input
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            {t("Treatment")}:
            <textarea
              name="treatment"
              value={formData.treatment}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            {t("Medication")}:
            <input
              name="medication"
              value={formData.medication}
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
          {saving ? t("Saving...") : t("Create Health Record")}
        </button>
      </form>

      <div className="dashboard-kpi-grid health-kpi-grid">
        <KpiCard title={t("Total Records")} value={records.length} />
        <KpiCard title={t("Treatments")} value={treatmentCount} />
        <KpiCard title={t("Illnesses")} value={illnessCount} />
        <KpiCard title={t("Vaccinations")} value={vaccinationCount} />
        <KpiCard title={t("Checkups")} value={checkupCount} />
        <KpiCard
          title={t("Active Withdrawal Locks")}
          value={activeWithdrawalCount}
        />
      </div>

      <div className="filter-bar">
        <label>
          {t("Filter")}:
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
          >
            <option value="all">{t("All Records")}</option>
            <option value="checkup">{t("Checkups")}</option>
            <option value="treatment">{t("Treatments")}</option>
            <option value="illness">{t("Illnesses")}</option>
            <option value="vaccination">{t("Vaccinations")}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Loading text={t("Loading health records...")} className="status-text" />
      ) : records.length === 0 ? (
        <p className="empty-text">{t("No health records found.")}</p>
      ) : filteredRecords.length === 0 ? (
        <p className="empty-text">{t("No health records match this filter.")}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("Date")}</th>
                <th>{t("Animal")}</th>
                <th>{t("Type")}</th>
                <th>{t("Diagnosis")}</th>
                <th>{t("Treatment")}</th>
                <th>{t("Medicine Usage")}</th>
                <th>{t("Withdrawal")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.record_date}</td>
                  <td>
                    <Link to={`/animals/${record.animal_id}`}>
                      {getAnimalLabel(record.animal_id)}
                    </Link>
                  </td>
                  <td>
                    <span className="health-type-label">
                      {tv(record.record_type)}
                    </span>
                  </td>
                  <td>{record.diagnosis || "-"}</td>
                  <td>{record.treatment || "-"}</td>
                  <td className="health-medicine-cell">
                    <strong>{record.medicine_name || "-"}</strong>
                    {record.dosage && <small>{t("Dosage")}: {record.dosage}</small>}
                  </td>
                  <td>
                    <span className="health-withdrawal-label">
                      {tv(getWithdrawalStatus(record, today))}
                    </span>
                    {record.withdrawal_end_date && (
                      <small>{t("End")}: {record.withdrawal_end_date}</small>
                    )}
                  </td>
                  <td>
                    <ButtonLink
                      to={`/health-records/${record.id}`}
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

export default HealthRecords;
