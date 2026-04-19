import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import LoginPage from "./LoginPage";
import ManagerPage from "./ManagerPage";
import CashierPage from "./CashierPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [employeeId, setEmployeeId] = useState(localStorage.getItem("employeeId"));

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setEmployeeId(null);
  };

  const PrivateRoute = ({ children, allowedRole }) => {
    if (!token) return <Navigate to="/" />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/" />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            token
              ? role === "MANAGER"
                ? <Navigate to="/manager" />
                : <Navigate to="/cashier" />
              : <LoginPage setToken={setToken} setRole={setRole} setEmployeeId={setEmployeeId} />
          }
        />

        <Route
          path="/manager"
          element={
            <PrivateRoute allowedRole="MANAGER">
              <ManagerPage logout={logout} />
            </PrivateRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <PrivateRoute allowedRole="CASHIER">
              <CashierPage logout={logout} employeeId={employeeId} />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;