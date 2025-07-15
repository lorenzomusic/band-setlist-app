"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [recentSets, setRecentSets] = useState([]);
  const [upcomingGigs, setUpcomingGigs] = useState([]);
  const [totalSongs, setTotalSongs] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent sets
      const setsResponse = await fetch('/api/sets');
      const sets = await setsResponse.json();
      setRecentSets(sets.slice(0, 3));

      // Load songs count
      const songsResponse = await fetch('/api/songs');
      const songs = await songsResponse.json();
      setTotalSongs(songs.length);

      // Mock upcoming gigs (replace with real API)
      setUpcomingGigs([
        { id: 1, name: 'Summer Festival', date: '2025-07-15', venue: 'Main Stage' },
        { id: 2, name: 'Wedding Reception', date: '2025-07-20', venue: 'Hotel Bella Vista' }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-apple-title-1 text-primary mb-2">Welcome to Greatest Gig</h1>
          <p className="text-apple-body text-secondary">Professional band management for Lorenzo&apos;s Band</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="text-apple-title-2 text-blue font-bold mb-1">{totalSongs}</div>
          <div className="text-apple-body text-secondary">Total Songs</div>
        </div>
        
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="text-apple-title-2 text-blue font-bold mb-1">{recentSets.length}</div>
          <div className="text-apple-body text-secondary">Recent Sets</div>
        </div>
        
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="text-apple-title-2 text-blue font-bold mb-1">{upcomingGigs.length}</div>
          <div className="text-apple-body text-secondary">Upcoming Gigs</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sets */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-light">
            <h3 className="text-apple-title-3 text-primary">Recent Sets</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSets.length > 0 ? (
              recentSets.map((set) => (
                <Link key={set.id} href="/sets" className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="text-apple-headline text-primary mb-1">{set.name}</div>
                  <div className="text-apple-callout text-secondary">
                    {set.songs?.length || 0} songs
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <div className="text-3xl opacity-30 mb-2">🎵</div>
                <p className="text-apple-body text-secondary">No sets yet</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-light">
            <Link href="/sets" className="text-apple-callout text-blue hover:opacity-80">
              View all sets →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-light">
            <h3 className="text-apple-title-3 text-primary">Quick Actions</h3>
          </div>
          <div className="p-6 space-y-3">
            <Link 
              href="/songs"
              className="block w-full px-4 py-3 bg-gray-100 text-primary rounded-apple-small text-apple-callout font-medium hover:bg-gray-200 transition-colors text-center"
            >
              📚 Manage Songs
            </Link>
            <Link 
              href="/sets"
              className="block w-full px-4 py-3 bg-gray-100 text-primary rounded-apple-small text-apple-callout font-medium hover:bg-gray-200 transition-colors text-center"
            >
              🎼 Build Setlist
            </Link>
            <Link 
              href="/ai-setlist"
              className="block w-full px-4 py-3 bg-blue text-white rounded-apple-small text-apple-callout font-medium hover:opacity-80 transition-opacity text-center"
            >
              🤖 AI Assistant
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Gigs */}
      {upcomingGigs.length > 0 && (
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-light">
            <h3 className="text-apple-title-3 text-primary">Upcoming Gigs</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingGigs.map((gig) => (
              <div key={gig.id} className="px-6 py-4">
                <div className="text-apple-headline text-primary mb-1">{gig.name}</div>
                <div className="text-apple-callout text-secondary">
                  {gig.date} • {gig.venue}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}