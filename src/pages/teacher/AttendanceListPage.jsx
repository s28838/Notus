import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";
import { useTeacherRealtime } from "../../hooks/useTeacherRealtime";

const AttendanceListPage = () => {
    const { getToken } = useContext(AuthContext);
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAttendance = useCallback(async () => {
        try {
            setError("");
            const token = await getToken();
            const data = await apiGet(`/api/attendance/sessions/${sessionId}/records`, null, token);
            setAttendanceList(Array.isArray(data) ? data : []);
        } catch {
            setError("Nie udało się pobrać listy obecności.");
        } finally {
            setLoading(false);
        }
    }, [getToken, sessionId]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const handleAttendanceRealtime = useCallback((data) => {
        if (Number(data?.payload?.sessionId) === Number(sessionId)) {
            fetchAttendance();
        }
    }, [fetchAttendance, sessionId]);

    useTeacherRealtime(["attendance.checked_in"], handleAttendanceRealtime, Boolean(sessionId));

    return (
        <div className="app-container" style={{ paddingBottom: "2rem" }}>
            <div className="top-bar">
                <button
                    className="icon-btn"
                    onClick={() => navigate(-1)}
                    style={{ background: "transparent", color: "var(--text-primary)" }}
                >
                    <span className="material-symbols-outlined text-primary">arrow_back</span>
                </button>
                <h2 className="top-bar-title" style={{ marginRight: "2.5rem" }}>
                    Lista obecności
                </h2>
            </div>

            <div style={{ padding: "1rem" }}>
                <div
                    className="glass-card"
                    style={{ padding: "1rem", marginBottom: "1rem" }}
                >
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
                        Sesja #{sessionId}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Liczba obecnych: {attendanceList.length}
                    </div>
                </div>

                {loading ? (
                    <LoadingState label="Ładowanie obecności..." />
                ) : error ? (
                    <div className="error-state">{error}</div>
                ) : attendanceList.length === 0 ? (
                    <div className="empty-state">
                        <span className="material-symbols-outlined" style={{ fontSize: "2.5rem", color: "var(--border-light)" }}>group_off</span>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak obecności</p>
                        <p style={{ margin: 0, fontSize: "0.875rem" }}>Na razie nikt się nie odbił.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {attendanceList.map((item, index) => (
                            <div
                                key={`${item.studentUid}-${index}`}
                                className="glass-card"
                                style={{
                                    padding: "1rem",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: "1rem",
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontWeight: 700,
                                            color: "var(--text-primary)",
                                            wordBreak: "break-all",
                                        }}
                                    >
                                        {item.studentName}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            color: "var(--text-secondary)",
                                        }}
                                    >
                                        {item.indexNumber || "Brak indeksu"}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        whiteSpace: "nowrap",
                                        fontSize: "0.85rem",
                                        color: "var(--text-secondary)",
                                        fontWeight: 600,
                                    }}
                                >
                                    {item.checkedInAt
                                        ? new Date(item.checkedInAt).toLocaleTimeString()
                                        : "-"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceListPage;
