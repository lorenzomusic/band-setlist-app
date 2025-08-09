'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplePanel from '@/components/ui/ApplePanel';
import ApplePanelHeader from '@/components/ui/ApplePanelHeader';
import AppleButton from '@/components/ui/AppleButton';
import AppleSearchInput from '@/components/ui/AppleSearchInput';

export default function AvailabilityCalendar() {
  const router = useRouter();
  const [availability, setAvailability] = useState([]);
  const [members, setMembers] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [rehearsals, setRehearsals] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load members - only core members for availability tracking
      const membersResponse = await fetch('/api/band-members');
      const membersData = await membersResponse.json();
      const coreMembers = membersData.filter(member => member.isCore);
      setMembers(coreMembers);

      // Load gigs
      const gigsResponse = await fetch('/api/gigs');
      const gigsData = await gigsResponse.json();
      setGigs(gigsData);

      // Load rehearsals
      const rehearsalsResponse = await fetch('/api/rehearsals');
      const rehearsalsData = await rehearsalsResponse.json();
      setRehearsals(rehearsalsData);

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
    const totalCoreMembers = members.length;
    
    // Filter availability entries to only include core members
    const coreMemberIds = members.map(m => m.id);
    const coreAvailability = dateAvailability.filter(entry => coreMemberIds.includes(entry.memberId));
    
    // If not all core members have provided availability, it's unknown
    if (coreAvailability.length < totalCoreMembers) {
      return 'unknown';
    }
    
    const availableMembers = coreAvailability.filter(entry => entry.status === 'available');
    const unavailableMembers = coreAvailability.filter(entry => entry.status === 'unavailable');
    const maybeMembers = coreAvailability.filter(entry => entry.status === 'maybe');
    
    // If all core members are available (and all have answered)
    if (availableMembers.length === totalCoreMembers) {
      return 'full';
    }
    // If any core members are unavailable
    if (unavailableMembers.length > 0) {
      return 'conflict';
    }
    // If some core members are maybe
    if (maybeMembers.length > 0) {
      return 'partial';
    }
    
    return 'unknown';
  };

  const getGigsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return gigs.filter(gig => gig.date === dateStr);
  };

  const getRehearsalsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return rehearsals.filter(rehearsal => rehearsal.date === dateStr);
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

  const getGigStatusDot = (gig) => {
    switch (gig.status) {
      case 'confirmed':
        return <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" title="Confirmed gig"></span>;
      case 'pending':
        return <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1" title="Pending gig"></span>;
      case 'canceled':
        return <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1" title="Canceled gig"></span>;
      default:
        return <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-1" title="Status unknown"></span>;
    }
  };

  const getRehearsalStatusDot = (rehearsal) => {
    switch (rehearsal.status) {
      case 'confirmed':
        return <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-1" title="Confirmed rehearsal"></span>;
      case 'planned':
        return <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1" title="Planned rehearsal"></span>;
      case 'cancelled':
        return <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1" title="Cancelled rehearsal"></span>;
      default:
        return <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-1" title="Rehearsal"></span>;
    }
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
            <ApplePanelHeader title="Availability Calendar" />
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
          <ApplePanelHeader title="Availability Calendar" />
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
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="text-xs font-medium text-gray-600 mr-2">Availability:</div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>All Available</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Partial</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span>Conflicts</span>
                </div>
                <div className="text-xs font-medium text-gray-600 ml-4 mr-2">Gig Status:</div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Pending</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Canceled</span>
                </div>
                <div className="text-xs font-medium text-gray-600 ml-4 mr-2">Rehearsals:</div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Planned</span>
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
                const rehearsalsForDate = getRehearsalsForDate(date);
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
                          <div key={gig.id} className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mb-1 flex items-center">
                            {getGigStatusDot(gig)}
                            {gig.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rehearsals */}
                    {rehearsalsForDate.length > 0 && (
                      <div className="mt-1">
                        {rehearsalsForDate.map(rehearsal => (
                          <div key={rehearsal.id} className="text-xs bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded mb-1 flex items-center">
                            {getRehearsalStatusDot(rehearsal)}
                            {rehearsal.name}
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Availability Details */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold mb-3">Member Availability (Core Members Only)</h4>
                  <div className="space-y-2">
                    {members.map(member => {
                      // Format date as DD-MM-YYYY to match availability API format
                      const day = selectedDate.getDate().toString().padStart(2, '0');
                      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
                      const year = selectedDate.getFullYear();
                      const dateString = `${day}-${month}-${year}`;
                      
                      const memberAvailability = availability.find(
                        entry => entry.memberId === member.id && entry.dateString === dateString
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
                        <div key={gig.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getGigStatusDot(gig)}
                                <div className="font-medium text-blue-900">{gig.name}</div>
                              </div>
                              <div className="text-sm text-blue-700">{gig.venue}</div>
                              <div className="text-sm text-blue-600">{gig.time}</div>
                              <div className="text-xs text-blue-500 mt-1">
                                Status: {gig.status || 'pending'}
                              </div>
                            </div>
                            <button
                              onClick={() => router.push(`/gigs?gigId=${gig.id}`)}
                              className="ml-3 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                              title="View gig details"
                            >
                              View Gig
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No gigs scheduled</div>
                  )}
                </div>
                
                {/* Rehearsals on this date */}
                <div className="lg:col-span-1">
                  <h4 className="font-semibold mb-3">Rehearsals on this date</h4>
                  {getRehearsalsForDate(selectedDate).length > 0 ? (
                    <div className="space-y-2">
                      {getRehearsalsForDate(selectedDate).map(rehearsal => (
                        <div key={rehearsal.id} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getRehearsalStatusDot(rehearsal)}
                                <div className="font-medium text-indigo-900">{rehearsal.name}</div>
                              </div>
                              {rehearsal.location && (
                                <div className="text-sm text-indigo-700">📍 {rehearsal.location}</div>
                              )}
                              <div className="text-sm text-indigo-600">{rehearsal.startTime} - {rehearsal.endTime}</div>
                              <div className="text-xs text-indigo-500 mt-1">
                                Status: {rehearsal.status || 'planned'}
                              </div>
                              {rehearsal.notes && (
                                <div className="text-xs text-gray-600 mt-2 italic">
                                  {rehearsal.notes.length > 50 ? `${rehearsal.notes.substring(0, 50)}...` : rehearsal.notes}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => router.push('/rehearsals')}
                              className="ml-3 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors"
                              title="View rehearsal details"
                            >
                              View Rehearsal
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No rehearsals scheduled</div>
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