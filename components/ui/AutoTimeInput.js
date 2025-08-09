'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function AutoTimeInput({ 
  value = '', 
  onChange, 
  className = '',
  placeholder = 'HH:MM',
  required = false,
  ...props 
}) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const isUpdatingFromParent = useRef(false);

  // Parse initial value
  useEffect(() => {
    if (isUpdatingFromParent.current) return;
    
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      const newHours = h || '';
      const newMinutes = m || '';
      
      if (newHours !== hours || newMinutes !== minutes) {
        setHours(newHours);
        setMinutes(newMinutes);
      }
    } else if (!value && (hours || minutes)) {
      setHours('');
      setMinutes('');
    }
  }, [value]);

  // Update parent when hours or minutes change
  const updateParent = useCallback((newHours, newMinutes) => {
    isUpdatingFromParent.current = true;
    
    if (newHours && newMinutes) {
      const timeValue = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
      onChange?.(timeValue);
    } else if (!newHours && !newMinutes) {
      onChange?.('');
    } else if (newHours && !newMinutes) {
      // Don't update parent until both fields have values or are both empty
      return;
    }
    
    setTimeout(() => {
      isUpdatingFromParent.current = false;
    }, 0);
  }, [onChange]);

  const handleHoursChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // Validate hours (0-23)
      if (val === '' || (numVal >= 0 && numVal <= 23)) {
        setHours(val);
        updateParent(val, minutes);
        
        // Auto-tab to minutes when 2 digits entered or when hours >= 3 (since max is 23)
        if (val.length === 2 || (val.length === 1 && numVal >= 3)) {
          setTimeout(() => {
            minutesRef.current?.focus();
            minutesRef.current?.select();
          }, 0);
        }
      }
    }
  };

  const handleMinutesChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // Validate minutes (0-59)
      if (val === '' || (numVal >= 0 && numVal <= 59)) {
        setMinutes(val);
        updateParent(hours, val);
        
        // Auto-tab out when 2 digits entered or when minutes >= 6 (since max is 59)
        if (val.length === 2 || (val.length === 1 && numVal >= 6)) {
          setTimeout(() => minutesRef.current?.blur(), 0);
        }
      }
    }
  };

  const handleHoursKeyDown = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Move to minutes on colon
    if (e.key === ':') {
      e.preventDefault();
      minutesRef.current?.focus();
      return;
    }
    
    // Ensure that it's a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleMinutesKeyDown = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Backspace to hours if at beginning
    if (e.key === 'Backspace' && e.target.selectionStart === 0 && !minutes) {
      e.preventDefault();
      hoursRef.current?.focus();
      return;
    }
    
    // Ensure that it's a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleInputClick = (inputRef) => {
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <input
        ref={hoursRef}
        type="text"
        value={hours}
        onChange={handleHoursChange}
        onKeyDown={handleHoursKeyDown}
        onClick={() => handleInputClick(hoursRef)}
        placeholder="HH"
        className="w-8 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={2}
        required={required}
        {...props}
      />
      <span className="text-gray-500 mx-0.5">:</span>
      <input
        ref={minutesRef}
        type="text"
        value={minutes}
        onChange={handleMinutesChange}
        onKeyDown={handleMinutesKeyDown}
        onClick={() => handleInputClick(minutesRef)}
        placeholder="MM"
        className="w-8 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={2}
      />
    </div>
  );
}