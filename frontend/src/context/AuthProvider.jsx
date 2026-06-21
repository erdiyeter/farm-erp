import { useEffect, useState } from "react";
import { getCurrentUser } from "../api/authApi";
import { AuthContext } from "./authContext";


const TOKEN_KEY = "farm_erp_access_token";

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setUser(await getCurrentUser(token));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [token]);

  function login(authData) {
    localStorage.setItem(TOKEN_KEY, authData.access_token);
    setToken(authData.access_token);
    setUser(authData.user);
    setLoading(false);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
