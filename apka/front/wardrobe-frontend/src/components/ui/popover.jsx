import React, { useState, useRef, useEffect } from 'react';

export function Popover({ children, content }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {children}
      </div>
      {open && (
        <div className="absolute z-50 mt-2 bg-white border rounded shadow-lg p-2">
          {content}
        </div>
      )}
    </div>
  );
}
