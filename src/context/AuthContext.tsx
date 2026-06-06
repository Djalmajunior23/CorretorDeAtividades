import React, { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "../types";
import { normalizeRole } from "../utils/roles";

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
          const url = baseUrl.endsWith("/auth/me") ? baseUrl : `${baseUrl.replace(/\/+$/, "")}/auth/me`;

          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            userData.role = normalizeRole(userData.role);
            setUser(userData);
            setToken(storedToken);
          } else {
            throw new Error("Invalid token");
          }
        } catch (e) {
          console.error("Token validation failed:", e);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    };
    validateToken();
  }, []);

  const login = (token: string, user: User) => {
    user.role = normalizeRole(user.role);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
