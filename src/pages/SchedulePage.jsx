// src/pages/SchedulePage.jsx

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// --- Pomocnicze funkcje ---

/**
 * Formatowanie daty na czytelny nagłówek (np. "Poniedziałek, 25 Listopada 2025")
 */
const formatDateHeader = (date) => {
    return date.toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

/**
 * Oblicza i zwraca listę dni (z pustymi komórkami) dla danego miesiąca,
 * zaczynając tydzień od Poniedziałku.
 */
const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = [];

    // Obliczanie pustych komórek przed 1. dniem miesiąca
    // .getDay() zwraca 0 dla Niedzieli, 1 dla Poniedziałku. Chcemy, aby Poniedziałek był 0.
    const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; 
    
    // Dodawanie pustych komórek
    for (let i = 0; i < startDayIndex; i++) {
        days.push({ key: `empty-${i}`, date: null, isCurrentMonth: false });
    }

    // Dodawanie dni miesiąca
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
        days.push({ 
            key: `day-${d}`, 
            date: new Date(year, month, d), 
            isCurrentMonth: true 
        });
    }
    
    // Opcjonalne dodanie pustych komórek na koniec, by wypełnić ostatni rząd siatki (dla estetyki)
    const totalCells = days.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remainingCells; i++) {
        days.push({ key: `empty-end-${i}`, date: null, isCurrentMonth: false });
    }

    return days;
};

/**
 * Mockowe dane planu lekcji (Symulacja danych zależnych od daty)
 */
const getMockSchedule = (date) => {
    const dayOfWeek = date.getDay(); // 0 = Niedziela, 1 = Poniedziałek, ...
    
    // Prosta symulacja: w weekendy i wtorki brak zajęć
    if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 2) {
        return [];
    }
    
    // Zajęcia w czwartki (dayOfWeek === 4)
    if (dayOfWeek === 4) {
        return [
            { time: "9:00 - 10:30", subject: "Sieci komputerowe", room: "F.404", teacher: "Marek Zając" },
            { time: "10:45 - 12:15", subject: "Projektowanie interfejsów (LAB)", room: "C.105", teacher: "Adam Kowalski" },
        ];
    }
    
    // Domyślne zajęcia (Poniedziałek, Środa, Piątek)
    return [
      { time: "8:00 - 9:30", subject: "Programowanie obiektowe (LAB)", room: "C.101", teacher: "Andrzej Wykładowca" },
      { time: "9:45 - 11:15", subject: "Algorytmy i struktury danych", room: "A.305", teacher: "Katarzyna Dziuba" },
      { time: "11:30 - 13:00", subject: "Bazy danych", room: "E.210", teacher: "Paweł Kurek" },
      { time: "14:00 - 15:30", subject: "Matematyka dyskretna", room: "B.007", teacher: "Anna Nowak" },
    ];
};

// Ikona strzałki w lewo (Powrót)
const BackIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

// Ikona strzałka w dół (do zwijania/rozwijania)
const ChevronDownIcon = ({ isOpen }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        // Rotacja ikony w zależności od stanu
        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
    >
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);


// --- Komponent główny ---

