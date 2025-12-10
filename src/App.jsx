// src/App.jsx

import React, { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import ProfilePage from "./pages/ProfilePage"; 
import SchedulePage from "./pages/SchedulePage";
import ScanQRPage from "./pages/ScanQRPage";

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

  const login = (email) => {
    const role = email.trim().toLowerCase().startsWith("s")
      ? "student"
      : "teacher";
    const fakeName = role === "student" ? "Adam Student" : "Andrzej Wykładowca";
    
    // 🔥 LOGIKA POBIERANIA NUMERU INDEKSU Z E-MAILA
    let indexNumber = null;
    if (role === "student") {
        // Podziel adres e-mail przy znaku '@' i weź pierwszą część
        const parts = email.split('@');
        indexNumber = parts[0]; 
    }
    
    // Zapisz numer indeksu w obiekcie user
    setUser({ 
        email, 
        role, 
        name: fakeName,
        index: indexNumber // 🔥 NOWA WŁAŚCIWOŚĆ 'index'
    });
    
    navigate(role === "student" ? "/student" : "/teacher");
  };

  const logout = () => {
    setUser(null);
    navigate("/login");
  };

  const authValue = { user, login, logout };

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
      </Routes>
    </AuthContext.Provider>
  );
};

const App = () => <AppInner />;

export default App;