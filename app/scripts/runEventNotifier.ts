import { checkAndSendEventNotifications } from '../lib/eventNotifier';
import { supabase } from '../lib/supabase';
import { DateTime } from 'luxon';

/**
 * This script manually tests the event notification system
 * It can be run with: npx ts-node -r tsconfig-paths/register app/scripts/runEventNotifier.ts
 */
async function main() {
  console.log('=== EVENT NOTIFIER TEST SCRIPT ===');
  const now = DateTime.now().setZone('Asia/Singapore');
  console.log('Starting at:', now.toFormat('yyyy-MM-dd HH:mm:ss'), '(SGT)');
  
  try {
    // First, check if there are any upcoming events in the system
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, start_time, workspace_id')
      .gte('start_time', now.toUTC().toISO())
      .order('start_time', { ascending: true })
      .limit(10);
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return;
    }
    
    console.log(`Found ${events?.length || 0} upcoming events in the system:`);
    if (events && events.length > 0) {
      events.forEach(event => {
        const eventTime = DateTime.fromISO(event.start_time).setZone('Asia/Singapore');
        const diffMs = eventTime.diff(now).milliseconds;
        const diffMins = Math.round(diffMs / 60000);
        
        console.log(`- ${event.title} (ID: ${event.id})`);
        console.log(`  Start time: ${eventTime.toFormat('yyyy-MM-dd HH:mm:ss')} (SGT)`);
        console.log(`  Workspace: ${event.workspace_id}`);
        console.log(`  Time until event: ${diffMins} minutes`);
      });
    } else {
      console.log('No upcoming events found. Consider creating a test event.');
    }
    
    // Check if we want to create a test event
    const createTestEvent = process.argv.includes('--create-test');
    if (createTestEvent) {
      console.log('\nCreating a test event for 55 minutes from now...');
      
      // Get a workspace to use
      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id, name')
        .limit(1);
      
      if (workspacesError || !workspaces || workspaces.length === 0) {
        console.error('Error fetching workspace or no workspaces found:', workspacesError);
        return;
      }
      
      const workspace = workspaces[0];
      
      // Get a user to use as creator
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.error('Error fetching user or no users found:', usersError);
        return;
      }
      
      const user = users[0];
      
      // Create event 55 minutes from now in Singapore timezone
      const startTime = now.plus({ minutes: 55 });
      const endTime = startTime.plus({ hours: 1 });
      
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert({
          title: 'Test Notification Event',
          description: 'This is a test event created to test the notification system',
          start_time: startTime.toUTC().toISO(), // Store in UTC in the database
          end_time: endTime.toUTC().toISO(),     // Store in UTC in the database
          workspace_id: workspace.id,
          user_id: user.id,
          location: 'Online',
          is_recurring: false
        })
        .select();
      
      if (createError) {
        console.error('Error creating test event:', createError);
        return;
      }
      
      console.log(`Test event created: ${newEvent[0].title} (ID: ${newEvent[0].id})`);
      console.log(`Start time: ${startTime.toFormat('yyyy-MM-dd HH:mm:ss')} (SGT)`);
    }
    
    console.log('\nRunning event notification check...');
    const result = await checkAndSendEventNotifications();
    
    console.log('\n=== NOTIFICATION CHECK RESULTS ===');
    console.log(`Events found: ${result.eventsFound}`);
    console.log(`Notifications sent: ${result.notificationsSent}`);
    console.log(`Errors: ${result.errors}`);
    console.log(`Execution time: ${result.executionTimeMs || 'N/A'}ms`);
    
    if (result.logs && result.logs.length > 0) {
      console.log('\n=== DETAILED LOGS ===');
      result.logs.forEach(log => console.log(log));
    }
    
    console.log('\nTest completed at:', DateTime.now().setZone('Asia/Singapore').toFormat('yyyy-MM-dd HH:mm:ss'), '(SGT)');
  } catch (error) {
    console.error('Error running test script:', error);
  }
}

// Run the main function
main().catch(console.error);
