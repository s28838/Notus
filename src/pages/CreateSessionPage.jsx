import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, apiGet } from "../api";

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qr, setQr] = useState(null); // QrResponse

  const createAndGetQr = async () => {
    setError("");
    setLoading(true);
    setQr(null);

    try {
      // 1) create session
      const created = await apiPost("/api/attendance/sessions", { title });

      // 2) fetch qr
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
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)}>← Powrót</button>

      <h1>Utwórz zajęcia</h1>

      <div style={{ marginTop: 12 }}>
        <label>Tytuł zajęć</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="np. Bazy danych - lab 1"
          style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
        />
      </div>

      {error && <div style={{ color: "salmon", marginTop: 12 }}>{error}</div>}

      <button
        onClick={createAndGetQr}
        disabled={loading || !title.trim()}
        style={{ marginTop: 12, padding: 12 }}
      >
        {loading ? "Tworzę..." : "Utwórz i pokaż QR"}
      </button>

      {qr && (
        <div style={{ marginTop: 20 }}>
          <h2>QR do sesji #{qr.sessionId}</h2>

          <img
            alt="QR"
            src={`data:image/png;base64,${qr.qrPngBase64}`}
            style={{ width: 260, height: 260, borderRadius: 12 }}
          />

          <div style={{ marginTop: 10 }}>
            <button onClick={refreshQr} disabled={loading} style={{ padding: 10 }}>
              Odśwież QR
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: 12 }}>
            Token (fallback): <code>{qr.qrToken}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSessionPage;