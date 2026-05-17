import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TeacherBottomNav from "../../../components/teacher/TeacherBottomNav";
import { apiGet } from "../../../services/api";
import LoadingState from "../../../components/shared/LoadingState";

const formatGradeDateTime = (grade) => {
  const value = grade.dateTime || grade.date;
  if (!value) return "-";
  return new Date(value).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StudentGradesPage = () => {
  const { groupId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    apiGet(`/api/teacher/groups/${groupId}/students/${studentId}/grades`)
      .then(setData)
      .catch(() => setError("Nie udało się pobrać ocen ucznia."))
      .finally(() => setLoading(false));
  }, [groupId, studentId]);

  return (
    <div className="schedule-page-container groups-page">
      <button className="back-link" onClick={() => navigate(`/teacher/groups/${groupId}`)}>
        <span className="material-symbols-outlined">arrow_back</span>
        Powrót
      </button>

      {loading ? (
        <LoadingState label="Ładowanie ocen..." />
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : (
        <>
          <div className="details-header">
            <div>
              <p className="eyebrow">Oceny</p>
              <h1>Oceny - {data.studentName}</h1>
              <p>Średnia ocen: {data.averageGrade == null ? "-" : Number(data.averageGrade).toFixed(2)}</p>
            </div>
          </div>

          {data.semesters.length === 0 ? (
            <section className="data-panel empty-state">
              <span className="material-symbols-outlined">grading</span>
              <h2>Brak ocen</h2>
              <p>Ten uczeń nie ma jeszcze ocen w tej grupie.</p>
            </section>
          ) : data.semesters.map((semester) => (
            <section className="data-panel" key={semester.semester}>
              <h2>Semestr {semester.semester}</h2>
              <p className="muted">Średnia: {semester.averageGrade == null ? "-" : Number(semester.averageGrade).toFixed(2)}</p>
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Ocena</th>
                      <th>Z czego</th>
                      <th>Komentarz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semester.grades.map((grade) => (
                      <tr key={grade.id}>
                        <td>{formatGradeDateTime(grade)}</td>
                        <td>{grade.value}</td>
                        <td>{grade.source || "-"}</td>
                        <td>{grade.comment || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default StudentGradesPage;
