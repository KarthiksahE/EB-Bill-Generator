import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import GenerateBill from "./pages/GenerateBill";
import ApplianceTracker from "./pages/ApplianceTracker";
import Reports from "./pages/Reports";
import MeterReading from "./pages/MeterReading";
import EditProfile from "./pages/EditProfile";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/generate-bill"
        element={
          <PrivateRoute>
            <GenerateBill />
          </PrivateRoute>
        }
      />
      <Route
        path="/appliances"
        element={
          <PrivateRoute>
            <ApplianceTracker />
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <Reports />
          </PrivateRoute>
        }
      />
      <Route
        path="/meter-reading"
        element={
          <PrivateRoute>
            <MeterReading />
          </PrivateRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <PrivateRoute>
            <EditProfile />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
