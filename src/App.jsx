// src/App.jsx

import React, { useEffect, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/global/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherStatsPage from "./pages/teacher/TeacherStatsPage";
import ProfilePage from "./pages/global/ProfilePage";
import SchedulePage from "./pages/student/SchedulePage";
import ScanQRPage from "./pages/student/ScanQRPage";
import StatsPage from "./pages/student/StatsPage";
import { apiGet } from "./services/api";
import CreateSessionPage from "./pages/teacher/CreateSessionPage";

const RequireRole = ({ role, user, children }) => {
  if (!user) return <Navigate to="/login" />;
  if (user.role !== role) return <Navigate to="/" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    apiGet("/api/test")
      .then((data) => console.log("API OK:", data))
      .catch((err) => console.error("API ERROR:", err));
  }, []);

  return (
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
      
      {/* ŚCIEŻKA TWORZENIA SESJI */}
      <Route
        path="/teacher/create-session"
        element={
          <RequireRole role="teacher" user={user}>
            <CreateSessionPage />
          </RequireRole>
        }
      />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;