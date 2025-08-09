"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../../components/LanguageProvider';

// Comment Modal Component
function CommentModal({ isOpen, onClose, onSave, currentComment, memberName, date }) {
  const [comment, setComment] = useState(currentComment || '');

  useEffect(() => {
    setComment(currentComment || '');
  }, [currentComment]);

  const handleSave = () => {
    onSave(comment);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-apple shadow-apple p-6 w-full max-w-md mx-4">
        <h3 className="text-apple-title-3 text-primary mb-4">
          {t('availability.addComment')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Comment for {memberName} on {new Date(date).toLocaleDateString()}
        </p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
          rows={4}
          autoFocus
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [members, setMembers] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGigs, setShowGigs] = useState(true);
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    memberId: null,
    memberName: '',
    date: null,
    currentComment: ''
  });

  const router = useRouter();

  useEffect(() => {
    loadMembers();
    loadGigs();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      loadAvailability();
    }
  }, [members, currentDate]);

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/band-members');
      if (response.ok) {
        const membersData = await response.json();
        // Only include core members in availability tracking
        const coreMembers = membersData.filter(member => member.isCore);
        setMembers(coreMembers);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGigs = async () => {
    try {
      const response = await fetch('/api/gigs');
      if (response.ok) {
        const gigsData = await response.json();
        setGigs(gigsData);
      }
    } catch (error) {
      console.error('Error loading gigs:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const startDate = getMonthStartDate(currentDate);
      const endDate = getMonthEndDate(currentDate);
      
      const response = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const availabilityData = await response.json();
        setAvailability(availabilityData);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const getMonthStartDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return `01-${String(month + 1).padStart(2, '0')}-${year}`;
  };

  const getMonthEndDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${String(lastDay).padStart(2, '0')}-${String(month + 1).padStart(2, '0')}-${year}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Add all days of the month (no empty cells)
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getDayLabel = (dayIndex) => {
    const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return dayLabels[dayIndex];
  };

  const getDayOfWeek = (date, day) => {
    if (!day) return null;
    const dayOfWeek = new Date(date.getFullYear(), date.getMonth(), day).getDay();
    return getDayLabel(dayOfWeek);
  };

  const isWeekend = (date, day) => {
    if (!day) return false;
    const dayOfWeek = new Date(date.getFullYear(), date.getMonth(), day).getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // Friday (5) or Saturday (6)
  };

  const getAvailabilityForDate = (date, memberId) => {
    const dateString = `${String(date).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
    return availability.find(entry => 
      entry.dateString === dateString && entry.memberId === memberId
    );
  };

  const getGigsForDate = (date) => {
    if (!date) return [];
    const dateStr = `${String(date).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
    // Convert DD-MM-YYYY to YYYY-MM-DD for gig comparison
    const [day, month, year] = dateStr.split('-');
    const gigDateStr = `${year}-${month}-${day}`;
    return gigs.filter(gig => gig.date === gigDateStr);
  };

  const getGigStatusDot = (gigsForDay) => {
    if (!gigsForDay || gigsForDay.length === 0) return null;
    
    // If any gig is confirmed, show green dot
    const hasConfirmed = gigsForDay.some(gig => gig.status === 'confirmed');
    if (hasConfirmed) {
      return <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" title="Confirmed gig"></div>;
    }
    
    // If any gig is pending, show yellow dot
    const hasPending = gigsForDay.some(gig => gig.status === 'pending' || !gig.status);
    if (hasPending) {
      return <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-500 rounded-full" title="Pending gig"></div>;
    }
    
    return null;
  };

  const cycleAvailability = async (date, memberId) => {
    const currentEntry = getAvailabilityForDate(date, memberId);
    const dateString = `${String(date).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
    
    let newStatus;
    if (!currentEntry) {
      newStatus = 'available';
    } else if (currentEntry.status === 'available') {
      newStatus = 'maybe';
    } else if (currentEntry.status === 'maybe') {
      newStatus = 'unavailable';
    } else {
      // If unavailable, remove the entry (set to null)
      newStatus = null;
    }

    try {
      if (newStatus === null) {
        // Delete the entry
        if (currentEntry) {
          await fetch(`/api/availability?id=${currentEntry.id}`, {
            method: 'DELETE',
          });
        }
      } else {
        // Create or update the entry
        await fetch('/api/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateString,
            memberId,
            status: newStatus,
            comment: currentEntry?.comment || ''
          }),
        });
      }
      
      // Reload availability data
      await loadAvailability();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const openCommentModal = (date, memberId, memberName) => {
    const entry = getAvailabilityForDate(date, memberId);
    setCommentModal({
      isOpen: true,
      memberId,
      memberName,
      date: `${String(date).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`,
      currentComment: entry?.comment || ''
    });
  };

  const saveComment = async (comment) => {
    try {
      const { memberId, date } = commentModal;
      // Parse DD-MM-YYYY format to get the day
      const dateParts = date.split('-');
      const day = parseInt(dateParts[0]); // Day is the first part in DD-MM-YYYY
      const entry = getAvailabilityForDate(day, memberId);
      
      if (entry) {
        // Update existing entry
        await fetch('/api/availability', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dateString: date,
            memberId,
            status: entry.status,
            comment
          }),
        });
      }
      
      await loadAvailability();
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return '✓';
      case 'maybe':
        return '?';
      case 'unavailable':
        return '✗';
      default:
        return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-400 border-gray-200';
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'next') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else {
        newDate.setMonth(newDate.getMonth() - 1);
      }
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-apple-title-1 text-primary mb-2">📅 Availability</h1>
                <p className="text-apple-body text-secondary">Track band member availability for gigs and rehearsals</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/availability/dashboard')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📊 Calendar
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              <h2 className="text-apple-title-2 text-primary">{monthName}</h2>
              <button
                onClick={() => navigateMonth('next')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showGigs}
                  onChange={(e) => setShowGigs(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show Gigs</span>
              </label>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header Row with Day Labels */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="p-3 font-medium text-gray-700 text-center">Date</div>
                {members.map(member => (
                  <div key={member.id} className="p-3 font-medium text-gray-700 text-center text-sm">
                    {member.name}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {Array.from({ length: Math.ceil(days.length / 7) }, (_, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-8 gap-0 border-b border-gray-100 last:border-b-0">
                    {/* Date Column */}
                    <div className="bg-gray-50">
                      {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                        const gigsForDay = showGigs ? getGigsForDate(day) : [];
                        const isWeekendDay = day && isWeekend(currentDate, day);
                        
                        // Determine gig status for border color
                        const getGigBorderColor = (gigs) => {
                          if (!gigs || gigs.length === 0) return '';
                          const hasConfirmed = gigs.some(gig => gig.status === 'confirmed');
                          if (hasConfirmed) return 'border-l-4 border-l-green-500';
                          const hasPending = gigs.some(gig => gig.status === 'pending' || !gig.status);
                          if (hasPending) return 'border-l-4 border-l-yellow-500';
                          return '';
                        };

                        return (
                          <div key={dayIndex} className={`h-12 flex flex-col items-center justify-center relative border-b border-gray-100 last:border-b-0 ${
                            day && isWeekendDay ? 'bg-gray-100' : 'bg-gray-50'
                          } ${showGigs ? getGigBorderColor(gigsForDay) : ''}`}>
                            <div className="text-xs text-gray-500 font-medium">
                              {getDayOfWeek(currentDate, day)}
                            </div>
                            <div className="text-sm font-medium text-gray-900">{day}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Member Columns */}
                    {members.map((member, memberIndex) => (
                      <div key={member.id} className={`${memberIndex === 0 ? 'border-l border-gray-200' : ''} border-r border-gray-100 last:border-r-0`}>
                        {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                          const entry = getAvailabilityForDate(day, member.id);
                          const hasComment = entry?.comment;
                          const isWeekendDay = day && isWeekend(currentDate, day);
                          const gigsForDay = showGigs ? getGigsForDate(day) : [];
                          const hasGig = gigsForDay.length > 0;
                          
                          return (
                            <div key={dayIndex} className={`h-12 flex items-center justify-center border-b border-gray-100 last:border-b-0 relative ${
                              isWeekendDay ? 'bg-gray-100' : 'hover:bg-gray-50'
                            }`}>
                              <button
                                onClick={() => cycleAvailability(day, member.id)}
                                onDoubleClick={() => openCommentModal(day, member.id, member.name)}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200 hover:scale-110 ${getStatusColor(entry?.status)} ${hasComment ? 'ring-2 ring-blue-300' : ''}`}
                                title={`${entry?.status || 'No status'}${hasComment ? ' - Has comment' : ''}${isWeekendDay ? ' - Weekend gig day' : ''}${hasGig ? ` - ${gigsForDay.length} gig(s) scheduled` : ''}`}
                              >
                                {getStatusIcon(entry?.status)}
                              </button>
                              
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Legend</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 text-green-800 border-2 border-green-200 rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                <span className="text-gray-700">Available</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-yellow-100 text-yellow-800 border-2 border-yellow-200 rounded-full flex items-center justify-center text-xs font-bold">?</div>
                <span className="text-gray-700">Maybe</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-red-100 text-red-800 border-2 border-red-200 rounded-full flex items-center justify-center text-xs font-bold">✗</div>
                <span className="text-gray-700">Unavailable</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-50 text-gray-400 border-2 border-gray-200 rounded-full flex items-center justify-center text-xs font-bold"></div>
                <span className="text-gray-700">No Status</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-800 border-2 border-blue-200 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-blue-300">✓</div>
                <span className="text-gray-700">Has Comment</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold">Fr</div>
                <span className="text-gray-700">Weekend (Fri/Sat)</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-6 bg-green-500 rounded-sm"></div>
                <span className="text-gray-700">Confirmed Gig</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-6 bg-yellow-500 rounded-sm"></div>
                <span className="text-gray-700">Pending Gig</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800 font-medium">
                💡 Click once to cycle status • Double-click to add/edit comment • Weekend days (Fri/Sat) are highlighted for gig planning • Green left border shows confirmed gigs, yellow shows pending gigs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={() => setCommentModal({ ...commentModal, isOpen: false })}
        onSave={saveComment}
        currentComment={commentModal.currentComment}
        memberName={commentModal.memberName}
        date={commentModal.date}
      />
    </div>
  );
} 