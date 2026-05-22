import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherBottomNav from "../../../components/teacher/TeacherBottomNav";
import { apiDelete, apiGet, apiPost, apiPut } from "../../../services/api";
import LoadingState from "../../../components/shared/LoadingState";

const emptyForm = {
  name: "",
  description: "",
  subject: "",
  schoolYear: "2025/2026",
  semester: "2",
};

const TeacherGroupsPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadGroups = async () => {
    setLoading(true);
    setError("");
    try {
      setGroups(await apiGet("/api/teacher/groups"));
    } catch {
      setError("Nie udało się pobrać grup.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setModalMode("create");
  };

  const openEdit = (group) => {
    setForm({
      name: group.name || "",
      description: group.description || "",
      subject: group.subject || "",
      schoolYear: group.schoolYear || "",
      semester: group.semester || "",
    });
    setEditingId(group.id);
    setModalMode("edit");
  };

  const submitGroup = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      if (editingId) {
        await apiPut(`/api/teacher/groups/${editingId}`, form);
      } else {
        await apiPost("/api/teacher/groups", form);
      }
      setModalMode(null);
      setNotice(editingId ? "Grupa została zaktualizowana." : "Grupa została utworzona.");
      await loadGroups();
    } catch {
      setError(editingId ? "Nie udało się zaktualizować grupy." : "Nie udało się utworzyć grupy.");
    }
  };

  const deleteGroup = async (group) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tę grupę?")) return;
    setError("");
    setNotice("");
    try {
      await apiDelete(`/api/teacher/groups/${group.id}`);
      setNotice("Grupa została usunięta.");
      await loadGroups();
    } catch {
      setError("Nie udało się usunąć grupy.");
    }
  };

  return (
    <div className="schedule-page-container groups-page">
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={() => navigate("/teacher")}
          style={{ background: "transparent", color: "var(--text-primary)" }}
          aria-label="Wróć do panelu nauczyciela"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Moje grupy</h2>
        <button
          className="icon-btn"
          onClick={openCreate}
          style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
          aria-label="Utwórz grupę"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {notice && <div className="success-banner">{notice}</div>}
      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <LoadingState label="Ładowanie grup..." />
      ) : (
        <section className="data-panel">
          {groups.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">groups</span>
            <h2>Nie masz jeszcze grup</h2>
            <p>Utwórz pierwszą grupę, a potem zaproś uczniów jednym formularzem email.</p>
          </div>
        ) : (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Nazwa grupy</th>
                  <th>Przedmiot</th>
                  <th>Rok szkolny</th>
                  <th>Semestr</th>
                  <th>Uczniów</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.subject || "-"}</td>
                    <td>{group.schoolYear || "-"}</td>
                    <td>{group.semester || "-"}</td>
                    <td>{group.studentsCount}</td>
                    <td className="table-actions">
                      <button onClick={() => navigate(`/teacher/groups/${group.id}`)}>Otwórz</button>
                      <button onClick={() => openEdit(group)}>Edytuj</button>
                      <button className="danger-link" onClick={() => deleteGroup(group)}>Usuń</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </section>
      )}

      {modalMode && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={submitGroup}>
            <h2>{editingId ? "Edytuj grupę" : "Utwórz grupę"}</h2>
            <label>
              Nazwa grupy
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Opis grupy
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label>
              Przedmiot / kategoria
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </label>
            <div className="form-grid">
              <label>
                Rok szkolny
                <input value={form.schoolYear} onChange={(e) => setForm({ ...form, schoolYear: e.target.value })} />
              </label>
              <label>
                Semestr
                <input value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setModalMode(null)}>Anuluj</button>
              <button className="primary-action-btn" type="submit">Zapisz</button>
            </div>
          </form>
        </div>
      )}

      <TeacherBottomNav />
    </div>
  );
};

export default TeacherGroupsPage;
