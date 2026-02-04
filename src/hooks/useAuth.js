import { useState } from "react";

const ADMIN_PASSWORD = import.meta.env.VITE_SUPER_SECRET;

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem("isAuthenticated");
    console.log("Initial isAuthenticated from localStorage:", saved);
    return saved === "true";
  });
  const [error, setError] = useState(null);

  const login = (password) => {
    console.log("Attempting login with password:", password);
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true");
      setError(null);
      console.log("Login successful!");
    } else {
      setError("Invalid password");
      console.log("Login failed: Invalid password");
    }
  };

  const logout = () => {
    console.log("Logging out");
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
  };

  return { isAuthenticated, login, logout, error };
}
