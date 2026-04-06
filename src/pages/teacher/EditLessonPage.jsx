import { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPut } from "../../services/api";

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
  border: '1px solid var(--border-light)', background: 'var(--surface-light)',
  color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 700,
  color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase'
};

const EditLessonPage = () => {
  const { id } = useParams();
  const { getToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [room, setRoom] = useState("");
  const [type, setType] = useState("Wykład");
  const [studentGroupId, setStudentGroupId] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const [lesson, groupList] = await Promise.all([
          apiGet(`/api/schedule/${id}`, null, token),
          apiGet("/api/student-groups", null, token)
        ]);
        setGroups(groupList || []);

        setSubject(lesson.subject || "");
        setRoom(lesson.room || "");
        setType(lesson.type || "Wykład");
        setStudentGroupId(lesson.studentGroup?.id ? String(lesson.studentGroup.id) : "");

        if (lesson.date) {
          setDate(new Date(lesson.date).toISOString().split("T")[0]);
        }
        if (lesson.time && lesson.time.includes(" - ")) {
          const [start, end] = lesson.time.split(" - ");
          setTimeStart(start);
          setTimeEnd(end);
        }
      } catch {
        setError("Nie udało się załadować lekcji.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, getToken]);

  const handleSubmit = async () => {
    if (!subject || !date || !timeStart || !timeEnd || !room || !type) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      await apiPut(`/api/schedule/${id}`, {
        subject,
        date: new Date(date).toISOString(),
        time: `${timeStart} - ${timeEnd}`,
        room,
        type,
        studentGroupId: studentGroupId ? Number(studentGroupId) : null,
        color: "primary"
      }, token);
      navigate(`/teacher/lesson/${id}`);
    } catch {
      setError("Nie udało się zapisać zmian. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container page-enter">
        <div className="top-bar">
          <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h2 className="top-bar-title">Edytuj lekcję</h2>
          <div style={{ width: '2.5rem' }} />
        </div>
        <div className="loading-state"><div className="loading-spinner"></div>Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="app-container page-enter">
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Edytuj lekcję</h2>
        <div style={{ width: '2.5rem' }} />
      </div>

      <div style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Przedmiot *</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="np. Matematyka" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Data *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Godz. start *</label>
              <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Godz. koniec *</label>
              <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sala *</label>
            <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="np. 101" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Typ *</label>
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
              <option value="Wykład">Wykład</option>
              <option value="Ćwiczenia">Ćwiczenia</option>
              <option value="Laboratorium">Laboratorium</option>
              <option value="Seminarium">Seminarium</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Grupa (opcjonalnie)</label>
            <select value={studentGroupId} onChange={e => setStudentGroupId(e.target.value)} style={inputStyle}>
              <option value="">Brak grupy</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.code}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
      </div>
    </div>
  );
};

export default EditLessonPage;
