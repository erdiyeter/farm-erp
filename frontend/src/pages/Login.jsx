import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/authContext";
import { tAnimal as t } from "../i18n";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const authData = await loginUser(email, password);
      login(authData);
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-card login-page">
      <h1>{t("Login")}</h1>
      <p className="page-subtitle">{t("Sign in to access Farm ERP.")}</p>

      {error && <ErrorMessage message={error} className="error-text" />}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          {t("Email")}
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          {t("Password")}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? t("Logging in...") : t("Login")}
        </button>
      </form>
    </div>
  );
}

export default Login;
