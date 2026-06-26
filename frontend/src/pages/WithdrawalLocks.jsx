import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createWithdrawalLock,
  getWithdrawalLocks,
} from "../api/withdrawalLockApi";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import useAnimals from "../hooks/useAnimals";
import { tOperation as t } from "../i18n";

const initialFormData = {
  animal_id: "",
  health_record_id: "",
  start_date: "",
  end_date: "",
  reason: "",
};

function getTodayText() {
  return new Date().toISOString().slice(0, 10);
}

function WithdrawalLocks() {
  const {
    animals,
    loading: animalsLoading,
    error: animalsError,
    getAnimalLabel,
  } = useAnimals();
  const [locks, setLocks] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const today = getTodayText();
  const filteredLocks = locks.filter((lock) => {
    if (activeFilter === "active") {
      return lock.is_active === true && lock.end_date >= today;
    }

    if (activeFilter === "expired") {
      return lock.end_date < today;
    }

    if (activeFilter === "released") {
      return lock.is_active === false;
    }

    return true;
  });

  useEffect(() => {
    async function loadWithdrawalLocks() {
      try {
        const data = await getWithdrawalLocks();
        setLocks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadWithdrawalLocks();
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
      health_record_id: formData.health_record_id
        ? Number(formData.health_record_id)
        : null,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason || null,
    };

    try {
      await createWithdrawalLock(payload);
      const data = await getWithdrawalLocks();
      setLocks(data);
      setFormData(initialFormData);
      setSuccessMessage(t("Withdrawal lock created successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Withdrawal Locks")}
        subtitle={t("Create and review manual withdrawal periods")}
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
            {t("Health Record ID")}:
            <input
              type="number"
              name="health_record_id"
              value={formData.health_record_id}
              onChange={handleChange}
            />
          </label>
        </div>

        <div>
          <label>
            {t("Start Date")}:
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("End Date")}:
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <div>
          <label>
            {t("Reason")}:
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
            />
          </label>
        </div>

        <button type="submit" disabled={saving || animalsLoading}>
          {saving ? t("Saving...") : t("Create Withdrawal Lock")}
        </button>
      </form>

      <div className="filter-bar">
        <label>
          {t("Filter")}:
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
          >
            <option value="all">{t("All")}</option>
            <option value="active">{t("Active")}</option>
            <option value="expired">{t("Expired")}</option>
            <option value="released">{t("Released")}</option>
          </select>
        </label>
      </div>

      {loading ? (
        <Loading
          text={t("Loading withdrawal locks...")}
          className="status-text"
        />
      ) : locks.length === 0 ? (
        <p className="empty-text">{t("No withdrawal locks found.")}</p>
      ) : filteredLocks.length === 0 ? (
        <p className="empty-text">{t("No withdrawal locks match this filter.")}</p>
      ) : (
        <div className="dashboard-records-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("ID")}</th>
                <th>{t("Animal")}</th>
                <th>{t("Health Record ID")}</th>
                <th>{t("Start Date")}</th>
                <th>{t("End Date")}</th>
                <th>{t("Reason")}</th>
                <th>{t("Active")}</th>
                <th>{t("Created At")}</th>
                <th>{t("Updated At")}</th>
                <th>{t("Actions")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredLocks.map((lock) => (
                <tr key={lock.id}>
                  <td>{lock.id}</td>
                  <td>
                    <Link to={`/animals/${lock.animal_id}`}>
                      {getAnimalLabel(lock.animal_id)}
                    </Link>
                  </td>
                  <td>{lock.health_record_id || "-"}</td>
                  <td>{lock.start_date}</td>
                  <td>{lock.end_date}</td>
                  <td>{lock.reason || "-"}</td>
                  <td>{lock.is_active ? t("Yes") : t("No")}</td>
                  <td>{lock.created_at || "-"}</td>
                  <td>{lock.updated_at || "-"}</td>
                  <td>
                    <ButtonLink
                      to={`/withdrawal-locks/${lock.id}`}
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

export default WithdrawalLocks;
