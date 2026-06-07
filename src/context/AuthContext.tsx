import React, { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "../types";
import { normalizeRole } from "../utils/roles";
import { getApiBaseUrl } from "../services/apiService";

export const diagnoseResponse = async (
  response: Response | null,
  error: any,
  url: string,
  method: string = "POST"
): Promise<void> => {
  console.group("%c[CodeCheck AI API Diagnosis]", "color: #ff9900; font-weight: bold; font-size: 11px;");
  console.log(`Request URL: ${method} ${url}`);
  
  if (response) {
    console.log(`HTTP Status Code: ${response.status} (${response.statusText})`);
    try {
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log(`Response Headers:`, headersObj);
    } catch (e) {
      console.log(`Could not read response headers`);
    }
    
    if (response.status === 401 || response.status === 403) {
      console.error(
        `%cDIAGNOSIS (Auth/CORS Error): The backend at Fly.io responded with status ${response.status}.\n` +
        "This indicates your request was rejected due to lack of credentials, invalid token structure, or a CORS blocklist configuration.",
        "color: #ff3333; font-weight: bold;"
      );
    } else if (!response.ok) {
      console.warn(`DIAGNOSIS (Response NOT OK): Server responded with error status ${response.status}.`);
    } else {
      console.log("%cDIAGNOSIS: Response status is OK (2xx success).", "color: #00ff00;");
    }

    try {
      const cloned = response.clone();
      const body = await cloned.text();
      console.log(`Raw Response Body:`, body);
    } catch (e) {
      console.error("DIAGNOSIS Error: Could not read raw response body:", e);
    }
  } else if (error) {
    console.error("Connection/Network Error Caught:", error);
    
    const errMessage = error instanceof Error ? error.message : String(error);
    const isFetchFailed = errMessage.toLowerCase().includes("failed to fetch");
    
    if (isFetchFailed) {
      console.error(
        `%cDIAGNOSIS (Potential CORS or Network Block):\n` +
        "The operation triggered a TypeError: 'Failed to fetch'. In browsers, this usually means that either:\n" +
        "1. CORS Violation: The backend server at Fly.io received the request but did not return 'Access-Control-Allow-Origin: *' or did not permit the Vercel header.\n" +
        "2. Network Unreachable: The backend server is not running or the URL (https://corretordeatividades.fly.dev) is down.\n" +
        "3. Mixed Content block or SSL invalid certificate.",
        "color: #ff3333; font-weight: bold;"
      );
    } else {
      console.error(`DIAGNOSIS: The connection failed with error: "${errMessage}". Method: ${method}, Target URL: ${url}`);
    }
  } else {
    console.warn("DIAGNOSIS: No response or error object was provided for evaluation.");
  }
  
  console.groupEnd();
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  diagnoseResponse,
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
          const API_BASE_URL = getApiBaseUrl();
          const url = API_BASE_URL.endsWith("/auth/me") ? API_BASE_URL : `${API_BASE_URL.replace(/\/+$/, "")}/auth/me`;

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
    user.role = normalizeRole(user.role) || "ALUNO";
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
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, diagnoseResponse }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
