import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";

const inputStyle = {
  width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
  border: '1px solid var(--border-light)', background: 'var(--surface-light)',
  color: 'var(--text-primary)', fontSize: '1rem', boxSizing: 'border-box'
};

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: 700,
  color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase'
};

const CreateLessonPage = () => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/student-groups", null, token);
        setGroups(data || []);
      } catch {
        // non-critical — groups dropdown just stays empty
      }
    };
    fetchGroups();
  }, [getToken]);

  const handleSubmit = async () => {
    if (!subject || !date || !timeStart || !timeEnd || !room || !type) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      await apiPost("/api/schedule", {
        subject,
        date: new Date(`${date}T12:00:00`).toISOString(),
        time: `${timeStart} - ${timeEnd}`,
        room,
        type,
        studentGroupId: studentGroupId ? Number(studentGroupId) : null,
        color: "primary"
      }, token);
      navigate("/teacher/schedule");
    } catch {
      setError("Nie udało się dodać lekcji. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container page-enter">
      <div className="top-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Nowa Lekcja</h2>
        <div style={{ width: '2.5rem' }} />
      </div>

      <div className="desktop-centered-content" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
          disabled={loading}
          style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: 700, background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Dodawanie..." : "Dodaj lekcję"}
        </button>
      </div>
    </div>
  );
};

export default CreateLessonPage;
