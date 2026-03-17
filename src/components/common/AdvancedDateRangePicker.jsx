import React, { useMemo, useState } from "react";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatKey(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildMonth(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const jsWeekday = first.getDay();
  const mondayOffset = (jsWeekday + 6) % 7;

  const cells = [];
  for (let i = 0; i < mondayOffset; i += 1) {
    cells.push({ empty: true, key: `empty-start-${monthIndex}-${i}` });
  }
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({
      day,
      dateKey: formatKey(year, monthIndex, day),
      dateObj: new Date(year, monthIndex, day),
      key: `${year}-${monthIndex}-${day}`,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ empty: true, key: `empty-end-${monthIndex}-${cells.length}` });
  }

  return {
    label: new Date(year, monthIndex, 1).toLocaleString("en-US", { month: "long", year: "numeric" }),
    cells,
  };
}

function nightsBetween(start, end) {
  if (!start || !end) return 0;
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function AdvancedDateRangePicker({
  monthsToShow = 2,
  startMonth = new Date(2026, 3, 1),
  blockedDateKeys = [],
  minNights = 1,
  onChange,
}) {
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);

  const blockedSet = useMemo(() => new Set(blockedDateKeys), [blockedDateKeys]);

  const months = useMemo(() => {
    return Array.from({ length: monthsToShow }).map((_, index) => {
      const monthDate = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
      return buildMonth(monthDate.getFullYear(), monthDate.getMonth());
    });
  }, [monthsToShow, startMonth]);

  function containsBlockedInside(startDate, endDate) {
    for (const month of months) {
      for (const cell of month.cells) {
        if (!cell.empty && blockedSet.has(cell.dateKey)) {
          if (cell.dateObj > startDate && cell.dateObj < endDate) return true;
        }
      }
    }
    return false;
  }

  function handleClick(cell) {
    if (cell.empty) return;
    if (blockedSet.has(cell.dateKey)) return;

    if (!start) {
      setStart(cell.dateObj);
      setEnd(null);
      return;
    }

    if (!end) {
      if (cell.dateObj <= start) {
        setStart(cell.dateObj);
        setEnd(null);
        return;
      }

      const nights = nightsBetween(start, cell.dateObj);
      if (nights < minNights) return;
      if (containsBlockedInside(start, cell.dateObj)) return;

      setEnd(cell.dateObj);
      onChange && onChange(start, cell.dateObj);
      return;
    }

    setStart(cell.dateObj);
    setEnd(null);
  }

  function isSelected(cellDate) {
    return (start && cellDate.getTime() === start.getTime()) || (end && cellDate.getTime() === end.getTime());
  }

  function isInRange(cellDate) {
    if (!start || !end) return false;
    return cellDate >= start && cellDate <= end;
  }

  return (
    <div>
      <div className="airbnb-calendar-wrap">
        {months.map((month) => (
          <div key={month.label} className="airbnb-month-card">
            <div className="airbnb-month-label">{month.label}</div>
            <div className="airbnb-weekdays">
              {WEEKDAYS.map((day) => (
                <div key={day} className="airbnb-weekday">{day}</div>
              ))}
            </div>
            <div className="airbnb-month-grid">
              {month.cells.map((cell) => {
                if (cell.empty) return <div key={cell.key} className="airbnb-day-empty" />;

                let className = "airbnb-day";
                if (blockedSet.has(cell.dateKey)) className += " blocked";
                else className += " available";
                if (isInRange(cell.dateObj)) className += " in-range";
                if (isSelected(cell.dateObj)) className += " selected";

                return (
                  <button
                    key={cell.key}
                    type="button"
                    className={className}
                    onClick={() => handleClick(cell)}
                    disabled={blockedSet.has(cell.dateKey)}
                    aria-label={cell.dateKey}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="muted" style={{ marginTop: "1rem", fontWeight: 700 }}>
        {start && !end ? "Choose checkout date" : "Select check-in and check-out"}
      </div>
    </div>
  );
}
