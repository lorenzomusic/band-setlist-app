"use client";

import React, { useState, useEffect } from 'react';

export default function PerformanceTracker() {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading performance data
    setTimeout(() => {
      setPerformances([
        {
          id: 1,
          date: '2024-01-15',
          venue: 'The Blue Note',
          attendance: 150,
          revenue: 2500,
          rating: 4.5,
          notes: 'Great crowd energy, encore performance'
        },
        {
          id: 2,
          date: '2024-01-08',
          venue: 'Jazz Corner',
          attendance: 120,
          revenue: 2000,
          rating: 4.2,
          notes: 'Technical issues with sound system'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <div className="apple-loading">Loading performance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <h1 className="text-apple-title-1 text-primary mb-2">Performance Tracker</h1>
          <p className="text-apple-body text-secondary">Track your gigs, attendance, and revenue</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="apple-stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-apple-small">
              <svg className="w-6 h-6 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="apple-stat-label">Total Gigs</p>
              <p className="apple-stat-number">{performances.length}</p>
            </div>
          </div>
        </div>

        <div className="apple-stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-apple-small">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="apple-stat-label">Total Attendance</p>
              <p className="apple-stat-number">
                {performances.reduce((sum, p) => sum + p.attendance, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="apple-stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-apple-small">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="apple-stat-label">Total Revenue</p>
              <p className="apple-stat-number">
                ${performances.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="apple-stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-apple-small">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="apple-stat-label">Avg Rating</p>
              <p className="apple-stat-number">
                {(performances.reduce((sum, p) => sum + p.rating, 0) / performances.length).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance List */}
      <div className="bg-white rounded-apple shadow-apple overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-light">
          <h3 className="text-apple-title-3 text-primary">Recent Performances</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {performances.map((performance) => (
            <div key={performance.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-apple-headline text-primary">{performance.venue}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue">
                      {performance.rating} ★
                    </span>
                  </div>
                  <p className="text-apple-callout text-secondary mt-1">{performance.date}</p>
                  <p className="text-apple-callout text-secondary mt-1">{performance.notes}</p>
                </div>
                <div className="text-right">
                  <p className="text-apple-headline text-primary">${performance.revenue.toLocaleString()}</p>
                  <p className="text-apple-callout text-secondary">{performance.attendance} attendees</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 