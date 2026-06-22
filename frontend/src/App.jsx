import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AnimalList from "./pages/AnimalList";
import AnimalCreate from "./pages/AnimalCreate";
import AnimalDetail from "./pages/AnimalDetail";
import AnimalEdit from "./pages/AnimalEdit";
import MilkRecords from "./pages/MilkRecords";
import Vaccinations from "./pages/Vaccinations";
import InventoryItems from "./pages/InventoryItems";
import InventoryItemDetail from "./pages/InventoryItemDetail";
import InventoryItemEdit from "./pages/InventoryItemEdit";
import InventoryMovements from "./pages/InventoryMovements";
import InventoryDashboard from "./pages/InventoryDashboard";
import FinanceRecords from "./pages/FinanceRecords";
import FinanceDetail from "./pages/FinanceDetail";
import FinanceEdit from "./pages/FinanceEdit";
import HealthRecords from "./pages/HealthRecords";
import HealthRecordDetail from "./pages/HealthRecordDetail";
import HealthRecordEdit from "./pages/HealthRecordEdit";
import WithdrawalLocks from "./pages/WithdrawalLocks";
import WithdrawalLockDetail from "./pages/WithdrawalLockDetail";
import WithdrawalLockEdit from "./pages/WithdrawalLockEdit";
import Alarms from "./pages/Alarms";
import AlarmDetail from "./pages/AlarmDetail";
import AlarmEdit from "./pages/AlarmEdit";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AuthProvider from "./context/AuthProvider";
import { useAuth } from "./context/authContext";
import "./App.css";

function ProtectedRoute() {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="status-text">Restoring session...</p>;
  }
  if (!token) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }
  return <Outlet />;
}

function AppContent() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const isAdmin = role === "admin";
  const canUseOperations = isAdmin || role === "worker";
  const canUseCare = isAdmin || role === "veterinarian";
  const navClassName = ({ isActive }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app">
      <nav className="navbar">
        <Link to={token ? "/dashboard" : "/login"} className="nav-logo">
          Farm ERP
        </Link>

        <div className="nav-links">
          {token ? (
            <>
              <NavLink className={navClassName} to="/dashboard">
                {role === "veterinarian" ? "Reports" : "Dashboard"}
              </NavLink>
              <NavLink className={navClassName} to="/animals">
                Animals
              </NavLink>
              {isAdmin && (
                <NavLink className={navClassName} to="/vaccinations">
                  Vaccinations
                </NavLink>
              )}
              {canUseOperations && (
                <>
                  <NavLink className={navClassName} to="/milk-records">
                    Milk Records
                  </NavLink>
                  <NavLink className={navClassName} to="/inventory">
                    Inventory
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink className={navClassName} to="/finance">
                  Finance
                </NavLink>
              )}
              {canUseCare && (
                <>
                  <NavLink className={navClassName} to="/health-records">
                    Health Records
                  </NavLink>
                  <NavLink className={navClassName} to="/withdrawal-locks">
                    Withdrawal Locks
                  </NavLink>
                  <NavLink className={navClassName} to="/alarms">
                    Alarms
                  </NavLink>
                </>
              )}
              {isAdmin && (
                <NavLink className={navClassName} to="/settings">
                  Settings
                </NavLink>
              )}
              <span className="nav-user">
                {user?.full_name}
                {role && <span className="nav-role">{role}</span>}
              </span>
              <button
                className="secondary-button nav-logout"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/animals" element={<AnimalList />} />
            <Route path="/animals/new" element={<AnimalCreate />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />
            <Route path="/animals/:id/edit" element={<AnimalEdit />} />
            <Route path="/vaccinations" element={<Vaccinations />} />
            <Route path="/milk-records" element={<MilkRecords />} />
            <Route path="/inventory" element={<InventoryDashboard />} />
            <Route path="/inventory/items" element={<InventoryItems />} />
            <Route
              path="/inventory/items/:id"
              element={<InventoryItemDetail />}
            />
            <Route
              path="/inventory/items/:id/edit"
              element={<InventoryItemEdit />}
            />
            <Route
              path="/inventory/movements"
              element={<InventoryMovements />}
            />
            <Route path="/finance" element={<FinanceRecords />} />
            <Route path="/finance/:id" element={<FinanceDetail />} />
            <Route path="/finance/:id/edit" element={<FinanceEdit />} />
            <Route path="/health-records" element={<HealthRecords />} />
            <Route
              path="/health-records/:id"
              element={<HealthRecordDetail />}
            />
            <Route
              path="/health-records/:id/edit"
              element={<HealthRecordEdit />}
            />
            <Route path="/withdrawal-locks" element={<WithdrawalLocks />} />
            <Route
              path="/withdrawal-locks/:id"
              element={<WithdrawalLockDetail />}
            />
            <Route
              path="/withdrawal-locks/:id/edit"
              element={<WithdrawalLockEdit />}
            />
            <Route path="/alarms" element={<Alarms />} />
            <Route path="/alarms/:id" element={<AlarmDetail />} />
            <Route path="/alarms/:id/edit" element={<AlarmEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
