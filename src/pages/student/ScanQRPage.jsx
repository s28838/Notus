import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiPost } from "../../services/api";

const ScanQRPage = () => {
  const { getToken } = useContext(AuthContext);
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
          video: { facingMode: "environment" },
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
    if (!manualCode.trim()) {
      setMessage("Wpisz kod zajęć.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const token = await getToken();

      if (!token) {
        throw new Error("Brak tokena logowania. Zaloguj się ponownie.");
      }

      const resp = await apiPost(
        "/api/attendance/check-in",
        { shortCode: manualCode.trim().toUpperCase() },
        token
      );

      localStorage.setItem(
        "student_attendance_status",
        JSON.stringify({
          sessionId: resp.sessionId,
          sessionTitle: resp.sessionTitle,
          checkedInAt: resp.checkedInAt,
          studentName: resp.studentName,
          indexNumber: resp.indexNumber,
          sessionEndsAt: resp.sessionEndsAt,
        })
      );

      if (resp.alreadyCheckedIn) {
        setMessage(`Jesteś już zapisany na sesję: ${resp.sessionTitle}`);
      } else {
        setMessage(`Jesteś obecny na sesji: ${resp.sessionTitle}`);
      }

      setMessageType("success");
      setManualCode("");

      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err) {
      console.error("CHECK-IN ERROR:", err);
      setMessage(err.message || "Wystąpił błąd podczas zapisu obecności.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ paddingBottom: "0" }}>
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={handleBack}
          style={{ background: "transparent", color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>
          Skanuj QR
        </h2>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: "#000",
        }}
      >
        {hasPermission !== false ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "white",
            }}
          >
            <p>Brak dostępu do kamery.</p>
          </div>
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              border: "2px solid rgba(255, 255, 255, 0.5)",
              width: "250px",
              height: "250px",
              borderRadius: "1rem",
              position: "relative",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "2px",
                background: "var(--color-primary)",
                boxShadow: "0 0 8px var(--color-primary)",
              }}
            />
          </div>
          <p
            style={{
              color: "white",
              marginTop: "2rem",
              fontWeight: 500,
              fontSize: "0.875rem",
            }}
          >
            Zeskanuj kod QR z sali
          </p>
        </div>
      </div>

      <div
        style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          background: "var(--surface-light)",
          borderTopLeftRadius: "1.5rem",
          borderTopRightRadius: "1.5rem",
          marginTop: "-1.5rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setIsFlashlightOn(!isFlashlightOn)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-light)",
            background: isFlashlightOn
              ? "rgba(244, 89, 37, 0.1)"
              : "transparent",
            color: isFlashlightOn
              ? "var(--color-primary)"
              : "var(--text-primary)",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <span className="material-symbols-outlined">
            {isFlashlightOn ? "flashlight_on" : "flashlight_off"}
          </span>
          <span>{isFlashlightOn ? "Wyłącz latarkę" : "Włącz latarkę"}</span>
        </button>

        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          placeholder="Wpisz kod zajęć"
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-light)",
            outline: "none",
            fontSize: "1rem",
            boxSizing: "border-box",
            textAlign: "center",
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        />

        <button
          onClick={handleManualCode}
          disabled={loading}
          className="btn-white"
          style={{
            background: "var(--color-primary)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            opacity: loading ? 0.7 : 1,
          }}
        >
          <span className="material-symbols-outlined">keyboard</span>
          <span>{loading ? "Zapisywanie..." : "Wpisz kod ręcznie"}</span>
        </button>

        {message && (
          <div
            style={{
              padding: "0.9rem 1rem",
              borderRadius: "0.85rem",
              fontWeight: 600,
              textAlign: "center",
              border:
                messageType === "success"
                  ? "1px solid rgba(34, 197, 94, 0.25)"
                  : "1px solid rgba(239, 68, 68, 0.2)",
              background:
                messageType === "success"
                  ? "rgba(34, 197, 94, 0.10)"
                  : "rgba(239, 68, 68, 0.08)",
              color: messageType === "success" ? "#15803d" : "#b91c1c",
            }}
          >
            {messageType === "success" ? "✅ " : "❌ "}
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanQRPage;