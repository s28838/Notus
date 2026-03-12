import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiGet } from "../api";
import "./CreateSessionPage.css";

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qr, setQr] = useState(null);

  const createAndGetQr = async () => {
    setError("");
    setLoading(true);
    setQr(null);

    try {
      const created = await apiPost("/api/attendance/sessions", { title });
      const qrResp = await apiGet(`/api/attendance/sessions/${created.sessionId}/qr`);
      setQr(qrResp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const refreshQr = async () => {
    if (!qr?.sessionId) return;

    setError("");
    setLoading(true);

    try {
      const qrResp = await apiGet(`/api/attendance/sessions/${qr.sessionId}/qr`);
      setQr(qrResp);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-session-page">
      <button className="create-session-back" onClick={() => navigate(-1)}>
        ←
      </button>

      <div className="create-session-wrapper">
        <div className="create-session-card">
          <div className="create-session-header">
            <h1>Utwórz zajęcia</h1>
            <p>Wprowadź tytuł zajęć i wygeneruj kod QR dla studentów.</p>
          </div>

          <div className="create-session-form-group">
            <label htmlFor="session-title">Tytuł zajęć</label>
            <input
              id="session-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Bazy danych - lab 1"
              className="create-session-input"
            />
          </div>

          {error && <div className="create-session-error">{error}</div>}

          <button
            onClick={createAndGetQr}
            disabled={loading || !title.trim()}
            className="create-session-button"
          >
            {loading ? "Tworzę..." : "Utwórz i pokaż QR"}
          </button>
        </div>

        {qr && (
          <div className="create-session-card qr-card">
            <div className="qr-card-header">
              <h2>Wygenerowany kod QR</h2>
              <span className="session-badge">Sesja #{qr.sessionId}</span>
            </div>

            <div className="qr-image-wrapper">
              <img
                alt="QR"
                src={`data:image/png;base64,${qr.qrPngBase64}`}
                className="qr-image"
              />
            </div>

            <div className="qr-actions">
              <button
                onClick={refreshQr}
                disabled={loading}
                className="create-session-button secondary"
              >
                {loading ? "Odświeżam..." : "Odśwież QR"}
              </button>
            </div>

            <div className="qr-token-box">
              <span>Token (fallback):</span>
              <code>{qr.qrToken}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSessionPage;