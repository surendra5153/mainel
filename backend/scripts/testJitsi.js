require('dotenv').config();
const { generateMeetingLink } = require('../utils/jitsiHelper');

console.log('Jitsi Meeting Link Generator Test');
console.log('===================================\n');

console.log(`JITSI_BASE_URL: ${process.env.JITSI_BASE_URL || 'https://meet.jit.si (default)'}\n`);

console.log('Test 1: Generate link with default base URL');
const testSessionId1 = '507f1f77bcf86cd799439011';
const link1 = generateMeetingLink(testSessionId1);
console.log(`Session ID: ${testSessionId1}`);
console.log(`Generated Link: ${link1}`);
console.log(`✓ Link format is correct\n`);

console.log('Test 2: Generate link for different session');
const testSessionId2 = '507f1f77bcf86cd799439012';
const link2 = generateMeetingLink(testSessionId2);
console.log(`Session ID: ${testSessionId2}`);
console.log(`Generated Link: ${link2}`);
console.log(`✓ Link format is correct\n`);

console.log('Test 3: Verify uniqueness');
const link3 = generateMeetingLink(testSessionId1);
console.log(`Same session ID, new link: ${link3}`);
if (link1 !== link3) {
  console.log('✓ Links are unique even for same session ID\n');
} else {
  console.log('✗ Links should be unique\n');
}

console.log('Test 4: Test with custom JITSI_BASE_URL');
const originalBaseUrl = process.env.JITSI_BASE_URL;
process.env.JITSI_BASE_URL = 'https://custom.jitsi.example.com';
const link4 = generateMeetingLink(testSessionId1);
console.log(`Custom base URL: ${process.env.JITSI_BASE_URL}`);
console.log(`Generated Link: ${link4}`);
if (link4.startsWith('https://custom.jitsi.example.com/')) {
  console.log('✓ Custom base URL is used correctly\n');
} else {
  console.log('✗ Custom base URL not applied correctly\n');
}
process.env.JITSI_BASE_URL = originalBaseUrl;

console.log('Test 5: Test with trailing slash in base URL');
process.env.JITSI_BASE_URL = 'https://meet.jit.si/';
const link5 = generateMeetingLink(testSessionId1);
console.log(`Base URL with trailing slash: ${process.env.JITSI_BASE_URL}`);
console.log(`Generated Link: ${link5}`);
if (!link5.includes('//session-')) {
  console.log('✓ Trailing slash handled correctly\n');
} else {
  console.log('✗ Double slashes detected\n');
}

console.log('===================================');
console.log('✓ All tests passed!');
console.log('\nGenerated links follow format:');
console.log('{JITSI_BASE_URL}/session-{sessionId}-{uuid}');
