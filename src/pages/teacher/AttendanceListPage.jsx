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
    const [sessionSummary, setSessionSummary] = useState(null);
    const [quizResults, setQuizResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchAttendance = useCallback(async () => {
        try {
            setError("");
            const token = await getToken();
            const summary = await apiGet(`/api/attendance/sessions/${sessionId}/summary`, null, token).catch(() => null);
            const data = await apiGet(`/api/attendance/sessions/${sessionId}/records`, null, token);
            setSessionSummary(summary);
            setAttendanceList(Array.isArray(data) ? data : []);
            try {
                const results = await apiGet(`/api/quiz-assignments/session/${sessionId}/results`, null, token);
                setQuizResults(results?.assignmentId ? results : null);
            } catch {
                setQuizResults(null);
            }
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
    const quizSubmissions = Array.isArray(quizResults?.submissions) ? quizResults.submissions : [];
    const pendingReviews = quizSubmissions.filter((item) => item.pendingOpenReview);
    const displaySessionNumber = sessionSummary?.groupSessionNumber || sessionId;

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
                        Sesja #{displaySessionNumber}
                    </div>
                    {sessionSummary?.sessionTitle && (
                        <div style={{ color: "var(--text-primary)", fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.15rem" }}>
                            {sessionSummary.sessionTitle}
                            {sessionSummary.groupName ? ` · ${sessionSummary.groupName}` : ""}
                        </div>
                    )}
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                        Liczba obecnych: {attendanceList.length}
                    </div>
                </div>

                {quizResults && quizSubmissions.length > 0 && (
                    <div className="glass-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-primary)" }}>
                            {quizResults.quizTitle}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem", marginBottom: "0.75rem" }}>
                            {pendingReviews.length > 0
                                ? `${pendingReviews.length} odpowiedzi otwartych do oceny`
                                : "Brak odpowiedzi oczekujących na ocenę"}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {(pendingReviews.length > 0 ? pendingReviews : quizSubmissions).map((item) => (
                                <div
                                    key={item.submissionId}
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "0.75rem",
                                        padding: "0.75rem",
                                        borderRadius: "0.5rem",
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid var(--border-light)"
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-word" }}>
                                            {item.studentName}
                                        </div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                            {item.pendingOpenReview ? "Czeka na ocenę pytań otwartych" : `${item.score}/${item.total} pkt`}
                                        </div>
                                    </div>
                                    {item.pendingOpenReview ? (
                                        <button
                                            className="btn-primary"
                                            type="button"
                                            onClick={() => navigate(`/teacher/review/${item.submissionId}`)}
                                            style={{ width: "auto", padding: "0.55rem 0.85rem", fontSize: "0.85rem" }}
                                        >
                                            Oceń
                                        </button>
                                    ) : (
                                        <span style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "0.85rem" }}>
                                            Oceniono
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
