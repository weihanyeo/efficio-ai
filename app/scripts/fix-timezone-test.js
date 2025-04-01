// Script to test and fix timezone handling issues
const { createClient } = require('@supabase/supabase-js');
const { DateTime } = require('luxon');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('=== TIMEZONE ISSUE DIAGNOSIS ===');
  
  // Get current time in different formats
  const utcNow = DateTime.utc();
  const sgtNow = DateTime.now().setZone('Asia/Singapore');
  
  console.log('Current time in UTC:', utcNow.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('Current time in SGT:', sgtNow.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('Timezone offset:', `UTC+${sgtNow.offset / 60} hours`);
  
  // Fetch some events from the database
  console.log('\n=== FETCHING EVENTS FROM DATABASE ===');
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, start_time, end_time')
    .order('start_time', { ascending: true })
    .limit(5);
  
  if (error) {
    console.error('Error fetching events:', error);
    return;
  }
  
  if (!events || events.length === 0) {
    console.log('No events found in the database.');
    return;
  }
  
  console.log(`Found ${events.length} events:`);
  
  // Analyze each event's time
  events.forEach(event => {
    console.log(`\n=== EVENT: ${event.title} (${event.id}) ===`);
    console.log('Raw start_time from DB:', event.start_time);
    
    // Try different parsing methods
    console.log('\nParsing with different methods:');
    
    // Method 1: Default parsing
    const time1 = DateTime.fromISO(event.start_time);
    console.log('Method 1 (Default):', time1.toFormat('yyyy-MM-dd HH:mm:ss'), time1.zoneName);
    
    // Method 2: Explicit UTC parsing
    const time2 = DateTime.fromISO(event.start_time, { zone: 'utc' });
    console.log('Method 2 (Explicit UTC):', time2.toFormat('yyyy-MM-dd HH:mm:ss'), time2.zoneName);
    
    // Method 3: Parse as UTC then convert to SGT
    const time3 = DateTime.fromISO(event.start_time, { zone: 'utc' }).setZone('Asia/Singapore');
    console.log('Method 3 (UTC→SGT):', time3.toFormat('yyyy-MM-dd HH:mm:ss'), time3.zoneName);
    
    // Method 4: Parse as local then convert to SGT
    const time4 = DateTime.fromISO(event.start_time).setZone('Asia/Singapore');
    console.log('Method 4 (Local→SGT):', time4.toFormat('yyyy-MM-dd HH:mm:ss'), time4.zoneName);
    
    // Calculate time until event for each method
    const minutesUntil1 = Math.round(time1.diff(utcNow).as('minutes'));
    const minutesUntil2 = Math.round(time2.diff(utcNow).as('minutes'));
    const minutesUntil3 = Math.round(time3.diff(sgtNow).as('minutes'));
    const minutesUntil4 = Math.round(time4.diff(sgtNow).as('minutes'));
    
    console.log('\nTime until event:');
    console.log('Method 1:', minutesUntil1, 'minutes');
    console.log('Method 2:', minutesUntil2, 'minutes');
    console.log('Method 3:', minutesUntil3, 'minutes');
    console.log('Method 4:', minutesUntil4, 'minutes');
    
    // Determine which method is likely correct
    // If the event is supposed to be in the future but within a reasonable timeframe
    const reasonableMinutes = [minutesUntil1, minutesUntil2, minutesUntil3, minutesUntil4].filter(m => m > 0 && m < 1440); // Within 24 hours
    
    console.log('\nAnalysis:');
    if (reasonableMinutes.length > 0) {
      const minValue = Math.min(...reasonableMinutes);
      console.log(`Most likely correct time until event: ${minValue} minutes`);
      
      if (minutesUntil3 === minValue) {
        console.log('RECOMMENDATION: Use Method 3 (Parse as UTC then convert to SGT)');
      } else if (minutesUntil4 === minValue) {
        console.log('RECOMMENDATION: Use Method 4 (Parse as local then convert to SGT)');
      } else if (minutesUntil2 === minValue) {
        console.log('RECOMMENDATION: Use Method 2 (Explicit UTC parsing)');
      } else {
        console.log('RECOMMENDATION: Use Method 1 (Default parsing)');
      }
    } else {
      console.log('Unable to determine the correct parsing method.');
    }
  });
}

// Run the main function
main().catch(console.error);
