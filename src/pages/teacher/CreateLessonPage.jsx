import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet, apiPost } from "../../services/api";
import { CustomDatePicker, CustomTimePicker } from "../../components/shared/DateTimePickers";
import { CustomCheckbox, CustomSelect } from "../../components/shared/FormControls";

const LESSON_TYPE_OPTIONS = [
  { value: "Wykład", label: "Wykład", aliases: ["WykÅ‚ad"] },
  { value: "Ćwiczenia", label: "Ćwiczenia", aliases: ["Ä†wiczenia"] },
  { value: "Laboratorium", label: "Laboratorium" },
  { value: "Seminarium", label: "Seminarium" },
];

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
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatEveryWeeks, setRepeatEveryWeeks] = useState(1);
  const [repeatUntil, setRepeatUntil] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = await getToken();
        const data = await apiGet("/api/teacher/groups", null, token);
        setGroups(data || []);
      } catch {
        // non-critical â€” groups dropdown just stays empty
      }
    };
    fetchGroups();
  }, [getToken]);

  useEffect(() => {
    if (!repeatWeekly || !date || repeatUntil) return;
    const defaultEnd = new Date(`${date}T12:00:00`);
    defaultEnd.setFullYear(defaultEnd.getFullYear() + 1);
    setRepeatUntil(defaultEnd.toISOString().split("T")[0]);
  }, [date, repeatUntil, repeatWeekly]);

  const handleSubmit = async () => {
    if (!subject || !date || !timeStart || !timeEnd || !room || !type || !studentGroupId) {
      setError("Wypełnij wszystkie wymagane pola.");
      return;
    }
    if (repeatWeekly) {
      if (!repeatUntil) {
        setError("Podaj datę końca powtarzania.");
        return;
      }
      if (new Date(`${repeatUntil}T12:00:00`) < new Date(`${date}T12:00:00`)) {
        setError("Data końca powtarzania nie może być wcześniejsza niż data pierwszych zajęć.");
        return;
      }
      if (Number(repeatEveryWeeks) < 1) {
        setError("Odstęp powtarzania musi wynosić minimum 1 tydzień.");
        return;
      }
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
        teacherGroupId: Number(studentGroupId),
        color: "primary",
        repeatWeekly,
        repeatEveryWeeks: repeatWeekly ? Number(repeatEveryWeeks) : null,
        repeatUntil: repeatWeekly ? new Date(`${repeatUntil}T12:00:00`).toISOString() : null
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

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
            <CustomCheckbox
              checked={repeatWeekly}
              onChange={setRepeatWeekly}
              label="Powtarzaj zajęcia cyklicznie"
            />

            {repeatWeekly && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={labelStyle}>Co ile tygodni *</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={repeatEveryWeeks}
                    onChange={e => setRepeatEveryWeeks(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Powtarzaj do *</label>
                  <CustomDatePicker
                    value={repeatUntil}
                    min={date || undefined}
                    onChange={setRepeatUntil}
                    placeholder="Wybierz datę"
                    ariaLabel="Wybierz datę końca powtarzania"
                  />
                </div>
              </div>
            )}
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

