import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import AppPageLayout from "../../components/shared/AppPageLayout";
import { EmptyState, ErrorState } from "../../components/shared/PageState";
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
    <AppPageLayout
        title="Oceny"
        leftIcon="arrow_back"
        onLeftClick={() => navigate("/student/groups")}
        leftAriaLabel="Wróć do grup"
        loading={loading}
        loadingLabel="Ładowanie ocen..."
        bottomNav={<StudentBottomNav />}
        shell="student"
        className="student-groups-page"
        contentClassName="student-groups-content"
      >

        {error ? (
          <ErrorState>{error}</ErrorState>
        ) : (
          <>
            <section className="student-group-card">
              <p className="eyebrow">Twoje oceny</p>
              <h3>{data?.studentName || "Uczeń"}</h3>
              <p>Średnia ocen: {data?.averageGrade == null ? "-" : Number(data.averageGrade).toFixed(2)}</p>
            </section>

            {!data?.semesters?.length ? (
              <EmptyState icon="grading">
                <h3>Brak ocen</h3>
                <p>Gdy nauczyciel wystawi ocenę w tej grupie, pojawi się tutaj.</p>
              </EmptyState>
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
    </AppPageLayout>
  );
};

export default StudentGroupGradesPage;
