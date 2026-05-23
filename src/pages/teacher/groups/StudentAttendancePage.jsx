import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TeacherBottomNav from "../../../components/teacher/TeacherBottomNav";
import { apiGet } from "../../../services/api";
import AppPageLayout from "../../../components/shared/AppPageLayout";
import { EmptyState } from "../../../components/shared/PageState";

const StudentAttendancePage = () => {
  const { groupId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/teacher/groups/${groupId}/students/${studentId}/attendance`)
      .then(setData)
      .catch(() => setError("Nie udało się pobrać frekwencji ucznia."))
      .finally(() => setLoading(false));
  }, [groupId, studentId]);

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return { day: value, weekday: "", month: "Zajęcia" };

    return {
      day: date.toLocaleDateString("pl-PL", { day: "2-digit" }),
      weekday: date.toLocaleDateString("pl-PL", { weekday: "short" }),
      full: date.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }),
      month: date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" })
    };
  };

  const attendanceByMonth = (data?.items || []).reduce((months, item) => {
    const dateParts = formatDate(item.date);
    const monthItems = months.get(dateParts.month) || [];
    monthItems.push({ ...item, dateParts });
    months.set(dateParts.month, monthItems);
    return months;
  }, new Map());

  return (
    <AppPageLayout
      title="Frekwencja"
      leftIcon="arrow_back"
      onLeftClick={() => navigate(`/teacher/groups/${groupId}`)}
      leftAriaLabel="Powrót do grupy"
      loading={loading}
      loadingLabel="Ładowanie frekwencji..."
      bottomNav={<TeacherBottomNav />}
      shell="teacher"
    >
      {error ? (
        <div className="error-banner">{error}</div>
      ) : (
        <>
          <div className="details-header">
            <div>
              <p className="eyebrow">Frekwencja</p>
              <h1>Frekwencja - {data.studentName}</h1>
              <p>Obecność: {data.attendancePercentage}%</p>
            </div>
          </div>
          <section className="data-panel">
            <div className="legend-row">
              <span><strong className="status-dot present"><span className="material-symbols-outlined">check_circle</span></strong> Obecny</span>
              <span><strong className="status-dot absent"><span className="material-symbols-outlined">cancel</span></strong> Nieobecny</span>
            </div>
            <div className="attendance-calendar">
              {data.items.length === 0 ? (
                <EmptyState icon="event_busy">
                  <h3>Brak zajęć do pokazania</h3>
                  <p>Gdy pojawią się zajęcia, frekwencja będzie widoczna w kalendarzu.</p>
                </EmptyState>
              ) : (
                Array.from(attendanceByMonth.entries()).map(([month, items]) => (
                  <section className="attendance-month" key={month}>
                    <h2>{month}</h2>
                    <div className="attendance-month-grid">
                      {items.map((item) => (
                        <article className={`attendance-day-card ${item.present ? "present" : "absent"}`} key={item.lessonId}>
                          <div className="attendance-date-tile">
                            <span>{item.dateParts.weekday}</span>
                            <strong>{item.dateParts.day}</strong>
                          </div>
                          <div className="attendance-day-main">
                            <p>{item.topic}</p>
                            <span>{item.dateParts.full}</span>
                          </div>
                          <span className={`status-dot ${item.present ? "present" : "absent"}`} aria-label={item.present ? "Obecny" : "Nieobecny"}>
                            <span className="material-symbols-outlined">{item.present ? "check_circle" : "cancel"}</span>
                          </span>
                        </article>
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </section>
        </>
      )}

    </AppPageLayout>
  );
};

export default StudentAttendancePage;
