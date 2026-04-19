import { useState } from "react";

export default function LoginPage({ setToken, setRole, setEmployeeId }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError("Неправильний логін або пароль");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("employeeId", data.employee_id);

      setToken(data.token);
      setRole(data.role);
      setEmployeeId(data.id_employee);

    } catch {
      setError("Неправильний логін або пароль");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        <input
          placeholder="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}