import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPut } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";
import { CustomDatePicker, CustomTimePicker } from "../../components/shared/DateTimePickers";
import { CustomSelect } from "../../components/shared/FormControls";

const LESSON_TYPE_OPTIONS = [
  { value: "Wykład", label: "Wykład", aliases: ["Wyk\u00c5\u201aad"] },
  { value: "Ćwiczenia", label: "Ćwiczenia", aliases: ["\u00c4\u2020wiczenia"] },
  { value: "Laboratorium", label: "Laboratorium" },
  { value: "Seminarium", label: "Seminarium" },
];

const normalizeLessonType = (value) => (
  LESSON_TYPE_OPTIONS.find((option) => option.value === value || option.aliases?.includes(value))?.value || "Wykład"
);

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
          apiGet("/api/teacher/groups", null, token)
        ]);
        setGroups(groupList || []);

        setSubject(lesson.subject || "");
        setRoom(lesson.room || "");
        setType(normalizeLessonType(lesson.type));
        setStudentGroupId(lesson.teacherGroupId ? String(lesson.teacherGroupId) : "");

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
    if (!subject || !date || !timeStart || !timeEnd || !room || !type || !studentGroupId) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      await apiPut(`/api/schedule/${id}`, {
        subject,
        date: new Date(`${date}T12:00:00`).toISOString(),
        time: `${timeStart} - ${timeEnd}`,
        room,
        type,
        teacherGroupId: Number(studentGroupId),
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
        <LoadingState label="Ładowanie lekcji..." />
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

      <div className="desktop-centered-content" style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Przedmiot *</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="np. Matematyka" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Data *</label>
            <CustomDatePicker value={date} onChange={setDate} placeholder="Wybierz datę" ariaLabel="Wybierz datę lekcji" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Godz. start *</label>
              <CustomTimePicker value={timeStart} onChange={setTimeStart} placeholder="Wybierz godzinę" ariaLabel="Wybierz godzinę rozpoczęcia" />
            </div>
            <div>
              <label style={labelStyle}>Godz. koniec *</label>
              <CustomTimePicker value={timeEnd} onChange={setTimeEnd} placeholder="Wybierz godzinę" ariaLabel="Wybierz godzinę zakończenia" />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Sala *</label>
            <input type="text" value={room} onChange={e => setRoom(e.target.value)} placeholder="np. 101" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Typ *</label>
            <CustomSelect value={type} onChange={setType} options={LESSON_TYPE_OPTIONS} ariaLabel="Wybierz typ zajęć" />
          </div>

          <div>
            <label style={labelStyle}>Grupa *</label>
            <CustomSelect
              value={studentGroupId}
              onChange={setStudentGroupId}
              placeholder="Wybierz grupę"
              ariaLabel="Wybierz grupę"
              options={groups.map(g => ({ value: String(g.id), label: `${g.name} - ${g.subject || "bez przedmiotu"}` }))}
            />
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

