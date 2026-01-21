require('dotenv').config();
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

const SERVER_URL = process.env.SOCKET_TEST_URL || 'http://localhost:5000';

console.log('Socket.io Authentication Test');
console.log('==============================\n');

async function testValidToken() {
  console.log('Test 1: Connect with valid JWT token');
  
  const testUserId = '507f1f77bcf86cd799439011';
  const token = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✓ Connected successfully with valid token');
      console.log(`  Socket ID: ${socket.id}\n`);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (err) => {
      console.log('✗ Connection failed:', err.message);
      console.log(`  Data: ${JSON.stringify(err.data)}\n`);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      console.log('✗ Connection timeout\n');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function testNoToken() {
  console.log('Test 2: Connect without token');
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✗ Should not connect without token\n');
      socket.disconnect();
      resolve(false);
    });

    socket.on('connect_error', (err) => {
      console.log('✓ Correctly rejected connection without token');
      console.log(`  Error: ${err.message}\n`);
      socket.disconnect();
      resolve(true);
    });

    setTimeout(() => {
      console.log('✗ Connection timeout\n');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function testInvalidToken() {
  console.log('Test 3: Connect with invalid token');
  
  const invalidToken = 'invalid.token.here';
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token: invalidToken },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✗ Should not connect with invalid token\n');
      socket.disconnect();
      resolve(false);
    });

    socket.on('connect_error', (err) => {
      console.log('✓ Correctly rejected invalid token');
      console.log(`  Error: ${err.message}\n`);
      socket.disconnect();
      resolve(true);
    });

    setTimeout(() => {
      console.log('✗ Connection timeout\n');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function testCookieAuth() {
  console.log('Test 4: Connect with cookie token');
  
  const testUserId = '507f1f77bcf86cd799439012';
  const token = jwt.sign({ id: testUserId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      extraHeaders: {
        cookie: `accessToken=${token}`
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✓ Connected successfully with cookie token');
      console.log(`  Socket ID: ${socket.id}\n`);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (err) => {
      console.log('✗ Connection failed:', err.message);
      console.log(`  Data: ${JSON.stringify(err.data)}\n`);
      socket.disconnect();
      resolve(false);
    });

    setTimeout(() => {
      console.log('✗ Connection timeout\n');
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function runTests() {
  console.log(`Testing server: ${SERVER_URL}\n`);
  
  const results = {
    validToken: await testValidToken(),
    noToken: await testNoToken(),
    invalidToken: await testInvalidToken(),
    cookieAuth: await testCookieAuth()
  };

  console.log('\n==============================');
  console.log('Test Results:');
  console.log('==============================');
  console.log(`Valid token:     ${results.validToken ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`No token:        ${results.noToken ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Invalid token:   ${results.invalidToken ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Cookie auth:     ${results.cookieAuth ? '✓ PASS' : '✗ FAIL'}`);
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('\n' + (allPassed ? '✓ All tests passed!' : '✗ Some tests failed'));
  
  process.exit(allPassed ? 0 : 1);
}

if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET not set in environment');
  process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
