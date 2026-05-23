import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentBottomNav from "../../components/student/StudentBottomNav";
import AppPageLayout from "../../components/shared/AppPageLayout";
import { EmptyState, ErrorState } from "../../components/shared/PageState";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";

const StudentGroupsPage = () => {
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/student/groups", null, token);
        setGroups(Array.isArray(data) ? data : []);
      } catch {
        setError("Nie udało się pobrać Twoich grup.");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [getToken]);

  return (
    <AppPageLayout
        title="Moje grupy"
        leftIcon="arrow_back"
        onLeftClick={() => navigate("/student")}
        leftAriaLabel="Wróć do strony głównej"
        loading={loading}
        loadingLabel="Ładowanie grup..."
        bottomNav={<StudentBottomNav />}
        shell="student"
        className="student-groups-page"
        contentClassName="student-groups-content"
      >

        {error ? (
          <ErrorState>{error}</ErrorState>
        ) : groups.length === 0 ? (
          <EmptyState icon="groups">
            <h3>Nie należysz jeszcze do żadnej grupy</h3>
            <p>Po zaakceptowaniu zaproszenia od nauczyciela grupa pojawi się tutaj.</p>
          </EmptyState>
        ) : (
          <div className="student-groups-list">
            {groups.map((group) => (
              <article className="student-group-card" key={group.id}>
                <div>
                  <p className="eyebrow">Grupa</p>
                  <h3>{group.name}</h3>
                  <p>{group.description || "Brak opisu grupy."}</p>
                </div>
                <div className="student-group-meta">
                  <span>
                    <strong>Przedmiot</strong>
                    {group.subject || "-"}
                  </span>
                  <span>
                    <strong>Rok</strong>
                    {group.schoolYear || "-"}
                  </span>
                  <span>
                    <strong>Semestr</strong>
                    {group.semester || "-"}
                  </span>
                  <span>
                    <strong>Nauczyciel</strong>
                    {group.teacherName || group.teacherEmail || "-"}
                  </span>
                </div>
                <button
                  className="primary-action-btn"
                  style={{ marginTop: "1rem", width: "100%" }}
                  onClick={() => navigate(`/student/groups/${group.id}/grades`)}
                >
                  <span className="material-symbols-outlined">grading</span>
                  Zobacz oceny
                </button>
              </article>
            ))}
          </div>
        )}
    </AppPageLayout>
  );
};

export default StudentGroupsPage;
