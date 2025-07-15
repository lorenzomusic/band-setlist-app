'use client';

import { useState, useEffect } from 'react';
import ApplePanel from './ui/ApplePanel';
import ApplePanelHeader from './ui/ApplePanelHeader';
import AppleButton from './ui/AppleButton';
import AppleMetadataBadge from './ui/AppleMetadataBadge';

export default function Analytics() {
  const [analytics, setAnalytics] = useState({
    totalSongs: 0,
    totalSets: 0,
    totalGigs: 0,
    totalDuration: 0,
    languageBreakdown: { english: 0, danish: 0 },
    vocalistBreakdown: { Rikke: 0, Lorentz: 0 },
    recentActivity: [],
    topSongs: [],
    upcomingGigs: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // TODO: Implement analytics API call
      // For now, using mock data
      setAnalytics({
        totalSongs: 45,
        totalSets: 12,
        totalGigs: 8,
        totalDuration: 180,
        languageBreakdown: { english: 65, danish: 35 },
        vocalistBreakdown: { Rikke: 55, Lorentz: 45 },
        recentActivity: [
          { type: 'gig', name: 'Summer Festival', date: '2024-07-15' },
          { type: 'set', name: 'Wedding Set', date: '2024-06-20' },
          { type: 'song', name: 'New Song Added', date: '2024-06-18' }
        ],
        topSongs: [
          { title: 'Song 1', plays: 15 },
          { title: 'Song 2', plays: 12 },
          { title: 'Song 3', plays: 10 }
        ],
        upcomingGigs: [
          { name: 'Wedding Reception', date: '2024-08-10', venue: 'Grand Hotel' },
          { name: 'Corporate Event', date: '2024-08-25', venue: 'Business Center' }
        ]
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="apple-container">
        <ApplePanel>
          <div className="text-center py-12">
            <div className="apple-loading">Loading analytics...</div>
          </div>
        </ApplePanel>
      </div>
    );
  }

  return (
    <div className="apple-container">
      <ApplePanel>
        <ApplePanelHeader
          title="Analytics Dashboard"
          subtitle="Performance insights and statistics"
        />
        
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="apple-stat-card">
              <div className="apple-stat-number">{analytics.totalSongs}</div>
              <div className="apple-stat-label">Total Songs</div>
            </div>
            
            <div className="apple-stat-card">
              <div className="apple-stat-number">{analytics.totalSets}</div>
              <div className="apple-stat-label">Total Sets</div>
            </div>
            
            <div className="apple-stat-card">
              <div className="apple-stat-number">{analytics.totalGigs}</div>
              <div className="apple-stat-label">Total Gigs</div>
            </div>
            
            <div className="apple-stat-card">
              <div className="apple-stat-number">{formatDuration(analytics.totalDuration)}</div>
              <div className="apple-stat-label">Total Duration</div>
            </div>
          </div>
          
          {/* Language and Vocalist Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="apple-card">
              <h3 className="apple-subheading mb-4">Language Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>English</span>
                  <AppleMetadataBadge type="language">🇬🇧 {analytics.languageBreakdown.english}%</AppleMetadataBadge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue h-2 rounded-full" 
                    style={{ width: `${analytics.languageBreakdown.english}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Danish</span>
                  <AppleMetadataBadge type="language">🇩🇰 {analytics.languageBreakdown.danish}%</AppleMetadataBadge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${analytics.languageBreakdown.danish}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="apple-card">
              <h3 className="apple-subheading mb-4">Vocalist Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Rikke</span>
                  <AppleMetadataBadge type="vocalist">🎤 {analytics.vocalistBreakdown.Rikke}%</AppleMetadataBadge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${analytics.vocalistBreakdown.Rikke}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Lorentz</span>
                  <AppleMetadataBadge type="vocalist">🎤 {analytics.vocalistBreakdown.Lorentz}%</AppleMetadataBadge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${analytics.vocalistBreakdown.Lorentz}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Activity and Upcoming Gigs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="apple-card">
              <h3 className="apple-subheading mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue rounded-full"></div>
                    <div className="flex-1">
                      <div className="apple-text-sm">{activity.name}</div>
                      <div className="apple-text-xs text-gray-500">{activity.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="apple-card">
              <h3 className="apple-subheading mb-4">Upcoming Gigs</h3>
              <div className="space-y-3">
                {analytics.upcomingGigs.map((gig, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="apple-text-sm font-medium">{gig.name}</div>
                      <div className="apple-text-xs text-gray-500">{gig.venue}</div>
                    </div>
                    <AppleMetadataBadge type="date">{gig.date}</AppleMetadataBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ApplePanel>
    </div>
  );
} 