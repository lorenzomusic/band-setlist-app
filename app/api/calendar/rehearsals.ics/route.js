import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { config, createKey } from '../../../../lib/config';

const redis = new Redis({
  url: config.redis.url,
  token: config.redis.token,
});

export async function GET() {
  try {
    // Get all rehearsals
    const keys = await redis.keys(createKey('rehearsal:*'));
    const rehearsals = [];
    
    for (const key of keys) {
      const rehearsal = await redis.hgetall(key);
      if (rehearsal && Object.keys(rehearsal).length > 0) {
        rehearsals.push(rehearsal);
      }
    }

    // Filter out cancelled rehearsals and sort by date
    const activeRehearsals = rehearsals
      .filter(rehearsal => rehearsal.status !== 'cancelled')
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create iCal content
    let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Greatest Gig//Rehearsal Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Band Rehearsals
X-WR-CALDESC:Practice sessions and rehearsals for the band
X-WR-TIMEZONE:Europe/Copenhagen
`;

    for (const rehearsal of activeRehearsals) {
      const startDateTime = new Date(`${rehearsal.date}T${rehearsal.startTime}`);
      const endDateTime = new Date(`${rehearsal.date}T${rehearsal.endTime}`);
      
      // Format dates for iCal (YYYYMMDDTHHMMSS)
      const dtStart = startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0];
      const dtEnd = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0];
      
      // Create a unique UID
      const uid = `rehearsal-${rehearsal.id}@greatestgig.com`;
      
      // Format summary
      let summary = rehearsal.name;
      if (rehearsal.status === 'planned') {
        summary = `[PLANNED] ${summary}`;
      }
      
      // Format description
      let description = `Rehearsal: ${rehearsal.name}\\n`;
      if (rehearsal.notes) {
        description += `Notes: ${rehearsal.notes}\\n`;
      }
      description += `Status: ${rehearsal.status || 'planned'}`;

      // No location for rehearsals
      const location = '';

      icalContent += `BEGIN:VEVENT
UID:${uid}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
STATUS:${rehearsal.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}
CATEGORIES:REHEARSAL,PRACTICE
END:VEVENT
`;
    }

    icalContent += `END:VCALENDAR`;

    return new NextResponse(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rehearsals.ics"',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error generating rehearsals calendar:', error);
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
  }
}