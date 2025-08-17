"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../components/LanguageProvider';
import { useAuth } from '../components/AuthProvider';

export default function Home() {
  const { t } = useLanguage();
  const { user, bandMember, isAuthenticated } = useAuth();
  const [recentSets, setRecentSets] = useState([]);
  const [upcomingGigs, setUpcomingGigs] = useState([]);
  const [totalSongs, setTotalSongs] = useState(0);
  
  // Check if user is replacement member (shouldn't see this page, but just in case)
  const isReplacementMember = bandMember && !bandMember.isCore;

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

      // Load real upcoming gigs
      const gigsResponse = await fetch('/api/gigs');
      const gigs = await gigsResponse.json();
      
      // Filter for upcoming gigs (future dates and confirmed status)
      const upcoming = gigs.filter(gig => {
        const gigDate = new Date(gig.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of today
        return gigDate >= today && gig.status === 'confirmed';
      }).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5); // Get next 5 upcoming
      
      setUpcomingGigs(upcoming);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-apple-title-1 text-primary mb-2">{t('home.welcome')}</h1>
          <p className="text-apple-body text-secondary">{t('home.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="text-apple-title-2 text-blue font-bold mb-1">{totalSongs}</div>
          <div className="text-apple-body text-secondary">{t('home.totalSongs')}</div>
        </div>
        
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="text-apple-title-2 text-blue font-bold mb-1">{recentSets.length}</div>
          <div className="text-apple-body text-secondary">{t('home.recentSets')}</div>
        </div>
        
        <div className="bg-white rounded-apple shadow-apple p-6">
          <div className="text-apple-title-2 text-blue font-bold mb-1">{upcomingGigs.length}</div>
          <div className="text-apple-body text-secondary">{t('home.upcomingGigs')}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`grid gap-6 ${isReplacementMember ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Recent Sets - Only show for core members and admins */}
        {!isReplacementMember && (
          <div className="bg-white rounded-apple shadow-apple overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-light">
              <h3 className="text-apple-title-3 text-primary">{t('home.recentSets')}</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {recentSets.length > 0 ? (
                recentSets.map((set) => (
                  <Link key={set.id} href="/sets" className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="text-apple-headline text-primary mb-1">{set.name}</div>
                    <div className="text-apple-callout text-secondary">
                      {set.songs?.length || 0} {t('home.songs')}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <div className="text-3xl opacity-30 mb-2">🎵</div>
                  <p className="text-apple-body text-secondary">{t('home.noSets')}</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-light">
              <Link href="/sets" className="text-apple-callout text-blue hover:opacity-80">
                {t('home.viewAllSets')} →
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions - Show different actions based on user type */}
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-light">
            <h3 className="text-apple-title-3 text-primary">{t('home.quickActions')}</h3>
          </div>
          <div className="p-6 space-y-3">
            {/* Always show gigs for everyone */}
            <Link 
              href="/gigs"
              className="block w-full px-4 py-3 bg-blue-100 text-blue-700 rounded-apple-small text-apple-callout font-medium hover:bg-blue-200 transition-colors text-center"
            >
              View Gigs
            </Link>
            
            {/* Only show songs and sets for core members and admins */}
            {!isReplacementMember && (
              <>
                <Link 
                  href="/songs"
                  className="block w-full px-4 py-3 bg-gray-100 text-primary rounded-apple-small text-apple-callout font-medium hover:bg-gray-200 transition-colors text-center"
                >
                  {t('home.manageSongs')}
                </Link>
                <Link 
                  href="/sets"
                  className="block w-full px-4 py-3 bg-gray-100 text-primary rounded-apple-small text-apple-callout font-medium hover:bg-gray-200 transition-colors text-center"
                >
                  {t('home.buildSetlist')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Gigs */}
      {upcomingGigs.length > 0 && (
        <div className="bg-white rounded-apple shadow-apple overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-light">
            <h3 className="text-apple-title-3 text-primary">{t('home.upcomingGigs')}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingGigs.map((gig) => (
              <Link key={gig.id} href="/gigs" className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="text-apple-headline text-primary mb-1">{gig.name}</div>
                <div className="text-apple-callout text-secondary">
                  {new Date(gig.date).toLocaleDateString()} • {gig.venue}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                  gig.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {gig.status}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}