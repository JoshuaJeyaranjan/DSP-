import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "./LoginPage.scss";

export default function LoginPage() {
  const { login, error, isAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(password);
    setPassword("");
  };

  // Redirect when login is successful
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard"); // ✅ redirect to admin dashboard
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Admin Access</h1>
        <p className="login-subtitle">Enter the password to continue</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button type="submit" className="login-btn">
            Login
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}