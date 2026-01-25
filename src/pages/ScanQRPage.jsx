// src/pages/ScanQRPage.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api";

// Ikona strzałki w lewo (Powrót)
const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

// Ikona latarki
const FlashlightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
  </svg>
);

const ScanQRPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null); // null = sprawdzanie, true = jest, false = brak
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  // Próba uruchomienia kamery przy wejściu na stronę
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" } // Preferuj tylną kamerę
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Błąd dostępu do kamery:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    // Czyszczenie przy wyjściu (zatrzymanie kamery)
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleBack = () => {
    navigate(-1);
  };
  const handleManualCode = async () => {
    const qrToken = prompt("Wklej kod z QR (token):");
    if (!qrToken) return;

    try {
      const resp = await apiPost("/api/attendance/check-in", { qrToken });
      alert("✅ Zapisano obecność!");
      console.log("check-in response:", resp);
      navigate(-1); // opcjonalnie: wróć do dashboardu
    } catch (err) {
      console.error(err);
      alert("❌ Błąd check-in: " + err.message);
    }
  };

  return (
    <div className="scan-page-container">
      {/* NAGŁÓWEK */}
      <div className="scan-header">
        <button className="back-button" onClick={handleBack} title="Powrót">
          <BackIcon />
        </button>
        <h1 className="scan-title">Skanuj QR</h1>
      </div>

      {/* OBSZAR SKANOWANIA */}
      <div className="scan-viewport-wrapper">

        <div className="scan-viewport">
          {/* Element Video (Kamera) */}
          {hasPermission !== false ? (
            <video ref={videoRef} autoPlay playsInline muted className="camera-video"></video>
          ) : (
            <div className="camera-fallback">
              <p>Brak dostępu do kamery.</p>
            </div>
          )}

          {/* Nakładka graficzna (Celownik) */}
          <div className="scan-overlay">
            <div className="scan-frame">
              <div className="scan-corner top-left"></div>
              <div className="scan-corner top-right"></div>
              <div className="scan-corner bottom-left"></div>
              <div className="scan-corner bottom-right"></div>

              {/* Animowana linia skanująca */}
              <div className="scan-line"></div>
            </div>
            <p className="scan-instruction">Zeskanuj kod QR z sali lub od prowadzącego</p>
          </div>
        </div>
      </div>

      {/* PRZYCISKI KONTROLNE */}
      <div className="scan-controls">
        <button
          className={`flashlight-btn ${isFlashlightOn ? 'active' : ''}`}
          onClick={() => setIsFlashlightOn(!isFlashlightOn)}
        >
          <FlashlightIcon />
          <span>{isFlashlightOn ? "Wyłącz latarkę" : "Włącz latarkę"}</span>
        </button>

        <button className="manual-code-btn" onClick={handleManualCode}>
          Wpisz kod ręcznie
        </button>
      </div>
    </div>
  );
};

export default ScanQRPage;