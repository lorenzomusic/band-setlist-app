'use client';

import { useState } from 'react';
import ApplePanel from '@/components/ui/ApplePanel';
import ApplePanelHeader from '@/components/ui/ApplePanelHeader';
import AppleButton from '@/components/ui/AppleButton';

export default function CalendarFeedsPage() {
  const [baseUrl] = useState(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3003');
  
  const confirmedUrl = `${baseUrl}/api/calendar/confirmed.ics`;
  const pendingUrl = `${baseUrl}/api/calendar/pending.ics`;

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <ApplePanel>
          <ApplePanelHeader title="Calendar Feeds" />
          
          <div className="p-6 space-y-8">
            {/* Introduction */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Subscribe to Your Gigs
              </h2>
              <p className="text-gray-600">
                Add your confirmed and pending gigs to your phone's calendar for easy access
              </p>
            </div>

            {/* Confirmed Gigs Calendar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmed Gigs</h3>
                  <p className="text-sm text-gray-600">All your confirmed gigs in one calendar</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <AppleButton
                    onClick={() => window.open(confirmedUrl, '_blank')}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subscribe to Confirmed Gigs
                  </AppleButton>
                  <AppleButton
                    onClick={() => copyToClipboard(confirmedUrl)}
                    variant="secondary"
                  >
                    Copy URL
                  </AppleButton>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-xs text-gray-700 break-all">{confirmedUrl}</code>
                </div>
              </div>
            </div>

            {/* Pending Gigs Calendar */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pending Gigs</h3>
                  <p className="text-sm text-gray-600">Gigs marked as "TBC" for tentative bookings</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <AppleButton
                    onClick={() => window.open(pendingUrl, '_blank')}
                    className="flex-1"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Subscribe to Pending Gigs
                  </AppleButton>
                  <AppleButton
                    onClick={() => copyToClipboard(pendingUrl)}
                    variant="secondary"
                  >
                    Copy URL
                  </AppleButton>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <code className="text-xs text-gray-700 break-all">{pendingUrl}</code>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Add to Your Calendar</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">📱 iPhone (iOS)</h4>
                  <ol className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>1. Tap the subscribe link above</li>
                    <li>2. Choose "Subscribe" when prompted</li>
                    <li>3. Select your preferred calendar</li>
                    <li>4. Tap "Add Events"</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">🤖 Android</h4>
                  <ol className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>1. Tap the subscribe link above</li>
                    <li>2. Choose "Add to Google Calendar"</li>
                    <li>3. Select your preferred calendar</li>
                    <li>4. Tap "Add"</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">💻 Desktop (Google Calendar)</h4>
                  <ol className="text-sm text-blue-700 space-y-1 ml-4">
                    <li>1. Open Google Calendar</li>
                    <li>2. Click the "+" next to "Other calendars"</li>
                    <li>3. Choose "From URL"</li>
                    <li>4. Paste the calendar URL and click "Add calendar"</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* QR Codes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmed Gigs QR Code</h3>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                      </svg>
                      <p className="text-sm">QR Code</p>
                      <p className="text-xs">(Coming Soon)</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">Scan with your phone camera to subscribe</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Gigs QR Code</h3>
                <div className="bg-gray-100 rounded-lg p-4 inline-block">
                  <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                      </svg>
                      <p className="text-sm">QR Code</p>
                      <p className="text-xs">(Coming Soon)</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">Scan with your phone camera to subscribe</p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-3">💡 Pro Tips</h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• Calendar feeds update automatically when gigs are added or modified</li>
                <li>• You can unsubscribe anytime from your calendar settings</li>
                <li>• Events include venue details, lineup info, and notes</li>
                <li>• Pending gigs are prefixed with "TBC:" for easy identification</li>
              </ul>
            </div>
          </div>
        </ApplePanel>
      </div>
    </div>
  );
} 