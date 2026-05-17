import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../../components/shared/LoadingState";
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
    <div className="app-container student-groups-page">
      <header className="top-bar">
        <button className="icon-btn" onClick={() => navigate("/student")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Moje grupy</h2>
        <div style={{ width: "2.5rem" }} />
      </header>

      <main className="student-groups-content">
        {loading ? (
          <LoadingState label="Ładowanie grup..." />
        ) : error ? (
          <div className="error-state">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">groups</span>
            <h3>Nie należysz jeszcze do żadnej grupy</h3>
            <p>Po zaakceptowaniu zaproszenia od nauczyciela grupa pojawi się tutaj.</p>
          </div>
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
      </main>

      <nav className="bottom-nav-stitch">
        <button className="nav-item" onClick={() => navigate("/student")}>
          <span className="material-symbols-outlined">home</span>
          Główna
        </button>
        <button className="nav-item" onClick={() => navigate("/student/schedule")}>
          <span className="material-symbols-outlined">calendar_month</span>
          Plan
        </button>
        <button className="nav-item active">
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
    </div>
  );
};

export default StudentGroupsPage;
