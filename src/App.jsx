// src/App.jsx

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStatsPage from "./pages/teacher/TeacherStatsPage";
import ProfilePage from "./pages/ProfilePage";
import SchedulePage from "./pages/SchedulePage";
import ScanQRPage from "./pages/ScanQRPage";
import StatsPage from "./pages/StatsPage";
import { apiGet } from "./api";
import CreateSessionPage from "./pages/CreateSessionPage";



export const AuthContext = React.createContext(null);

const RequireRole = ({ role, user, children }) => {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/" />;
  return children;
};

const AppInner = () => {
  // Mock danych użytkownika na potrzeby demonstracji i testów
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/api/test")
      .then((data) => console.log("API OK:", data))
      .catch((err) => console.error("API ERROR:", err));
  }, []);
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
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        {/* GŁÓWNA ŚCIEŻKA STUDENTA */}
        <Route
          path="/student"
          element={
            <RequireRole role="student" user={user}>
              <StudentDashboard />
            </RequireRole>
          }
        />

        {/* ŚCIEŻKA PROFILU DLA STUDENTA */}
        <Route
          path="/student/profile"
          element={
            <RequireRole role="student" user={user}>
              <ProfilePage />
            </RequireRole>
          }
        />

        {/* ŚCIEŻKA PLANU ZAJĘĆ DLA STUDENTA */}
        <Route
          path="/student/schedule"
          element={
            <RequireRole role="student" user={user}>
              <SchedulePage />
            </RequireRole>
          }
        />

        {/* ŚCIEŻKA SKANU KODU QR DLA STUDENTA */}
        <Route
          path="/student/scan-qr"
          element={
            <RequireRole role="student" user={user}>
              <ScanQRPage />
            </RequireRole>
          }
        />

        {/* ŚCIEŻKA STATYSTYK DLA STUDENTA */}
        <Route
          path="/student/stats"
          element={
            <RequireRole role="student" user={user}>
              <StatsPage />
            </RequireRole>
          }
        />

        {/* GŁÓWNA ŚCIEŻKA NAUCZYCIELA */}
        <Route
          path="/teacher"
          element={
            <RequireRole role="teacher" user={user}>
              <TeacherDashboard />
            </RequireRole>
          }
        />

        {/* ŚCIEŻKA PROFILU DLA NAUCZYCIELA */}
        <Route
          path="/teacher/profile"
          element={
            <RequireRole role="teacher" user={user}>
              <ProfilePage />
            </RequireRole>
          }
        />

        {/* 🔥 ŚCIEŻKA PLANU ZAJĘĆ DLA NAUCZYCIELA */}
        <Route
          path="/teacher/schedule"
          element={
            <RequireRole role="teacher" user={user}>
              <SchedulePage />
            </RequireRole>
          }
        />

        {/* ŚCIEŻKA STATYSTYK DLA NAUCZYCIELA */}
        <Route
          path="/teacher/stats"
          element={
            <RequireRole role="teacher" user={user}>
              <TeacherStatsPage />
            </RequireRole>
          }
        />

        {/* GŁÓWNA ŚCIEŻKA PRZEKIEROWUJĄCA */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === "student" ? "/student" : "/teacher"} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/teacher/create-session"
          element={
            <RequireRole role="teacher" user={user}>
              <CreateSessionPage />
            </RequireRole>
          }
        />
      </Routes>
    </AuthContext.Provider>
  );
};

const App = () => <AppInner />;

export default App;