const axios = require('axios');

// Use the token from the logs
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg4OTNlZGUzLWUzZGMtNDBkYy1hZWFlLWU0ZmM1ZjBlNmYwNSIsImVtYWlsIjoid2lsZHJleHNvbHV0aW9uczAwQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsIm9yZ2FuaXphdGlvbklkIjoiN2QyNGE5MTktYWUwZi00N2ZjLThkMzMtYTViZDQwZjg5OTA1IiwiaWF0IjoxNzMwMjgzMTU2LCJleHAiOjE3MzAyODY3NTZ9.Y5JVjWLgPbEphZ1CIm3kSCQy-ZJeMzYPsxIp51P2Ou8';

async function testApis() {
  const baseUrl = 'http://localhost:3000/api/v1/assets';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('Testing Asset APIs...\n');

  try {
    // Test 1: Get all assets
    console.log('1. Testing GET /assets');
    const allAssets = await axios.get(baseUrl, { headers });
    console.log('Status:', allAssets.status);
    console.log('Response:', JSON.stringify(allAssets.data, null, 2));
    console.log('Assets count:', allAssets.data.data?.length || 0);
    console.log('\n---\n');

    // Test 2: Get my assets
    console.log('2. Testing GET /assets/my-assets');
    const myAssets = await axios.get(`${baseUrl}/my-assets`, { headers });
    console.log('Status:', myAssets.status);
    console.log('Response:', JSON.stringify(myAssets.data, null, 2));
    console.log('My assets count:', myAssets.data.data?.length || 0);
    console.log('\n---\n');

    // Test 3: Get stats
    console.log('3. Testing GET /assets/stats');
    const stats = await axios.get(`${baseUrl}/stats`, { headers });
    console.log('Status:', stats.status);
    console.log('Response:', JSON.stringify(stats.data, null, 2));

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testApis();
