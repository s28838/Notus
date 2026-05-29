import React, { useEffect, useMemo, useRef, useState } from "react";

const useCloseOnOutside = (open, setOpen, ref) => {
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

const normalizeText = (value) => String(value ?? "").normalize("NFC");

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "Wybierz",
  ariaLabel = "Wybierz opcję",
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = useMemo(
    () => {
      const currentValue = normalizeText(value);
      return options.find((option) => {
        if (normalizeText(option.value) === currentValue) return true;
        return (option.aliases || []).some((alias) => normalizeText(alias) === currentValue);
      });
    },
    [options, value]
  );

  useCloseOnOutside(open, setOpen, rootRef);

  const pickOption = (option) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className="custom-select" ref={rootRef}>
      <button
        type="button"
        className={`custom-select-trigger${open ? " is-open" : ""}${selected ? "" : " is-placeholder"}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{selected?.label || placeholder}</span>
        <span className="material-symbols-outlined" aria-hidden="true">expand_more</span>
      </button>

      {open && (
        <div className="custom-select-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={String(option.value)}
                type="button"
                className={isSelected ? "is-selected" : ""}
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => pickOption(option)}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined" aria-hidden="true">check</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CustomCheckbox = ({ checked, onChange, label }) => (
  <button
    type="button"
    className={`custom-checkbox${checked ? " is-checked" : ""}`}
    role="checkbox"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
  >
    <span className="custom-checkbox-box" aria-hidden="true">
      {checked && <span className="material-symbols-outlined">check</span>}
    </span>
    <span>{label}</span>
  </button>
);
