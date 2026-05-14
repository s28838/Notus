import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TeacherBottomNav from "../../../components/teacher/TeacherBottomNav";
import { apiDelete, apiGet, apiPost, apiPut } from "../../../services/api";

const TeacherGroupDetailsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    value: "5",
    weight: 1,
    semester: group?.semester || "2",
    title: "",
    description: "",
    comment: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [groupData, studentData] = await Promise.all([
        apiGet(`/api/teacher/groups/${groupId}`),
        apiGet(`/api/teacher/groups/${groupId}/students`),
      ]);
      setGroup(groupData);
      setStudents(studentData);
    } catch {
      setError("Nie masz uprawnień do tej grupy albo nie udało się jej pobrać.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const sendInvite = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      const response = await apiPost(`/api/teacher/groups/${groupId}/students/invite`, { email: inviteEmail });
      if (!response.success) throw new Error(response.message);
      setInviteEmail("");
      setShowInvite(false);
      setNotice("Zaproszenie zostało wysłane.");
    } catch {
      setError("Nie udało się zaprosić ucznia. Skontaktuj się z administratorem.");
    }
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      await apiPut(`/api/teacher/groups/${groupId}/students/${editingStudent.id}`, {
        displayName: editingStudent.fullName,
        email: editingStudent.email,
      });
      setEditingStudent(null);
      setNotice("Dane ucznia zostały zaktualizowane.");
      await load();
    } catch {
      setError("Nie udało się zaktualizować danych ucznia.");
    }
  };

  const saveGrade = async () => {
    if (!editingStudent) return;
    setNotice("");
    setError("");
    try {
      await apiPost(`/api/teacher/groups/${groupId}/students/${editingStudent.id}/grades`, {
        value: gradeForm.value,
        weight: Number(gradeForm.weight),
        semester: gradeForm.semester,
        title: gradeForm.title,
        description: gradeForm.description,
        comment: gradeForm.comment,
        gradeDate: new Date().toISOString().slice(0, 10),
      });
      setNotice("Ocena została wystawiona.");
      setGradeForm({
        value: "5",
        weight: 1,
        semester: group?.semester || "2",
        title: "",
        description: "",
        comment: "",
      });
      await load();
    } catch {
      setError("Nie udało się wystawić oceny.");
    }
  };

  const removeStudent = async (student) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tego ucznia z grupy?")) return;
    setNotice("");
    setError("");
    try {
      await apiDelete(`/api/teacher/groups/${groupId}/students/${student.id}`);
      setNotice("Uczeń został usunięty z grupy.");
      await load();
    } catch {
      setError("Nie udało się usunąć ucznia z grupy.");
    }
  };

  if (loading) {
    return <div className="schedule-page-container"><p className="muted">Ładowanie grupy...</p><TeacherBottomNav /></div>;
  }

  return (
    <div className="schedule-page-container groups-page">
      <button className="back-link" onClick={() => navigate("/teacher/groups")}>
        <span className="material-symbols-outlined">arrow_back</span>
        Powrót
      </button>

      {group && (
        <div className="details-header">
          <div>
            <p className="eyebrow">Szczegóły grupy</p>
            <h1>{group.name}</h1>
            <p>Przedmiot: {group.subject || "-"} | Rok szkolny: {group.schoolYear || "-"} | Semestr: {group.semester || "-"}</p>
          </div>
          <button className="primary-action-btn" onClick={() => setShowInvite(true)}>
            <span className="material-symbols-outlined">person_add</span>
            Dodaj ucznia
          </button>
        </div>
      )}

      {notice && <div className="success-banner">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}

      <section className="data-panel student-roster-panel">
        <h2>Uczniowie</h2>
        {students.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">person_add</span>
            <h3>Brak uczniów w grupie</h3>
            <p>Użyj przycisku Dodaj ucznia, żeby wysłać zaproszenie email.</p>
          </div>
        ) : (
          <div className="responsive-table student-roster-table">
            <table>
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>Email</th>
                  <th>Frekwencja</th>
                  <th>Średnia ocen</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.fullName}</td>
                    <td>{student.email}</td>
                    <td>
                      <button className="table-link" onClick={() => navigate(`/teacher/groups/${groupId}/students/${student.id}/attendance`)}>
                        <span className="attendance-meter" aria-label={`Frekwencja ${student.attendancePercentage}%`}>
                          <span className="attendance-meter-track">
                            <span
                              className="attendance-meter-fill"
                              style={{ width: `${Math.max(0, Math.min(100, Number(student.attendancePercentage) || 0))}%` }}
                            />
                          </span>
                          <strong>{student.attendancePercentage}%</strong>
                        </span>
                      </button>
                    </td>
                    <td>
                      <button className="table-link" onClick={() => navigate(`/teacher/groups/${groupId}/students/${student.id}/grades`)}>
                        {Number(student.averageGrade).toFixed(2)}
                      </button>
                    </td>
                    <td className="table-actions">
                      <button onClick={() => setEditingStudent({ ...student })}>Edytuj</button>
                      <button className="danger-link" onClick={() => removeStudent(student)}>Usuń</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showInvite && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={sendInvite}>
            <h2>Dodaj ucznia do grupy</h2>
            <label>
              Email ucznia
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowInvite(false)}>Anuluj</button>
              <button className="primary-action-btn" type="submit">Wyślij zaproszenie</button>
            </div>
          </form>
        </div>
      )}

      {editingStudent && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={saveStudent}>
            <h2>Edytuj ucznia</h2>
            <label>
              Imię i nazwisko
              <input value={editingStudent.fullName} onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={editingStudent.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} required />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={() => setEditingStudent(null)}>Anuluj</button>
              <button className="primary-action-btn" type="submit">Zapisz zmiany</button>
            </div>
            <div className="grade-form-section">
              <h3>Wystaw ocenę</h3>
              <div className="form-grid">
                <label>
                  Ocena
                  <input value={gradeForm.value} onChange={(e) => setGradeForm({ ...gradeForm, value: e.target.value })} />
                </label>
                <label>
                  Waga
                  <input type="number" min="1" value={gradeForm.weight} onChange={(e) => setGradeForm({ ...gradeForm, weight: e.target.value })} />
                </label>
                <label>
                  Semestr
                  <input value={gradeForm.semester} onChange={(e) => setGradeForm({ ...gradeForm, semester: e.target.value })} />
                </label>
                <label>
                  Z czego
                  <input value={gradeForm.title} onChange={(e) => setGradeForm({ ...gradeForm, title: e.target.value })} placeholder="Kartkówka" />
                </label>
              </div>
              <label>
                Opis
                <input value={gradeForm.description} onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })} placeholder="Ułamki zwykłe" />
              </label>
              <label>
                Komentarz
                <textarea value={gradeForm.comment} onChange={(e) => setGradeForm({ ...gradeForm, comment: e.target.value })} placeholder="Bardzo dobra praca" />
              </label>
              <button className="primary-action-btn" type="button" onClick={saveGrade}>
                Zapisz ocenę
              </button>
            </div>
          </form>
        </div>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherGroupDetailsPage;
