import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import "./styles/App.css";
import Register from "./pages/Register";
import DashboardPage from "./pages/DashboardPage";
import WelcomePage from "./pages/WelcomePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole='user'>
            <DashboardPage />
          </ProtectedRoute>
        }
        />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole='admin'>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
        />
        {/* Add more routes as needed */}
        <Route path="*" element={<div className="justify-center items-center">404 Not Found</div>} />
      </Routes>
    </div>
  );
};

export default App;
