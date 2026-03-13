import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api";

const ScanQRPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [hasPermission, setHasPermission] = useState(null);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error

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

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
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
    <div className="app-container" style={{ paddingBottom: '0' }}>
      {/* Header */}
      <div className="top-bar">
        <button className="icon-btn" onClick={handleBack} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: '2.5rem' }}>Skanuj QR</h2>
      </div>

      {/* OBSZAR SKANOWANIA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#000' }}>
          {/* Element Video (Kamera) */}
          {hasPermission !== false ? (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }}></video>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
              <p>Brak dostępu do kamery.</p>
            </div>
          )}

          {/* Nakładka graficzna (Celownik) */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Ciemniejsza ramka wokół skanera */}
            <div style={{ border: '2px solid rgba(255, 255, 255, 0.5)', width: '250px', height: '250px', borderRadius: '1rem', position: 'relative', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}>
              {/* Animowana linia skanująca mogłaby być tu */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--color-primary)', boxShadow: '0 0 8px var(--color-primary)' }}></div>
            </div>
            <p style={{ color: 'white', marginTop: '2rem', fontWeight: 500, fontSize: '0.875rem' }}>Zeskanuj kod QR z sali</p>
          </div>
      </div>

      {/* PRZYCISKI KONTROLNE */}
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--surface-light)', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem', marginTop: '-1.5rem', position: 'relative', zIndex: 10 }}>
        <button
          onClick={() => setIsFlashlightOn(!isFlashlightOn)}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
            padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-light)', 
            background: isFlashlightOn ? 'rgba(244, 89, 37, 0.1)' : 'transparent', 
            color: isFlashlightOn ? 'var(--color-primary)' : 'var(--text-primary)',
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <span className="material-symbols-outlined">{isFlashlightOn ? 'flashlight_on' : 'flashlight_off'}</span>
          <span>{isFlashlightOn ? "Wyłącz latarkę" : "Włącz latarkę"}</span>
        </button>

        <button 
          onClick={handleManualCode}
          className="btn-white" 
          style={{ background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <span className="material-symbols-outlined">keyboard</span>
          <span>Wpisz kod ręcznie</span>
        </button>
      </div>
    </div>
  );
};

export default ScanQRPage;