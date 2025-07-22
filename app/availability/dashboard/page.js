'use client';

import { useState, useEffect } from 'react';
import ApplePanel from '@/components/ui/ApplePanel';
import ApplePanelHeader from '@/components/ui/ApplePanelHeader';
import AppleButton from '@/components/ui/AppleButton';
import AppleSearchInput from '@/components/ui/AppleSearchInput';

export default function AvailabilityDashboard() {
  const [availability, setAvailability] = useState([]);
  const [members, setMembers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load members
      const membersResponse = await fetch('/api/band-members');
      const membersData = await membersResponse.json();
      setMembers(membersData);

      // Load gigs
      const gigsResponse = await fetch('/api/gigs');
      const gigsData = await gigsResponse.json();
      setGigs(gigsData);

      // Load availability for the selected month
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      
      // Convert to DD-MM-YYYY format to match the availability API
      const startDay = startDate.getDate().toString().padStart(2, '0');
      const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const startYear = startDate.getFullYear();
      const startDateStr = `${startDay}-${startMonth}-${startYear}`;
      
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endYear = endDate.getFullYear();
      const endDateStr = `${endDay}-${endMonth}-${endYear}`;
      
      const availabilityResponse = await fetch(`/api/availability?startDate=${startDateStr}&endDate=${endDateStr}`);
      const availabilityData = await availabilityResponse.json();
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityForDate = (date) => {
    // Convert to DD-MM-YYYY format to match the availability API format
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    return availability.filter(entry => entry.dateString === dateStr);
  };

  const getAvailabilityStatus = (date) => {
    const dateAvailability = getAvailabilityForDate(date);
    const coreMembers = members.filter(member => member.isCore);
    
    if (dateAvailability.length === 0) return 'unknown';
    
    const availableMembers = dateAvailability.filter(entry => entry.status === 'available');
    const unavailableMembers = dateAvailability.filter(entry => entry.status === 'unavailable');
    const maybeMembers = dateAvailability.filter(entry => entry.status === 'maybe');
    
    // If all core members are available
    if (availableMembers.length === coreMembers.length) return 'full';
    // If any core members are unavailable
    if (unavailableMembers.length > 0) return 'conflict';
    // If some core members are maybe
    if (maybeMembers.length > 0) return 'partial';
    
    return 'unknown';
  };

  const getGigsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return gigs.filter(gig => gig.date === dateStr);
  };

  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'full': return 'bg-green-100 border-green-300 text-green-800';
      case 'conflict': return 'bg-red-100 border-red-300 text-red-800';
      case 'partial': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'unknown': return 'bg-gray-100 border-gray-300 text-gray-600';
      default: return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'full': return 'All Available';
      case 'conflict': return 'Conflicts';
      case 'partial': return 'Partial';
      case 'unknown': return 'Unknown';
      default: return 'Unknown';
    }
  };

  const getUnavailableMembers = (date) => {
    const dateAvailability = getAvailabilityForDate(date);
    const unavailable = dateAvailability.filter(entry => entry.status === 'unavailable');
    return unavailable.map(entry => {
      const member = members.find(m => m.id === entry.memberId);
      return member ? member.name : 'Unknown Member';
    });
  };

  const previousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <ApplePanel>
            <ApplePanelHeader title="Availability Dashboard" />
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </ApplePanel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <ApplePanel>
          <ApplePanelHeader title="Availability Dashboard" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <AppleButton onClick={previousMonth} variant="secondary">
                  ← Previous
                </AppleButton>
                <h2 className="text-2xl font-bold">
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <AppleButton onClick={nextMonth} variant="secondary">
                  Next →
                </AppleButton>
              </div>
              <div className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-sm">All Available</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span className="text-sm">Partial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm">Conflicts</span>
                </div>
              </div>
            </div>
          </div>
        </ApplePanel>

        {/* Calendar Grid */}
        <ApplePanel>
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {getCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === selectedMonth.getMonth();
                const availabilityStatus = getAvailabilityStatus(date);
                const gigsForDate = getGigsForDate(date);
                const unavailableMembers = getUnavailableMembers(date);
                const dateAvailability = getAvailabilityForDate(date);
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border rounded-lg cursor-pointer transition-colors ${
                      isCurrentMonth 
                        ? 'bg-white hover:bg-gray-50' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    onClick={() => handleDateClick(date)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {date.getDate()}
                    </div>
                    
                    {/* Availability Status */}
                    {isCurrentMonth && dateAvailability.length > 0 && (
                      <div className={`text-xs px-1 py-0.5 rounded border ${getStatusColor(availabilityStatus)}`}>
                        {getStatusText(availabilityStatus)}
                      </div>
                    )}
                    
                    {/* Gigs */}
                    {gigsForDate.length > 0 && (
                      <div className="mt-1">
                        {gigsForDate.map(gig => (
                          <div key={gig.id} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mb-1">
                            {gig.name}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Unavailable members */}
                    {unavailableMembers.length > 0 && (
                      <div className="mt-1">
                        <div className="text-xs text-red-600 font-medium">Not Available:</div>
                        {unavailableMembers.slice(0, 2).map((member, idx) => (
                          <div key={idx} className="text-xs text-red-600">
                            {member}
                          </div>
                        ))}
                        {unavailableMembers.length > 2 && (
                          <div className="text-xs text-red-600">
                            +{unavailableMembers.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Comments preview */}
                    {isCurrentMonth && dateAvailability.length > 0 && (
                      <div className="mt-1">
                        {dateAvailability.slice(0, 2).map((entry, idx) => {
                          const member = members.find(m => m.id === entry.memberId);
                          if (!entry.comment || entry.comment.trim() === '') return null;
                          
                          return (
                            <div key={idx} className="text-xs text-gray-600 italic">
                              "{entry.comment.length > 20 ? entry.comment.substring(0, 20) + '...' : entry.comment}"
                            </div>
                          );
                        })}
                        {dateAvailability.filter(entry => entry.comment && entry.comment.trim() !== '').length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{dateAvailability.filter(entry => entry.comment && entry.comment.trim() !== '').length - 2} more comments
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ApplePanel>

        {/* Selected Date Details */}
        {selectedDate && (
          <ApplePanel>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Availability Details */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold mb-3">Member Availability</h4>
                  <div className="space-y-2">
                    {members.map(member => {
                      const memberAvailability = availability.find(
                        entry => entry.memberId === member.id && 
                        entry.dateString === selectedDate.toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })
                      );
                      
                      const status = memberAvailability?.status || 'unknown';
                      const statusColor = {
                        available: 'text-green-600',
                        unavailable: 'text-red-600',
                        maybe: 'text-yellow-600',
                        unknown: 'text-gray-500'
                      }[status];
                      
                      return (
                        <div key={member.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-medium">{member.name} ({member.instrument})</span>
                              {memberAvailability?.comment && memberAvailability.comment.trim() !== '' && (
                                <div className="text-sm text-gray-600 mt-1 italic">
                                  "{memberAvailability.comment}"
                                </div>
                              )}
                            </div>
                            <span className={`text-sm ${statusColor} ml-2`}>
                              {status === 'available' ? '✅ Available' :
                               status === 'unavailable' ? '❌ Unavailable' :
                               status === 'maybe' ? '⚠️ Maybe' : '❓ Unknown'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Comments Summary */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold mb-3">Comments Summary</h4>
                  {(() => {
                    const dateAvailability = getAvailabilityForDate(selectedDate);
                    const comments = dateAvailability.filter(entry => entry.comment && entry.comment.trim() !== '');
                    
                    if (comments.length === 0) {
                      return <div className="text-gray-500 text-sm">No comments for this date</div>;
                    }
                    
                    return (
                      <div className="space-y-2">
                        {comments.map((entry, idx) => {
                          const member = members.find(m => m.id === entry.memberId);
                          const statusColor = {
                            available: 'text-green-600',
                            unavailable: 'text-red-600',
                            maybe: 'text-yellow-600'
                          }[entry.status] || 'text-gray-600';
                          
                          return (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{member?.name || 'Unknown Member'}</div>
                                  <div className="text-sm text-gray-600 italic mt-1">
                                    "{entry.comment}"
                                  </div>
                                </div>
                                <span className={`text-xs ${statusColor} ml-2`}>
                                  {entry.status === 'available' ? '✅' :
                                   entry.status === 'unavailable' ? '❌' :
                                   entry.status === 'maybe' ? '⚠️' : '❓'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Gigs on this date */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold mb-3">Gigs on this date</h4>
                  {getGigsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-2">
                      {getGigsForDate(selectedDate).map(gig => (
                        <div key={gig.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="font-medium text-blue-900">{gig.name}</div>
                          <div className="text-sm text-blue-700">{gig.venue}</div>
                          <div className="text-sm text-blue-600">{gig.time}</div>
                          <div className="text-xs text-blue-500 mt-1">
                            Status: {gig.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No gigs scheduled</div>
                  )}
                </div>
              </div>
            </div>
          </ApplePanel>
        )}
      </div>
    </div>
  );
} 