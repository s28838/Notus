import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";

export const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  // Mock danych użytkownika na potrzeby demonstracji i testów
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Login using Firebase Google auth result directly (no backend needed)
  const loginWithGoogle = (firebaseUser) => {
    const email = firebaseUser.email;
    const role = email.trim().toLowerCase().startsWith("s")
      ? "student"
      : "teacher";

    let indexNumber = null;
    if (role === "student") {
      const parts = email.split('@');
      indexNumber = parts[0];
    }

    const token = firebaseUser.accessToken;
    if (token) {
      localStorage.setItem("firebaseToken", token);
    }

    setUser({
      email,
      role,
      name: firebaseUser.displayName || email,
      index: indexNumber,
      photoURL: firebaseUser.photoURL || null
    });

    navigate(role === "student" ? "/student" : "/teacher");
  };

  const login = (email) => {
    // Maintain mock login for development
    const role = email.trim().toLowerCase().startsWith("s")
      ? "student"
      : "teacher";
    const fakeName = role === "student" ? "Adam Student" : "Andrzej Wykładowca";

    let indexNumber = null;
    if (role === "student") {
      const parts = email.split('@');
      indexNumber = parts[0];
    }

    setUser({
      email,
      role,
      name: fakeName,
      index: indexNumber
    });

    navigate(role === "student" ? "/student" : "/teacher");
  };

  const logout = async () => {
    try { await signOut(auth); } catch (e) { /* ignore */ }
    localStorage.removeItem("firebaseToken");
    setUser(null);
    navigate("/login");
  };

  const authValue = { user, login, loginWithGoogle, logout };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};
