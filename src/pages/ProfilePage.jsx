// src/pages/ProfilePage.jsx

import React, { useContext } from "react";
import { AuthContext } from "../App";
import { useNavigate } from "react-router-dom";

// Ikona strzałki w lewo (SVG)
const BackIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Użyjemy danych użytkownika, które są dostępne w kontekście
  const userName = user?.name || "Użytkownik Testowy";
  const userEmail = user?.email || "test@notus.edu";
  const userRole = user?.role === "student" ? "Student" : "Wykładowca";
  
  // 🔥 POBRANIE NUMERU INDEKSU Z OBIEKTU USER
  const userIndex = user?.index || "-"; 

  const handleLogout = () => {
    logout();
  };
  
  // Funkcja powrotu do poprzedniego dashboardu
  const handleBack = () => {
      navigate(-1);
  };

  return (
    <div className="profile-page-container">
      {/* NAGŁÓWEK Z PRZYCISKIEM POWROTU */}
      <div className="profile-header">
        <button 
            className="back-button" 
            onClick={handleBack} 
            title="Powrót"
        >
            <BackIcon />
        </button>
        <h1 className="profile-title">Moje Konto</h1>
      </div>

      {/* KARTA PROFILOWA (Glassmorphism) */}
      <div className="profile-card-wrapper">
        <div className="profile-card">
          
          {/* SEKCJA DANYCH */}
          <div className="profile-details-section">
            <h2 className="profile-name">{userName}</h2>
            <div className="profile-detail-item">
                <span className="label">Rola:</span>
                <span className="value">{userRole}</span>
            </div>
            <div className="profile-detail-item">
                <span className="label">E-mail:</span>
                <span className="value">{userEmail}</span>
            </div>
            {/* 🔥 WARUNKOWE WYŚWIETLANIE NUMERU INDEKSU DLA STUDENTA */}
            {userRole === "Student" && (
                <div className="profile-detail-item">
                    <span className="label">Numer Indeksu:</span>
                    <span className="value">{userIndex}</span>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* SEKCJA OPCJI (Przyciski) */}
      <div className="profile-options-wrapper">
        {/* Przykładowy przycisk do zmiany hasła (może być rozwijany później) */}
        <button className="profile-option-btn">Zmień hasło</button>
        
        {/* Przycisk Wyloguj */}
        <button className="profile-option-btn logout-btn" onClick={handleLogout}>
            Wyloguj
        </button>
      </div>

    </div>
  );
};

export default ProfilePage;