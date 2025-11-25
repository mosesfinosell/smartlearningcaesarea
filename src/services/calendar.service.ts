/**
 * Google Calendar Integration Service
 * 
 * This service helps tutors sync their class schedules with Google Calendar
 * Students and parents receive calendar invites automatically
 */

interface CalendarEvent {
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendees: string[]; // Email addresses
  meetingLink?: string; // Zoom link
  timezone?: string;
}

export class GoogleCalendarService {
  /**
   * Generate a Google Calendar link that users can click to add event
   * This is a simple approach that doesn't require OAuth
   */
  static generateCalendarLink(event: CalendarEvent): string {
    const {
      title,
      description,
      startTime,
      endTime,
      meetingLink,
      timezone = 'Africa/Lagos',
    } = event;

    // Format dates for Google Calendar (YYYYMMDDTHHmmss)
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = formatDate(startTime);
    const end = formatDate(endTime);

    // Build description with Zoom link
    let fullDescription = description;
    if (meetingLink) {
      fullDescription += `\n\nZoom Meeting Link: ${meetingLink}`;
    }

    // Create Google Calendar URL
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: fullDescription,
      dates: `${start}/${end}`,
      ctz: timezone,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generate calendar links for recurring classes
   */
  static generateRecurringCalendarLinks(
    baseEvent: CalendarEvent,
    recurrence: {
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      count: number; // Number of occurrences
    }
  ): string[] {
    const links: string[] = [];
    const { frequency, count } = recurrence;

    for (let i = 0; i < count; i++) {
      const event = { ...baseEvent };
      
      // Calculate next occurrence
      const daysToAdd = 
        frequency === 'daily' ? i :
        frequency === 'weekly' ? i * 7 :
        frequency === 'biweekly' ? i * 14 :
        i * 30; // monthly (approximate)

      event.startTime = new Date(baseEvent.startTime);
      event.startTime.setDate(event.startTime.getDate() + daysToAdd);
      
      event.endTime = new Date(baseEvent.endTime);
      event.endTime.setDate(event.endTime.getDate() + daysToAdd);

      links.push(this.generateCalendarLink(event));
    }

    return links;
  }

  /**
   * Generate ICS file content for email attachments
   * Students/parents can download and add to any calendar app
   */
  static generateICSFile(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Caesarea Smart School//Class Schedule//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@caesareasmartschool.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startTime)}`,
      `DTEND:${formatDate(event.endTime)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}${event.meetingLink ? '\\n\\nZoom: ' + event.meetingLink : ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return ics;
  }

  /**
   * Create email content with calendar invite
   */
  static createCalendarInviteEmail(
    recipientName: string,
    className: string,
    tutorName: string,
    event: CalendarEvent,
    calendarLink: string
  ): { subject: string; html: string } {
    const subject = `Class Scheduled: ${className}`;
    
    const formatTime = (date: Date) => {
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #C9A05C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #F5F0E8; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #8B1538; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: white; padding: 20px; border-left: 4px solid #C9A05C; margin: 20px 0; }
          .zoom-link { background: #0E72ED; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Class Scheduled</h1>
            <p>Caesarea Smart School</p>
          </div>
          <div class="content">
            <p>Hello ${recipientName},</p>
            
            <p>Your class has been scheduled successfully!</p>
            
            <div class="details">
              <h3>${className}</h3>
              <p><strong>Tutor:</strong> ${tutorName}</p>
              <p><strong>Date & Time:</strong> ${formatTime(event.startTime)}</p>
              <p><strong>Duration:</strong> ${Math.round((event.endTime.getTime() - event.startTime.getTime()) / 60000)} minutes</p>
            </div>

            ${event.meetingLink ? `
              <p><strong>Join the class:</strong></p>
              <a href="${event.meetingLink}" class="zoom-link">🎥 Join Zoom Meeting</a>
            ` : ''}

            <p><strong>Add to your calendar:</strong></p>
            <a href="${calendarLink}" class="button" target="_blank">📅 Add to Google Calendar</a>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #E8D4B0;">
              <small>
                You can also add this event to other calendar apps by clicking the link above and choosing your preferred calendar.
              </small>
            </p>

            <p>
              <strong>Important Reminders:</strong>
            </p>
            <ul>
              <li>Join 5 minutes early to test your connection</li>
              <li>Ensure your camera and microphone are working</li>
              <li>Have your study materials ready</li>
            </ul>

            <p>See you in class!</p>
            
            <p>
              Best regards,<br>
              <strong>Caesarea Smart School Team</strong>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }
}

export default GoogleCalendarService;
