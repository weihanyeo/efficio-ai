// Simple script to test timezone handling
const { DateTime } = require('luxon');

function main() {
  console.log('=== TIMEZONE TEST SCRIPT ===');
  
  // Get current time in different formats
  const utcNow = DateTime.utc();
  const sgtNow = DateTime.now().setZone('Asia/Singapore');
  
  console.log('Current time in UTC:', utcNow.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('Current time in SGT:', sgtNow.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('Timezone offset:', `UTC+${sgtNow.offset / 60} hours`);
  
  // Test event time conversion
  console.log('\n=== EVENT TIME CONVERSION TEST ===');
  
  // Create a test event time 1 hour from now in SGT
  const eventTimeSGT = sgtNow.plus({ hours: 1 });
  console.log('Event time in SGT:', eventTimeSGT.toFormat('yyyy-MM-dd HH:mm:ss'));
  
  // Convert to UTC for storage
  const eventTimeUTC = eventTimeSGT.toUTC();
  console.log('Event time in UTC (for storage):', eventTimeUTC.toFormat('yyyy-MM-dd HH:mm:ss'));
  
  // Convert back to SGT (simulating retrieval from database)
  const retrievedEventTimeSGT = DateTime.fromISO(eventTimeUTC.toISO()).setZone('Asia/Singapore');
  console.log('Retrieved event time in SGT:', retrievedEventTimeSGT.toFormat('yyyy-MM-dd HH:mm:ss'));
  
  // Verify the times match
  console.log('Original and retrieved times match:', eventTimeSGT.toISO() === retrievedEventTimeSGT.toISO());
  
  // Test time comparison
  console.log('\n=== TIME COMPARISON TEST ===');
  
  // Create a past event (30 minutes ago)
  const pastEventSGT = sgtNow.minus({ minutes: 30 });
  console.log('Past event time (SGT):', pastEventSGT.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('Is past event in the past?', pastEventSGT < sgtNow);
  
  // Create a future event (30 minutes from now)
  const futureEventSGT = sgtNow.plus({ minutes: 30 });
  console.log('Future event time (SGT):', futureEventSGT.toFormat('yyyy-MM-dd HH:mm:ss'));
  console.log('Is future event in the future?', futureEventSGT > sgtNow);
  
  // Test notification window
  console.log('\n=== NOTIFICATION WINDOW TEST ===');
  
  // Create events at different times
  const events = [
    { name: 'Past Event', time: sgtNow.minus({ minutes: 30 }) },
    { name: 'Imminent Event', time: sgtNow.plus({ minutes: 5 }) },
    { name: 'Soon Event', time: sgtNow.plus({ minutes: 30 }) },
    { name: 'One Hour Event', time: sgtNow.plus({ minutes: 59 }) },
    { name: 'Just Outside Window', time: sgtNow.plus({ minutes: 66 }) },
    { name: 'Far Future Event', time: sgtNow.plus({ hours: 3 }) }
  ];
  
  // Define notification window (1 hour with 5-minute buffer)
  const windowEnd = sgtNow.plus({ minutes: 65 });
  
  console.log(`Notification window: ${sgtNow.toFormat('HH:mm:ss')} to ${windowEnd.toFormat('HH:mm:ss')} SGT`);
  
  // Check which events would trigger notifications
  events.forEach(event => {
    const inWindow = event.time > sgtNow && event.time <= windowEnd;
    console.log(`${event.name} (${event.time.toFormat('HH:mm:ss')}): ${inWindow ? 'NOTIFY' : 'SKIP'}`);
  });
}

// Run the main function
main();
