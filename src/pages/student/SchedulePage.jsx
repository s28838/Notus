import { useState, useMemo, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import { apiGet } from "../../services/api";

// --- Helpers ---
const formatDateHeader = (date) => {
    return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'long'
    });
};

const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = [];

    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; 
    
    for (let i = 0; i < startDayIndex; i++) {
        days.push({ key: `empty-${i}`, date: null, isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
        days.push({ 
            key: `day-${d}`, 
            date: new Date(year, month, d), 
            isCurrentMonth: true 
        });
    }

    return days;
};

const SchedulePage = () => {
  const { user, getToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [calendarMonth, setCalendarMonth] = useState(new Date()); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [assignmentMap, setAssignmentMap] = useState({});
  
  const today = useMemo(() => new Date(), []);
  
  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Find the start and end of the selected date for filtering
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const token = await getToken();
        let params = {
          start: startOfDay.toISOString(),
          end: endOfDay.toISOString()
        };

        if (user?.role === 'teacher') {
          if (user.id) params.teacherId = user.id;
          else if (user.name) params.teacherName = user.name;
        }

        const data = await apiGet("/api/schedule", params, token);
          
        // Map the database rows to the expected format for our UI components.
        const formattedData = (data || []).map(row => ({
          id: row.id,
          subject: row.subject || "Unknown Subject",
          teacher: row.teacher || "Unknown Teacher",
          type: row.type || "Lecture",
          color: row.color || "primary",
          time: row.time || "00:00",
          room: row.room || "TBD",
        }));

        setSchedule(formattedData);

        // Fetch quiz assignments for these lessons
        const ids = formattedData.map(l => l.id).filter(Boolean);
        if (ids.length > 0) {
          try {
            const assignments = await apiGet(
              "/api/quiz-assignments/by-schedules",
              { scheduleIds: ids.join(",") },
              token
            );
            const map = {};
            (assignments || []).forEach(a => { map[a.scheduleId] = a; });
            setAssignmentMap(map);
          } catch {
            // non-critical — badges just won't show
          }
        } else {
          setAssignmentMap({});
        }
      } catch {
        setError("Nie udało się załadować planu. Spróbuj ponownie.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedDate, user, getToken]);

  const dateHeader = useMemo(() => formatDateHeader(calendarMonth), [calendarMonth]);
  
  const daysInMonth = useMemo(() => getDaysInMonth(calendarMonth), [calendarMonth]);

  const handleBack = () => navigate(-1);
  const goToStats = () => navigate(user?.role === "teacher" ? "/teacher/stats" : "/student/stats");
  const goToHome = () => navigate(user?.role === "teacher" ? "/teacher" : "/student");
  const goToProfile = () => navigate(user?.role === "teacher" ? "/teacher/profile" : "/student/profile");
  
  const handleDaySelect = (date) => {
      if (date) setSelectedDate(date);
  };

  const changeMonth = (offset) => {
      const newMonth = new Date(calendarMonth.getTime());
      newMonth.setMonth(calendarMonth.getMonth() + offset);
      setCalendarMonth(newMonth);
  };
  
  const getDayShortName = (dayIndex) => {
    const names = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
    return names[dayIndex];
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div className="top-bar">
        <button className="icon-btn" onClick={handleBack} style={{ background: 'transparent', color: 'var(--text-primary)' }}>
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h2 className="top-bar-title">Mój Plan</h2>
        {user?.role === 'teacher' ? (
          <button
            className="icon-btn"
            onClick={() => navigate('/teacher/create-lesson')}
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            <span className="material-symbols-outlined">calendar_add_on</span>
          </button>
        ) : (
          <div style={{ width: '2.5rem' }} />
        )}
      </div>

      {/* Date Picker Section */}
      <div style={{ padding: '1.5rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <button onClick={() => changeMonth(-1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}>{'<'}</button>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{dateHeader}</h2>
             <button onClick={() => changeMonth(1)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-tertiary)' }}>{'>'}</button>
          </div>
          <span className="text-primary font-medium" style={{ fontSize: '0.875rem' }}>Dziś</span>
        </div>
        
        {/* Horizontal Scroll Days */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {daysInMonth.map((dayInfo) => {
             const date = dayInfo.date;
             if (!date) return null; // skip empties for this horizontal view
             
             const isSelected = date.toDateString() === selectedDate.toDateString();
             const dayName = getDayShortName((date.getDay() + 6) % 7);
             
             return (
                <div 
                  key={dayInfo.key} 
                  onClick={() => handleDaySelect(date)}
                  className={`glass-card ${isSelected ? 'selected' : ''}`}
                  style={{ 
                    minWidth: '64px', height: '5rem', display: 'flex', flexDirection: 'column', 
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                    background: isSelected ? 'var(--color-primary)' : 'var(--surface-light)',
                    color: isSelected ? 'white' : 'var(--text-primary)',
                    boxShadow: isSelected ? '0 10px 15px -3px rgba(244, 89, 37, 0.3)' : '0 1px 2px 0 rgba(0,0,0,0.05)',
                    border: isSelected ? 'none' : '1px solid var(--border-light)',
                    margin: 0
                  }}
                >
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' }}>{dayName}</span>
                  <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>{date.getDate()}</span>
                </div>
             );
          })}
        </div>
      </div>

      {/* Timeline Section */}
      <div style={{ padding: '0 1rem' }}>
        <h3 style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', marginTop: 0 }}>
          {selectedDate.toDateString() === today.toDateString() ? "Plan na dziś" : "Plan"}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              Ładowanie planu...
            </div>
          ) : error ? (
            <div className="error-state">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>error</span>
              <p style={{ margin: 0 }}>{error}</p>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate))}
                style={{ padding: '0.5rem 1rem', background: '#ef4444', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : schedule.length > 0 ? (
            schedule.map((lesson, index) => (
              <div key={lesson.id} style={{ position: 'relative', paddingLeft: '2rem' }}>
                {/* Timeline Line */}
                <div style={{ position: 'absolute', left: '0.75rem', top: 0, bottom: index === schedule.length - 1 ? '50%' : '-1rem', width: '2px', background: 'rgba(244, 89, 37, 0.2)' }}></div>
                {/* Timeline Dot */}
                <div style={{ position: 'absolute', left: '0.375rem', top: '1.5rem', width: '14px', height: '14px', borderRadius: '50%', border: `2px solid ${index === 0 ? 'var(--color-primary)' : 'var(--border-light)'}`, background: 'white', zIndex: 10 }}></div>
                
                <div
                  className="glass-card"
                  onClick={() => navigate(user?.role === 'teacher' ? `/teacher/lesson/${lesson.id}` : `/student/lesson/${lesson.id}`)}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', opacity: index > 0 && selectedDate.toDateString() === today.toDateString() ? 0.8 : 1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1.125rem', margin: '0 0 0.25rem' }}>{lesson.subject}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{lesson.teacher}</p>
                    </div>
                    <span style={{
                        background: lesson.color === 'emerald' ? '#d1fae5' : 'rgba(244, 89, 37, 0.1)',
                        color: lesson.color === 'emerald' ? '#059669' : 'var(--color-primary)',
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                    }}>{lesson.type}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>schedule</span>
                      <span style={{ fontSize: '0.875rem' }}>{lesson.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: '1.25rem' }}>location_on</span>
                      <span style={{ fontSize: '0.875rem' }}>{lesson.room}</span>
                    </div>
                  </div>
                  {user?.role === 'teacher' ? (
                    assignmentMap[lesson.id] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border-light)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>quiz</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', flex: 1 }}>{assignmentMap[lesson.id].quizTitle}</span>
                        <button
                          onClick={() => navigate(`/teacher/assign-quiz/${lesson.id}`)}
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          Zmień
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/teacher/assign-quiz/${lesson.id}`)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                        Przypisz quiz
                      </button>
                    )
                  ) : assignmentMap[lesson.id] ? (
                    <button
                      onClick={() => navigate(`/student/quiz/${assignmentMap[lesson.id].assignmentId}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>quiz</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>Quiz dostępny</span>
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--color-primary)', marginLeft: 'auto' }}>chevron_right</span>
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--border-light)' }}>event_busy</span>
              <p style={{ margin: 0, fontWeight: 600, fontSize: '1.125rem', color: 'var(--text-primary)' }}>Brak zajęć</p>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Ciesz się wolnym czasem lub sprawdź inny dzień.</p>
            </div>
          )}
        </div>
      </div>

      {user?.role === "teacher" ? (
        <TeacherBottomNav />
      ) : (
        <nav className="bottom-nav-stitch">
          <button className="nav-item" onClick={goToHome}>
            <span className="material-symbols-outlined">home</span>
            Główna
          </button>
          <button className="nav-item active">
            <span className="material-symbols-outlined fill">calendar_month</span>
            Plan
          </button>
          <button className="nav-item" onClick={goToStats}>
            <span className="material-symbols-outlined">history</span>
            Historia
          </button>
          <button className="nav-item" onClick={goToProfile}>
            <span className="material-symbols-outlined">person</span>
            Profil
          </button>
        </nav>
      )}
    </div>
  );
};

export default SchedulePage;
