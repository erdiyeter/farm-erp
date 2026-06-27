import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../api/settingsApi";
import ErrorMessage from "../components/ErrorMessage";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { tAnimal as t } from "../i18n";

const initialFormData = {
  farm_name: "",
  owner_name: "",
  contact_phone: "",
  milk_price: "",
  address: "",
  notes: "",
};

function toFormData(settings) {
  return {
    farm_name: settings.farm_name || "",
    owner_name: settings.owner_name || "",
    contact_phone: settings.contact_phone || "",
    milk_price: settings.milk_price ?? "",
    address: settings.address || "",
    notes: settings.notes || "",
  };
}

function Settings() {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await getSettings();
        setFormData(toFormData(settings));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    const payload = {
      ...Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, value || null])
      ),
      milk_price: formData.milk_price ? Number(formData.milk_price) : null,
    };

    try {
      const settings = await updateSettings(payload);
      setFormData(toFormData(settings));
      setSuccessMessage(t("Settings saved successfully."));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <Loading text={t("Loading settings...")} className="status-text" />;
  }

  return (
    <div className="page-card">
      <PageHeader
        title={t("Settings")}
        subtitle={t("Manage basic farm and application information")}
      />

      {error && <ErrorMessage message={error} className="error-text" />}
      {successMessage && <p className="status-text">{successMessage}</p>}

      <form className="settings-form" onSubmit={handleSubmit}>
        <label>
          {t("Farm Name")}
          <input
            name="farm_name"
            value={formData.farm_name}
            onChange={handleChange}
          />
        </label>

        <label>
          {t("Owner Name")}
          <input
            name="owner_name"
            value={formData.owner_name}
            onChange={handleChange}
          />
        </label>

        <label>
          {t("Contact Phone")}
          <input
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
          />
        </label>

        <label>
          {t("Milk Price")}
          <input
            type="number"
            step="0.01"
            min="0"
            name="milk_price"
            value={formData.milk_price}
            onChange={handleChange}
          />
        </label>

        <label>
          {t("Address")}
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </label>

        <label>
          {t("Notes")}
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
          />
        </label>

        <button type="submit" disabled={saving}>
          {saving ? t("Saving...") : t("Save Settings")}
        </button>
      </form>
    </div>
  );
}

export default Settings;
