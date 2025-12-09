// test-backend.js
const axios = require('axios');

async function testBackend() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🧪 Testing backend endpoints...\n');
  
  const tests = [
    { name: 'Health Check', url: '/health' },
    { name: 'API Docs', url: '/api' },
    { name: 'PayMongo Config', url: '/test-paymongo' },
    { name: 'PayMongo Connection', url: '/api/payment/test-connection' }
  ];
  
  for (const test of tests) {
    try {
      console.log(`🔗 ${test.name}: ${baseUrl}${test.url}`);
      const response = await axios.get(`${baseUrl}${test.url}`, { timeout: 5000 });
      console.log(`✅ ${response.status} - Success\n`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log();
    }
  }
}

testBackend();