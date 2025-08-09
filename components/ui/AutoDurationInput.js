'use client';

import { useState, useRef, useEffect } from 'react';

export default function AutoDurationInput({ 
  value = '', 
  onChange, 
  className = '',
  placeholder = 'MM:SS',
  required = false,
  ...props 
}) {
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const minutesRef = useRef(null);
  const secondsRef = useRef(null);

  // Parse initial value (expecting MM:SS format)
  useEffect(() => {
    if (value) {
      const [m, s] = value.split(':');
      setMinutes(m || '');
      setSeconds(s || '');
    } else {
      setMinutes('');
      setSeconds('');
    }
  }, [value]);

  // Update parent when minutes or seconds change
  useEffect(() => {
    if (minutes && seconds) {
      const durationValue = `${minutes}:${seconds.padStart(2, '0')}`;
      onChange?.(durationValue);
    } else if (!minutes && !seconds) {
      onChange?.('');
    }
  }, [minutes, seconds, onChange]);

  const handleMinutesChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // For song durations, minutes can be 0-99 (songs can be longer than an hour)
      if (val === '' || (numVal >= 0 && numVal <= 99)) {
        setMinutes(val);
        
        // Auto-tab to seconds when 2 digits entered or when minutes >= 10 (since most songs are under 10 minutes)
        if (val.length === 2 || (val.length === 1 && numVal >= 10)) {
          secondsRef.current?.focus();
        }
      }
    }
  };

  const handleSecondsChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // Validate seconds (0-59)
      if (val === '' || (numVal >= 0 && numVal <= 59)) {
        setSeconds(val);
        
        // Auto-tab out when 2 digits entered or when seconds >= 6 (since max is 59)
        if (val.length === 2 || (val.length === 1 && numVal >= 6)) {
          secondsRef.current?.blur();
        }
      }
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
    
    // Move to seconds on colon
    if (e.key === ':') {
      e.preventDefault();
      secondsRef.current?.focus();
      return;
    }
    
    // Ensure that it's a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleSecondsKeyDown = (e) => {
    // Allow backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Backspace to minutes if at beginning
    if (e.key === 'Backspace' && e.target.selectionStart === 0 && !seconds) {
      e.preventDefault();
      minutesRef.current?.focus();
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
        ref={minutesRef}
        type="text"
        value={minutes}
        onChange={handleMinutesChange}
        onKeyDown={handleMinutesKeyDown}
        placeholder="MM"
        className="w-12 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={2}
        required={required}
        {...props}
      />
      <span className="text-gray-500 mx-1">:</span>
      <input
        ref={secondsRef}
        type="text"
        value={seconds}
        onChange={handleSecondsChange}
        onKeyDown={handleSecondsKeyDown}
        placeholder="SS"
        className="w-12 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={2}
      />
    </div>
  );
}