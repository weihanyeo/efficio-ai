// Simple script to test the event notification system
const { createClient } = require('@supabase/supabase-js');
const { DateTime } = require('luxon');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== EVENT NOTIFICATION TEST SCRIPT ===');
  const now = DateTime.now().setZone('Asia/Singapore');
  console.log('Current time (SGT):', now.toFormat('yyyy-MM-dd HH:mm:ss'));
  
  try {
    // Check for upcoming events
    console.log('\nChecking for upcoming events...');
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
    
    console.log(`Found ${events?.length || 0} upcoming events:`);
    if (events && events.length > 0) {
      events.forEach(event => {
        const eventTime = DateTime.fromISO(event.start_time).setZone('Asia/Singapore');
        const diffMs = eventTime.diff(now).milliseconds;
        const diffMins = Math.round(diffMs / 60000);
        
        console.log(`- ${event.title} (ID: ${event.id})`);
        console.log(`  Start time: ${eventTime.toFormat('yyyy-MM-dd HH:mm:ss')} (SGT)`);
        console.log(`  Time until event: ${diffMins} minutes`);
      });
    }
    
    // Create a test event if requested
    if (process.argv.includes('--create-test')) {
      console.log('\nCreating a test event for 55 minutes from now...');
      
      // Get a workspace
      const { data: workspaces, error: workspacesError } = await supabase
        .from('workspaces')
        .select('id, name')
        .limit(1);
      
      if (workspacesError || !workspaces || workspaces.length === 0) {
        console.error('Error fetching workspace or no workspaces found:', workspacesError);
        return;
      }
      
      // Get a user
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);
      
      if (usersError || !users || users.length === 0) {
        console.error('Error fetching user or no users found:', usersError);
        return;
      }
      
      // Create event 55 minutes from now
      const startTime = now.plus({ minutes: 55 });
      const endTime = startTime.plus({ hours: 1 });
      
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert({
          title: `Test Event (${now.toFormat('HH:mm')})`,
          description: 'This is a test event created to test the notification system',
          start_time: startTime.toUTC().toISO(),
          end_time: endTime.toUTC().toISO(),
          workspace_id: workspaces[0].id,
          user_id: users[0].id,
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
    
    // Call the notification API endpoint
    console.log('\nCalling the notification API endpoint...');
    const response = await fetch('http://localhost:3000/api/cron/event-notifications');
    const result = await response.json();
    
    console.log('API Response:', JSON.stringify(result, null, 2));
    
    // Check system logs
    console.log('\nChecking system logs...');
    const { data: logs, error: logsError } = await supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);
    
    if (logsError) {
      console.error('Error fetching logs:', logsError);
    } else {
      console.log('Recent system logs:');
      logs.forEach(log => {
        const logTime = DateTime.fromISO(log.timestamp).setZone('Asia/Singapore');
        console.log(`- [${logTime.toFormat('HH:mm:ss')}] ${log.type}: ${log.message}`);
      });
    }
    
    console.log('\nTest completed at:', DateTime.now().setZone('Asia/Singapore').toFormat('yyyy-MM-dd HH:mm:ss'), '(SGT)');
  } catch (error) {
    console.error('Error running test script:', error);
  }
}

// Run the main function
main().catch(console.error);
