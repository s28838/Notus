import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api";

// Ikona strzałki w lewo (Powrót)
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

// Ikona latarki
const FlashlightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
  </svg>
);

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
          video: { facingMode: "environment" }
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

  const handleManualCodeSubmit = async () => {
    const qrToken = manualCode.trim();
    if (!qrToken) return;

    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const resp = await apiPost("/api/attendance/check-in", { qrToken });
      console.log("check-in response:", resp);

      setMessage("✅ Zapisano obecność!");
      setMessageType("success");
      setManualCode("");

      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage("❌ Błąd check-in: " + (err.message || "Spróbuj ponownie."));
      setMessageType("error");
    } finally {
      setLoading(false);
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
          {hasPermission !== false ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            ></video>
          ) : (
            <div className="camera-fallback">
              <p>Brak dostępu do kamery.</p>
            </div>
          )}

          <div className="scan-overlay">
            <div className="scan-frame">
              <div className="scan-corner top-left"></div>
              <div className="scan-corner top-right"></div>
              <div className="scan-corner bottom-left"></div>
              <div className="scan-corner bottom-right"></div>
              <div className="scan-line"></div>
            </div>
            <p className="scan-instruction">
              Zeskanuj kod QR z sali lub od prowadzącego
            </p>
          </div>
        </div>
      </div>

      {/* PRZYCISKI KONTROLNE */}
      <div className="scan-controls">
        <button
          className={`flashlight-btn ${isFlashlightOn ? "active" : ""}`}
          onClick={() => setIsFlashlightOn(!isFlashlightOn)}
        >
          <FlashlightIcon />
          <span>{isFlashlightOn ? "Wyłącz latarkę" : "Włącz latarkę"}</span>
        </button>

        <div className="manual-code-section">
          <button className="manual-code-btn" type="button">
            Wpisz kod ręcznie
          </button>

          <div className="manual-code-form">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Wklej kod z QR"
              className="manual-code-input"
            />

            <button
              className="manual-code-submit-btn"
              onClick={handleManualCodeSubmit}
              disabled={loading || !manualCode.trim()}
            >
              {loading ? "Wysyłanie..." : "Potwierdź"}
            </button>
          </div>

          {message && (
            <div className={`manual-code-message ${messageType}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanQRPage;