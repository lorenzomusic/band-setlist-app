'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import ApplePanel from '../../../components/ui/ApplePanel';
import ApplePanelHeader from '../../../components/ui/ApplePanelHeader';
import AppleButton from '../../../components/ui/AppleButton';

export default function GigDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gigId = params.id;
  const { user, bandMember } = useAuth();
  
  const [gig, setGig] = useState(null);
  const [songs, setSongs] = useState([]);
  const [members, setMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState('Current User'); // TODO: Get from auth
  
  // Check if user is a replacement member (non-core member)
  const isReplacementMember = bandMember && !bandMember.isCore;

  // Helper function to resolve song IDs to current song data
  const resolveSong = (songId) => {
    const id = typeof songId === 'string' ? songId : songId.id;
    const currentSong = songs.find(s => s.id === id);
    return currentSong || { id, title: 'Unknown Song', artist: 'Unknown' };
  };
  
  // Helper function to get status text for display
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '⏳ Pending';
      case 'confirmed': return '✅ Confirmed';
      case 'completed': return '🎉 Completed';
      case 'cancelled': return '❌ Cancelled';
      default: return '⏳ Pending';
    }
  };

  useEffect(() => {
    loadGig();
    loadSongs();
    loadMembers();
    loadComments();
    loadCurrentUser();
  }, [gigId]);

  useEffect(() => {
    if (gig && gig.date) {
      loadAvailability();
    }
  }, [gig]);

  // Load the current logged-in user
  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const userData = await response.json();
        if (userData.user) {
          // Find the band member that matches the logged-in user
          const memberResponse = await fetch('/api/band-members');
          if (memberResponse.ok) {
            const members = await memberResponse.json();
            const matchingMember = members.find(member => 
              member.userId === userData.user.id || 
              member.email === userData.user.email
            );
            if (matchingMember) {
              setCurrentUser(matchingMember.name);
            } else {
              // Fallback to user name if no matching band member
              setCurrentUser(userData.user.name || userData.user.email);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      if (response.ok) {
        const songsData = await response.json();
        setSongs(songsData);
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const loadGig = async () => {
    try {
      const response = await fetch('/api/gigs');
      if (response.ok) {
        const gigs = await response.json();
        console.log('All gigs:', gigs);
        console.log('Looking for gig ID:', gigId);
        
        // Try to find the gig with different ID matching strategies
        let foundGig = gigs.find(g => g.id === gigId);
        
        if (!foundGig) {
          // Try string comparison
          foundGig = gigs.find(g => String(g.id) === String(gigId));
        }
        
        if (!foundGig) {
          // Try partial match as fallback
          foundGig = gigs.find(g => String(g.id).includes(String(gigId))) || 
                     gigs.find(g => String(gigId).includes(String(g.id)));
        }
        
        if (foundGig) {
          // Add fallbacks for older gigs that don't have new fields
          const gigWithFallbacks = {
            ...foundGig,
            status: foundGig.status || 'pending',
            comments: foundGig.comments || [],
            lineup: foundGig.lineup || [],
            contractUploaded: foundGig.contractUploaded || false
          };
          setGig(gigWithFallbacks);
        } else {
          console.error('Gig not found. Available gigs:', gigs.map(g => ({ id: g.id, name: g.name })));
          alert('Gig not found');
          router.push('/gigs');
        }
      }
    } catch (error) {
      console.error('Error loading gig:', error);
      alert('Error loading gig');
      router.push('/gigs');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/band-members');
      if (response.ok) {
        const membersData = await response.json();
        setMembers(membersData);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      // Convert gig date to DD-MM-YYYY format for API
      const [year, month, day] = gig.date.split('-');
      const dateStr = `${day}-${month}-${year}`;
      
      const response = await fetch(`/api/availability?startDate=${dateStr}&endDate=${dateStr}`);
      if (response.ok) {
        const availabilityData = await response.json();
        setAvailability(availabilityData);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/gigs/${gigId}/comments`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`/api/gigs/${gigId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...gig, status: newStatus }),
      });

      if (response.ok) {
        setGig(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating gig status:', error);
    }
  };

  const handleContractToggle = async () => {
    try {
      const response = await fetch(`/api/gigs/${gigId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...gig, contractUploaded: !gig.contractUploaded }),
      });

      if (response.ok) {
        setGig(prev => ({ ...prev, contractUploaded: !prev.contractUploaded }));
      }
    } catch (error) {
      console.error('Error updating contract status:', error);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/gigs/${gigId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newComment,
          author: currentUser,
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments(prev => [...prev, newCommentData]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      const response = await fetch(`/api/gigs/${gigId}/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">⏳ Pending</span>,
      confirmed: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✅ Confirmed</span>,
      completed: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">🎉 Completed</span>,
      cancelled: <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">❌ Cancelled</span>
    };
    return badges[status] || badges.pending;
  };

  const getMemberName = (memberId) => {
    if (!memberId) return 'TBD';
    const member = members.find(m => m.id === memberId);
    return member ? member.name : `Member (${memberId.slice(-8)})`;
  };

  const getAvailabilityForMember = (memberId) => {
    return availability.find(entry => entry.memberId === memberId);
  };

  const getAvailabilityStatus = (status) => {
    switch (status) {
      case 'available': return { text: 'Available', color: 'text-green-600', icon: '✅' };
      case 'unavailable': return { text: 'Unavailable', color: 'text-red-600', icon: '❌' };
      case 'maybe': return { text: 'Maybe', color: 'text-yellow-600', icon: '⚠️' };
      default: return { text: 'Unknown', color: 'text-gray-500', icon: '❓' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCommentTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Gig Not Found</h2>
          <p className="text-gray-600 mb-4">The gig you're looking for doesn't exist.</p>
          <AppleButton onClick={() => router.push('/gigs')}>
            Back to Gigs
          </AppleButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-apple-title-1 text-primary mb-2">🎤 {gig.name}</h1>
                <p className="text-apple-body text-secondary">{gig.venue || 'No venue'} • {formatDate(gig.date)}</p>
              </div>
              <div className="flex items-center space-x-4">
                {getStatusBadge(gig.status)}
                <AppleButton
                  variant="secondary"
                  onClick={() => router.push('/gigs')}
                >
                  ← Back to Gigs
                </AppleButton>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gig Details */}
            <ApplePanel>
              <ApplePanelHeader title="Gig Details" />
              <div className="px-8 pb-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="apple-label">Status</label>
                    <div className="flex items-center space-x-3">
                      {isReplacementMember ? (
                        <p className="text-gray-900">{getStatusText(gig.status || 'pending')}</p>
                      ) : (
                        <select
                          className="apple-input"
                          value={gig.status || 'pending'}
                          onChange={(e) => handleStatusChange(e.target.value)}
                        >
                          <option value="pending">⏳ Pending</option>
                          <option value="confirmed">✅ Confirmed</option>
                          <option value="completed">🎉 Completed</option>
                          <option value="cancelled">❌ Cancelled</option>
                        </select>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="apple-label">Contract</label>
                    <div className="flex items-center space-x-3">
                      {isReplacementMember ? (
                        <p className="text-gray-900">
                          {gig.contractUploaded ? '✅ Contract uploaded' : '⏳ No contract'}
                        </p>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            id="contractUploaded"
                            checked={gig.contractUploaded || false}
                            onChange={handleContractToggle}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <label htmlFor="contractUploaded" className="text-sm text-gray-700">
                            Contract uploaded
                          </label>
                        </>
                      )}
                      {gig.contractUploaded && (
                        <AppleButton size="sm" variant="secondary">
                          📄 Download
                        </AppleButton>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="apple-label">Venue</label>
                    <p className="text-gray-900">{gig.venue || 'Not specified'}</p>
                  </div>

                  <div>
                    <label className="apple-label">Date & Time</label>
                    <p className="text-gray-900">
                      {formatDate(gig.date)} {gig.time && `at ${gig.time}`}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="apple-label">Address</label>
                    <p className="text-gray-900">{gig.address || 'Not specified'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="apple-label">Notes</label>
                    <p className="text-gray-900">{gig.notes || 'No notes'}</p>
                  </div>
                </div>
              </div>
            </ApplePanel>

            {/* Availability Summary */}
            <ApplePanel>
              <ApplePanelHeader title="Member Availability" />
              <div className="px-8 pb-8">
                {availability.length > 0 ? (
                  <div className="space-y-4">
                    {members.map(member => {
                      const memberAvailability = getAvailabilityForMember(member.id);
                      const status = memberAvailability?.status || 'unknown';
                      const statusInfo = getAvailabilityStatus(status);
                      
                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div>
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.instrument}</div>
                            {memberAvailability?.comment && (
                              <div className="text-xs text-gray-500 mt-1">
                                "{memberAvailability.comment}"
                              </div>
                            )}
                          </div>
                          <div className={`flex items-center space-x-2 ${statusInfo.color}`}>
                            <span className="text-lg">{statusInfo.icon}</span>
                            <span className="font-medium">{statusInfo.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-gray-700 font-medium">No availability data</p>
                    <p className="text-sm text-gray-500 mt-1">Members haven't set their availability for this date yet</p>
                    <AppleButton
                      variant="secondary"
                      onClick={() => router.push('/availability')}
                      className="mt-4"
                    >
                      Set Availability
                    </AppleButton>
                  </div>
                )}
              </div>
            </ApplePanel>

            {/* Lineup */}
            {gig.lineup && gig.lineup.length > 0 && (
              <ApplePanel>
                <ApplePanelHeader title="Band Lineup" />
                <div className="px-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gig.lineup.map((item, index) => {
                      console.log('Lineup item:', item);
                      const memberName = getMemberName(item.memberId);
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                          <div>
                            <div className="font-medium text-gray-900">{item.instrument}</div>
                            <div className="text-sm text-gray-600">
                              {item.memberId ? memberName : 'TBD'}
                            </div>
                          </div>
                          {item.isReplacement && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              Replacement
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ApplePanel>
            )}

            {/* Sets */}
            {gig.sets && gig.sets.length > 0 && (
              <ApplePanel>
                <ApplePanelHeader title="Setlist" />
                <div className="px-8 pb-8">
                  <div className="space-y-4">
                    {gig.sets.map((set, setIndex) => (
                      <div key={setIndex} className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Set {setIndex + 1}: {set.name}
                        </h4>
                        {set.songs && set.songs.length > 0 ? (
                          <div className="space-y-2">
                            {set.songs.map((songId, songIndex) => {
                              const song = resolveSong(songId);
                              return (
                                <div key={`${setIndex}-${song.id || songIndex}`} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                  <span className="text-sm text-gray-500 w-8">#{songIndex + 1}</span>
                                  <div className="flex-1">
                                    <div className="font-medium">{song.title}</div>
                                    <div className="text-sm text-gray-600">by {song.artist}</div>
                                    {song.key && (
                                      <div className="text-xs text-gray-500">Key: {song.key}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {song.duration && (
                                      <span className="text-sm text-gray-500">{song.duration}</span>
                                    )}
                                    {song.youtubeLink && (
                                      <a
                                        href={song.youtubeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                      >
                                        🎵 Recording
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No songs in this set</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </ApplePanel>
            )}
          </div>

          {/* Comments Sidebar - WhatsApp/iMessage Style */}
          <div className="space-y-6">
            <ApplePanel>
              <ApplePanelHeader title="Comments" />
              <div className="px-8 pb-8">
                {/* Comments List */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex flex-col space-y-2">
                        {/* Member Name */}
                        <div className={`flex ${comment.author === currentUser ? 'justify-end' : 'justify-start'} px-2`}>
                          <div className={`text-xs ${comment.author === currentUser ? 'text-right' : 'text-left'}`}>
                            <div className="font-medium text-gray-700">
                              {comment.author}
                            </div>
                          </div>
                        </div>
                        
                        {/* Comment Bubble */}
                        <div className={`flex ${comment.author === currentUser ? 'justify-end' : 'justify-start'}`}>
                          <div 
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              comment.author === currentUser 
                                ? 'bg-blue-500 rounded-br-md' 
                                : 'bg-gray-100 rounded-bl-md'
                            }`}
                            style={{
                              backgroundColor: comment.author === currentUser ? '#3b82f6' : '#f3f4f6',
                              color: comment.author === currentUser ? 'white' : 'black'
                            }}
                          >
                            <div className={`text-sm leading-relaxed`}>
                              {comment.message}
                            </div>
                          </div>
                        </div>
                        
                        {/* Timestamp and Delete */}
                        <div className={`flex ${comment.author === currentUser ? 'justify-end' : 'justify-start'} px-2`}>
                          <div className={`text-xs ${comment.author === currentUser ? 'text-right' : 'text-left'}`}>
                            <div className="text-gray-500">
                              {formatCommentTime(comment.timestamp)}
                            </div>
                            {comment.author === currentUser && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 mt-1"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">💬</div>
                      <p className="text-gray-700 font-medium">No comments yet</p>
                      <p className="text-sm text-gray-500 mt-1">Start the conversation!</p>
                      <p className="text-xs text-gray-400 mt-2">Posting as: {currentUser}</p>
                    </div>
                  )}
                </div>

                {/* Comment Input - WhatsApp Style */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500">Posting as: <span className="font-medium text-gray-700">{currentUser}</span></span>
                  </div>
                  <div className="flex items-end space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type a message..."
                        className="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue focus:border-transparent resize-none text-gray-900 bg-white"
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submitComment();
                          }
                        }}
                      />
                    </div>
                    <AppleButton
                      onClick={submitComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="px-6 py-3 rounded-full"
                    >
                      {submittingComment ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        '💬'
                      )}
                    </AppleButton>
                  </div>
                </div>
              </div>
            </ApplePanel>
          </div>
        </div>
      </div>
    </div>
  );
} 