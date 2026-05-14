import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TeacherBottomNav from "../../../components/teacher/TeacherBottomNav";
import { apiGet } from "../../../services/api";

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

  return (
    <div className="schedule-page-container groups-page">
      <button className="back-link" onClick={() => navigate(`/teacher/groups/${groupId}`)}>
        <span className="material-symbols-outlined">arrow_back</span>
        Powrót
      </button>

      {loading ? (
        <p className="muted">Ładowanie frekwencji...</p>
      ) : error ? (
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
              <span><strong className="status-dot present">✓</strong> Obecny</span>
              <span><strong className="status-dot absent">×</strong> Nieobecny</span>
            </div>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Data zajęć</th>
                    <th>Temat zajęć</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.lessonId}>
                      <td>{item.date}</td>
                      <td>{item.topic}</td>
                      <td>
                        <span className={`status-dot ${item.present ? "present" : "absent"}`}>
                          {item.present ? "✓" : "×"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.items.length === 0 && (
                    <tr><td colSpan="3">Brak zajęć do pokazania.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default StudentAttendancePage;
