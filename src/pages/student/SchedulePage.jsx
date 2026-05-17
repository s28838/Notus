import React, { useState, useMemo, useContext, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import TeacherBottomNav from "../../components/teacher/TeacherBottomNav";
import { apiGet } from "../../services/api";
import LoadingState from "../../components/shared/LoadingState";

// --- Helpers ---
const formatDateHeader = (date) => {
  return date.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long'
  });
};

const formatSelectedLabel = (date) => {
  const today = new Date();
  const dateStr = date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  if (date.toDateString() === today.toDateString()) {
    return `Dziś, ${dateStr}`;
  }
  return dateStr;
};

const toInputDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getExtendedDays = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const days = [];

  // Generate 3 months: previous, current, and next
  for (let offset = -1; offset <= 1; offset++) {
    const d = new Date(year, month + offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();

    for (let day = 1; day <= lastDayOfMonth; day++) {
      days.push({
        key: `day-${y}-${m}-${day}`,
        date: new Date(y, m, day)
      });
    }
  }

  return days;
};

// --- Inline Styles (scoped to component) ---
const styles = {
  datepickerOverlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn 0.2s ease',
  },
  datepickerModal: {
    background: 'var(--surface-light)',
    borderRadius: '1.5rem',
    padding: '2rem 1.5rem',
    display: 'flex', flexDirection: 'column', gap: '1.25rem',
    minWidth: '280px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(244,89,37,0.15)',
    animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  datepickerTitle: {
    margin: 0, fontSize: '1.125rem', fontWeight: 700,
    color: 'var(--text-primary)', textAlign: 'center',
  },
  nativeDateInput: {
    width: '100%', padding: '0.75rem 1rem',
    border: '2px solid var(--border-light)',
    borderRadius: '0.75rem',
    fontSize: '1rem', fontFamily: 'inherit',
    color: 'var(--text-primary)',
    background: 'var(--bg-light)',
    outline: 'none', cursor: 'pointer',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  datepickerConfirmBtn: {
    padding: '0.75rem 1.5rem',
    background: 'var(--color-primary)',
    color: 'white', border: 'none',
    borderRadius: '0.75rem', fontWeight: 700,
    fontSize: '1rem', cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(244,89,37,0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  datepickerCancelBtn: {
    padding: '0.65rem 1.5rem',
    background: 'transparent', color: 'var(--text-tertiary)',
    border: '1px solid var(--border-light)',
    borderRadius: '0.75rem', fontWeight: 600,
    fontSize: '0.9rem', cursor: 'pointer',
    transition: 'background 0.15s',
  },
};

const SchedulePage = () => {
  const { user, getToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [listPivotMonth, setListPivotMonth] = useState(new Date());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(toInputDateString(new Date()));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [assignmentMap, setAssignmentMap] = useState({});

  const today = useMemo(() => new Date(), []);
  const scrollContainerRef = useRef(null);
  const selectedTileRef = useRef(null);
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const shouldScrollInstant = useRef(false);

  // --- Fetch lessons whenever selectedDate changes ---
  const fetchLessons = useCallback(async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const data = await apiGet(`/api/schedule/day/${formattedDate}`, null, token);

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
          // non-critical
        }
      } else {
        setAssignmentMap({});
      }
    } catch {
      setError("Nie udało się załadować planu. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchLessons(selectedDate);
  }, [selectedDate, fetchLessons]);

  // --- Scroll selected tile to center whenever selection changes ---
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedTileRef.current) {
        isProgrammaticScroll.current = true;
        selectedTileRef.current.scrollIntoView({
          behavior: shouldScrollInstant.current ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center',
        });
        shouldScrollInstant.current = false;
        
        // Reset programmatic flag after smooth scroll completes
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isProgrammaticScroll.current = false;
        }, 600); 
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const dateHeader = useMemo(() => formatDateHeader(calendarMonth), [calendarMonth]);
  
  // Pivot the list generation on listPivotMonth instead of selectedDate
  // to prevent the entire list from re-rendering when a user just clicks a visible date.
  const daysInMonth = useMemo(() => getExtendedDays(listPivotMonth), [listPivotMonth.getMonth(), listPivotMonth.getFullYear()]);

  // Sync header with scroll position
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isProgrammaticScroll.current) return;

    const container = scrollContainerRef.current;
    const containerCenter = container.scrollLeft + container.offsetWidth / 2;
    const tiles = container.children;
    
    let closestDate = null;
    let minDiff = Infinity;

    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const tileCenter = tile.offsetLeft + tile.offsetWidth / 2;
      const diff = Math.abs(containerCenter - tileCenter);
      
      if (diff < minDiff) {
        minDiff = diff;
        // The data index maps to daysInMonth
        if (daysInMonth[i]) closestDate = daysInMonth[i].date;
      }
    }

    if (closestDate) {
      if (closestDate.getMonth() !== calendarMonth.getMonth() || closestDate.getFullYear() !== calendarMonth.getFullYear()) {
        setCalendarMonth(new Date(closestDate.getFullYear(), closestDate.getMonth(), 1));
      }
    }
  }, [daysInMonth, calendarMonth]);

  // Dynamic label: shows selected date formatted
  const selectedLabel = useMemo(() => formatSelectedLabel(selectedDate), [selectedDate]);

  const handleBack = () => navigate(-1);
  const goToStats = () => navigate(user?.role === "teacher" ? "/teacher/stats" : "/student/stats");
  const goToHome = () => navigate(user?.role === "teacher" ? "/teacher" : "/student");
  const goToProfile = () => navigate(user?.role === "teacher" ? "/teacher/settings" : "/student/settings");
  const goToGroups = () => navigate("/student/groups");

  const handleDaySelect = (date) => {
    if (!date) return;
    
    // If moving to a different month, don't animate the scroll to avoid weird visual glitches
    const isDifferentMonth = date.getMonth() !== selectedDate.getMonth() || date.getFullYear() !== selectedDate.getFullYear();
    if (isDifferentMonth) shouldScrollInstant.current = true;

    setSelectedDate(date);
    // Update header (calendarMonth)
    setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));

    // Only update the list pivot if the selected date is outside the current 3-month window
    // (1 month before, 1 month after the pivot)
    const monthDiff = (date.getFullYear() - listPivotMonth.getFullYear()) * 12 + (date.getMonth() - listPivotMonth.getMonth());
    if (Math.abs(monthDiff) > 1) {
      setListPivotMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  // --- Date Picker handlers ---
  const handleHeaderClick = () => {
    setPickerValue(toInputDateString(selectedDate));
    setIsPickerOpen(true);
  };

  const handlePickerConfirm = () => {
    if (!pickerValue) return;
    const [y, m, d] = pickerValue.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    setSelectedDate(newDate);
    setCalendarMonth(new Date(y, m - 1, 1));
    setListPivotMonth(new Date(y, m - 1, 1));
    setIsPickerOpen(false);
  };

  const handlePickerCancel = () => setIsPickerOpen(false);

  const getDayShortName = (dayIndex) => {
    const names = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
    return names[dayIndex];
  };

  return (
    <div className="app-container">
      {/* === DATE PICKER MODAL === */}
      {isPickerOpen && (
        <div style={styles.datepickerOverlay} onClick={handlePickerCancel}>
          <div style={styles.datepickerModal} onClick={e => e.stopPropagation()}>
            <p style={styles.datepickerTitle}>📅 Wybierz datę</p>
            <input
              type="date"
              value={pickerValue}
              onChange={e => setPickerValue(e.target.value)}
              style={styles.nativeDateInput}
              onFocus={e => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button style={styles.datepickerCancelBtn} onClick={handlePickerCancel}>
                Anuluj
              </button>
              <button
                style={{ ...styles.datepickerConfirmBtn, flex: 1 }}
                onClick={handlePickerConfirm}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244,89,37,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 15px rgba(244,89,37,0.4)'; }}
              >
                Przejdź
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === HEADER === */}
      <div className="top-bar">
        <button
          className="icon-btn"
          onClick={handleBack}
          style={{ background: 'transparent', color: 'var(--text-primary)' }}
        >
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

      {/* === DATE PICKER SECTION === */}
      <div style={{ padding: '1.5rem 1rem 0.75rem' }}>
        {/* Month header – clickable, no arrows */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <button
            onClick={handleHeaderClick}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0.25rem 0.5rem 0.25rem 0',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              borderRadius: '0.5rem',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,89,37,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            title="Kliknij, aby wybrać datę"
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {dateHeader}
            </h2>
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '1.1rem', opacity: 0.7 }}
            >
              expand_more
            </span>
          </button>

          {/* Dynamic "Dziś" label — shows selected date */}
          <span
            className="text-primary font-medium"
            style={{
              fontSize: '0.8rem', fontWeight: 600,
              background: 'rgba(244,89,37,0.1)',
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              textTransform: 'capitalize',
              maxWidth: '55%', textAlign: 'right',
              lineHeight: 1.3,
            }}
          >
            {selectedLabel}
          </span>
        </div>

        {/* === HORIZONTAL DAY TILES === */}
        <div
          ref={scrollContainerRef}
          className="no-scrollbar"
          onScroll={handleScroll}
          style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', paddingTop: '0.25rem', scrollBehavior: 'smooth' }}
        >
          {daysInMonth.map((dayInfo) => {
            const date = dayInfo.date;
            if (!date) return null;

            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isToday = date.toDateString() === today.toDateString();
            const dayName = getDayShortName((date.getDay() + 6) % 7);

            return (
              <div
                key={dayInfo.key}
                ref={isSelected ? selectedTileRef : null}
                onClick={() => handleDaySelect(date)}
                style={{
                  minWidth: '60px',
                  height: '5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  borderRadius: '0.875rem',
                  flexShrink: 0,
                  // Background & color
                  background: isSelected
                    ? 'linear-gradient(135deg, #f45925 0%, #ff7a4d 100%)'
                    : isToday
                    ? 'var(--surface-light)'
                    : 'var(--surface-light)',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  // Border
                  border: isSelected
                    ? '2px solid transparent'
                    : isToday
                    ? '2px solid var(--color-primary)'
                    : '1px solid var(--border-light)',
                  // Glow & shadow
                  boxShadow: isSelected
                    ? '0 6px 20px rgba(244,89,37,0.45), 0 0 0 3px rgba(244,89,37,0.15)'
                    : isToday
                    ? '0 2px 8px rgba(244,89,37,0.2)'
                    : '0 1px 3px rgba(0,0,0,0.06)',
                  // Smooth transition for all properties
                  transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, background 0.2s ease, border 0.15s ease',
                  transform: isSelected ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
                }}
              >
                <span style={{
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: isSelected ? 'rgba(255,255,255,0.85)' : isToday ? 'var(--color-primary)' : 'var(--text-tertiary)',
                  marginBottom: '0.2rem',
                }}>
                  {dayName}
                </span>
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  lineHeight: 1,
                }}>
                  {date.getDate()}
                </span>
                {isToday && !isSelected && (
                  <span style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: 'var(--color-primary)',
                    marginTop: '0.25rem',
                    display: 'block',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* === TIMELINE SECTION === */}
      <div style={{ padding: '0.75rem 1rem 5rem' }}>
        <h3 style={{
          fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.8rem',
          textTransform: 'uppercase', letterSpacing: '0.07em',
          marginBottom: '1rem', marginTop: 0,
        }}>
          {selectedDate.toDateString() === today.toDateString() ? "Plan na dziś" : "Plan"}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isLoading ? (
            <LoadingState label="Ładowanie planu..." />
          ) : error ? (
            <div className="error-state">
              <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>error</span>
              <p style={{ margin: 0 }}>{error}</p>
              <button
                onClick={() => fetchLessons(selectedDate)}
                style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', border: 'none', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                Spróbuj ponownie
              </button>
            </div>
          ) : schedule.length > 0 ? (
            schedule.map((lesson, index) => (
              <div key={lesson.id} style={{ position: 'relative', paddingLeft: '2rem' }}>
                <div style={{ position: 'absolute', left: '0.75rem', top: 0, bottom: index === schedule.length - 1 ? '50%' : '-1rem', width: '2px', background: 'rgba(244, 89, 37, 0.2)' }}></div>
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
                          onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assign-quiz/${lesson.id}`); }}
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
                        >
                          Zmień
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/assign-quiz/${lesson.id}`); }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                        Przypisz quiz
                      </button>
                    )
                  ) : assignmentMap[lesson.id] ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/student/quiz/${assignmentMap[lesson.id].assignmentId}`); }}
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

      {/* === BOTTOM NAV === */}
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
          <button className="nav-item" onClick={goToGroups}>
            <span className="material-symbols-outlined">groups</span>
            Grupy
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

      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default SchedulePage;
