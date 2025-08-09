'use client';

import { useState, useRef, useEffect } from 'react';

export default function AutoDateInput({ 
  value = '', 
  onChange, 
  className = '',
  placeholder = 'DD/MM/YYYY',
  required = false,
  ...props 
}) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Parse initial value (expecting YYYY-MM-DD format)
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setDay(d || '');
      setMonth(m || '');
      setYear(y || '');
    } else {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Update parent when day, month, or year change
  useEffect(() => {
    if (day && month && year) {
      const dateValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      onChange?.(dateValue);
    } else if (!day && !month && !year) {
      onChange?.('');
    }
  }, [day, month, year, onChange]);

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // Validate day (1-31)
      if (val === '' || (numVal >= 1 && numVal <= 31)) {
        setDay(val);
        
        // Auto-tab to month when 2 digits entered or when day >= 4 (since max is 31)
        if (val.length === 2 || (val.length === 1 && numVal >= 4)) {
          monthRef.current?.focus();
        }
      }
    }
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // Validate month (1-12)
      if (val === '' || (numVal >= 1 && numVal <= 12)) {
        setMonth(val);
        
        // Auto-tab to year when 2 digits entered or when month >= 2 (since max is 12)
        if (val.length === 2 || (val.length === 1 && numVal >= 2)) {
          yearRef.current?.focus();
        }
      }
    }
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 4) {
      setYear(val);
      
      // Auto-tab out when 4 digits entered
      if (val.length === 4) {
        yearRef.current?.blur();
      }
    }
  };

  const handleKeyDown = (e, field) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Move between fields on slash or period
    if (e.key === '/' || e.key === '.') {
      e.preventDefault();
      if (field === 'day') {
        monthRef.current?.focus();
      } else if (field === 'month') {
        yearRef.current?.focus();
      }
      return;
    }
    
    // Handle backspace navigation
    if (e.key === 'Backspace' && e.target.selectionStart === 0) {
      e.preventDefault();
      if (field === 'month' && !month) {
        dayRef.current?.focus();
      } else if (field === 'year' && !year) {
        monthRef.current?.focus();
      }
      return;
    }
    
    // Ensure that it's a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        ref={dayRef}
        type="text"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        placeholder="DD"
        className="w-8 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={2}
        required={required}
        {...props}
      />
      <span className="text-gray-500 mx-1">/</span>
      <input
        ref={monthRef}
        type="text"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={(e) => handleKeyDown(e, 'month')}
        placeholder="MM"
        className="w-8 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={2}
      />
      <span className="text-gray-500 mx-1">/</span>
      <input
        ref={yearRef}
        type="text"
        value={year}
        onChange={handleYearChange}
        onKeyDown={(e) => handleKeyDown(e, 'year')}
        placeholder="YYYY"
        className="w-16 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={4}
      />
    </div>
  );
}