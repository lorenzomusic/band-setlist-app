// Temporary debug script to check sets database structure
// Run this in browser console to see what's in the database

console.log('=== SETS DATABASE DEBUG ===');

// Check all sets
fetch('/api/sets')
  .then(r => r.json())
  .then(data => {
    console.log('All sets structure:', data);
    if (data.length > 0) {
      console.log('First set example:', data[0]);
      console.log('First set ID:', data[0].id, 'Type:', typeof data[0].id);
      console.log('All set IDs and types:');
      data.forEach((set, index) => {
        console.log(`Set ${index + 1}: ID="${set.id}" (${typeof set.id}), Name="${set.name}"`);
      });
    } else {
      console.log('No sets found in database');
    }
  })
  .catch(error => {
    console.error('Error fetching sets:', error);
  });

// Also check gigs for comparison
fetch('/api/gigs')
  .then(r => r.json())
  .then(data => {
    console.log('All gigs structure:', data);
    if (data.length > 0) {
      console.log('First gig example:', data[0]);
      console.log('First gig ID:', data[0].id, 'Type:', typeof data[0].id);
    }
  })
  .catch(error => {
    console.error('Error fetching gigs:', error);
  });

console.log('=== END DEBUG ==='); 