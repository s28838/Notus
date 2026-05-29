import React, { useEffect, useMemo, useRef, useState } from "react";

const pad = (value) => String(value).padStart(2, "0");

const toInputDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseInputDate = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDateLabel = (value) => {
  const date = parseInputDate(value);
  if (!date) return "";
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatMonthLabel = (date) =>
  date.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

const getCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < mondayOffset; i += 1) days.push(null);
  for (let day = 1; day <= lastDay; day += 1) days.push(new Date(year, month, day));
  while (days.length % 7 !== 0) days.push(null);

  return days;
};

const useClosePicker = (open, setOpen, ref) => {
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, ref, setOpen]);
};

const PickerButton = ({ icon, isOpen, label, placeholder, onClick }) => (
  <button
    type="button"
    className={`custom-picker-trigger${isOpen ? " is-open" : ""}${label ? "" : " is-placeholder"}`}
    onClick={onClick}
  >
    <span>{label || placeholder}</span>
    <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
  </button>
);

export const CustomDatePicker = ({
  value,
  onChange,
  min,
  placeholder = "Wybierz datę",
  ariaLabel = "Wybierz datę",
}) => {
  const [open, setOpen] = useState(false);
  const selectedDate = parseInputDate(value);
  const minDate = parseInputDate(min);
  const [visibleMonth, setVisibleMonth] = useState(selectedDate || minDate || new Date());
  const rootRef = useRef(null);

  useClosePicker(open, setOpen, rootRef);

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    }
  }, [value]);

  const days = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const selectedKey = value || "";
  const minKey = min || "";
  const todayKey = toInputDate(new Date());

  const selectDate = (date) => {
    const nextValue = toInputDate(date);
    if (minKey && nextValue < minKey) return;
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div className="custom-picker" ref={rootRef}>
      <PickerButton
        icon="calendar_month"
        isOpen={open}
        label={formatDateLabel(value)}
        placeholder={placeholder}
        onClick={() => setOpen((current) => !current)}
      />

      {open && (
        <div className="custom-picker-popover date-picker-popover" role="dialog" aria-label={ariaLabel}>
          <div className="custom-picker-header">
            <button
              type="button"
              className="custom-picker-icon-btn"
              onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))}
              aria-label="Poprzedni miesiac"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <strong>{formatMonthLabel(visibleMonth)}</strong>
            <button
              type="button"
              className="custom-picker-icon-btn"
              onClick={() => setVisibleMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))}
              aria-label="Nastepny miesiac"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="custom-date-weekdays" aria-hidden="true">
            {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="custom-date-grid">
            {days.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />;
              const dateKey = toInputDate(date);
              const disabled = Boolean(minKey && dateKey < minKey);
              return (
                <button
                  key={dateKey}
                  type="button"
                  className={[
                    "custom-date-day",
                    dateKey === selectedKey ? "is-selected" : "",
                    dateKey === todayKey ? "is-today" : "",
                  ].filter(Boolean).join(" ")}
                  onClick={() => selectDate(date)}
                  disabled={disabled}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const CustomTimePicker = ({
  value,
  onChange,
  placeholder = "Wybierz godzinę",
  ariaLabel = "Wybierz godzinę",
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const [selectedHour = "", selectedMinute = ""] = value ? value.split(":") : [];

  useClosePicker(open, setOpen, rootRef);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, index) => pad(index)), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, index) => pad(index * 5)), []);

  const setPart = (hour, minute) => {
    const nextHour = hour || selectedHour || "08";
    const nextMinute = minute || selectedMinute || "00";
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <div className="custom-picker" ref={rootRef}>
      <PickerButton
        icon="schedule"
        isOpen={open}
        label={value}
        placeholder={placeholder}
        onClick={() => setOpen((current) => !current)}
      />

      {open && (
        <div className="custom-picker-popover time-picker-popover" role="dialog" aria-label={ariaLabel}>
          <div className="time-picker-columns">
            <div className="time-picker-column" aria-label="Godzina">
              <span>Godz.</span>
              <div>
                {hours.map((hour) => (
                  <button
                    key={hour}
                    type="button"
                    className={hour === selectedHour ? "is-selected" : ""}
                    onClick={() => setPart(hour, selectedMinute)}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>
            <div className="time-picker-column" aria-label="Minuty">
              <span>Min</span>
              <div>
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    type="button"
                    className={minute === selectedMinute ? "is-selected" : ""}
                    onClick={() => {
                      setPart(selectedHour, minute);
                      setOpen(false);
                    }}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
