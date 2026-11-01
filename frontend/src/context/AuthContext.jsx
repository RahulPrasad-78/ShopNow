import React, { createContext, useState } from "react";

export const AuthContext = createContext();

// Reads the persisted session once, on mount. A malformed or truncated entry
// would otherwise throw inside the initialiser and blank the entire app, with
// no way for the user to recover short of clearing site data by hand.
const readStoredUser = () => {
  try {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) return null;
    const parsed = JSON.parse(userInfo);
    return parsed && parsed.token ? parsed : null;
  } catch {
    localStorage.removeItem("userInfo");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("userInfo", JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
