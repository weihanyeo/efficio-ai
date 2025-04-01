import { NextResponse } from 'next/server';
import { checkAndSendEventNotifications } from '../../../lib/eventNotifier';
import { supabase } from '../../../lib/supabase';
import { DateTime } from 'luxon';

/**
 * API route to trigger checking for upcoming events and sending notifications
 * This route is called by a cron job configured in vercel.json
 * The cron job runs in UTC, but we handle Singapore timezone (UTC+8) internally
 */
export async function GET() {
  // Use Luxon to get the current time in Singapore timezone
  const startTime = DateTime.now().setZone('Asia/Singapore');
  const utcNow = DateTime.now().toUTC();
  
  console.log(`[${startTime.toISO()}] Event notification check started (SGT timezone)`);
  console.log(`Current time in SGT: ${startTime.toFormat('yyyy-MM-dd HH:mm:ss')}`);
  console.log(`Current time in UTC: ${utcNow.toFormat('yyyy-MM-dd HH:mm:ss')}`);
  console.log(`Timezone offset: UTC+${startTime.offset / 60} hours`);
  
  try {
    // Log the cron job execution to the database for monitoring
    const { error: logError } = await supabase
      .from('system_logs')
      .insert({
        type: 'cron_execution',
        message: 'Event notification cron job started',
        timestamp: startTime.toUTC().toISO(), // Store in UTC in the database
        details: { 
          source: 'api/cron/event-notifications',
          timezone: 'Asia/Singapore',
          localTime: startTime.toFormat('yyyy-MM-dd HH:mm:ss'),
          utcTime: utcNow.toFormat('yyyy-MM-dd HH:mm:ss'),
          timezoneOffset: `UTC+${startTime.offset / 60}`
        }
      });
    
    if (logError) {
      console.error(`[${DateTime.now().setZone('Asia/Singapore').toISO()}] Error logging cron execution: ${logError.message}`);
    }
    
    // Run the notification check
    const result = await checkAndSendEventNotifications();
    
    // Calculate execution time
    const endTime = DateTime.now().setZone('Asia/Singapore');
    const executionTime = endTime.diff(startTime).milliseconds;
    
    // Log the completion to the database
    await supabase
      .from('system_logs')
      .insert({
        type: 'cron_completion',
        message: `Event notification cron job completed in ${executionTime}ms`,
        timestamp: endTime.toUTC().toISO(), // Store in UTC in the database
        details: { 
          source: 'api/cron/event-notifications',
          timezone: 'Asia/Singapore',
          localTime: endTime.toFormat('yyyy-MM-dd HH:mm:ss'),
          executionTimeMs: executionTime,
          eventsFound: result.eventsFound,
          notificationsSent: result.notificationsSent,
          errors: result.errors
        }
      });
    
    console.log(`[${endTime.toISO()}] Event notification check completed in ${executionTime}ms (SGT timezone)`);
    console.log(`Events found: ${result.eventsFound}, Notifications sent: ${result.notificationsSent}, Errors: ${result.errors}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Event notification check completed',
      timezone: 'Asia/Singapore',
      localTime: endTime.toFormat('yyyy-MM-dd HH:mm:ss'),
      utcTime: endTime.toUTC().toFormat('yyyy-MM-dd HH:mm:ss'),
      executionTimeMs: executionTime,
      result
    });
  } catch (error) {
    const errorTime = DateTime.now().setZone('Asia/Singapore');
    console.error(`[${errorTime.toISO()}] Error in event notification cron job:`, error);
    
    // Log the error to the database
    await supabase
      .from('system_logs')
      .insert({
        type: 'cron_error',
        message: `Event notification cron job error: ${error}`,
        timestamp: errorTime.toUTC().toISO(), // Store in UTC in the database
        details: { 
          source: 'api/cron/event-notifications',
          timezone: 'Asia/Singapore',
          localTime: errorTime.toFormat('yyyy-MM-dd HH:mm:ss'),
          error: String(error)
        }
      });
    
    return NextResponse.json({ 
      success: false, 
      message: 'Error running event notification check',
      timezone: 'Asia/Singapore',
      localTime: errorTime.toFormat('yyyy-MM-dd HH:mm:ss'),
      error: String(error)
    }, { status: 500 });
  }
}
