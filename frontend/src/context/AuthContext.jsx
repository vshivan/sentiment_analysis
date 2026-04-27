import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const BASE = "/api";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem("senti_token"));
  const [loading, setLoading] = useState(true);

  // Set axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Verify token on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get(`${BASE}/auth/me`)
      .then(r => setUser(r.data.user))
      .catch(() => { localStorage.removeItem("senti_token"); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await axios.post(`${BASE}/auth/login`, { username, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem("senti_token", t);
    setToken(t);
    setUser(u);
    axios.defaults.headers.common["Authorization"] = `Bearer ${t}`;
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("senti_token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  }, []);

  const isAdmin   = user?.role === "admin";
  const isAnalyst = user?.role === "analyst" || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isAnalyst }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