const SchedulePage = () => {
  const navigate = useNavigate();
  // Data, której plan zajęć jest wyświetlany
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  // Data, której miesiąc jest aktualnie wyświetlany w komponencie kalendarza
  const [calendarMonth, setCalendarMonth] = useState(new Date()); 
  // Stan dla zwijania/rozwijania kalendarza
  const [isCalendarOpen, setIsCalendarOpen] = useState(true); 

  const today = useMemo(() => new Date(), []);
  
  const schedule = useMemo(() => getMockSchedule(selectedDate), [selectedDate]);
  const dateHeader = useMemo(() => formatDateHeader(selectedDate), [selectedDate]);
  
  // Generowanie dni do wyświetlenia w kalendarzu
  const daysInMonth = useMemo(() => getDaysInMonth(calendarMonth), [calendarMonth]);

  const handleBack = () => {
      navigate(-1);
  };
  
  const handleDaySelect = (date) => {
      if (date) {
          setSelectedDate(date);
          // Ustawiamy wyświetlany miesiąc na wybrany dzień, jeśli to konieczne
          if (date.getMonth() !== calendarMonth.getMonth() || date.getFullYear() !== calendarMonth.getFullYear()) {
             setCalendarMonth(date); 
          }
          // Automatyczne zwijanie kalendarza po wyborze daty
          setIsCalendarOpen(false); 
      }
  };

  const changeMonth = (offset) => {
      // Używamy nowej instancji Date, aby prawidłowo zaktualizować stan
      const newMonth = new Date(calendarMonth.getTime());
      newMonth.setMonth(calendarMonth.getMonth() + offset);
      setCalendarMonth(newMonth);
  };
  
  const currentMonthName = calendarMonth.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });

  return (
    <div className="schedule-page-container">
      {/* NAGŁÓWEK Z PRZYCISKIEM POWROTU */}
      <div className="schedule-header">
        <button 
            className="back-button" 
            onClick={handleBack} 
            title="Powrót"
        >
            <BackIcon />
        </button>
        <h1 className="schedule-title">Plan Zajęć</h1>
      </div>

      {/* GŁÓWNY KONTENER KALENDARZA (z mechanizmem zwijania) */}
      <div className={`calendar-container ${!isCalendarOpen ? 'calendar-collapsed' : ''}`}>
          
          {/* NAGŁÓWEK DO KLIKANIA - wyświetla aktualnie wybraną datę */}
          <div 
              className="calendar-toggle-header" 
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              role="button"
              aria-expanded={isCalendarOpen}
          >
              <h3 className="selected-date-display">{dateHeader}</h3>
              <ChevronDownIcon isOpen={isCalendarOpen} />
          </div>

          {/* RZECZYWISTY KALENDARZ (zwijana treść z glassmorphism) */}
          <div className="calendar-wrapper">
              <div className="calendar-header-controls">
                  <button onClick={() => changeMonth(-1)} className="month-control-btn">{'<'}</button>
                  <h3 className="month-display">{currentMonthName}</h3>
                  <button onClick={() => changeMonth(1)} className="month-control-btn">{'>'}</button>
              </div>

              <div className="day-names-row">
                  {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map(day => (
                      <div key={day} className="day-name">{day}</div>
                  ))}
              </div>

              <div className="days-grid">
                  {daysInMonth.map(dayInfo => {
                      const date = dayInfo.date;
                      
                      // Porównywanie tylko dat (bez czasu)
                      const isSelected = date && date.toDateString() === selectedDate.toDateString();
                      const isToday = date && date.toDateString() === today.toDateString();
                      
                      return (
                          <button
                              key={dayInfo.key}
                              className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!date ? 'empty' : ''}`}
                              onClick={() => handleDaySelect(date)}
                              disabled={!date}
                          >
                              {date ? date.getDate() : ''}
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>
      
      {/* TREŚĆ - Lista zajęć */}
      <div className="schedule-list-wrapper">
        <h2 className="schedule-day-heading">Zajęcia na {dateHeader}</h2>
        
        {schedule.length > 0 ? (
            schedule.map((lesson, index) => (
                <div key={index} className="lesson-card">
                    <div className="lesson-time-status">
                        <span className="lesson-time">{lesson.time}</span>
                        {/* Status: "Trwa" tylko dla pierwszych zajęć w dniu dzisiejszym */}
                        {selectedDate.toDateString() === today.toDateString() && index === 0 && (
                            <span className="lesson-status-tag">Trwa</span>
                        )}
                    </div>
                    <h3 className="lesson-subject">{lesson.subject}</h3>
                    <div className="lesson-details">
                        <span><span className="detail-label">Sala:</span> {lesson.room}</span>
                        <span><span className="detail-label">Prowadzący:</span> {lesson.teacher}</span>
                    </div>
                </div>
            ))
        ) : (
            <div className="no-schedule-message">Brak zaplanowanych zajęć w tym dniu.</div>
        )}
      </div>

    </div>
  );
};

export default SchedulePage;
