import { apiUrl, API_BASE_URL } from "../config/api";
import React, { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "../types";
import { normalizeRole } from "../utils/roles";


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
        `%cDIAGNOSIS (Auth/CORS Error): The backend responded with status ${response.status}.\n` +
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
        "1. CORS Violation: The backend server received the request but did not return 'Access-Control-Allow-Origin: *'.\n" +
        "2. Network Unreachable: The backend server is not running or the URL is down.\n" +
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
  guestLogin: () => {},
  logout: () => {},
  isLoading: true,
  isDemoMode: false,
  diagnoseResponse,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          const url = apiUrl("/api/auth/me");

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
            throw new Error("Token expired or invalid");
          }
        } catch (e) {
          console.warn("Token validation failed, clearing session:", e);
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

  const login = (authToken: string, authUser: User) => {
    authUser.role = normalizeRole(authUser.role) || "ALUNO";
    localStorage.setItem("token", authToken);
    localStorage.setItem("user", JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const guestLogin = async () => {
    try {
      const url = apiUrl("/api/auth/demo-session");
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (response.ok) {
        const data = await response.json();
        const demoUser: User = {
          id: data.user?.id || "guest-demo-visitor",
          name: data.user?.name || "Visitante Convidado (Modo Demonstração)",
          email: data.user?.email || "visitante.demo@codecheck.senai.br",
          role: "DEMO",
          isGuest: true
        };
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(demoUser));
        setToken(data.token);
        setUser(demoUser);
        return;
      }
    } catch (err) {
      console.warn("Could not obtain server demo token:", err);
    }

    // Fallback if backend is completely offline
    const fallbackDemoUser: User = {
      id: "guest-demo-visitor",
      name: "Visitante Convidado (Modo Demonstração)",
      email: "visitante.demo@codecheck.senai.br",
      role: "DEMO",
      isGuest: true
    };
    setUser(fallbackDemoUser);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isDemoMode = user?.role === "DEMO" || user?.isGuest === true;

  return (
    <AuthContext.Provider value={{ user, token, login, guestLogin, logout, isLoading, isDemoMode, diagnoseResponse }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
