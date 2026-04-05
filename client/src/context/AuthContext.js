import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("chatty_token") || null);
  const [loading, setLoading] = useState(true);

  // Set axios default auth header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // On mount, verify token and load user
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_URL}/auth/me`
        );
        setUser(data.user);
      } catch (error) {
        console.error("Token verification failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []); // eslint-disable-line

  const login = async (email, password) => {
    const { data } = await axios.post(
      `${process.env.REACT_APP_API_URL}/auth/login`,
      { email, password }
    );
    localStorage.setItem("chatty_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await axios.post(
      `${process.env.REACT_APP_API_URL}/auth/register`,
      { username, email, password }
    );
    localStorage.setItem("chatty_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`);
      }
    } catch (e) {
      // ignore
    }
    localStorage.removeItem("chatty_token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
