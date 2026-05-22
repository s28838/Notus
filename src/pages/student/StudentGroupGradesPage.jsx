import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../components/shared/LoadingState";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";

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

const StudentGroupGradesPage = () => {
  const { groupId } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGrades = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        const response = await apiGet(`/api/student/groups/${groupId}/grades`, null, token);
        setData(response);
      } catch {
        setError("Nie udało się pobrać ocen z tej grupy.");
      } finally {
        setLoading(false);
      }
    };

    loadGrades();
  }, [getToken, groupId]);

  return (
    <div className="app-container student-groups-page">
      <header className="top-bar">
        <button className="icon-btn" onClick={() => navigate("/student/groups")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Oceny</h2>
        <div style={{ width: "2.5rem" }} />
      </header>

      <main className="student-groups-content">
        {loading ? (
          <LoadingState label="Ładowanie ocen..." />
        ) : error ? (
          <div className="error-state">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        ) : (
          <>
            <section className="student-group-card">
              <p className="eyebrow">Twoje oceny</p>
              <h3>{data?.studentName || "Uczeń"}</h3>
              <p>Średnia ocen: {data?.averageGrade == null ? "-" : Number(data.averageGrade).toFixed(2)}</p>
            </section>

            {!data?.semesters?.length ? (
              <div className="empty-state">
                <span className="material-symbols-outlined">grading</span>
                <h3>Brak ocen</h3>
                <p>Gdy nauczyciel wystawi ocenę w tej grupie, pojawi się tutaj.</p>
              </div>
            ) : (
              data.semesters.map((semester) => (
                <section className="student-group-card" key={semester.semester}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem" }}>
                    <h3>Semestr {semester.semester}</h3>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 800 }}>
                      Średnia: {semester.averageGrade == null ? "-" : Number(semester.averageGrade).toFixed(2)}
                    </span>
                  </div>
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
                            <td><strong>{grade.value}</strong></td>
                            <td>{grade.source || "-"}</td>
                            <td>{grade.comment || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </main>

      <>
      <StudentBottomNav />
      <nav className="bottom-nav-stitch" style={{ display: "none" }}>
        <button className="nav-item" onClick={() => navigate("/student")}>
          <span className="material-symbols-outlined">home</span>
          Główna
        </button>
        <button className="nav-item" onClick={() => navigate("/student/schedule")}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item active" onClick={() => navigate("/student/groups")}>
          <span className="material-symbols-outlined fill">groups</span>
          Grupy
        </button>
        <button className="nav-item" onClick={() => navigate("/student/activity")}>
          <span className="material-symbols-outlined">notifications</span>
          Aktywność
        </button>
        <button className="nav-item" onClick={() => navigate("/student/settings")}>
          <span className="material-symbols-outlined">person</span>
          Profil
        </button>
      </nav>
      </>
    </div>
  );
};

export default StudentGroupGradesPage;
