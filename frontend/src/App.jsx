import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <Link to="/" className="nav-logo">
            Farm ERP
          </Link>

          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/animals">Animals</Link>
            <Link to="/vaccinations">Vaccinations</Link>
            <Link to="/milk-records">Milk Records</Link>
            <Link to="/inventory">Inventory</Link>
            <Link to="/inventory/items">Inventory Items</Link>
            <Link to="/inventory/movements">Inventory Movements</Link>
            <Link to="/finance">Finance</Link>
            <Link to="/health-records">Health Records</Link>
            <Link to="/withdrawal-locks">Withdrawal Locks</Link>
            <Link to="/alarms">Alarms</Link>
            <Link to="/settings">Settings</Link>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
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
          </Routes>          
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
