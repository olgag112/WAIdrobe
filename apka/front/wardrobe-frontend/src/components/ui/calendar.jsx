import React from 'react';
import { Popover } from './popover';

export function CalendarInput({ value, onChange }) {
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  const formatDate = (dateObj) => {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const minDate = formatDate(today);
  const maxDate = formatDate(next7Days);

  return (
    <Popover
      content={
        <input
          type="date"
          value={value}          // use string directly
          min={minDate}
          max={maxDate}
          onChange={e => onChange(e.target.value)}
          className="border rounded p-1"
        />
      }
    >
      <input
        type="text"
        readOnly
        value={value}           // display string directly
        className="border rounded p-2 cursor-pointer w-full"
      />
    </Popover>
  );
}
