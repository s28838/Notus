import React, { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import AppPageLayout from "../../components/shared/AppPageLayout";
import { EmptyState, ErrorState } from "../../components/shared/PageState";
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
        <AppPageLayout
            title="Lista obecności"
            leftIcon="arrow_back"
            onLeftClick={() => navigate(-1)}
            leftAriaLabel="Wróć"
            loading={loading}
            loadingLabel="Ładowanie obecności..."
            bottomNav={<TeacherBottomNav />}
            shell="teacher"
        >
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

                {error ? (
                    <ErrorState icon={null}>{error}</ErrorState>
                ) : attendanceList.length === 0 ? (
                    <EmptyState icon="group_off" iconStyle={{ fontSize: "2.5rem", color: "var(--border-light)" }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)" }}>Brak obecności</p>
                        <p style={{ margin: 0, fontSize: "0.875rem" }}>Na razie nikt się nie odbił.</p>
                    </EmptyState>
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
        </AppPageLayout>
    );
};

export default AttendanceListPage;
