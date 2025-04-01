import { supabase } from './supabase';
import emailjs from '@emailjs/browser';
import { DateTime } from 'luxon';

interface EventNotification {
  id: string;
  event_id: string;
  user_id: string;
  sent_at: string;
  type: 'upcoming';
}

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
}

interface NotificationSummary {
  startTime: string;
  endTime?: string;
  executionTimeMs?: number;
  eventsFound: number;
  notificationsSent: number;
  errors: number;
  logs: string[];
}

/**
 * Checks for upcoming events and sends notifications to attendees
 * This function should be called by a cron job or queue consumer
 * @returns Summary of execution including events found and notifications sent
 */
export async function checkAndSendEventNotifications(): Promise<NotificationSummary> {
  // Use Luxon to get the current time in Singapore timezone
  const startTime = DateTime.now().setZone('Asia/Singapore');
  const executionLog: string[] = [];
  const summary: NotificationSummary = {
    startTime: startTime.toISO(),
    eventsFound: 0,
    notificationsSent: 0,
    errors: 0,
    logs: executionLog
  };
  
  executionLog.push(`[${startTime.toISO()}] Checking for upcoming events to send notifications (SGT timezone)...`);
  console.log(`[${startTime.toISO()}] Checking for upcoming events to send notifications (SGT timezone)...`);
  
  try {
    // Initialize EmailJS
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_API_KEY_NOTIFICATION || '');
    executionLog.push(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] EmailJS initialized`);
    
    // Get current time in Singapore timezone
    const now = DateTime.now().setZone('Asia/Singapore');
    
    // Calculate time one hour from now with a small buffer (add 5 minutes to ensure we catch events right at the edge)
    const oneHourFromNow = now.plus({ minutes: 65 }); // 1 hour and 5 minutes
    
    // Format dates for Supabase query - convert to UTC since Supabase stores timestamps in UTC
    const formattedNow = now.toUTC().toISO();
    const formattedOneHourFromNow = oneHourFromNow.toUTC().toISO();
    
    const logMessage = `[${now.toISO()}] Looking for events between ${now.toFormat('yyyy-MM-dd HH:mm:ss')} and ${oneHourFromNow.toFormat('yyyy-MM-dd HH:mm:ss')} SGT (with 5-minute buffer)`;
    executionLog.push(logMessage);
    console.log(logMessage);
    console.log(`Current UTC time: ${DateTime.utc().toFormat('yyyy-MM-dd HH:mm:ss')}`);
    console.log(`Current SGT time: ${now.toFormat('yyyy-MM-dd HH:mm:ss')}`);
    console.log(`UTC query range: ${DateTime.fromISO(formattedNow || '', { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm:ss')} to ${DateTime.fromISO(formattedOneHourFromNow || '', { zone: 'utc' }).toFormat('yyyy-MM-dd HH:mm:ss')}`);
    
    // First, let's do a broader query to see what events exist (for debugging)
    const { data: allUpcomingEvents } = await supabase
      .from('events')
      .select('id, title, start_time')
      .gte('start_time', formattedNow) // Only get events that start in the future
      .order('start_time', { ascending: true })
      .limit(10);
    
    if (allUpcomingEvents && allUpcomingEvents.length > 0) {
      const debugMsg = `[${now.toISO()}] Found ${allUpcomingEvents.length} upcoming events in the system`;
      executionLog.push(debugMsg);
      console.log(debugMsg);
      
      // Log each event with its SGT time for debugging
      allUpcomingEvents.forEach(event => {
        // Explicitly parse the event time as UTC first, then convert to SGT
        // This ensures we're treating the database time correctly as UTC
        const eventTimeUTC = DateTime.fromISO(event.start_time, { zone: 'utc' });
        const eventTime = eventTimeUTC.setZone('Asia/Singapore');
        
        // Debug the raw time from database and the parsed times
        console.log(`Raw event time from DB: ${event.start_time}`);
        console.log(`Parsed as UTC: ${eventTimeUTC.toFormat('yyyy-MM-dd HH:mm:ss')}`);
        console.log(`Converted to SGT: ${eventTime.toFormat('yyyy-MM-dd HH:mm:ss')}`);
        
        // Check if event is in the future
        const isInFuture = eventTime > now;
        const minutesUntilEvent = Math.round(eventTime.diff(now).as('minutes'));
        const debugEventMsg = `[${now.toISO()}] Event: ${event.title} (${event.id}) - Starts at ${eventTime.toFormat('yyyy-MM-dd HH:mm:ss')} SGT - ${isInFuture ? `UPCOMING (in ${minutesUntilEvent} minutes)` : 'PAST'}`;
        executionLog.push(debugEventMsg);
        console.log(debugEventMsg);
      });
    } else {
      const debugMsg = `[${now.toISO()}] No upcoming events found in the system at all`;
      executionLog.push(debugMsg);
      console.log(debugMsg);
    }
    
    // Query for events starting within the next hour (with buffer)
    // Make sure we're only getting future events
    const { data: upcomingEvents, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        start_time,
        end_time,
        workspace_id,
        user_id
      `)
      .gte('start_time', formattedNow) // Only get events that start in the future
      .lte('start_time', formattedOneHourFromNow);
    
    if (eventsError) {
      const errorMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error fetching upcoming events: ${eventsError.message}`;
      executionLog.push(errorMsg);
      console.error(errorMsg);
      summary.errors++;
      return summary;
    }
    
    if (!upcomingEvents || upcomingEvents.length === 0) {
      const logMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] No upcoming events found within the next hour`;
      executionLog.push(logMsg);
      console.log(logMsg);
      return summary;
    }
    
    summary.eventsFound = upcomingEvents.length;
    const eventsMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Found ${upcomingEvents.length} upcoming events to notify`;
    executionLog.push(eventsMsg);
    console.log(eventsMsg);
    
    // Process each upcoming event
    for (const event of upcomingEvents) {
      // Convert event time to Singapore timezone for display
      const eventStartTimeUTC = DateTime.fromISO(event.start_time, { zone: 'utc' });
      const eventStartTime = eventStartTimeUTC.setZone('Asia/Singapore');
      
      // Double-check that this event is actually in the future (to handle any timezone issues)
      if (eventStartTime < now) {
        const skipMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Skipping past event: ${event.title} (${event.id}) - Was scheduled for ${eventStartTime.toFormat('yyyy-MM-dd HH:mm:ss')} SGT but current time is ${now.toFormat('yyyy-MM-dd HH:mm:ss')} SGT`;
        executionLog.push(skipMsg);
        console.log(skipMsg);
        continue;
      }
      
      const eventMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Processing event: ${event.title} (${event.id}) - Starts at ${eventStartTime.toFormat('yyyy-MM-dd HH:mm:ss')} SGT`;
      executionLog.push(eventMsg);
      console.log(eventMsg);
      
      // Get all workspace members for the event's workspace
      const { data: workspaceMembers, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          user_id,
          users:user_id(
            id,
            email,
            name
          )
        `)
        .eq('workspace_id', event.workspace_id);
      
      if (membersError) {
        const errorMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error fetching members for workspace ${event.workspace_id}: ${membersError.message}`;
        executionLog.push(errorMsg);
        console.error(errorMsg);
        summary.errors++;
        continue;
      }
      
      if (!workspaceMembers || workspaceMembers.length === 0) {
        const logMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] No members found for workspace ${event.workspace_id}`;
        executionLog.push(logMsg);
        console.log(logMsg);
        continue;
      }
      
      executionLog.push(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Found ${workspaceMembers.length} members for workspace ${event.workspace_id}`);
      console.log(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Found ${workspaceMembers.length} members for workspace ${event.workspace_id}`);
      
      // Check if notifications have already been sent for this event
      for (const member of workspaceMembers) {
        // Extract user data from the nested structure
        const userData = member.users as unknown as UserProfile;
        
        if (!userData || !userData.email) {
          executionLog.push(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Skipping user with missing email: ${member.user_id}`);
          console.log(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Skipping user with missing email: ${member.user_id}`);
          continue;
        }
        
        // Check if we've already sent a notification for this event to this user
        const { data: existingNotifications, error: notificationError } = await supabase
          .from('event_notifications')
          .select('id')
          .eq('event_id', event.id)
          .eq('user_id', userData.id)
          .eq('type', 'upcoming');
        
        if (notificationError) {
          const errorMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error checking existing notifications for user ${userData.id}: ${notificationError.message}`;
          executionLog.push(errorMsg);
          console.error(errorMsg);
          summary.errors++;
          continue;
        }
        
        // If notification already sent, skip this user
        if (existingNotifications && existingNotifications.length > 0) {
          executionLog.push(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Notification already sent to ${userData.email} for event ${event.id}`);
          console.log(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Notification already sent to ${userData.email} for event ${event.id}`);
          continue;
        }
        
        // Format event time for display using Luxon
        const formattedStartTime = eventStartTime.toFormat('hh:mm a');
        const formattedDate = eventStartTime.toFormat('EEEE, MMMM d, yyyy');
        
        // Prepare email parameters
        const templateParams = {
          to_email: userData.email,
          to_name: userData.name || userData.email.split('@')[0],
          email: userData.email, // Add this field which might be required by the template
          user_email: userData.email, // Add alternative field name
          recipient_email: userData.email, // Add alternative field name
          event_title: event.title,
          event_description: event.description || 'No description provided',
          event_time: formattedStartTime,
          event_date: formattedDate,
          event_location: 'Online', // Default location if not available
          message: `Your event "${event.title}" is starting soon at ${formattedStartTime} on ${formattedDate}.`,
          // Add additional parameters that might be expected by the template
          subject: `Upcoming Event: ${event.title}`,
          from_name: 'Efficio AI',
          reply_to: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || userData.email,
        };
        
        try {
          // Send email notification
          const sendingMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Sending event notification to ${userData.email} for event ${event.title}`;
          executionLog.push(sendingMsg);
          console.log(sendingMsg);
          
          // Log the template parameters for debugging
          const paramsMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Email template parameters: ${JSON.stringify(templateParams)}`;
          executionLog.push(paramsMsg);
          console.log(paramsMsg);
          
          // Log the EmailJS configuration
          const configMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] EmailJS config - Service: ${process.env.NEXT_PUBLIC_EMAILJS_SERVICE_LINK_NOTIFICATION || 'not set'}, Template: ${process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_LINK_NOTIFICATION || 'not set'}, API Key: ${process.env.NEXT_PUBLIC_EMAILJS_API_KEY_NOTIFICATION ? 'set' : 'not set'}`;
          executionLog.push(configMsg);
          console.log(configMsg);
          
          const emailResult = await emailjs.send(
            process.env.NEXT_PUBLIC_EMAILJS_SERVICE_LINK_NOTIFICATION || '',
            process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_LINK_NOTIFICATION || '',
            templateParams,
            process.env.NEXT_PUBLIC_EMAILJS_API_KEY_NOTIFICATION || ''
          );
          
          const successMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Email sent successfully to ${userData.email}: ${JSON.stringify(emailResult)}`;
          executionLog.push(successMsg);
          console.log(successMsg);
          summary.notificationsSent++;
          
          // Record that we've sent the notification
          const { error: insertError } = await supabase
            .from('event_notifications')
            .insert({
              event_id: event.id,
              user_id: userData.id,
              sent_at: DateTime.now().toUTC().toISO(), // Store in UTC in the database
              type: 'upcoming'
            });
          
          if (insertError) {
            const errorMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error recording notification for user ${userData.id}: ${insertError.message}`;
            executionLog.push(errorMsg);
            console.error(errorMsg);
            summary.errors++;
          } else {
            executionLog.push(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Notification record created for user ${userData.id}`);
            console.log(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Notification record created for user ${userData.id}`);
          }
        } catch (emailError) {
          const errorMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error sending email notification to ${userData.email}: ${emailError}`;
          executionLog.push(errorMsg);
          console.error(errorMsg);
          summary.errors++;
        }
      }
    }
    
    const endTime = DateTime.now().setZone('Asia/Singapore');
    const executionTime = endTime.diff(startTime).milliseconds;
    const completionMsg = `[${endTime.toISO()}] Finished processing event notifications in ${executionTime}ms`;
    executionLog.push(completionMsg);
    console.log(completionMsg);
    
    summary.endTime = endTime.toISO();
    summary.executionTimeMs = executionTime;
    
    return summary;
  } catch (error) {
    const errorMsg = `[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error in checkAndSendEventNotifications: ${error}`;
    executionLog.push(errorMsg);
    console.error(errorMsg);
    summary.errors++;
    summary.endTime = DateTime.now().setZone('Asia/Singapore').toISO();
    return summary;
  }
}
