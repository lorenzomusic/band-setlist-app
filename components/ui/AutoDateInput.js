'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

function DatePickerCalendar({ currentDate, onDateSelect }) {
  const [displayDate, setDisplayDate] = useState(currentDate);
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Convert Sunday (0) to be last (6), Monday becomes 0
  };

  const navigateMonth = (direction) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDayOfMonth = getFirstDayOfMonth(viewDate);
    const today = new Date();

    const days = [];
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const isToday = date.toDateString() === today.toDateString();
      
      // Check if this date matches the current selected date from the input fields
      const isSelected = currentDate && 
                        date.getDate() === currentDate.getDate() &&
                        date.getMonth() === currentDate.getMonth() &&
                        date.getFullYear() === currentDate.getFullYear();
      
      days.push(
        <button
          key={day}
          onClick={(e) => {
            e.stopPropagation();
            onDateSelect(date);
          }}
          className={`w-8 h-8 text-sm rounded transition-colors ${
            isSelected 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : isToday 
                ? 'font-bold text-blue-600 hover:bg-blue-100' 
                : 'hover:bg-blue-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-3">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            navigateMonth(-1);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <div className="text-sm font-medium">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            navigateMonth(1);
          }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayName, i) => (
          <div key={i} className="w-8 h-6 text-xs text-gray-500 text-center font-medium">
            {dayName}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {renderCalendar()}
      </div>
    </div>
  );
}

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const containerRef = useRef(null);
  const isUpdatingFromParent = useRef(false);

  // Parse initial value (expecting YYYY-MM-DD format)
  useEffect(() => {
    if (isUpdatingFromParent.current) return;
    
    if (value && value.includes('-')) {
      const [y, m, d] = value.split('-');
      const newDay = d || '';
      const newMonth = m || '';
      const newYear = y || '';
      
      if (newDay !== day || newMonth !== month || newYear !== year) {
        setDay(newDay);
        setMonth(newMonth);
        setYear(newYear);
      }
    } else if (!value && (day || month || year)) {
      setDay('');
      setMonth('');
      setYear('');
    }
  }, [value]);

  // Update parent when day, month, or year change
  const updateParent = useCallback((newDay, newMonth, newYear) => {
    isUpdatingFromParent.current = true;
    
    if (newDay && newMonth && newYear) {
      const dateValue = `${newYear}-${newMonth.padStart(2, '0')}-${newDay.padStart(2, '0')}`;
      onChange?.(dateValue);
    } else if (!newDay && !newMonth && !newYear) {
      onChange?.('');
    } else {
      // Don't update parent until all fields have values or are all empty
      return;
    }
    
    setTimeout(() => {
      isUpdatingFromParent.current = false;
    }, 0);
  }, [onChange]);

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 2) {
      const numVal = parseInt(val);
      
      // Validate day (1-31)
      if (val === '' || (numVal >= 1 && numVal <= 31)) {
        setDay(val);
        updateParent(val, month, year);
        
        // Auto-tab to month when 2 digits entered or when day >= 4 (since max is 31)
        if (val.length === 2 || (val.length === 1 && numVal >= 4)) {
          setTimeout(() => {
            monthRef.current?.focus();
            monthRef.current?.select();
          }, 0);
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
        updateParent(day, val, year);
        
        // Auto-tab to year when 2 digits entered or when month >= 2 (since max is 12)
        if (val.length === 2 || (val.length === 1 && numVal >= 2)) {
          setTimeout(() => {
            yearRef.current?.focus();
            yearRef.current?.select();
          }, 0);
        }
      }
    }
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only digits
    
    if (val.length <= 4) {
      setYear(val);
      updateParent(day, month, val);
      
      // Auto-tab out when 4 digits entered
      if (val.length === 4) {
        setTimeout(() => yearRef.current?.blur(), 0);
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

  const handleInputClick = (inputRef) => {
    setShowDatePicker(true);
    setTimeout(() => {
      inputRef.current?.select();
    }, 0);
  };

  const handleDatePickerSelect = (selectedDate) => {
    const day = selectedDate.getDate().toString();
    const month = (selectedDate.getMonth() + 1).toString();
    const year = selectedDate.getFullYear().toString();
    
    setDay(day);
    setMonth(month);
    setYear(year);
    updateParent(day, month, year);
    setShowDatePicker(false);
  };

  const getCurrentDate = () => {
    if (day && month && year) {
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return new Date();
  };

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative flex items-center ${className}`}>
      <input
        ref={dayRef}
        type="text"
        value={day}
        onChange={handleDayChange}
        onKeyDown={(e) => handleKeyDown(e, 'day')}
        onClick={() => handleInputClick(dayRef)}
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
        onClick={() => handleInputClick(monthRef)}
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
        onClick={() => handleInputClick(yearRef)}
        placeholder="YYYY"
        className="w-16 text-center border-0 bg-transparent outline-none text-inherit font-inherit"
        maxLength={4}
      />
      
      {showDatePicker && (
        <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-64">
          <DatePickerCalendar
            currentDate={getCurrentDate()}
            onDateSelect={handleDatePickerSelect}
          />
        </div>
      )}
    </div>
  );
}