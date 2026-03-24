import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";

const AttendanceListPage = () => {
    const { getToken } = useContext(AuthContext);
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [attendanceList, setAttendanceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAttendance = async () => {
        try {
            setError("");
            const token = await getToken();
            const data = await apiGet(`/api/attendance/sessions/${sessionId}/records`, token);
            setAttendanceList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError("Nie udało się pobrać listy obecności.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();

        const interval = setInterval(() => {
            fetchAttendance();
        }, 3000);

        return () => clearInterval(interval);
    }, [sessionId]);

    return (
        <div className="app-container" style={{ paddingBottom: "2rem" }}>
            <div className="top-bar">
                <button
                    className="icon-btn"
                    onClick={() => navigate(-1)}
                    style={{ background: "transparent", color: "var(--text-primary)" }}
                >
                    <span className="material-symbols-outlined">arrow_back</span>
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
                    <div className="glass-card" style={{ padding: "1rem", textAlign: "center" }}>
                        Ładowanie...
                    </div>
                ) : error ? (
                    <div className="glass-card" style={{ padding: "1rem", color: "#dc2626" }}>
                        {error}
                    </div>
                ) : attendanceList.length === 0 ? (
                    <div className="glass-card" style={{ padding: "1rem", textAlign: "center" }}>
                        Na razie nikt się nie odbił.
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