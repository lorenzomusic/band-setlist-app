import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function GET() {
  try {
    // Get all gigs from Redis
    const gigs = await redis.get('gigs') || [];
    
    // Get band members for name resolution
    const members = await redis.get('band_members') || [];
    
    // Filter for confirmed gigs
    const confirmedGigs = gigs.filter(gig => gig.status === 'confirmed');
    
    // Generate iCal content
    const icalContent = generateICal(confirmedGigs, false, members);
    
    return new Response(icalContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="confirmed-gigs.ics"'
      }
    });
  } catch (error) {
    console.error('Error generating confirmed gigs iCal:', error);
    return new Response('Error generating calendar', { status: 500 });
  }
}

function generateICal(gigs, isPending = false, members = []) {
  const now = new Date();
  const calendarId = isPending ? 'pending-gigs' : 'confirmed-gigs';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3003';
  
  // Helper function to get member name
  const getMemberName = (memberId) => {
    if (!memberId) return 'TBD';
    const member = members.find(m => m.id === memberId);
    return member ? member.name : `Member (${memberId.slice(-8)})`;
  };
  
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Band Setlist App//Calendar Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${isPending ? 'Pending' : 'Confirmed'} Gigs`,
    `X-WR-CALDESC:${isPending ? 'Pending' : 'Confirmed'} gigs from Band Setlist App`,
    ''
  ];
  
  gigs.forEach((gig, index) => {
    const eventId = `${calendarId}-${gig.id}`;
    const eventTitle = isPending ? `TBC: ${gig.name}` : gig.name;
    
    // Parse date and time - handle both DD.MM.YYYY and YYYY-MM-DD formats
    let eventDate;
    if (gig.date.includes('-')) {
      // YYYY-MM-DD format
      const [year, month, day] = gig.date.split('-');
      const [hours, minutes] = gig.time.split(':');
      eventDate = new Date(year, month - 1, day, hours, minutes);
    } else {
      // DD.MM.YYYY format
      const [day, month, year] = gig.date.split('.');
      const [hours, minutes] = gig.time.split(':');
      eventDate = new Date(year, month - 1, day, hours, minutes);
    }
    
    // Format date for iCal (YYYYMMDDTHHMMSSZ)
    const startDate = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endDate = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours duration
    const endDateFormatted = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    // Create description with lineup info
    let description = `Venue: ${gig.venue}`;
    if (gig.address) {
      description += `\r\nAddress: ${gig.address}`;
    }
    if (gig.notes) {
      description += `\r\nNotes: ${gig.notes}`;
    }
    if (gig.lineup && gig.lineup.length > 0) {
      description += '\r\n\r\nLineup:';
      gig.lineup.forEach(item => {
        const memberName = getMemberName(item.memberId);
        description += `\r\n- ${item.instrument}: ${memberName}`;
        if (item.isReplacement) {
          description += ' (Replacement)';
        }
      });
    }
    
    // Add link to the specific gig
    const gigUrl = `${baseUrl}/gigs/${gig.id}`;
    description += `\r\n\r\nView Details: ${gigUrl}`;
    
    // Escape special characters for iCal
    const escapedTitle = eventTitle.replace(/[\\;,]/g, '\\$&');
    const escapedDescription = description.replace(/[\\;,]/g, '\\$&');
    const escapedLocation = (gig.address || gig.venue).replace(/[\\;,]/g, '\\$&');
    
    ical.push(
      'BEGIN:VEVENT',
      `UID:${eventId}`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTSTART:${startDate}`,
      `DTEND:${endDateFormatted}`,
      `SUMMARY:${escapedTitle}`,
      `DESCRIPTION:${escapedDescription}`,
      `LOCATION:${escapedLocation}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      ''
    );
  });
  
  ical.push('END:VCALENDAR');
  
  return ical.join('\r\n');
} 