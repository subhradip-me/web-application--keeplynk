import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    let savedUser = localStorage.getItem("user");

    // Only parse if savedUser is a valid JSON string
    let parsedUser = null;
    if (savedUser && savedUser !== 'undefined') {
      try {
        parsedUser = JSON.parse(savedUser);
      } catch (e) {
        parsedUser = null;
      }
    }

    if (savedToken && parsedUser) {
      setToken(savedToken);
      setUser(parsedUser);
    }

    setLoading(false);
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("token", jwtToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
